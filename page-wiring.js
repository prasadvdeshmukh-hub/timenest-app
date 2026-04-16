// ─── TIMENEST Page Wiring ───
// Auto-detects the current page from location.pathname and wires up
// every button/soft-pill/form to the data.js Firestore layer.
//
// Because the static HTML uses <span class="soft-pill">Save Task</span>
// instead of real <button>s, this module also upgrades those spans into
// clickable, keyboard-accessible buttons.

import "./data.js";

// Wait for window.timenestData to be populated (data.js exports into window).
function api() {
  return window.timenestData;
}

// ───── Utility: find a pill/button by its text ─────
function findByText(selector, text) {
  const t = text.trim().toLowerCase();
  return Array.from(document.querySelectorAll(selector)).find(
    (el) => el.textContent.trim().toLowerCase() === t
  );
}

function makeClickable(el) {
  if (!el) return;
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.style.cursor = "pointer";
}

function onClick(el, fn) {
  if (!el) return;
  makeClickable(el);
  el.addEventListener("click", (e) => {
    e.preventDefault();
    fn(e);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn(e);
    }
  });
}

function toast(msg, kind = "info") {
  let el = document.getElementById("timenest-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "timenest-toast";
    el.style.cssText =
      "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);" +
      "background:rgba(15,20,40,0.92);color:#5ce8ff;border:1px solid rgba(92,232,255,0.35);" +
      "padding:0.65rem 1.1rem;border-radius:14px;font-family:'Space Grotesk',sans-serif;" +
      "font-size:0.85rem;z-index:9999;backdrop-filter:blur(8px);transition:opacity .25s;";
    document.body.appendChild(el);
  }
  el.style.color = kind === "error" ? "#ff6b6b" : kind === "success" ? "#7af29c" : "#5ce8ff";
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.style.opacity = "0";
  }, 2600);
}

function currentPage() {
  const raw = location.pathname.split("/").pop() || "index.html";
  return raw.toLowerCase();
}

// Protect authenticated pages — redirect to login if not signed in.
const AUTH_REQUIRED = new Set([
  "index.html",
  "daily-tasks.html",
  "task-detail.html",
  "task-editor.html",
  "subtask-editor.html",
  "short-term-goals.html",
  "long-term-goals.html",
  "goal-editor.html",
  "goal-detail.html",
  "habits.html",
  "calendar.html",
  "notifications.html",
  "profile.html",
  "settings.html",
]);

function guardAuth() {
  if (!AUTH_REQUIRED.has(currentPage())) return;
  // Wait for firebase auth, then redirect if no user.
  let attempts = 0;
  const iv = setInterval(() => {
    attempts += 1;
    const f = window._fb;
    if (f && f.auth) {
      clearInterval(iv);
      f.onAuthStateChanged(f.auth, (user) => {
        if (!user) location.href = "./login.html";
      });
    }
    if (attempts > 60) clearInterval(iv);
  }, 100);
}

