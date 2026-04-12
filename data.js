// ─── TIMENEST Data Layer ───
// Firestore-backed CRUD for tasks, subtasks, goals, habits, notifications,
// settings, and calendar events, plus pure helper functions that are unit
// tested in tests/data.test.js.
//
// This module works in two modes:
//   1. Browser — attaches to window._fb (populated by auth.js) and uses
//      Firebase Web SDK (modular). Collections are scoped per-user under
//      users/{uid}/{collection}.
//   2. Node (tests) — pure helper functions are exported via CommonJS-style
//      globalThis assignment so Vitest can import them.
//
// Design notes:
// - All CRUD functions return Promises and never throw; they resolve to
//   { ok: true, data } or { ok: false, error }.
// - Pure helpers (progress, filterByStatus, nextRecurrence, streakFromLog,
//   validateTask, validateGoal) take plain data and are easy to test.

// ───────────────────────── Pure helpers ─────────────────────────

export function progress(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t && t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

export function filterByStatus(items, status) {
  if (!Array.isArray(items)) return [];
  if (!status || status === "all") return items.slice();
  return items.filter((i) => i && i.status === status);
}

export function filterDueToday(tasks, today = new Date()) {
  if (!Array.isArray(tasks)) return [];
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  return tasks.filter((t) => {
    if (!t || !t.deadline) return false;
    const dt = new Date(t.deadline);
    return (
      dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
    );
  });
}

export function sortByDeadline(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.slice().sort((a, b) => {
    const da = a?.deadline ? new Date(a.deadline).getTime() : Infinity;
    const db = b?.deadline ? new Date(b.deadline).getTime() : Infinity;
    return da - db;
  });
}

export function nextRecurrence(date, recurrence) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  switch ((recurrence || "").toLowerCase()) {
    case "daily":
      d.setDate(d.getDate() + 1);
      return d.toISOString();
    case "weekly":
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      return d.toISOString();
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    case "none":
    case "":
    case undefined:
    case null:
      return null;
    default:
      return null;
  }
}

