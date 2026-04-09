// Node built-in test runner — run with: node --test tests/
import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
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
  goalsApi,
  habitsApi,
  notificationsApi,
  settingsApi,
  calendarApi,
} from "../data.js";

// ───────────────── Pure helpers ─────────────────

describe("progress()", () => {
  it("returns 0 for empty or invalid input", () => {
    assert.equal(progress([]), 0);
    assert.equal(progress(null), 0);
    assert.equal(progress(undefined), 0);
  });
  it("computes percentage of done tasks", () => {
    assert.equal(progress([{ status: "done" }, { status: "pending" }]), 50);
    assert.equal(
      progress([
        { status: "done" },
        { status: "done" },
        { status: "done" },
        { status: "pending" },
      ]),
      75
    );
  });
  it("rounds to nearest integer", () => {
    assert.equal(
      progress([{ status: "done" }, { status: "pending" }, { status: "pending" }]),
      33
    );
  });
});

describe("filterByStatus()", () => {
  const items = [
    { id: 1, status: "done" },
    { id: 2, status: "pending" },
    { id: 3, status: "done" },
  ];
  it("returns all when status omitted", () => {
    assert.equal(filterByStatus(items).length, 3);
    assert.equal(filterByStatus(items, "all").length, 3);
  });
  it("filters by exact status", () => {
    assert.equal(filterByStatus(items, "done").length, 2);
    assert.equal(filterByStatus(items, "pending").length, 1);
  });
  it("handles invalid input", () => {
    assert.deepEqual(filterByStatus(null, "done"), []);
  });
});

describe("filterDueToday()", () => {
  it("returns only tasks with deadline today", () => {
    const today = new Date("2026-04-09T12:00:00");
    const tasks = [
      { name: "A", deadline: "2026-04-09T08:00:00" },
      { name: "B", deadline: "2026-04-10T08:00:00" },
      { name: "C", deadline: "2026-04-09T23:00:00" },
      { name: "D" },
    ];
    const out = filterDueToday(tasks, today);
    assert.equal(out.length, 2);
    assert.deepEqual(
      out.map((t) => t.name),
      ["A", "C"]
    );
  });
});

describe("sortByDeadline()", () => {
  it("sorts ascending, undated last", () => {
    const out = sortByDeadline([
      { name: "late", deadline: "2026-05-01" },
      { name: "none" },
      { name: "early", deadline: "2026-04-01" },
    ]);
    assert.deepEqual(
      out.map((t) => t.name),
      ["early", "late", "none"]
    );
  });
});

describe("nextRecurrence()", () => {
  const base = "2026-04-09T10:00:00.000Z";
  it("daily adds a day", () => {
    assert.equal(nextRecurrence(base, "daily"), "2026-04-10T10:00:00.000Z");
  });
  it("weekly adds 7 days", () => {
    assert.equal(nextRecurrence(base, "weekly"), "2026-04-16T10:00:00.000Z");
  });
  it("monthly advances month", () => {
    assert.equal(nextRecurrence(base, "monthly"), "2026-05-09T10:00:00.000Z");
  });
  it("yearly advances year", () => {
    assert.equal(nextRecurrence(base, "yearly"), "2027-04-09T10:00:00.000Z");
  });
  it("none / invalid returns null", () => {
    assert.equal(nextRecurrence(base, "none"), null);
    assert.equal(nextRecurrence(base, ""), null);
    assert.equal(nextRecurrence(base, "lol"), null);
    assert.equal(nextRecurrence("not-a-date", "daily"), null);
  });
});

describe("streakFromLog()", () => {
  it("returns 0 for empty log", () => {
    assert.equal(streakFromLog([]), 0);
  });
  it("counts consecutive days ending today", () => {
    const today = new Date("2026-04-09T09:00:00");
    const log = [
      "2026-04-07T06:00:00",
      "2026-04-08T06:00:00",
      "2026-04-09T06:00:00",
    ];
    assert.equal(streakFromLog(log, today), 3);
  });
  it("breaks on missing day", () => {
    const today = new Date("2026-04-09T09:00:00");
    const log = ["2026-04-06", "2026-04-08", "2026-04-09"];
    assert.equal(streakFromLog(log, today), 2);
  });
  it("returns 0 if today missing", () => {
    const today = new Date("2026-04-09");
    assert.equal(streakFromLog(["2026-04-07", "2026-04-08"], today), 0);
  });
});