// ───────────────── Page: Task Editor ─────────────────
async function wireTaskEditor() {
  const inputs = document.querySelectorAll(".form-grid input");
  const [nameI, priorityI, deadlineI, timeI, notesI] = inputs;
  const segRows = document.querySelectorAll(".segmented-row");
  const recurrencePills = segRows[0]
    ? Array.from(segRows[0].querySelectorAll(".soft-pill"))
    : [];
  const channelPills = segRows[1]
    ? Array.from(segRows[1].querySelectorAll(".soft-pill"))
    : [];

  let recurrence = "none";
  recurrencePills.forEach((p) => {
    onClick(p, () => {
      recurrencePills.forEach((x) => x.classList.remove("is-active"));
      p.classList.add("is-active");
      recurrence = p.textContent.trim().toLowerCase();
    });
  });
  const selectedChannels = new Set();
  channelPills.forEach((p) => {
    onClick(p, () => {
      const key = p.textContent.trim().toLowerCase();
      if (selectedChannels.has(key)) {
        selectedChannels.delete(key);
        p.classList.remove("is-active");
      } else {
        selectedChannels.add(key);
        p.classList.add("is-active");
      }
    });
  });

  const editId = new URLSearchParams(location.search).get("id");
  if (editId) {
    const all = await api().tasksApi.list();
    if (all.ok) {
      const t = all.data.find((x) => x.id === editId);
      if (t) {
        if (nameI) nameI.value = t.name || "";
        if (priorityI) priorityI.value = t.priority || "";
        if (deadlineI) deadlineI.value = t.deadline || "";
        if (timeI) timeI.value = t.time || "";
        if (notesI) notesI.value = t.notes || "";
        recurrence = t.recurrence || "none";
        (t.channels || []).forEach((c) => selectedChannels.add(c));
      }
    }
  }

  const saveBtn = findByText(".form-actions .soft-pill", "Save Task");
  onClick(saveBtn, async () => {
    const payload = {
      name: nameI?.value || "",
      priority: priorityI?.value || "medium",
      deadline: deadlineI?.value || null,
      time: timeI?.value || null,
      notes: notesI?.value || "",
      recurrence,
      channels: Array.from(selectedChannels),
    };
    const v = api().validateTask(payload);
    if (!v.valid) {
      toast(v.errors[0], "error");
      return;
    }
    const res = editId
      ? await api().tasksApi.update(editId, api().normalizeTask(payload))
      : await api().tasksApi.create(payload);
    if (res.ok) {
      toast("Task saved", "success");
      setTimeout(() => (location.href = "./daily-tasks.html"), 600);
    } else {
      toast(res.error, "error");
    }
  });

  const resetBtn = findByText(".form-actions .soft-pill", "Reset");
  onClick(resetBtn, () => {
    [nameI, priorityI, deadlineI, timeI, notesI].forEach((i) => i && (i.value = ""));
    selectedChannels.clear();
    channelPills.forEach((p) => p.classList.remove("is-active"));
    recurrencePills.forEach((p) => p.classList.remove("is-active"));
    recurrence = "none";
    toast("Form reset");
  });

  const previewBtn = findByText(".form-actions .soft-pill", "Preview Reminder");
  onClick(previewBtn, () => {
    toast(
      `Reminder preview: ${nameI?.value || "(unnamed)"} via ${
        Array.from(selectedChannels).join(", ") || "no channel"
      }`
    );
  });
}

// ───────────────── Page: Daily Tasks ─────────────────
async function wireDailyTasks() {
  const listEl = document.querySelector(".surface-list");
  if (!listEl) return;
  const res = await api().tasksApi.list();
  if (!res.ok) {
    toast(res.error, "error");
    return;
  }
  if (res.data.length === 0) return; // leave static demo rows
  listEl.innerHTML = "";
  api()
    .sortByDeadline(res.data)
    .forEach((t) => {
      const a = document.createElement("a");
      a.className = "surface-item";
      a.href = `./task-detail.html?id=${t.id}`;
      const statusClass =
        t.status === "done" ? "good" : t.status === "skipped" ? "warn" : "warn";
      const statusText =
        t.status === "done" ? "Done" : t.status === "skipped" ? "Skipped" : "Pending";
      const meta = [
        t.priority ? t.priority[0].toUpperCase() + t.priority.slice(1) : "",
        t.deadline ? new Date(t.deadline).toLocaleString() : "",
      ]
        .filter(Boolean)
        .join(" · ");
      a.innerHTML = `<div><strong></strong><small></small></div><span class="status-pill ${statusClass}"></span>`;
      a.querySelector("strong").textContent = t.name;
      a.querySelector("small").textContent = meta;
      a.querySelector(".status-pill").textContent = statusText;
      listEl.appendChild(a);
    });
}