// Given an ordered array of ISO date strings marking habit completions,
// compute the current consecutive-day streak ending today.
export function streakFromLog(log, today = new Date()) {
  if (!Array.isArray(log) || log.length === 0) return 0;
  const days = new Set(
    log
      .map((d) => {
        const x = new Date(d);
        if (Number.isNaN(x.getTime())) return null;
        return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
      })
      .filter(Boolean)
  );
  let streak = 0;
  const cursor = new Date(today);
  while (days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function validateTask(task) {
  const errors = [];
  if (!task || typeof task !== "object") {
    return { valid: false, errors: ["Task must be an object"] };
  }
  if (!task.name || typeof task.name !== "string" || !task.name.trim()) {
    errors.push("Task name is required");
  }
  if (
    task.priority &&
    !["low", "medium", "high"].includes(String(task.priority).toLowerCase())
  ) {
    errors.push("Priority must be low, medium, or high");
  }
  if (task.deadline && Number.isNaN(new Date(task.deadline).getTime())) {
    errors.push("Deadline is not a valid date");
  }
  return { valid: errors.length === 0, errors };
}

export function validateGoal(goal) {
  const errors = [];
  if (!goal || typeof goal !== "object") {
    return { valid: false, errors: ["Goal must be an object"] };
  }
  if (!goal.name || !String(goal.name).trim()) errors.push("Goal name is required");
  if (goal.type && !["short", "long", "tasks"].includes(String(goal.type).toLowerCase())) {
    errors.push("Goal type must be short, long, or tasks");
  }
  if (goal.startDate && goal.targetDate) {
    const s = new Date(goal.startDate).getTime();
    const t = new Date(goal.targetDate).getTime();
    if (!Number.isNaN(s) && !Number.isNaN(t) && t < s) {
      errors.push("Target date must be after start date");
    }
  }
  return { valid: errors.length === 0, errors };
}

export function normalizeTask(raw) {
  return {
    name: String(raw?.name || "").trim(),
    priority: String(raw?.priority || "medium").toLowerCase(),
    deadline: raw?.deadline || null,
    time: raw?.time || null,
    notes: raw?.notes || "",
    recurrence: String(raw?.recurrence || "none").toLowerCase(),
    channels: Array.isArray(raw?.channels) ? raw.channels : [],
    goalId: raw?.goalId || null,
    status: raw?.status || "pending",
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ───────────────────────── Firestore CRUD ─────────────────────────
//
// These only run in the browser where window._fb is set up by auth.js.

function fb() {
  if (typeof window === "undefined" || !window._fb) return null;
  return window._fb;
}

function currentUid() {
  const f = fb();
  return f?.auth?.currentUser?.uid || null;
}

async function lazyFirestore() {
  const f = fb();
  if (!f) throw new Error("Firebase not initialised");
  if (f.collection && f.addDoc && f.getDocs && f.query) return f;
  // Load the parts not preloaded by auth.js
  const more = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  const merged = {
    ...f,
    collection: more.collection,
    addDoc: more.addDoc,
    getDocs: more.getDocs,
    query: more.query,
    where: more.where,
    orderBy: more.orderBy,
    deleteDoc: more.deleteDoc,
    onSnapshot: more.onSnapshot,
    serverTimestamp: more.serverTimestamp,
  };
  window._fb = merged;
  return merged;
}

async function waitForUser() {
  // Give auth up to 4 seconds to finish restoring
  for (let i = 0; i < 40; i += 1) {
    const uid = currentUid();
    if (uid) return uid;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

function ok(data) {
  return { ok: true, data };
}
function fail(error) {
  return { ok: false, error: error?.message || String(error) };
}

// Generic collection helpers — scoped per user.
async function userCol(name) {
  const f = await lazyFirestore();
  const uid = await waitForUser();
  if (!uid) throw new Error("Not signed in");
  return { ref: f.collection(f.db, "users", uid, name), f };
}

async function listDocs(name) {
  try {
    const { ref, f } = await userCol(name);
    const snap = await f.getDocs(ref);
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

async function addRow(name, payload) {
  try {
    const { ref, f } = await userCol(name);
    const docRef = await f.addDoc(ref, payload);
    return ok({ id: docRef.id, ...payload });
  } catch (e) {
    return fail(e);
  }
}

async function updateRow(name, id, patch) {
  try {
    const { f } = await userCol(name);
    const uid = currentUid();
    const ref = f.doc(f.db, "users", uid, name, id);
    await f.updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() });
    return ok({ id, ...patch });
  } catch (e) {
    return fail(e);
  }
}

async function deleteRow(name, id) {
  try {
    const { f } = await userCol(name);
    const uid = currentUid();
    const ref = f.doc(f.db, "users", uid, name, id);
    await f.deleteDoc(ref);
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

// ── Tasks ──
export const tasksApi = {
  list: () => listDocs("tasks"),
  create: (raw) => {
    const v = validateTask(raw);
    if (!v.valid) return Promise.resolve(fail(v.errors.join(", ")));
    return addRow("tasks", normalizeTask(raw));
  },
  update: (id, patch) => updateRow("tasks", id, patch),
  remove: (id) => deleteRow("tasks", id),
  complete: (id) =>
    updateRow("tasks", id, { status: "done", completedAt: new Date().toISOString() }),
  skip: (id) => updateRow("tasks", id, { status: "skipped" }),
  snooze: (id, minutes = 10) =>
    updateRow("tasks", id, {
      status: "snoozed",
      snoozedUntil: new Date(Date.now() + minutes * 60000).toISOString(),
    }),
  reschedule: (id, newDeadline) =>
    updateRow("tasks", id, { deadline: newDeadline, status: "pending" }),
};

// ── Subtasks (stored as a subcollection document field on the parent task) ──
export const subtasksApi = {
  async list(taskId) {
    try {
      const { f } = await userCol("tasks");
      const uid = currentUid();
      const sub = f.collection(f.db, "users", uid, "tasks", taskId, "subtasks");
      const snap = await f.getDocs(sub);
      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      return ok(rows);
    } catch (e) {
      return fail(e);
    }
  },
  async create(taskId, raw) {
    const v = validateTask(raw);
    if (!v.valid) return fail(v.errors.join(", "));
    try {
      const { f } = await userCol("tasks");
      const uid = currentUid();
      const sub = f.collection(f.db, "users", uid, "tasks", taskId, "subtasks");
      const docRef = await f.addDoc(sub, normalizeTask(raw));
      return ok({ id: docRef.id });
    } catch (e) {
      return fail(e);
    }
  },
  async complete(taskId, subtaskId) {
    try {
      const { f } = await userCol("tasks");
      const uid = currentUid();
      const ref = f.doc(f.db, "users", uid, "tasks", taskId, "subtasks", subtaskId);
      await f.updateDoc(ref, { status: "done" });
      return ok({ id: subtaskId });
    } catch (e) {
      return fail(e);
    }
  },
};

// ── Goals ──
export const goalsApi = {
  list: () => listDocs("goals"),
  listByType: async (type) => {
    const res = await listDocs("goals");
    if (!res.ok) return res;
    return ok(res.data.filter((g) => (g.type || "").toLowerCase() === type));
  },
  create: (raw) => {
    const v = validateGoal(raw);
    if (!v.valid) return Promise.resolve(fail(v.errors.join(", ")));
    return addRow("goals", {
      name: String(raw.name).trim(),
      type: String(raw.type || "short").toLowerCase(),
      startDate: raw.startDate || null,
      targetDate: raw.targetDate || null,
      description: raw.description || "",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  update: (id, patch) => updateRow("goals", id, patch),
  remove: (id) => deleteRow("goals", id),
  duplicate: async (id) => {
    const res = await listDocs("goals");
    if (!res.ok) return res;
    const src = res.data.find((g) => g.id === id);
    if (!src) return fail("Goal not found");
    const { id: _omit, ...rest } = src;
    return addRow("goals", {
      ...rest,
      name: `${src.name} (copy)`,
      createdAt: new Date().toISOString(),
    });
  },
};

// ── Habits ──
export const habitsApi = {
  list: () => listDocs("habits"),
  create: (raw) =>
    addRow("habits", {
      name: String(raw?.name || "").trim(),
      schedule: raw?.schedule || "daily",
      time: raw?.time || null,
      channel: raw?.channel || "push",
      log: [],
      createdAt: new Date().toISOString(),
    }),
  checkIn: async (id) => {
    const res = await listDocs("habits");
    if (!res.ok) return res;
    const h = res.data.find((x) => x.id === id);
    if (!h) return fail("Habit not found");
    const log = Array.isArray(h.log) ? h.log.slice() : [];
    log.push(new Date().toISOString());
    return updateRow("habits", id, { log });
  },
  remove: (id) => deleteRow("habits", id),
};

// ── Notification preferences ──
export const notificationsApi = {
  async get() {
    try {
      const f = await lazyFirestore();
      const uid = await waitForUser();
      if (!uid) throw new Error("Not signed in");
      const ref = f.doc(f.db, "users", uid);
      const snap = await f.getDoc(ref);
      return ok(snap.exists() ? snap.data().notificationPrefs || {} : {});
    } catch (e) {
      return fail(e);
    }
  },
  async setChannel(channel, enabled) {
    try {
      const f = await lazyFirestore();
      const uid = await waitForUser();
      if (!uid) throw new Error("Not signed in");
      const ref = f.doc(f.db, "users", uid);
      await f.updateDoc(ref, { [`notificationPrefs.${channel}`]: !!enabled });
      return ok({ channel, enabled: !!enabled });
    } catch (e) {
      return fail(e);
    }
  },
};

// ── Settings (profile-level preferences) ──
export const settingsApi = {
  async get() {
    try {
      const f = await lazyFirestore();
      const uid = await waitForUser();
      if (!uid) throw new Error("Not signed in");
      const ref = f.doc(f.db, "users", uid);
      const snap = await f.getDoc(ref);
      return ok(snap.exists() ? snap.data().settings || {} : {});
    } catch (e) {
      return fail(e);
    }
  },
  async set(patch) {
    try {
      const f = await lazyFirestore();
      const uid = await waitForUser();
      if (!uid) throw new Error("Not signed in");
      const ref = f.doc(f.db, "users", uid);
      const updates = {};
      Object.keys(patch || {}).forEach((k) => {
        updates[`settings.${k}`] = patch[k];
      });
      await f.updateDoc(ref, updates);
      return ok(patch);
    } catch (e) {
      return fail(e);
    }
  },
};

// ── Calendar events (derived from tasks + goal milestones) ──
export const calendarApi = {
  async monthEvents(year, month) {
    const res = await tasksApi.list();
    if (!res.ok) return res;
    const events = res.data
      .filter((t) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((t) => ({
        id: t.id,
        title: t.name,
        date: t.deadline,
        status: t.status,
      }));
    return ok(events);
  },
};

// ── Expose on window for HTML onclick handlers ──
if (typeof window !== "undefined") {
  window.timenestData = {
    progress,
    filterByStatus,
    filterDueToday,
    sortByDeadline,
    nextRecurrence,
    streakFromLog,
    validateTask,
    validateGoal,
    normalizeTask,
    tasksApi,
    subtasksApi,
    goalsApi,
    habitsApi,
    notificationsApi,
    settingsApi,
    calendarApi,
  };
}