describe("validateTask()", () => {
  it("rejects missing name", () => {
    assert.equal(validateTask({}).valid, false);
    assert.equal(validateTask({ name: "" }).valid, false);
    assert.equal(validateTask({ name: "   " }).valid, false);
  });
  it("accepts minimal valid task", () => {
    assert.equal(validateTask({ name: "Do thing" }).valid, true);
  });
  it("rejects bad priority", () => {
    assert.equal(validateTask({ name: "x", priority: "urgent" }).valid, false);
  });
  it("accepts valid priorities case-insensitively", () => {
    assert.equal(validateTask({ name: "x", priority: "HIGH" }).valid, true);
  });
  it("rejects invalid deadline", () => {
    assert.equal(validateTask({ name: "x", deadline: "not-a-date" }).valid, false);
  });
  it("rejects non-object input", () => {
    assert.equal(validateTask(null).valid, false);
    assert.equal(validateTask("str").valid, false);
  });
});

describe("validateGoal()", () => {
  it("rejects missing name", () => {
    assert.equal(validateGoal({}).valid, false);
  });
  it("rejects bad type", () => {
    assert.equal(validateGoal({ name: "g", type: "medium" }).valid, false);
  });
  it("rejects target before start", () => {
    assert.equal(
      validateGoal({ name: "g", startDate: "2026-06-01", targetDate: "2026-05-01" }).valid,
      false
    );
  });
  it("accepts valid goal", () => {
    assert.equal(
      validateGoal({
        name: "g",
        type: "short",
        startDate: "2026-04-01",
        targetDate: "2026-06-01",
      }).valid,
      true
    );
  });
});

describe("normalizeTask()", () => {
  it("trims name and defaults fields", () => {
    const out = normalizeTask({ name: "  Hi  " });
    assert.equal(out.name, "Hi");
    assert.equal(out.priority, "medium");
    assert.equal(out.status, "pending");
    assert.equal(out.recurrence, "none");
    assert.ok(Array.isArray(out.channels));
    assert.equal(typeof out.updatedAt, "string");
  });
});

// ───────────────── Firestore CRUD (in-memory stub) ─────────────────

function makeFirestoreStub() {
  const store = new Map();
  const seq = { n: 0 };
  const keyOf = (parts) => parts.join("/");
  const api = {
    db: { __stub: true },
    auth: { currentUser: { uid: "u1" } },
    collection: (_db, ...parts) => ({ __col: keyOf(parts) }),
    doc: (_db, ...parts) => ({ __doc: keyOf(parts) }),
    addDoc: async (col, payload) => {
      seq.n += 1;
      const id = `id${seq.n}`;
      store.set(`${col.__col}/${id}`, { id, ...payload });
      return { id };
    },
    getDocs: async (col) => {
      const prefix = col.__col + "/";
      const rows = [];
      store.forEach((v, k) => {
        if (k.startsWith(prefix) && k.slice(prefix.length).indexOf("/") === -1) {
          rows.push({ id: v.id, data: () => v });
        }
      });
      return { forEach: (cb) => rows.forEach(cb) };
    },
    updateDoc: async (ref, patch) => {
      const existing = store.get(ref.__doc) || { id: ref.__doc.split("/").pop() };
      const merged = { ...existing };
      Object.keys(patch).forEach((k) => {
        if (k.includes(".")) {
          const [top, sub] = k.split(".");
          merged[top] = { ...(merged[top] || {}), [sub]: patch[k] };
        } else {
          merged[k] = patch[k];
        }
      });
      store.set(ref.__doc, merged);
      return true;
    },
    deleteDoc: async (ref) => {
      store.delete(ref.__doc);
      return true;
    },
    getDoc: async (ref) => {
      const v = store.get(ref.__doc);
      return {
        exists: () => !!v,
        data: () => v,
      };
    },
    setDoc: async (ref, data) => {
      store.set(ref.__doc, data);
      return true;
    },
    query: (x) => x,
    where: () => ({}),
    orderBy: () => ({}),
    onSnapshot: () => () => {},
    serverTimestamp: () => new Date().toISOString(),
  };
  return { api, store };
}

function installStub() {
  const stub = makeFirestoreStub();
  globalThis.window = { _fb: stub.api };
  return stub;
}

