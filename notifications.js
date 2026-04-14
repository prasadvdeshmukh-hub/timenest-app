// ─── TIMENEST In-App Notification Engine ───
// Self-contained module:
//  • Persists notifications to a scoped localStorage key
//  • Scans tasks/habits every 60s and emits:
//      due-soon   (task within 30 min of deadline)
//      overdue    (task past deadline, not complete — once per day per task)
//      habit-nudge (habit time reached today with no check-in — once per day per habit)
//      confirmation (manual action confirmations via window.timenestNotify.confirm)
//  • Renders a floating bell + inbox panel on every page
//  • Queues email via Firestore "mail" collection when available
//
// Depends on: script.js (for STORE_KEYS, readStore, writeStore, getStoreScope,
//             generateId, showToast). All exposed on window inside script.js.

(function initTimenestNotifications() {
  if (window.__timenestNotificationsBooted) return;
  window.__timenestNotificationsBooted = true;

  // ── Safe getters from script.js globals ─────────────────────────────
  function scope() {
    try {
      return localStorage.getItem("timenest-user-scope") || "guest";
    } catch (_) {
      return "guest";
    }
  }

  function scopedKey(base) {
    return `${base}::${scope()}`;
  }

  const NOTIF_KEY = "timenest-notifications-v1";
  const LAST_SCAN_KEY = "timenest-notifications-last-scan";
  const DEDUPE_KEY = "timenest-notifications-dedupe";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {
      /* quota or private mode */
    }
  }

  function readNotifs() {
    const arr = readJSON(scopedKey(NOTIF_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function writeNotifs(arr) {
    writeJSON(scopedKey(NOTIF_KEY), arr.slice(-200)); // cap at 200
  }

  function readDedupe() {
    const o = readJSON(scopedKey(DEDUPE_KEY), {});
    return o && typeof o === "object" ? o : {};
  }

  function writeDedupe(o) {
    writeJSON(scopedKey(DEDUPE_KEY), o);
  }

  function readStoreArr(base) {
    const scoped = readJSON(scopedKey(base), null);
    if (Array.isArray(scoped)) return scoped;
    const legacy = readJSON(base, null);
    return Array.isArray(legacy) ? legacy : [];
  }

  function readChannelPrefs() {
    // script.js stores channels as { push: "enabled", email: "enabled", "in-app": "enabled", ... }
    const obj = readJSON(scopedKey("timenest-channels-v1"), null);
    const raw = obj && typeof obj === "object" && !Array.isArray(obj)
      ? obj
      : { push: "enabled", email: "enabled", sms: "disabled", whatsapp: "disabled", "in-app": "enabled", snooze: "enabled" };
    const isOn = (v) => v === true || v === "enabled" || v === "on";
    return {
      push: isOn(raw.push),
      email: isOn(raw.email),
      sms: isOn(raw.sms),
      whatsapp: isOn(raw.whatsapp),
      inApp: isOn(raw["in-app"] ?? raw.inApp),
      snooze: isOn(raw.snooze),
    };
  }

  function uid() {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    );
  }

  function dayKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  // ── Email scaffolding via Firestore "mail" collection ───────────────
  // Firebase "Trigger Email" extension reads this collection.
  async function queueEmail(notif) {
    try {
      const fb = window._fb;
      const user = fb?.auth?.currentUser;
      if (!fb || !user || !user.email) return;
      if (!fb.firestore || !fb.addDoc || !fb.collection) return;
      const prefs = readChannelPrefs();
      if (!prefs.email) return;
      await fb.addDoc(fb.collection(fb.firestore, "mail"), {
        to: [user.email],
        message: {
          subject: `[TIMENEST] ${notif.title}`,
          text: `${notif.body}\n\nOpen: ${notif.linkUrl || location.origin}`,
          html: `<p style="font-family:sans-serif"><strong>${escapeHtml(notif.title)}</strong></p>
                 <p style="font-family:sans-serif">${escapeHtml(notif.body)}</p>
                 <p><a href="${escapeAttr(notif.linkUrl || location.origin)}">Open TIMENEST</a></p>`,
        },
        tnMeta: {
          type: notif.type,
          taskId: notif.taskId || null,
          habitId: notif.habitId || null,
          scope: scope(),
          createdAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.debug("[timenest-notify] email queue skipped:", e?.message || e);
    }
  }

  // ── Public push helper ──────────────────────────────────────────────
  function pushNotif(partial) {
    const prefs = readChannelPrefs();
    const notif = {
      id: uid(),
      type: partial.type || "info",
      title: partial.title || "TIMENEST",
      body: partial.body || "",
      linkUrl: partial.linkUrl || null,
      taskId: partial.taskId || null,
      habitId: partial.habitId || null,
      goalId: partial.goalId || null,
      scheduledAt: partial.scheduledAt || new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      readAt: null,
      channels: partial.channels || ["in-app"].concat(prefs.email ? ["email"] : []),
    };
    const all = readNotifs();
    all.push(notif);
    writeNotifs(all);

    if (prefs.inApp !== false && typeof window.showToast === "function") {
      window.showToast(notif.title + (notif.body ? " — " + notif.body : ""), notif.type === "overdue" ? "error" : "info", 4500);
    }

    if (notif.channels.includes("email")) {
      queueEmail(notif);
    }

    renderBell(); // update badge immediately
    return notif;
  }

  // ── Scan: task due-soon / overdue ───────────────────────────────────
  function taskDateTime(task) {
    if (!task) return null;
    const date = task.date || task.deadline;
    if (!date) return null;
    const time = task.time || "09:00";
    const iso = `${date}T${time.length === 5 ? time + ":00" : time}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  function isTaskComplete(t) {
    if (!t) return false;
    return Boolean(
      t.isComplete ||
      (t.status && String(t.status).toLowerCase() === "completed")
    );
  }

  function scanTasks(now, dedupe) {
    const tasks = readStoreArr("timenest-tasks-v1");
    const thirtyMin = 30 * 60 * 1000;
    tasks.forEach((task) => {
      if (isTaskComplete(task)) return;
      const when = taskDateTime(task);
      if (!when) return;
      const delta = when.getTime() - now.getTime();

      // Due soon: within next 30 min, not yet notified
      if (delta > 0 && delta <= thirtyMin) {
        const k = `due:${task.id}`;
        if (!dedupe[k]) {
          pushNotif({
            type: "due-soon",
            title: `Due soon: ${task.name || "Untitled task"}`,
            body: `Scheduled for ${when.toLocaleString()}.`,
            linkUrl: `./task-detail.html?id=${encodeURIComponent(task.id)}`,
            taskId: task.id,
            scheduledAt: when.toISOString(),
          });
          dedupe[k] = now.toISOString();
        }
      }

      // Overdue: past deadline and still not complete; once per day
      if (delta < 0 && !isTaskComplete(task)) {
        const k = `overdue:${task.id}:${dayKey(now)}`;
        if (!dedupe[k]) {
          pushNotif({
            type: "overdue",
            title: `Overdue: ${task.name || "Untitled task"}`,
            body: `Was due ${when.toLocaleString()}. Reschedule or mark complete.`,
            linkUrl: `./task-detail.html?id=${encodeURIComponent(task.id)}`,
            taskId: task.id,
          });
          dedupe[k] = now.toISOString();
        }
      }
    });
  }

  // ── Scan: habit check-in nudge ──────────────────────────────────────
  function parseHabitTime(habit, now) {
    if (!habit?.time) return null;
    const [h, m] = String(habit.time).split(":").map(Number);
    if (Number.isNaN(h)) return null;
    const d = new Date(now);
    d.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
    return d;
  }

  function habitCheckedToday(habit, now) {
    if (!habit) return false;
    const hist = habit.history || {};
    const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (hist[key]) return true;
    // Legacy array/object shapes
    if (Array.isArray(habit.log)) {
      const dk = dayKey(now);
      return habit.log.some((entry) => dayKey(entry.at || entry.date || entry) === dk);
    }
    return false;
  }

  function scanHabits(now, dedupe) {
    const habits = readStoreArr("timenest-habits-v1");
    habits.forEach((habit) => {
      const when = parseHabitTime(habit, now);
      if (!when) return;
      // Trigger window: from habit time to end of day
      if (now.getTime() < when.getTime()) return;
      if (habitCheckedToday(habit, now)) return;
      const k = `habit:${habit.id}:${dayKey(now)}`;
      if (dedupe[k]) return;
      pushNotif({
        type: "habit-nudge",
        title: `Check in: ${habit.name || "Habit"}`,
        body: `Your ${habit.schedule || "daily"} habit is due. Tap to mark done.`,
        linkUrl: `./habits.html`,
        habitId: habit.id,
      });
      dedupe[k] = now.toISOString();
    });
  }

  function runScan() {
    try {
      const now = new Date();
      const dedupe = readDedupe();
      scanTasks(now, dedupe);
      scanHabits(now, dedupe);
      // Prune dedupe entries older than 7 days to avoid unbounded growth
      const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      Object.keys(dedupe).forEach((k) => {
        const t = Date.parse(dedupe[k]);
        if (isFinite(t) && t < cutoff) delete dedupe[k];
      });
      writeDedupe(dedupe);
      writeJSON(scopedKey(LAST_SCAN_KEY), now.toISOString());
    } catch (e) {
      console.warn("[timenest-notify] scan error", e);
    }
  }

  // ── Confirmation helper (action toasts that also land in inbox) ─────
  function confirmAction(title, body, meta) {
    return pushNotif({
      type: "confirmation",
      title: title || "Done",
      body: body || "",
      ...(meta || {}),
    });
  }

  // ── Bell + Inbox UI ─────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function ensureBellEl() {
    let bell = document.getElementById("timenest-bell");
    if (bell) return bell;
    if (!document.body) return null;
    // On the notifications page itself we don't need the bell —
    // the page already lists everything.
    const path = (window.location.pathname || "").toLowerCase();
    if (path.endsWith("/notifications.html") || path.endsWith("notifications.html")) {
      return null;
    }

    // Prefer inline placement inside the page's top-actions nav so we
    // don't overlap Logout / Profile / Theme buttons. If no top-actions
    // nav exists on this page, fall back to a floating fixed bell.
    const topActions = document.querySelector(".top-actions");
    const inline = Boolean(topActions);

    bell = document.createElement("a");
    bell.id = "timenest-bell";
    bell.href = "./notifications.html";
    bell.setAttribute("aria-label", "Notifications");
    if (inline) bell.classList.add("is-inline");
    bell.innerHTML = `
      <span class="tn-bell-btn" role="presentation">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M12 22a2.25 2.25 0 0 0 2.2-1.8h-4.4A2.25 2.25 0 0 0 12 22Zm7.5-5.5V11a7.5 7.5 0 0 0-6-7.35V3a1.5 1.5 0 1 0-3 0v.65A7.5 7.5 0 0 0 4.5 11v5.5L3 18v1h18v-1l-1.5-1.5Z"/>
        </svg>
        <span class="tn-bell-badge" hidden>0</span>
      </span>
    `;
    if (inline) {
      // Insert as the first child so the bell sits before theme/profile/logout.
      topActions.insertBefore(bell, topActions.firstChild);
    } else {
      document.body.appendChild(bell);
    }

    const style = document.createElement("style");
    style.textContent = `
      /* Floating fallback on pages that have no .top-actions nav */
      #timenest-bell:not(.is-inline) { position: fixed; top: 18px; right: 18px; z-index: 9998; }
      #timenest-bell { font-family: 'Space Grotesk', system-ui, sans-serif; text-decoration: none; }
      /* Inline sizing that matches the topbar's ghost-chip buttons */
      #timenest-bell.is-inline { display: inline-flex; align-items: center; }
      #timenest-bell.is-inline .tn-bell-btn { width: 40px; height: 40px; border-radius: 12px; }
      #timenest-bell .tn-bell-btn {
        position: relative; width: 44px; height: 44px; border-radius: 14px;
        background: rgba(15,20,40,0.72); color: #b6d4ff;
        border: 1px solid rgba(92,232,255,0.35);
        backdrop-filter: blur(12px);
        display: grid; place-items: center; cursor: pointer;
        box-shadow: 0 4px 18px rgba(15,22,40,0.45);
        transition: transform .15s ease, border-color .2s ease;
      }
      #timenest-bell:hover .tn-bell-btn { transform: translateY(-1px); border-color: rgba(122,242,156,0.45); }
      #timenest-bell .tn-bell-badge {
        position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; padding: 0 5px;
        border-radius: 999px; background: #ff6b6b; color: white; font-size: 11px; font-weight: 700;
        display: inline-flex; align-items: center; justify-content: center;
        border: 1.5px solid rgba(15,20,40,0.85);
      }
      @media (max-width: 500px) {
        #timenest-bell:not(.is-inline) { top: 14px; right: 14px; }
      }
    `;
    document.head.appendChild(style);
    return bell;
  }

  function renderBell() {
    const bell = document.getElementById("timenest-bell");
    if (!bell) return;
    const unread = readNotifs().filter((n) => !n.readAt).length;
    const badge = bell.querySelector(".tn-bell-badge");
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 99 ? "99+" : String(unread);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function relTime(iso) {
    const t = Date.parse(iso);
    if (!isFinite(t)) return "";
    const diff = Math.round((Date.now() - t) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return diff + "m ago";
    if (diff < 1440) return Math.floor(diff / 60) + "h ago";
    return Math.floor(diff / 1440) + "d ago";
  }

  function renderInbox() {
    // The inbox is only rendered on the dedicated notifications page.
    const list = document.querySelector("[data-tn-inbox-list]");
    if (!list) return;
    const items = readNotifs()
      .slice()
      .sort((a, b) => Date.parse(b.deliveredAt) - Date.parse(a.deliveredAt));
    if (items.length === 0) {
      list.innerHTML =
        '<div class="tn-inbox-empty">No notifications yet. Task reminders, overdue alerts, and habit nudges will appear here.</div>';
      return;
    }
    list.innerHTML = items
      .map(
        (n) => `
      <a class="tn-inbox-item tn-type-${escapeAttr(n.type)} ${n.readAt ? "" : "unread"}" data-tn-id="${escapeAttr(n.id)}" data-tn-link="${escapeAttr(n.linkUrl || "")}" href="${escapeAttr(n.linkUrl || "#")}">
        <strong>${escapeHtml(n.title)}</strong>
        <small>${escapeHtml(n.body || "")}</small>
        <div class="tn-time">${escapeHtml(relTime(n.deliveredAt))}</div>
      </a>`
      )
      .join("");
  }

  function mountInboxPage() {
    const list = document.querySelector("[data-tn-inbox-list]");
    if (!list) return;

    // Inject inbox-specific styles once.
    if (!document.getElementById("tn-inbox-page-styles")) {
      const style = document.createElement("style");
      style.id = "tn-inbox-page-styles";
      style.textContent = `
        .tn-inbox-panel { margin: 16px 0 24px; padding: 14px 14px 4px; border-radius: 18px;
          background: rgba(15,20,40,0.7); border: 1px solid rgba(92,232,255,0.22); }
        .tn-inbox-panel-head { display:flex; justify-content:space-between; align-items:center;
          padding: 2px 4px 10px; border-bottom: 1px solid rgba(122,242,156,0.15); }
        .tn-inbox-panel-head strong { color:#eaf4ff; font-size:15px; letter-spacing:0.02em; }
        .tn-inbox-tools button { background: transparent; color: #7af29c;
          border: 1px solid rgba(122,242,156,0.25); padding: 4px 10px; border-radius: 10px;
          font-size: 12px; cursor: pointer; margin-left: 6px; }
        [data-tn-inbox-list] { display:flex; flex-direction:column; }
        .tn-inbox-item { display:block; padding: 12px 6px; border-bottom: 1px dashed rgba(92,232,255,0.15);
          color:#d7e5ff; text-decoration:none; }
        .tn-inbox-item:hover { background: rgba(92,232,255,0.06); }
        .tn-inbox-item.unread { background: rgba(122,242,156,0.06); }
        .tn-inbox-item strong { display:block; font-size:14px; margin-bottom:2px; color:#eaf4ff; }
        .tn-inbox-item small { display:block; font-size:12px; color:#8aa4cc; }
        .tn-inbox-item .tn-time { font-size: 10px; color:#66809e; margin-top: 4px; }
        .tn-inbox-empty { text-align:center; padding: 24px 8px; color:#8aa4cc; font-size:13px; }
        .tn-type-overdue strong { color:#ff9aa2; }
        .tn-type-due-soon strong { color:#5ce8ff; }
        .tn-type-habit-nudge strong { color:#b6ff9a; }
        .tn-type-confirmation strong { color:#d7e5ff; }
      `;
      document.head.appendChild(style);
    }

    const markAll = document.querySelector("[data-tn-mark-all]");
    const clearAll = document.querySelector("[data-tn-clear]");
    if (markAll && !markAll.dataset.tnBound) {
      markAll.dataset.tnBound = "1";
      markAll.addEventListener("click", () => {
        const all = readNotifs().map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        }));
        writeNotifs(all);
        renderInbox();
        renderBell();
      });
    }
    if (clearAll && !clearAll.dataset.tnBound) {
      clearAll.dataset.tnBound = "1";
      clearAll.addEventListener("click", () => {
        if (!confirm("Clear all notifications?")) return;
        writeNotifs([]);
        renderInbox();
        renderBell();
      });
    }

    list.addEventListener("click", (e) => {
      const item = e.target.closest("[data-tn-id]");
      if (!item) return;
      const id = item.getAttribute("data-tn-id");
      const all = readNotifs();
      const idx = all.findIndex((n) => n.id === id);
      if (idx !== -1 && !all[idx].readAt) {
        all[idx].readAt = new Date().toISOString();
        writeNotifs(all);
      }
      // The anchor href handles navigation; if no link, prevent '#' jump.
      const link = item.getAttribute("data-tn-link");
      if (!link || link === "null" || link === "#" || link === "") {
        e.preventDefault();
        renderInbox();
        renderBell();
      }
    });

    renderInbox();
  }

  // ── Boot ────────────────────────────────────────────────────────────
  function boot() {
    ensureBellEl();
    renderBell();
    mountInboxPage();
    runScan();
    setInterval(runScan, 60 * 1000);
    // Re-render every time notifications storage might change
    window.addEventListener("storage", (ev) => {
      if (ev.key && ev.key.indexOf(NOTIF_KEY) !== -1) {
        renderBell();
        renderInbox();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // ── Public API ──────────────────────────────────────────────────────
  window.timenestNotify = {
    push: pushNotif,
    confirm: confirmAction,
    list: readNotifs,
    markAllRead() {
      const all = readNotifs().map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }));
      writeNotifs(all);
      renderBell(); renderInbox();
    },
    clear() {
      writeNotifs([]);
      renderBell(); renderInbox();
    },
    scan: runScan,
    _renderBell: renderBell,
    _renderInbox: renderInbox,
  };
})();