// ───────────────── Page: Task Detail ─────────────────
async function wireTaskDetail() {
  const id = new URLSearchParams(location.search).get("id");
  if (id) {
    const res = await api().tasksApi.list();
    if (res.ok) {
      const t = res.data.find((x) => x.id === id);
      if (t) {
        const titleEl = document.querySelector(".hero-panel-large h1");
        if (titleEl) titleEl.textContent = t.name;
        const statusEl = document.querySelector(".hero-panel-side .value-big");
        if (statusEl)
          statusEl.textContent =
            t.status === "done" ? "Done" : t.status === "skipped" ? "Skipped" : "Pending";
      }
    }
  }
  const completeBtn = findByText(".chip-row .status-pill", "Mark Complete");
  onClick(completeBtn, async () => {
    if (!id) return toast("No task id", "error");
    const r = await api().tasksApi.complete(id);
    toast(r.ok ? "Marked complete" : r.error, r.ok ? "success" : "error");
  });
  const skipBtn = findByText(".chip-row .soft-pill", "Skip");
  onClick(skipBtn, async () => {
    if (!id) return;
    const r = await api().tasksApi.skip(id);
    toast(r.ok ? "Skipped" : r.error, r.ok ? "success" : "error");
  });
  const snoozeBtn = findByText(".chip-row .soft-pill", "Snooze");
  onClick(snoozeBtn, async () => {
    if (!id) return;
    const r = await api().tasksApi.snooze(id, 10);
    toast(r.ok ? "Snoozed 10 min" : r.error, r.ok ? "success" : "error");
  });
  const reschedBtn = findByText(".chip-row .soft-pill", "Reschedule");
  onClick(reschedBtn, async () => {
    if (!id) return;
    const when = prompt("New deadline (ISO date, e.g. 2026-04-15T18:30)");
    if (!when) return;
    const r = await api().tasksApi.reschedule(id, when);
    toast(r.ok ? "Rescheduled" : r.error, r.ok ? "success" : "error");
  });
}

// ───────────────── Page: Subtask Editor ─────────────────
async function wireSubtaskEditor() {
  const taskId = new URLSearchParams(location.search).get("taskId");
  const inputs = document.querySelectorAll(".form-grid input");
  const [nameI, statusI, deadlineI, priorityI, notesI] = inputs;
  const saveBtn = findByText(".form-actions .soft-pill", "Save Subtask");
  onClick(saveBtn, async () => {
    if (!taskId) return toast("Open from a task to save subtask", "error");
    const payload = {
      name: nameI?.value || "",
      status: statusI?.value || "pending",
      deadline: deadlineI?.value || null,
      priority: priorityI?.value || "medium",
      notes: notesI?.value || "",
    };
    const r = await api().subtasksApi.create(taskId, payload);
    toast(r.ok ? "Subtask saved" : r.error, r.ok ? "success" : "error");
  });
  const doneBtn = findByText(".form-actions .soft-pill", "Mark Complete");
  onClick(doneBtn, () => {
    toast("Select a subtask from task detail to complete");
  });
}

// ───────────────── Page: Goal Editor ─────────────────
async function wireGoalEditor() {
  const inputs = document.querySelectorAll(".form-grid input");
  const [nameI, typeI, startI, targetI, descI] = inputs;
  const editId = new URLSearchParams(location.search).get("id");
  if (editId) {
    const res = await api().goalsApi.list();
    if (res.ok) {
      const g = res.data.find((x) => x.id === editId);
      if (g) {
        nameI && (nameI.value = g.name || "");
        typeI && (typeI.value = g.type || "");
        startI && (startI.value = g.startDate || "");
        targetI && (targetI.value = g.targetDate || "");
        descI && (descI.value = g.description || "");
      }
    }
  }
  const saveBtn = findByText(".form-actions .soft-pill", "Save Goal");
  onClick(saveBtn, async () => {
    const payload = {
      name: nameI?.value || "",
      type: (typeI?.value || "short").toLowerCase().includes("long") ? "long" : "short",
      startDate: startI?.value || null,
      targetDate: targetI?.value || null,
      description: descI?.value || "",
    };
    const v = api().validateGoal(payload);
    if (!v.valid) return toast(v.errors[0], "error");
    const r = editId
      ? await api().goalsApi.update(editId, payload)
      : await api().goalsApi.create(payload);
    toast(r.ok ? "Goal saved" : r.error, r.ok ? "success" : "error");
    if (r.ok) setTimeout(() => history.back(), 700);
  });
  const dupBtn = findByText(".form-actions .soft-pill", "Duplicate");
  onClick(dupBtn, async () => {
    if (!editId) return toast("Save the goal first to duplicate", "error");
    const r = await api().goalsApi.duplicate(editId);
    toast(r.ok ? "Duplicated" : r.error, r.ok ? "success" : "error");
  });
  const delBtn = findByText(".form-actions .soft-pill", "Delete");
  onClick(delBtn, async () => {
    if (!editId) return toast("Nothing to delete", "error");
    if (!confirm("Delete this goal?")) return;
    const r = await api().goalsApi.remove(editId);
    toast(r.ok ? "Deleted" : r.error, r.ok ? "success" : "error");
    if (r.ok) setTimeout(() => (location.href = "./short-term-goals.html"), 500);
  });
}

