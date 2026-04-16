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

  // ── Set Alarm backend ───────────────────────────────────────────────
  // Public entry: window.timenestNotify.setAlarm(item)
  //
  // item = {
  //   id, name, date (YYYY-MM-DD), time (HH:MM),  // task-shaped
  // }  -- OR --
  // { id, name, time (HH:MM), schedule }           // habit-shaped
  //
  // Behaviour by platform:
  //  • Android (Chrome) — fires the AlarmClock.ACTION_SET_ALARM intent,
  //    which opens the native Clock app with the hour/minute prefilled.
  //    This is the only way a web page can actually create a device alarm.
  //  • iOS / any other mobile — generates and downloads an .ics file with
  //    a VALARM VEVENT. The user taps it and Calendar imports the alert,
  //    which rings at the set time (default iOS behaviour, works offline).
  //  • Desktop — registers an in-page scheduler that shows a modal +
  //    plays a beep when the moment arrives, and also records the alarm
  //    in localStorage so future page loads can re-hydrate pending ones.
  const ALARMS_KEY = "timenest-alarms-v1";

  function readAlarms() {
    try {
      const raw = JSON.parse(localStorage.getItem(scopedKey(ALARMS_KEY)) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_e) {
      return [];
    }
  }
  function writeAlarms(list) {
    try { localStorage.setItem(scopedKey(ALARMS_KEY), JSON.stringify(list || [])); } catch (_e) {}
  }

  function parseAlarmTarget(item) {
    if (!item || !item.time) return null;
    const [hRaw, mRaw] = String(item.time).split(":");
    const hh = Number(hRaw);
    const mm = Number(mRaw);
    if (Number.isNaN(hh)) return null;
    const target = new Date();
    if (item.date) {
      // Respect the calendar date for tasks.
      const [y, mo, d] = String(item.date).split("-").map(Number);
      if (y && mo && d) target.setFullYear(y, mo - 1, d);
    }
    target.setHours(hh, Number.isNaN(mm) ? 0 : mm, 0, 0);
    // If the computed time is already past (no date given), roll to tomorrow
    // so the alarm still fires — same behaviour as a phone alarm clock.
    if (!item.date && target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }
    return { hh, mm: Number.isNaN(mm) ? 0 : mm, when: target };
  }

  function detectPlatform() {
    const ua = (navigator.userAgent || "") + " " + (navigator.platform || "");
    if (/Android/i.test(ua)) return "android";
    if (/iPad|iPhone|iPod/i.test(ua)) return "ios";
    return "desktop";
  }

  function fireAndroidSetAlarmIntent(label, hh, mm) {
    // Chrome on Android honours the Intent URI syntax. The clock app
    // receives ACTION_SET_ALARM with EXTRA_HOUR / EXTRA_MINUTES /
    // EXTRA_MESSAGE and opens its alarm editor prefilled.
    const extraMsg = encodeURIComponent(label || "TIMENEST alarm");
    const url =
      "intent://alarm" +
      "#Intent" +
      ";scheme=alarm" +
      ";action=android.intent.action.SET_ALARM" +
      ";S.android.intent.extra.alarm.MESSAGE=" + extraMsg +
      ";i.android.intent.extra.alarm.HOUR=" + hh +
      ";i.android.intent.extra.alarm.MINUTES=" + mm +
      ";B.android.intent.extra.alarm.SKIP_UI=false" +
      ";end";
    // Navigation in a new tab keeps the TIMENEST tab alive in case the
    // intent is rejected (user has no handler); if it succeeds the Clock
    // app steals focus, which is exactly what we want.
    try {
      window.location.href = url;
    } catch (_e) {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      a.click();
    }
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function icsDate(d) {
    // UTC stamp, no punctuation — RFC 5545 "floating" local would also work
    // but Calendar apps import UTC consistently.
    return (
      d.getUTCFullYear().toString() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      "Z"
    );
  }

  function downloadIcsAlarm(label, when) {
    const uid = "timenest-" + Math.random().toString(36).slice(2) + "-" + Date.now();
    const dtStart = icsDate(when);
    const dtEnd = icsDate(new Date(when.getTime() + 60 * 1000));
    const dtStamp = icsDate(new Date());
    const summary = String(label || "TIMENEST alarm").replace(/[\r\n]+/g, " ");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TIMENEST//Alarm//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + dtStamp,
      "DTSTART:" + dtStart,
      "DTEND:" + dtEnd,
      "SUMMARY:" + summary,
      "DESCRIPTION:Alarm scheduled from TIMENEST.",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + summary,
      "TRIGGER:-PT0M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timenest-alarm.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function ringInPageAlarm(entry) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.15;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        // Short triple-beep pattern
        [0.15, 0.3, 0.45, 0.6, 0.75].forEach((t, i) => {
          g.gain.setValueAtTime(i % 2 === 0 ? 0.15 : 0, ctx.currentTime + t);
        });
        setTimeout(() => { try { o.stop(); ctx.close(); } catch (_e) {} }, 900);
      }
    } catch (_e) {}
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ TIMENEST alarm", { body: entry.label || "Time to act.", tag: entry.id });
      }
    } catch (_e) {}
    pushNotif({
      type: "alarm",
      title: "⏰ " + (entry.label || "TIMENEST alarm"),
      body: "Alarm reached — " + new Date(entry.when).toLocaleString(),
      taskId: entry.taskId || null,
      habitId: entry.habitId || null,
      linkUrl: entry.linkUrl || null,
    });
  }

  function scheduleInPageAlarm(entry) {
    const delta = new Date(entry.when).getTime() - Date.now();
    if (delta <= 0) { ringInPageAlarm(entry); return; }
    // Cap setTimeout to int32 max so long alarms don't wrap to 0ms.
    const SAFE = 2147483000;
    const wait = Math.min(delta, SAFE);
    setTimeout(() => {
      if (Date.now() >= new Date(entry.when).getTime() - 500) {
        ringInPageAlarm(entry);
      } else {
        scheduleInPageAlarm(entry);
      }
    }, wait);
  }

  function rehydrateAlarms() {
    const now = Date.now();
    const list = readAlarms();
    const keep = [];
    list.forEach((entry) => {
      if (!entry || !entry.when) return;
      const t = new Date(entry.when).getTime();
      if (t < now - 60 * 1000) return; // prune stale
      keep.push(entry);
      scheduleInPageAlarm(entry);
    });
    writeAlarms(keep);
  }

  function requestNotificationPermission() {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch (_e) {}
  }

  function setAlarm(item) {
    const parsed = parseAlarmTarget(item);
    if (!parsed) {
      return { ok: false, reason: "no-time", message: "Set a time before enabling the alarm." };
    }
    const label = item.name || item.title || "TIMENEST alarm";
    const platform = detectPlatform();
    const entry = {
      id: item.id || "alarm-" + Date.now(),
      taskId: item.taskId || (item.__kind === "task" ? item.id : null),
      habitId: item.habitId || (item.__kind === "habit" ? item.id : null),
      label,
      when: parsed.when.toISOString(),
      hour: parsed.hh,
      minute: parsed.mm,
      platform,
      linkUrl: item.linkUrl || null,
    };

    // Always persist so we can ring from any page load.
    const list = readAlarms().filter((a) => a.id !== entry.id);
    list.push(entry);
    writeAlarms(list);

    if (platform === "android") {
      fireAndroidSetAlarmIntent(label, parsed.hh, parsed.mm);
      return { ok: true, platform, via: "android-intent", when: entry.when };
    }
    if (platform === "ios") {
      downloadIcsAlarm(label, parsed.when);
      return { ok: true, platform, via: "ics-calendar", when: entry.when };
    }
    // Desktop / unknown: in-page scheduler + Notification API if granted.
    requestNotificationPermission();
    scheduleInPageAlarm(entry);
    return { ok: true, platform, via: "in-page", when: entry.when };
  }

  function cancelAlarm(id) {
    const list = readAlarms().filter((a) => a.id !== id);
    writeAlarms(list);
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
    // The bell is allowed only on the home/dashboard page. The
    // Goals, Daily Tasks, Habits, and Notifications pages should
    // not show the inline bell per product requirements.
    const path = (window.location.pathname || "").toLowerCase();
    const last = path.split("/").pop() || "";
    const isHome =
      last === "" ||
      last === "index.html" ||
      document.body.classList.contains("dashboard-home");
    if (!isHome) return null;

    // The bell should sit inside .top-actions next to the Logout button,
    // at the very end (banner/panel end). If .top-actions isn't on the
    // page yet, bail out quietly — renderBell() will retry on the next
    // refreshNotifications() tick.
    const topActions = document.querySelector(".top-actions");
    if (!topActions) return null;

    bell = document.createElement("a");
    bell.id = "timenest-bell";
    bell.className = "ghost-chip tn-bell-chip";
    bell.href = "./notifications.html";
    bell.setAttribute("aria-label", "Notifications");
    bell.innerHTML = `
      <span class="action-icon tn-bell-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M12 22a2.25 2.25 0 0 0 2.2-1.8h-4.4A2.25 2.25 0 0 0 12 22Zm7.5-5.5V11a7.5 7.5 0 0 0-6-7.35V3a1.5 1.5 0 1 0-3 0v.65A7.5 7.5 0 0 0 4.5 11v5.5L3 18v1h18v-1l-1.5-1.5Z"/>
        </svg>
        <span class="tn-bell-badge" hidden>0</span>
      </span>
      <span class="action-label">Alerts</span>
    `;
    // Append after the Logout button so the order becomes
    // Theme | Profile | Logout | Alerts (bell at the end).
    topActions.appendChild(bell);

    if (!document.getElementById("timenest-bell-style")) {
      const style = document.createElement("style");
      style.id = "timenest-bell-style";
      style.textContent = `
        .top-actions #timenest-bell {
          text-decoration: none;
          order: 99; /* push to the far end of the flex row */
          margin-left: auto;
        }
        .top-actions #timenest-bell .tn-bell-icon {
          position: relative;
        }
        .top-actions #timenest-bell .tn-bell-badge {
          position: absolute; top: -6px; right: -6px;
          min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 999px; background: #ff6b6b; color: #fff;
          font-size: 10px; font-weight: 700; line-height: 18px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(15,20,40,0.85);
        }
      `;
      document.head.appendChild(style);
    }
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

    // Styles for the inbox panel now live in styles.css so they're applied
    // before first paint (avoids the unstyled/distorted flash).

    // Use event delegation on document so the Mark-all-read / Clear buttons
    // work reliably even if this mount function runs before the nodes exist
    // or the markup is re-rendered later.
    if (!document.__tnInboxToolsBound) {
      document.__tnInboxToolsBound = true;
      document.addEventListener("click", (ev) => {
        const markAllBtn = ev.target.closest("[data-tn-mark-all]");
        if (markAllBtn) {
          ev.preventDefault();
          const all = readNotifs().map((n) => ({
            ...n,
            readAt: n.readAt || new Date().toISOString(),
          }));
          writeNotifs(all);
          renderInbox();
          renderBell();
          return;
        }
        const clearBtn = ev.target.closest("[data-tn-clear]");
        if (clearBtn) {
          ev.preventDefault();
          if (!confirm("Clear all notifications?")) return;
          writeNotifs([]);
          renderInbox();
          renderBell();
          return;
        }
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
    setAlarm,
    cancelAlarm,
    listAlarms: readAlarms,
    _renderBell: renderBell,
    _renderInbox: renderInbox,
  };

  // Re-hydrate any in-page alarms scheduled on previous page loads.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rehydrateAlarms);
  } else {
    rehydrateAlarms();
  }
})();