describe("tasksApi (CRUD against in-memory Firestore)", () => {
  beforeEach(() => {
    installStub();
  });

  it("create() rejects invalid tasks", async () => {
    const r = await tasksApi.create({ name: "" });
    assert.equal(r.ok, false);
    assert.match(r.error, /name/i);
  });

  it("create → list → update → complete → remove", async () => {
    const c = await tasksApi.create({ name: "Write docs", priority: "high" });
    assert.equal(c.ok, true);
    assert.ok(c.data.id);

    const list1 = await tasksApi.list();
    assert.equal(list1.ok, true);
    assert.equal(list1.data.length, 1);
    assert.equal(list1.data[0].name, "Write docs");
    assert.equal(list1.data[0].status, "pending");

    const u = await tasksApi.update(c.data.id, { notes: "updated" });
    assert.equal(u.ok, true);

    const done = await tasksApi.complete(c.data.id);
    assert.equal(done.ok, true);

    const list2 = await tasksApi.list();
    assert.equal(list2.data[0].status, "done");
    assert.ok(list2.data[0].completedAt);

    const del = await tasksApi.remove(c.data.id);
    assert.equal(del.ok, true);

    const list3 = await tasksApi.list();
    assert.equal(list3.data.length, 0);
  });

  it("skip / snooze / reschedule update status", async () => {
    const c = await tasksApi.create({ name: "X" });
    const id = c.data.id;
    assert.equal((await tasksApi.skip(id)).ok, true);
    assert.equal((await tasksApi.snooze(id, 5)).ok, true);
    const rs = await tasksApi.reschedule(id, "2026-05-01T10:00:00");
    assert.equal(rs.ok, true);
    const list = await tasksApi.list();
    assert.equal(list.data[0].status, "pending");
    assert.equal(list.data[0].deadline, "2026-05-01T10:00:00");
  });
});

describe("goalsApi", () => {
  beforeEach(() => installStub());
  it("create rejects invalid, listByType filters", async () => {
    assert.equal((await goalsApi.create({})).ok, false);
    await goalsApi.create({ name: "S", type: "short" });
    await goalsApi.create({ name: "L", type: "long" });
    const s = await goalsApi.listByType("short");
    assert.equal(s.ok, true);
    assert.equal(s.data.length, 1);
    assert.equal(s.data[0].name, "S");
  });
  it("duplicate clones an existing goal", async () => {
    const c = await goalsApi.create({ name: "Orig", type: "short" });
    const d = await goalsApi.duplicate(c.data.id);
    assert.equal(d.ok, true);
    const list = await goalsApi.list();
    assert.equal(list.data.length, 2);
    assert.deepEqual(
      list.data.map((g) => g.name).sort(),
      ["Orig", "Orig (copy)"]
    );
  });
});

describe("habitsApi", () => {
  beforeEach(() => installStub());
  it("checkIn appends to log", async () => {
    const c = await habitsApi.create({ name: "Walk", schedule: "daily" });
    const r = await habitsApi.checkIn(c.data.id);
    assert.equal(r.ok, true);
    const list = await habitsApi.list();
    assert.equal(list.data[0].log.length, 1);
  });
});

describe("notificationsApi + settingsApi", () => {
  beforeEach(() => {
    const stub = makeFirestoreStub();
    stub.api.setDoc(
      { __doc: "users/u1" },
      { notificationPrefs: { push: true }, settings: {} }
    );
    globalThis.window = { _fb: stub.api };
  });
  it("notifications.get returns prefs", async () => {
    const r = await notificationsApi.get();
    assert.equal(r.ok, true);
    assert.equal(r.data.push, true);
  });
  it("notifications.setChannel flips a channel", async () => {
    const r = await notificationsApi.setChannel("email", true);
    assert.equal(r.ok, true);
    assert.deepEqual(r.data, { channel: "email", enabled: true });
  });
  it("settings.set persists dot-notation updates", async () => {
    const r = await settingsApi.set({ theme: "dark", language: "en" });
    assert.equal(r.ok, true);
    const g = await settingsApi.get();
    assert.equal(g.ok, true);
    assert.equal(g.data.theme, "dark");
    assert.equal(g.data.language, "en");
  });
});

describe("calendarApi", () => {
  beforeEach(() => installStub());
  it("monthEvents returns only that month's tasks", async () => {
    await tasksApi.create({ name: "In month", deadline: "2026-04-15T10:00:00" });
    await tasksApi.create({ name: "Other", deadline: "2026-05-02T10:00:00" });
    const r = await calendarApi.monthEvents(2026, 3);
    assert.equal(r.ok, true);
    assert.equal(r.data.length, 1);
    assert.equal(r.data[0].title, "In month");
  });
});