// ───────────────── Goal list pages ─────────────────
async function wireGoalList(type) {
  const res = await api().goalsApi.listByType(type);
  if (!res.ok) return;
  if (res.data.length === 0) return;
  const grid = document.querySelector(".goal-grid") || document.querySelector(".surface-list");
  if (!grid) return;
  grid.innerHTML = "";
  res.data.forEach((g) => {
    const card = document.createElement("article");
    card.className = "goal-card";
    card.innerHTML = `<p class="mini-label"></p><h2></h2><p></p>
      <div class="progress-bar"><span></span></div>
      <div class="chip-row"><span class="status-pill good">Active</span>
      <a class="soft-pill" href="./goal-detail.html?id=${g.id}">View</a></div>`;
    card.querySelector(".mini-label").textContent = g.type === "long" ? "Long-Term" : "Short-Term";
    card.querySelectorAll("h2,p")[0] && (card.querySelector("h2").textContent = g.name);
    const pEls = card.querySelectorAll("p");
    if (pEls[1]) pEls[1].textContent = g.description || "";
    card.querySelector(".progress-bar span").style.width = `${g.progress || 0}%`;
    grid.appendChild(card);
  });
}

// ───────────────── Goal detail ─────────────────
async function wireGoalDetail() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;
  const res = await api().goalsApi.list();
  if (!res.ok) return;
  const g = res.data.find((x) => x.id === id);
  if (!g) return;
  const title = document.querySelector(".hero-panel-large h1");
  if (title) title.textContent = g.name;
  const tasks = await api().tasksApi.list();
  if (tasks.ok) {
    const mine = tasks.data.filter((t) => t.goalId === id);
    const pct = api().progress(mine);
    const progEl = document.querySelector(".hero-panel-side .value-big");
    if (progEl) progEl.textContent = `${pct}%`;
    const bar = document.querySelector(".hero-panel-side .progress-bar span");
    if (bar) bar.style.width = `${pct}%`;
  }
}

// ───────────────── Habits ─────────────────
async function wireHabits() {
  const res = await api().habitsApi.list();
  if (!res.ok) return;
  if (res.data.length === 0) return;
  const grid = document.querySelector(".habit-grid") || document.getElementById("habit-list");
  if (!grid) return;
  grid.innerHTML = "";
  res.data.forEach((h) => {
    const streak = api().streakFromLog(h.log || []);
    const pct = Math.min(100, streak * 7);
    const card = document.createElement("article");
    card.className = "habit-card";
    card.innerHTML = `<p class="mini-label"></p><h2 class="section-title"></h2><p></p>
      <div class="progress-bar"><span></span></div>
      <div class="chip-row"><span class="soft-pill check-in">Check In</span></div>`;
    card.querySelector(".mini-label").textContent = h.schedule || "daily";
    card.querySelector("h2").textContent = h.name;
    card.querySelector("p").textContent = `Streak ${streak} · ${h.time || ""}`;
    card.querySelector(".progress-bar span").style.width = `${pct}%`;
    onClick(card.querySelector(".check-in"), async () => {
      const r = await api().habitsApi.checkIn(h.id);
      toast(r.ok ? "Checked in" : r.error, r.ok ? "success" : "error");
    });
    grid.appendChild(card);
  });
}

// ───────────────── Calendar ─────────────────
async function wireCalendar() {
  const today = new Date();
  const res = await api().calendarApi.monthEvents(today.getFullYear(), today.getMonth());
  if (!res.ok) return;
  const cells = document.querySelectorAll(".calendar-cell");
  res.data.forEach((ev) => {
    const d = new Date(ev.date).getDate();
    const cell = Array.from(cells).find((c) => Number(c.querySelector("strong")?.textContent) === d);
    if (cell) {
      const span = document.createElement("span");
      span.className = "calendar-event";
      span.textContent = ev.title;
      cell.appendChild(span);
    }
  });
}

// ───────────────── Notifications ─────────────────
async function wireNotifications() {
  const cards = document.querySelectorAll(".channel-card");
  const res = await api().notificationsApi.get();
  const prefs = res.ok ? res.data : {};
  cards.forEach((card) => {
    const label = card.querySelector(".mini-label")?.textContent?.trim().toLowerCase();
    if (!label) return;
    const key =
      label === "in-app" ? "inApp" : label === "snooze" ? "snooze" : label;
    const strong = card.querySelector("strong");
    const enabled = prefs[key] ?? (label !== "sms" && label !== "whatsapp");
    if (strong) strong.textContent = enabled ? "Enabled" : "Disabled";
    makeClickable(card);
    card.addEventListener("click", async () => {
      const now = (card.querySelector("strong")?.textContent || "").toLowerCase() === "enabled";
      const r = await api().notificationsApi.setChannel(key, !now);
      if (r.ok) {
        card.querySelector("strong").textContent = !now ? "Enabled" : "Disabled";
        toast(`${label}: ${!now ? "on" : "off"}`, "success");
      } else {
        toast(r.error, "error");
      }
    });
  });
}

// ───────────────── Profile ─────────────────
async function wireProfile() {
  const f = window._fb;
  if (!f?.auth?.currentUser) return;
  const u = f.auth.currentUser;
  const title = document.querySelector(".hero-panel-large h1");
  if (title && u.displayName) title.textContent = u.displayName;
  const logoutLink = Array.from(document.querySelectorAll(".sidebar-link")).find(
    (a) => /logout/i.test(a.textContent)
  );
  onClick(logoutLink, () => window.timenestAuth?.logOut());
}

// ───────────────── Settings ─────────────────
async function wireSettings() {
  const res = await api().settingsApi.get();
  const prefs = res.ok ? res.data : {};
  const cards = document.querySelectorAll(".settings-card");
  cards.forEach((card) => {
    makeClickable(card);
    const label = card.querySelector(".mini-label")?.textContent?.trim().toLowerCase();
    card.addEventListener("click", async () => {
      const val = prompt(`Set ${label}:`);
      if (val == null) return;
      const r = await api().settingsApi.set({ [label]: val });
      toast(r.ok ? `${label} saved` : r.error, r.ok ? "success" : "error");
    });
  });
  const logoutLink = Array.from(document.querySelectorAll(".sidebar-link")).find(
    (a) => /logout/i.test(a.textContent)
  );
  onClick(logoutLink, () => window.timenestAuth?.logOut());
}

// ───────────────── Dashboard (index.html) ─────────────────
async function wireDashboard() {
  // Upgrade the demo task rows to use real data if present.
  const res = await api().tasksApi.list();
  if (!res.ok || res.data.length === 0) return;
  const rows = document.querySelectorAll(".task-row");
  const tasks = api().sortByDeadline(res.data).slice(0, rows.length);
  rows.forEach((row, i) => {
    const t = tasks[i];
    if (!t) return;
    const strong = row.querySelector("strong");
    if (strong) strong.textContent = t.name;
    row.dataset.taskId = t.id;
  });
}

// ───────────────── Dispatcher ─────────────────
function waitForApi(cb) {
  if (api()) return cb();
  const iv = setInterval(() => {
    if (api()) {
      clearInterval(iv);
      cb();
    }
  }, 50);
  setTimeout(() => clearInterval(iv), 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  guardAuth();
  waitForApi(() => {
    const page = currentPage();
    const map = {
      "index.html": wireDashboard,
      "": wireDashboard,
      "daily-tasks.html": wireDailyTasks,
      "task-detail.html": wireTaskDetail,
      "task-editor.html": wireTaskEditor,
      "subtask-editor.html": wireSubtaskEditor,
      "goal-editor.html": wireGoalEditor,
      "goal-detail.html": wireGoalDetail,
      "short-term-goals.html": () => wireGoalList("short"),
      "long-term-goals.html": () => wireGoalList("long"),
      "habits.html": wireHabits,
      "calendar.html": wireCalendar,
      "notifications.html": wireNotifications,
      "profile.html": wireProfile,
      "settings.html": wireSettings,
    };
    const fn = map[page];
    if (fn) {
      Promise.resolve(fn()).catch((e) => console.error("wiring error:", e));
    }
  });
});

// Export helpers for tests (no-op in browser)
export { findByText, currentPage };
