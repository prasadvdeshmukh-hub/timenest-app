(() => {
  const demoPurgeKey = "timenest-demo-purge-v2";
  const demoRecords = {
    goals: new Set([
      "finish 30-day strength cycle",
      "build emergency buffer",
      "ship flutter ui prototype",
      "sleep before 11 pm for 21 days",
      "launch timenest mvp",
      "build financial freedom runway",
      "master marathi communication",
      "reach advanced fitness baseline"
    ]),
    tasks: new Set([
      "submit investor-ready roadmap",
      "practice marathi lesson",
      "practice spoken marathi lesson",
      "review monthly budget targets",
      "renew hosting and production services",
      "prepare q2 learning sprint plan",
      "finalize dashboard ui",
      "build auth screens",
      "connect recurring task engine",
      "set up notification matrix",
      "complete 45 min workout"
    ]),
    habits: new Set([
      "workout habit",
      "marathi practice",
      "sleep routine"
    ]),
    subtasks: new Set([
      "update milestone slide",
      "validate financial numbers",
      "complete guided speaking session",
      "review new vocabulary",
      "compare actual spend to target",
      "send review copy",
      "adjust savings buffer",
      "warm up and mobility",
      "verify invoice amount",
      "confirm payment receipt"
    ])
  };

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function completedTickMarkup(label = "Completed") {
    const safeLabel = escapeHtml(label);
    return `
      <span class="completion-check-badge" aria-label="${safeLabel}" title="${safeLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    `;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }

  function sameDay(leftDate, rightDate) {
    if (!(leftDate instanceof Date) || !(rightDate instanceof Date)) {
      return false;
    }

    return (
      leftDate.getFullYear() === rightDate.getFullYear() &&
      leftDate.getMonth() === rightDate.getMonth() &&
      leftDate.getDate() === rightDate.getDate()
    );
  }

  function parseDateOnly(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [yearValue, monthValue, dayValue] = value.split("-").map(Number);
    const parsed = new Date(yearValue, monthValue - 1, dayValue, 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function parseTaskDateTime(record) {
    const baseDate = parseDateOnly(record?.date);
    if (!baseDate) {
      return null;
    }

    const [hourValue, minuteValue] = String(record?.time || "00:00").split(":").map(Number);
    baseDate.setHours(
      Number.isInteger(hourValue) ? hourValue : 0,
      Number.isInteger(minuteValue) ? minuteValue : 0,
      0,
      0
    );
    return baseDate;
  }

  function formatLongDate(dateValue) {
    return dateValue.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatShortDate(dateValue) {
    return dateValue.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short"
    });
  }

  function formatTime(dateValue) {
    return dateValue.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function getRelativeDayLabel(dateValue, now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (sameDay(dateValue, today)) {
      return "Today";
    }

    if (sameDay(dateValue, tomorrow)) {
      return "Tomorrow";
    }

    if (sameDay(dateValue, yesterday)) {
      return "Yesterday";
    }

    return formatShortDate(dateValue);
  }

  function formatDueLabel(record, now = new Date()) {
    const dueDate = parseTaskDateTime(record);
    if (!dueDate) {
      return "No due date";
    }

    const dayLabel = getRelativeDayLabel(dueDate, now);
    const timeLabel = formatTime(dueDate);
    return dayLabel === "Today" ? `Due ${timeLabel}` : `${dayLabel} / ${timeLabel}`;
  }

  function formatDueMeta(record, now = new Date()) {
    const dueDate = parseTaskDateTime(record);
    if (!dueDate) {
      return "No due date set";
    }

    return `${getRelativeDayLabel(dueDate, now)} / ${formatTime(dueDate)}`;
  }

  function getTaskCadence(task) {
    const frequency = Array.isArray(task?.frequency)
      ? task.frequency.map((item) => normalizeName(item))
      : [];
    const weekdayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    if (
      frequency.includes("custom days")
      || frequency.includes("custom-days")
      || frequency.some((item) => weekdayKeys.includes(item))
    ) {
      return "custom days";
    }
    return ["daily", "weekly", "monthly", "yearly"].find((item) => frequency.includes(item)) || "";
  }

  function getTaskCadenceLabel(task) {
    const cadence = getTaskCadence(task);
    if (!cadence) {
      return "One-time";
    }
    if (cadence === "custom days") {
      return "Custom days";
    }
    return `${titleCase(cadence)} task`;
  }

  function isTaskComplete(task) {
    return Boolean(task?.isComplete || normalizeName(task?.status) === "completed");
  }

  function isSubtaskComplete(subtask) {
    return Boolean(subtask?.isComplete || normalizeName(subtask?.status) === "completed");
  }

  function getTaskStatus(task, now = new Date()) {
    if (isTaskComplete(task)) {
      return "completed";
    }

    const rawStatus = normalizeName(task?.status);
    if (rawStatus === "skipped" || rawStatus === "delayed" || rawStatus === "overdue") {
      return "delayed";
    }

    const dueDate = parseTaskDateTime(task);
    if (dueDate && dueDate.getTime() < now.getTime()) {
      return "delayed";
    }

    return "open";
  }

  function getTaskStatusLabel(task, now = new Date()) {
    if (isTaskComplete(task)) {
      return "Completed";
    }

    const rawStatus = normalizeName(task?.status);
    if (rawStatus === "skipped") {
      return "Skipped";
    }

    if (getTaskStatus(task, now) === "delayed") {
      return "Overdue";
    }

    if (rawStatus) {
      return titleCase(rawStatus);
    }

    return "Pending";
  }

  function getPriorityTone(priorityValue) {
    const priority = normalizeName(priorityValue);
    if (priority === "high") {
      return "alert";
    }

    if (priority === "low") {
      return "good";
    }

    return "warn";
  }

  function getStatusTone(statusValue, priorityValue) {
    if (statusValue === "completed") {
      return "good";
    }

    if (statusValue === "delayed") {
      return "alert";
    }

    return getPriorityTone(priorityValue);
  }

  function getTaskDueBuckets(task, now = new Date()) {
    const dueDate = parseTaskDateTime(task);
    const buckets = [];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    if (dueDate) {
      if (sameDay(dueDate, now)) {
        buckets.push("due-today");
      }

      if (dueDate >= startOfWeek && dueDate <= endOfWeek) {
        buckets.push("this-week");
      }

      if (dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth()) {
        buckets.push("this-month");
      }

      if (dueDate.getFullYear() === now.getFullYear()) {
        buckets.push("this-year");
      }

      if (dueDate.getTime() < now.getTime() && !isTaskComplete(task)) {
        buckets.push("overdue");
      }
    }

    if (getTaskCadence(task)) {
      buckets.push("recurring");
    }

    return [...new Set(buckets)];
  }

  function getSortKey(record) {
    const dueDate = parseTaskDateTime(record);
    if (dueDate) {
      return `${dueDate.getFullYear()}${pad(dueDate.getMonth() + 1)}${pad(dueDate.getDate())}${pad(dueDate.getHours())}${pad(dueDate.getMinutes())}`;
    }

    const createdDate = record?.createdAt ? new Date(record.createdAt) : null;
    if (createdDate instanceof Date && !Number.isNaN(createdDate.getTime())) {
      return `${createdDate.getFullYear()}${pad(createdDate.getMonth() + 1)}${pad(createdDate.getDate())}${pad(createdDate.getHours())}${pad(createdDate.getMinutes())}`;
    }

    return "999999999999";
  }

  function purgeDemoRecords() {
    if (localStorage.getItem(demoPurgeKey) === "done") {
      return;
    }

    const goals = readStore(STORE_KEYS.goals);
    const tasks = readStore(STORE_KEYS.tasks);
    const habits = readStore(STORE_KEYS.habits);
    const subtasks = readStore(STORE_KEYS.subtasks);

    const nextGoals = goals.filter((goal) => !demoRecords.goals.has(normalizeName(goal?.name)));
    const nextTasks = tasks.filter((task) => !demoRecords.tasks.has(normalizeName(task?.name)));
    const nextHabits = habits.filter((habit) => !demoRecords.habits.has(normalizeName(habit?.name)));
    const nextSubtasks = subtasks.filter((subtask) => !demoRecords.subtasks.has(normalizeName(subtask?.name)));

    if (nextGoals.length !== goals.length) {
      writeStore(STORE_KEYS.goals, nextGoals);
    }

    if (nextTasks.length !== tasks.length) {
      writeStore(STORE_KEYS.tasks, nextTasks);
    }

    if (nextHabits.length !== habits.length) {
      writeStore(STORE_KEYS.habits, nextHabits);
    }

    if (nextSubtasks.length !== subtasks.length) {
      writeStore(STORE_KEYS.subtasks, nextSubtasks);
    }

    localStorage.setItem(demoPurgeKey, "done");
  }

  function getState(now = new Date()) {
    const goals = readStore(STORE_KEYS.goals).filter((goal) => goal && goal.id);
    const tasks = readStore(STORE_KEYS.tasks).filter((task) => task && task.id);
    const habits = readStore(STORE_KEYS.habits).filter((habit) => habit && habit.id);
    const subtasks = readStore(STORE_KEYS.subtasks).filter((subtask) => subtask && subtask.id);

    const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
    const tasksByGoalId = new Map();
    const subtasksByTaskId = new Map();

    tasks.forEach((task) => {
      if (!task.goalId) {
        return;
      }

      const goalTasks = tasksByGoalId.get(task.goalId) || [];
      goalTasks.push(task);
      tasksByGoalId.set(task.goalId, goalTasks);
    });

    subtasks.forEach((subtask) => {
      if (!subtask.parentTaskId) {
        return;
      }

      const taskSubtasks = subtasksByTaskId.get(subtask.parentTaskId) || [];
      taskSubtasks.push(subtask);
      subtasksByTaskId.set(subtask.parentTaskId, taskSubtasks);
    });

    return {
      now,
      goals,
      tasks,
      habits,
      subtasks,
      goalsById,
      tasksByGoalId,
      subtasksByTaskId
    };
  }

  function getGoalView(goal) {
    return normalizeName(goal?.type).includes("long") ? "long" : "short";
  }

  function getGoalRecord(goal, state) {
    const linkedTasks = [...(state.tasksByGoalId.get(goal.id) || [])].sort(
      (leftTask, rightTask) => Number(getSortKey(leftTask)) - Number(getSortKey(rightTask))
    );
    const completedCount = linkedTasks.filter((task) => getTaskStatus(task, state.now) === "completed").length;
    const progress = normalizeName(goal?.status) === "completed"
      ? 100
      : linkedTasks.length
        ? clampPercent((completedCount / linkedTasks.length) * 100)
        : 0;
    const targetDate = parseDateOnly(goal?.target);
    const startOfToday = new Date(state.now.getFullYear(), state.now.getMonth(), state.now.getDate());
    const hasDelayedTask = linkedTasks.some((task) => getTaskStatus(task, state.now) === "delayed");

    let status = "open";
    if (normalizeName(goal?.status) === "completed" || (linkedTasks.length && progress >= 100)) {
      status = "completed";
    } else if (
      normalizeName(goal?.status) === "delayed" ||
      hasDelayedTask ||
      (targetDate && targetDate.getTime() < startOfToday.getTime() && progress < 100)
    ) {
      status = "delayed";
    }

    return {
      goal,
      linkedTasks,
      progress,
      status,
      tone: getStatusTone(status, ""),
      statusLabel: status === "completed" ? "Completed" : status === "delayed" ? "Delayed" : "Active",
      view: getGoalView(goal)
    };
  }

  function goalMatchesRange(goalRecord, range, now = new Date()) {
    if (range !== "month") {
      return true;
    }

    const startDate = parseDateOnly(goalRecord.goal?.start);
    const targetDate = parseDateOnly(goalRecord.goal?.target);
    const inCurrentMonth = (dateValue) =>
      dateValue &&
      dateValue.getFullYear() === now.getFullYear() &&
      dateValue.getMonth() === now.getMonth();

    if (inCurrentMonth(startDate) || inCurrentMonth(targetDate)) {
      return true;
    }

    return goalRecord.linkedTasks.some((task) => getTaskDueBuckets(task, now).includes("this-month"));
  }

  function goalMatchesStatus(goalRecord, statusFilter) {
    if (!statusFilter || statusFilter === "all") {
      return true;
    }

    if (statusFilter === "open" || statusFilter === "active") {
      return goalRecord.status === "open";
    }

    if (statusFilter === "on-time") {
      return goalRecord.status !== "delayed";
    }

    return goalRecord.status === statusFilter;
  }

  function getGoalRecordsForView(state, view, range, statusFilter = "") {
    return state.goals
      .filter((goal) => getGoalView(goal) === view)
      .map((goal) => getGoalRecord(goal, state))
      .filter((goalRecord) => goalMatchesRange(goalRecord, range, state.now))
      .filter((goalRecord) => goalMatchesStatus(goalRecord, statusFilter))
      .sort((leftGoal, rightGoal) => {
        const leftDate = parseDateOnly(leftGoal.goal?.target);
        const rightDate = parseDateOnly(rightGoal.goal?.target);
        const leftTime = leftDate ? leftDate.getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = rightDate ? rightDate.getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      });
  }

  function getHabitMonthDays(habit, monthKey) {
    const history = habit?.history && typeof habit.history === "object" ? habit.history : {};
    const directDays = Array.isArray(history[monthKey]) ? history[monthKey] : [];
    const legacyState = typeof readHabitCalendarStorage === "function" ? readHabitCalendarStorage() : {};
    const legacyDays = Array.isArray(legacyState?.[slugifyHabitName(habit?.name)]?.[monthKey])
      ? legacyState[slugifyHabitName(habit.name)][monthKey]
      : [];

    return [...new Set([...directDays, ...legacyDays].map((day) => Number(day)).filter((day) => Number.isInteger(day) && day > 0))]
      .sort((leftDay, rightDay) => leftDay - rightDay);
  }

  function writeHabitMonthDays(habitId, monthKey, completedDays) {
    const habits = readStore(STORE_KEYS.habits);
    const habitIndex = habits.findIndex((habit) => habit.id === habitId);
    if (habitIndex === -1) {
      return;
    }

    const normalizedDays = [...new Set([...completedDays].map((day) => Number(day)).filter((day) => Number.isInteger(day) && day > 0))]
      .sort((leftDay, rightDay) => leftDay - rightDay);
    const habit = habits[habitIndex];
    const history = habit?.history && typeof habit.history === "object" ? habit.history : {};

    habits[habitIndex] = {
      ...habit,
      history: {
        ...history,
        [monthKey]: normalizedDays
      },
      updatedAt: new Date().toISOString()
    };

    writeStore(STORE_KEYS.habits, habits);

    if (typeof saveHabitCompletionDays === "function") {
      saveHabitCompletionDays(slugifyHabitName(habit.name || habit.id), monthKey, new Set(normalizedDays));
    }
  }

  function getHabitMonthKeys(habit, range, now = new Date()) {
    const currentMonthKey = getHabitMonthKey(now.getFullYear(), now.getMonth());
    if (range === "this-month") {
      return [currentMonthKey];
    }

    const historyKeys = habit?.history && typeof habit.history === "object" ? Object.keys(habit.history) : [];
    const legacyKeys = Object.keys((typeof readHabitCalendarStorage === "function"
      ? readHabitCalendarStorage()?.[slugifyHabitName(habit?.name)] || {}
      : {}));
    return [...new Set([...historyKeys, ...legacyKeys, currentMonthKey])].sort();
  }

  function getHabitCounts(habit, range = "all", now = new Date()) {
    const currentMonthKey = getHabitMonthKey(now.getFullYear(), now.getMonth());
    return getHabitMonthKeys(habit, range, now).reduce(
      (totals, monthKey) => {
        const monthDate = parseHabitMonthParam(monthKey);
        if (!monthDate) {
          return totals;
        }

        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        const trackableDays = monthKey === currentMonthKey ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
        const completedDays = getHabitMonthDays(habit, monthKey).filter((day) => day <= trackableDays);

        totals.completed += completedDays.length;
        totals.total += trackableDays;
        return totals;
      },
      { completed: 0, total: 0, skipped: 0 }
    );
  }

  function finalizeHabitCounts(counts) {
    return {
      ...counts,
      skipped: Math.max(counts.total - counts.completed, 0)
    };
  }

  function isHabitCompleteOnDate(habit, dateValue) {
    const monthKey = getHabitMonthKey(dateValue.getFullYear(), dateValue.getMonth());
    return getHabitMonthDays(habit, monthKey).includes(dateValue.getDate());
  }

  function getHabitCurrentStreak(habit, now = new Date()) {
    let streak = 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let index = 0; index < 365; index += 1) {
      if (!isHabitCompleteOnDate(habit, cursor)) {
        break;
      }

      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  function getHabitAggregateCounts(state, range = "all") {
    return state.habits.reduce(
      (totals, habit) => {
        const counts = finalizeHabitCounts(getHabitCounts(habit, range, state.now));
        totals.completed += counts.completed;
        totals.skipped += counts.skipped;
        totals.total += counts.total;
        return totals;
      },
      { completed: 0, skipped: 0, total: 0 }
    );
  }

  function syncTaskDashboardRecords(state) {
    if (!Array.isArray(taskDashboardRecords)) {
      return;
    }

    taskDashboardRecords.length = 0;
    state.tasks.forEach((task) => {
      taskDashboardRecords.push({
        id: task.id,
        due: getTaskDueBuckets(task, state.now),
        cadence: getTaskCadence(task),
        isComplete: isTaskComplete(task)
      });
    });
  }

  function updateSidebarCounts(state) {
    const shortGoalCount = state.goals.filter((goal) => getGoalView(goal) === "short").length;
    const longGoalCount = state.goals.filter((goal) => getGoalView(goal) === "long").length;
    const taskCount = state.tasks.length;
    const habitCount = state.habits.length;
    const calendarCount = getHabitAggregateCounts(state, "this-month").completed;

    document.querySelectorAll(".sidebar-link").forEach((link) => {
      const badge = link.querySelector("span");
      if (!badge) {
        return;
      }

      const href = String(link.getAttribute("href") || "").toLowerCase();
      if (href.includes("goals.html?view=short")) {
        badge.textContent = pad(shortGoalCount);
      } else if (href.includes("goals.html?view=long")) {
        badge.textContent = pad(longGoalCount);
      } else if (href.includes("daily-tasks.html")) {
        badge.textContent = pad(taskCount);
      } else if (href.includes("habits.html")) {
        badge.textContent = pad(habitCount);
      } else if (href.includes("calendar.html")) {
        badge.textContent = pad(calendarCount);
      } else if (href.includes("goals.html")) {
        badge.textContent = pad(shortGoalCount + longGoalCount);
      }
    });
  }

  function renderDashboardTaskList(container, records, state, emptyCopy) {
    if (!container) {
      return;
    }

    if (!records.length) {
      container.innerHTML = `
        <div class="task-row">
          <span class="task-status" aria-hidden="true"></span>
          <span class="task-main">
            <strong>No tasks yet</strong>
            <small class="task-meta">${escapeHtml(emptyCopy)}</small>
          </span>
          <span class="task-tag">0</span>
        </div>
      `;
      return;
    }

    container.innerHTML = records
      .map((task) => {
        const goal = state.goalsById.get(task.goalId);
        const priority = normalizeName(task.priority) || "medium";
        const statusClass = isTaskComplete(task) ? "is-complete" : "";
        return `
          <a class="task-row is-priority-${escapeHtml(priority)}" href="./task-detail.html?id=${encodeURIComponent(task.id)}">
            <span class="task-status ${statusClass}" aria-hidden="true"></span>
            <span class="task-main">
              <strong>${escapeHtml(task.name || "Untitled task")}</strong>
              <small class="task-meta">
                <span class="task-meta-due">${escapeHtml(formatDueLabel(task, state.now))}</span>
                <span class="task-meta-goal">${escapeHtml(goal?.name || "Independent task")}</span>
              </small>
            </span>
            <span class="task-tag">${escapeHtml(titleCase(priority))}</span>
          </a>
        `;
      })
      .join("");
  }

  function updateDashboardFocusChart(state) {
    const focusValue = document.querySelector(".dashboard-focus-value");
    const bars = Array.from(document.querySelectorAll(".focus-bar"));
    const values = Array.from(document.querySelectorAll(".focus-bar-value"));
    const dayLabels = Array.from(document.querySelectorAll(".focus-day-row span"));
    const focusChips = Array.from(document.querySelectorAll(".focus-chip"));
    const focusDesc = document.getElementById("focus-trend-desc");
    const scores = [];
    const today = new Date(state.now.getFullYear(), state.now.getMonth(), state.now.getDate());
    const goalRecords = state.goals.map((goal) => getGoalRecord(goal, state));
    const onTimeGoalScore = goalRecords.length
      ? Math.round(
          (goalRecords.filter((goalRecord) => goalRecord.status !== "delayed").length / goalRecords.length) * 100
        )
      : null;

    for (let offset = 6; offset >= 0; offset -= 1) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - offset);

      const dayTasks = state.tasks.filter((task) => {
        const dueDate = parseTaskDateTime(task);
        return dueDate && sameDay(dueDate, currentDate);
      });
      const taskScore = dayTasks.length
        ? Math.round(
            (dayTasks.filter((task) => getTaskStatus(task, state.now) === "completed").length / dayTasks.length) *
              100
          )
        : null;
      const habitScore = state.habits.length
        ? Math.round(
            (state.habits.filter((habit) => isHabitCompleteOnDate(habit, currentDate)).length / state.habits.length) *
              100
          )
        : null;
      const samples = [taskScore, habitScore, onTimeGoalScore].filter((value) => Number.isFinite(value));
      const score = samples.length ? Math.round(samples.reduce((total, value) => total + value, 0) / samples.length) : 0;

      scores.push({
        date: currentDate,
        label: currentDate.toLocaleDateString(undefined, { weekday: "short" }),
        score
      });
    }

    if (focusValue) {
      const overallScore = scores.length
        ? Math.round(scores.reduce((total, entry) => total + entry.score, 0) / scores.length)
        : 0;
      focusValue.textContent = `${clampPercent(overallScore)}%`;
    }

    bars.forEach((bar, index) => {
      const entry = scores[index];
      if (!entry) {
        return;
      }

      const height = Math.max(8, Math.round((Math.max(entry.score, 5) / 100) * 68));
      const yValue = 92 - height;
      bar.setAttribute("y", String(yValue));
      bar.setAttribute("height", String(height));
    });

    values.forEach((label, index) => {
      const entry = scores[index];
      if (!entry) {
        return;
      }

      const matchingBar = bars[index];
      const yValue = Number(matchingBar?.getAttribute("y") || 24);
      label.textContent = `${clampPercent(entry.score)}%`;
      label.setAttribute("y", String(Math.max(yValue - 5, 12)));
    });

    dayLabels.forEach((label, index) => {
      if (scores[index]) {
        label.textContent = scores[index].label;
      }
    });

    if (focusChips.length && scores.length) {
      const bestEntry = [...scores].sort((leftEntry, rightEntry) => rightEntry.score - leftEntry.score)[0];
      const targetHits = scores.filter((entry) => entry.score >= 80).length;
      const trendDelta = scores[scores.length - 1].score - scores[0].score;
      focusChips[0].innerHTML = `<strong>Best Day</strong>${escapeHtml(bestEntry.label)} - ${clampPercent(bestEntry.score)}%`;
      if (focusChips[1]) {
        focusChips[1].innerHTML = `<strong>On Target</strong>${targetHits} of ${scores.length} days`;
      }
      if (focusChips[2]) {
        focusChips[2].innerHTML = `<strong>Trend</strong>${trendDelta >= 0 ? "+" : ""}${trendDelta} pts`;
      }
    }

    if (focusDesc && scores.length) {
      focusDesc.textContent = `Execution scores for the last seven days: ${scores
        .map((entry) => `${entry.label} ${clampPercent(entry.score)}%`)
        .join(", ")}.`;
    }
  }

  function renderDashboard(state) {
    const todayList = document.getElementById("dashboard-today-list");
    const upcomingList = document.getElementById("dashboard-upcoming-list");
    const dashboardCards = Array.from(document.querySelectorAll("[data-dashboard-card]"));
    if (!dashboardCards.length && !todayList && !upcomingList) {
      return;
    }

    const selectedRange = document.querySelector('input[name="dashboard-range"]:checked')?.value === "this-month"
      ? "this-month"
      : "all";
    const taskRecords = state.tasks.filter((task) => {
      if (selectedRange !== "this-month") {
        return true;
      }

      return getTaskDueBuckets(task, state.now).includes("this-month");
    });
    const goalRecordsByView = {
      short: state.goals
        .filter((goal) => getGoalView(goal) === "short")
        .map((goal) => getGoalRecord(goal, state))
        .filter((goalRecord) => goalMatchesRange(goalRecord, selectedRange === "this-month" ? "month" : "all", state.now)),
      long: state.goals
        .filter((goal) => getGoalView(goal) === "long")
        .map((goal) => getGoalRecord(goal, state))
        .filter((goalRecord) => goalMatchesRange(goalRecord, selectedRange === "this-month" ? "month" : "all", state.now))
    };
    const habitCounts = getHabitAggregateCounts(state, selectedRange);

    dashboardCards.forEach((card) => {
      const entity = card.dataset.dashboardEntity || "";
      const status = card.dataset.dashboardStatus || "";
      const countElement = card.querySelector("[data-dashboard-count]");
      if (!countElement) {
        return;
      }

      let nextCount = 0;
      if (entity === "tasks") {
        nextCount = taskRecords.filter((task) => getTaskStatus(task, state.now) === status).length;
      } else if (entity === "short-goals" || entity === "long-goals") {
        const records = goalRecordsByView[entity === "short-goals" ? "short" : "long"];
        nextCount = records.filter((record) => record.status === status).length;
      } else if (entity === "habits") {
        nextCount = habitCounts[status] || 0;
      }

      countElement.textContent = pad(nextCount);

      if (card instanceof HTMLAnchorElement) {
        if (entity === "tasks") {
          card.href = `./daily-tasks.html?status=${encodeURIComponent(status)}&range=${encodeURIComponent(selectedRange)}`;
        } else if (entity === "short-goals" || entity === "long-goals") {
          const view = entity === "short-goals" ? "short" : "long";
          const goalRange = selectedRange === "this-month" ? "month" : "all";
          card.href = `./goals.html?view=${view}&status=${encodeURIComponent(status)}&range=${goalRange}`;
        } else if (entity === "habits") {
          card.href = `./habits.html?status=${encodeURIComponent(status)}&range=${encodeURIComponent(selectedRange)}`;
        }
      }
    });

    const sortedTasks = [...state.tasks].sort(
      (leftTask, rightTask) => Number(getSortKey(leftTask)) - Number(getSortKey(rightTask))
    );
    const todayTasks = sortedTasks
      .filter((task) => {
        const dueDate = parseTaskDateTime(task);
        return dueDate && sameDay(dueDate, state.now);
      })
      .slice(0, 3);
    const upcomingTasks = sortedTasks
      .filter((task) => {
        const dueDate = parseTaskDateTime(task);
        return dueDate && dueDate.getTime() > state.now.getTime() && !sameDay(dueDate, state.now);
      })
      .slice(0, 3);

    renderDashboardTaskList(todayList, todayTasks, state, "Nothing is due today.");
    renderDashboardTaskList(upcomingList, upcomingTasks, state, "Nothing upcoming is scheduled.");
    updateDashboardFocusChart(state);
  }

  function renderTaskBoard(state) {
    if (!taskBoard) {
      return;
    }

    getTaskItems().forEach((item) => item.remove());

    const sortedTasks = [...state.tasks].sort(
      (leftTask, rightTask) => Number(getSortKey(leftTask)) - Number(getSortKey(rightTask))
    );
    const taskMarkup = sortedTasks
      .map((task) => {
        const status = getTaskStatus(task, state.now);
        const statusLabel = getTaskStatusLabel(task, state.now);
        const statusTone = getStatusTone(status, task.priority);
        const pendingTone = status === "completed"
          ? "good"
          : status === "delayed"
            ? "alert"
            : getPriorityTone(task.priority);
        const linkedGoal = state.goalsById.get(task.goalId);
        const dueBuckets = getTaskDueBuckets(task, state.now);
        const taskGroups = [...new Set([...(getTaskCadence(task) ? ["recurring"] : []), ...dueBuckets])];
        const subtasks = [...(state.subtasksByTaskId.get(task.id) || [])].sort(
          (leftSubtask, rightSubtask) => Number(getSortKey(leftSubtask)) - Number(getSortKey(rightSubtask))
        );

        return `
          <article
            class="task-management-card ${isTaskComplete(task) ? "is-complete" : ""}"
            data-task-item
            data-task-id="${escapeHtml(task.id)}"
            data-task-groups="${escapeHtml(taskGroups.join(" "))}"
            data-task-due="${escapeHtml(dueBuckets.join(" "))}"
            data-task-cadence="${escapeHtml(getTaskCadence(task))}"
            data-sort-key="${escapeHtml(getSortKey(task))}"
            data-pending-label="${escapeHtml(statusLabel)}"
            data-complete-label="Completed"
            data-pending-tone="${escapeHtml(pendingTone)}"
          >
            <div class="task-card-top">
              <div class="task-card-copy">
                <div class="task-card-title-row">
                  <p class="mini-label">${escapeHtml(linkedGoal?.name || "Independent Task")}</p>
                  <div class="task-card-status-cluster">
                    ${isTaskComplete(task) ? completedTickMarkup("Completed task") : ""}
                    <span class="status-pill ${escapeHtml(statusTone)}" data-status-pill>${escapeHtml(statusLabel)}</span>
                  </div>
                </div>
                <h3>${escapeHtml(task.name || "Untitled task")}</h3>
                <p class="task-card-meta">${escapeHtml(formatDueLabel(task, state.now))} | ${escapeHtml(titleCase(task.priority || "Medium"))} priority | ${escapeHtml(getTaskCadenceLabel(task))}</p>
              </div>
            </div>

            <div class="task-card-icon-actions">
              <button
                class="task-icon-btn task-icon-complete${isTaskComplete(task) ? " is-complete" : ""}"
                type="button"
                data-complete-toggle
                data-store-task-toggle="${escapeHtml(task.id)}"
                aria-pressed="${isTaskComplete(task)}"
                aria-label="${isTaskComplete(task) ? "Mark task as open" : "Mark task complete"}"
                title="${isTaskComplete(task) ? "Mark as open" : "Mark complete"}"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <a
                class="task-icon-btn task-icon-edit"
                href="./task-editor.html?id=${encodeURIComponent(task.id)}"
                aria-label="Edit task"
                title="Edit task"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <button
                class="task-icon-btn task-icon-delete"
                type="button"
                data-store-task-delete="${escapeHtml(task.id)}"
                aria-label="Delete task"
                title="Delete task"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>

            <div class="subtask-stack">
              ${subtasks.length
                ? subtasks
                    .map((subtask) => {
                      const complete = isSubtaskComplete(subtask);
                      const subtaskLabel = complete ? "Completed" : titleCase(subtask.status || "Pending");
                      return `
                        <div
                          class="subtask-row ${complete ? "is-complete" : ""}"
                          data-subtask-item
                          data-subtask-id="${escapeHtml(subtask.id)}"
                          data-pending-label="${escapeHtml(titleCase(subtask.status || "Pending"))}"
                          data-complete-label="Completed"
                        >
                          <div class="subtask-copy">
                            <strong>${escapeHtml(subtask.name || "Untitled subtask")}</strong>
                            <small>${escapeHtml(formatDueMeta(subtask, state.now))} | <span data-state-label>${escapeHtml(subtaskLabel)}</span></small>
                          </div>
                          <div class="subtask-actions">
                            <button
                              class="soft-pill task-action-pill task-complete-pill is-subtask"
                              type="button"
                              data-complete-toggle
                              data-store-subtask-toggle="${escapeHtml(subtask.id)}"
                              aria-pressed="${complete}"
                            >
                              <span class="task-complete-dot" aria-hidden="true"></span>
                              <span data-complete-text>${complete ? "Completed" : "Complete"}</span>
                            </button>
                            <a class="soft-pill task-action-pill" href="./subtask-editor.html?id=${encodeURIComponent(subtask.id)}&taskId=${encodeURIComponent(task.id)}">Edit</a>
                            <button class="soft-pill task-action-pill" type="button" data-store-subtask-delete="${escapeHtml(subtask.id)}">Delete</button>
                          </div>
                        </div>
                      `;
                    })
                    .join("")
                : '<p class="subtask-empty" data-subtask-empty>No subtasks yet. Use Add Subtask to create one.</p>'}
            </div>
          </article>
        `;
      })
      .join("");

    if (taskBoardEmptyState) {
      taskBoardEmptyState.insertAdjacentHTML("beforebegin", taskMarkup);
    } else {
      taskBoard.insertAdjacentHTML("afterbegin", taskMarkup);
    }

    getTaskItems().forEach((taskItem) => syncSubtaskEmptyState(taskItem));
    syncTaskDashboardRecords(state);
    applyTaskDashboardQueryParams();
    applyTaskBoardFilter(activeTaskMetricFilter);
  }

  function renderTaskDetail(state) {
    const titleElement = document.getElementById("task-detail-title");
    const summaryElement = document.getElementById("task-detail-summary");
    const metaElement = document.getElementById("task-detail-meta");
    const priorityElement = document.getElementById("task-detail-priority");
    const editLink = document.getElementById("task-detail-edit-link");
    const addSubtaskLink = document.getElementById("task-detail-add-subtask-link");
    const statusValue = document.getElementById("task-detail-status-value");
    const statusCopy = document.getElementById("task-detail-status-copy");
    const executionList = document.getElementById("task-detail-execution-list");
    const actionList = document.getElementById("task-detail-actions");
    const reminderList = document.getElementById("task-detail-reminder-list");
    const subtaskList = document.getElementById("task-detail-subtask-list");

    if (
      !titleElement ||
      !summaryElement ||
      !metaElement ||
      !priorityElement ||
      !editLink ||
      !addSubtaskLink ||
      !statusValue ||
      !statusCopy ||
      !executionList ||
      !actionList ||
      !reminderList ||
      !subtaskList
    ) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("id") || state.tasks[0]?.id || "";
    const task = state.tasks.find((item) => item.id === taskId);
    const metaPills = Array.from(metaElement.querySelectorAll(".soft-pill"));
    const duePill = metaPills[0] || null;
    const cadencePill = metaPills[1] || null;

    if (!task) {
      titleElement.textContent = "Task detail";
      summaryElement.textContent = "Select or create a task to review reminders, timing, and subtasks.";
      priorityElement.textContent = "No task";
      priorityElement.className = "status-pill warn";
      statusValue.textContent = "Empty";
      statusCopy.textContent = "No saved task was found for this detail view.";
      if (duePill) {
        duePill.textContent = "No due date";
      }
      if (cadencePill) {
        cadencePill.textContent = "Recurrence: None";
      }
      editLink.href = "./task-editor.html";
      addSubtaskLink.href = "./subtask-editor.html";
      executionList.innerHTML = `
        <div class="surface-item">
          <div>
            <strong>No task selected</strong>
            <small>Create a task first, then return here for details.</small>
          </div>
          <a class="soft-pill" href="./task-editor.html">Add Task</a>
        </div>
      `;
      reminderList.innerHTML = `
        <div class="timeline-item">
          <span class="timeline-time">--</span>
          <div>
            <strong>No reminders configured</strong>
            <small>Saved reminder channels will appear here.</small>
          </div>
        </div>
      `;
      subtaskList.innerHTML = `
        <div class="surface-item">
          <div>
            <strong>No subtasks yet</strong>
            <small>Create a main task first before adding subtasks.</small>
          </div>
        </div>
      `;
      // No parent task — hide the top-level "Add Subtask" CTA entirely.
      if (addSubtaskLink) {
        addSubtaskLink.hidden = true;
        addSubtaskLink.removeAttribute("href");
      }
      return;
    }

    const linkedGoal = state.goalsById.get(task.goalId);
    const notifications = Array.isArray(task.notifications)
      ? task.notifications.filter((item) => normalizeName(item) && normalizeName(item) !== "none")
      : [];
    const subtasks = [...(state.subtasksByTaskId.get(task.id) || [])].sort(
      (leftSubtask, rightSubtask) => Number(getSortKey(leftSubtask)) - Number(getSortKey(rightSubtask))
    );

    titleElement.textContent = task.name || "Untitled task";
    summaryElement.textContent = task.notes || "Open this task to review its schedule, linked goal, reminders, and subtasks.";
    priorityElement.textContent = titleCase(task.priority || "Medium");
    priorityElement.className = `status-pill ${getPriorityTone(task.priority)}`;
    statusValue.textContent = getTaskStatusLabel(task, state.now);
    statusCopy.textContent = linkedGoal
      ? `Linked to ${linkedGoal.name} with ${subtasks.length} saved subtask${subtasks.length === 1 ? "" : "s"}.`
      : `Independent task with ${subtasks.length} saved subtask${subtasks.length === 1 ? "" : "s"}.`;
    if (duePill) {
      duePill.textContent = formatDueMeta(task, state.now);
    }
    if (cadencePill) {
      cadencePill.textContent = `Recurrence: ${getTaskCadenceLabel(task)}`;
    }
    editLink.href = `./task-editor.html?id=${encodeURIComponent(task.id)}`;
    // Hide the "Add Subtask" CTA when the parent task is already closed —
    // users shouldn't be able to attach new work to a completed task.
    const parentClosed = isTaskComplete(task);
    if (addSubtaskLink) {
      addSubtaskLink.hidden = parentClosed;
      if (parentClosed) {
        addSubtaskLink.removeAttribute("href");
      } else {
        addSubtaskLink.href = `./subtask-editor.html?taskId=${encodeURIComponent(task.id)}`;
      }
    }

    const detailDelete = actionList.querySelector('[data-task-detail-action="delete"]');
    if (!detailDelete) {
      actionList.insertAdjacentHTML("beforeend", '<span class="soft-pill" data-task-detail-action="delete">Delete</span>');
    }

    executionList.innerHTML = `
      <div class="surface-item">
        <div><strong>Goal</strong><small>${escapeHtml(linkedGoal?.name || "Independent task")}</small></div>
        <span class="soft-pill">Parent</span>
      </div>
      <div class="surface-item">
        <div><strong>Timing</strong><small>${escapeHtml(formatDueMeta(task, state.now))}</small></div>
        <span class="soft-pill">${escapeHtml(getTaskCadenceLabel(task))}</span>
      </div>
      <div class="surface-item">
        <div><strong>Reminder Channels</strong><small>${escapeHtml(notifications.length ? notifications.map(titleCase).join(", ") : "No channels selected")}</small></div>
        <span class="soft-pill">${pad(notifications.length)}</span>
      </div>
      <div class="surface-item">
        <div><strong>Notes</strong><small>${escapeHtml(task.notes || "No notes added yet.")}</small></div>
        <a class="soft-pill" href="./task-editor.html?id=${encodeURIComponent(task.id)}">Edit</a>
      </div>
    `;

    reminderList.innerHTML = notifications.length
      ? notifications
          .map(
            (channel, index) => `
              <div class="timeline-item">
                <span class="timeline-time">${index === 0 ? "Due" : `+${index * 10}m`}</span>
                <div>
                  <strong>${escapeHtml(titleCase(channel))} reminder</strong>
                  <small>${escapeHtml(`Sent around ${formatDueMeta(task, state.now)}.`)}</small>
                </div>
              </div>
            `
          )
          .join("")
      : `
          <div class="timeline-item">
            <span class="timeline-time">--</span>
            <div>
              <strong>No reminders configured</strong>
              <small>Add push, email, or in-app reminders from the task editor.</small>
            </div>
          </div>
        `;

    subtaskList.innerHTML = subtasks.length
      ? subtasks
          .map((subtask) => {
            const complete = isSubtaskComplete(subtask);
            return `
              <div class="surface-item" data-task-detail-subtask-id="${escapeHtml(subtask.id)}">
                <div>
                  <strong>${escapeHtml(subtask.name || "Untitled subtask")}</strong>
                  <small>${escapeHtml(formatDueMeta(subtask, state.now))} | ${escapeHtml(complete ? "Completed" : titleCase(subtask.status || "Pending"))}</small>
                </div>
                <div class="chip-row">
                  <button class="soft-pill" type="button" data-store-subtask-toggle="${escapeHtml(subtask.id)}">${complete ? "Undo" : "Complete"}</button>
                  <a class="soft-pill" href="./subtask-editor.html?id=${encodeURIComponent(subtask.id)}&taskId=${encodeURIComponent(task.id)}">Edit</a>
                  <button class="soft-pill" type="button" data-store-subtask-delete="${escapeHtml(subtask.id)}">Delete</button>
                </div>
              </div>
            `;
          })
          .join("")
      : `
          <div class="surface-item">
            <div>
              <strong>No subtasks yet</strong>
              <small>${parentClosed
                ? "This task is closed — reopen it to add subtasks."
                : "Break this task into smaller steps when you are ready."}</small>
            </div>
            ${parentClosed
              ? ''
              : `<a class="soft-pill" href="./subtask-editor.html?taskId=${encodeURIComponent(task.id)}">Add Subtask</a>`}
          </div>
        `;

    document.title = `TIMENEST ${task.name || "Task Detail"}`;
  }

  function renderGoalsPage(state) {
    if (!document.body.classList.contains("goals-page")) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const selectedView = document.querySelector('input[name="goal-view"]:checked')?.value === "long" ? "long" : "short";
    const selectedRange = document.querySelector('input[name="goal-range"]:checked')?.value === "month" ? "month" : "all";
    // Active metric tab — drives which goals are shown in the grid below.
    // Default is "active" (open goals). Other valid values: completed,
    // delayed, on-time. Falls back to URL ?metric= when present.
    const activeMetricEl = document.querySelector("[data-goal-status-filter].is-active");
    const requestedMetric = (params.get("metric") || activeMetricEl?.dataset.goalStatusFilter || "active").toLowerCase();
    const metricFilter = ["completed", "active", "delayed", "on-time"].includes(requestedMetric)
      ? requestedMetric
      : "active";
    const statusFilter = normalizeName(params.get("status"));
    const pageTitle = document.getElementById("goal-toggle-title");
    const panels = Array.from(document.querySelectorAll("[data-goal-view]"));

    // Only show the metric row matching the selected view (short vs long).
    document.querySelectorAll("[data-goal-metrics-row]").forEach((rowEl) => {
      const rowView = rowEl.getAttribute("data-goal-metrics-row") === "long" ? "long" : "short";
      rowEl.hidden = rowView !== selectedView;
    });

    panels.forEach((panel) => {
      const panelView = panel.getAttribute("data-goal-view") === "long" ? "long" : "short";
      const goalRecords = getGoalRecordsForView(state, panelView, selectedRange, statusFilter);
      // Metric grid lives in a separate <article data-goal-metrics-row> above
      // the list panel, so scope the lookup to the document, not to `panel`.
      const metricsRoot = document.querySelector(`[data-goal-metrics="${panelView}"]`);
      const heroTitle = panel.querySelector("[data-goal-hero-title]");
      const healthLabel = panel.querySelector("[data-goal-health-label]");
      const healthValue = panel.querySelector("[data-goal-health-value]");
      const healthCopy = panel.querySelector("[data-goal-health-copy]");
      const portfolioList = panel.querySelector("[data-goal-portfolio-list]");
      const timelineLabel = panel.querySelector("[data-goal-timeline-label]");
      const timelineList = panel.querySelector("[data-goal-timeline-list]");
      const metricCounts = {
        completed: goalRecords.filter((goalRecord) => goalRecord.status === "completed").length,
        active: goalRecords.filter((goalRecord) => goalRecord.status === "open").length,
        delayed: goalRecords.filter((goalRecord) => goalRecord.status === "delayed").length
      };
      const onTimeValue = goalRecords.length
        ? Math.round(
            (goalRecords.filter((goalRecord) => goalRecord.status !== "delayed").length / goalRecords.length) * 100
          )
        : 0;

      panel.hidden = panelView !== selectedView;

      if (metricsRoot) {
        Array.from(metricsRoot.querySelectorAll("[data-goal-metric-card]")).forEach((card) => {
          const metricKey = card.getAttribute("data-goal-metric-key") || "";
          const metricValue = card.querySelector("[data-goal-metric-value]");
          if (!metricValue) {
            return;
          }

          if (metricKey === "on-time") {
            metricValue.textContent = `${clampPercent(onTimeValue)}%`;
          } else {
            metricValue.textContent = pad(metricCounts[metricKey] || 0);
          }

          if (card instanceof HTMLAnchorElement) {
            const nextStatus = metricKey === "active" ? "open" : metricKey;
            const nextRange = selectedRange === "month" ? "month" : "all";
            card.href = metricKey === "on-time"
              ? `./goals.html?view=${panelView}&range=${nextRange}`
              : `./goals.html?view=${panelView}&status=${encodeURIComponent(nextStatus)}&range=${nextRange}`;
          }
        });
      }

      if (heroTitle) {
        heroTitle.textContent = panelView === "long"
          ? "Long-term goals shaping the next year"
          : "Short-term goals shaping the next quarter";
      }

      if (healthLabel) {
        healthLabel.textContent = selectedRange === "month"
          ? "Monthly Health"
          : panelView === "long"
            ? "Annual Health"
            : "Sprint Health";
      }

      if (healthValue) {
        healthValue.textContent = `${clampPercent(onTimeValue)}%`;
      }

      if (healthCopy) {
        healthCopy.textContent = goalRecords.length
          ? `${metricCounts.completed} completed, ${metricCounts.active} active, and ${metricCounts.delayed} delayed goals are currently tracked in this view.`
          : "No goals have been saved for this view yet.";
      }

      // Apply the selected metric tab filter to the portfolio list.
      // - completed: status === completed
      // - active   : status === open (default)
      // - delayed  : status === delayed
      // - on-time  : status !== delayed (active + completed within target)
      const filteredGoalRecords = goalRecords.filter((goalRecord) => {
        const status = goalRecord.status;
        if (metricFilter === "completed") return status === "completed";
        if (metricFilter === "delayed") return status === "delayed";
        if (metricFilter === "on-time") return status !== "delayed";
        return status === "open"; // active (default)
      });

      // Reflect the active tab visually inside this panel.
      if (metricsRoot) {
        Array.from(metricsRoot.querySelectorAll("[data-goal-status-filter]")).forEach((card) => {
          const isActive = card.getAttribute("data-goal-status-filter") === metricFilter;
          card.classList.toggle("is-active", isActive);
          card.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      }

      if (portfolioList) {
        const filterLabel = ({
          completed: "completed",
          active: "active",
          delayed: "delayed",
          "on-time": "on-time",
        })[metricFilter] || "matching";
        portfolioList.innerHTML = filteredGoalRecords.length
          ? filteredGoalRecords
              .map((goalRecord) => {
                const goalName = escapeHtml(goalRecord.goal.name || "Untitled goal");
                const goalId = encodeURIComponent(goalRecord.goal.id);
                const goalIdAttr = escapeHtml(goalRecord.goal.id);
                const tone = escapeHtml(goalRecord.tone);
                const pct = clampPercent(goalRecord.progress);
                const completed = goalRecord.status === "completed";
                const detailHref = `./goal-detail.html?id=${goalId}`;
                return `
                  <div class="goal-portfolio-card ${completed ? "is-complete" : ""}">
                    <a class="goal-portfolio-row goal-portfolio-link" href="${detailHref}" aria-label="Open goal: ${goalName}">
                      <strong class="goal-portfolio-title" title="${goalName}">${goalName}</strong>
                      <div class="goal-portfolio-status">
                        ${completed ? completedTickMarkup("Completed goal") : ""}
                        <span class="status-pill ${tone}">${pct}%</span>
                      </div>
                    </a>
                    <div class="goal-portfolio-actions">
                      <a class="goal-action-btn" href="${detailHref}">Open</a>
                      <a class="goal-action-btn" href="./goal-editor.html?id=${goalId}">Edit</a>
                      <button class="goal-action-btn" type="button" data-store-goal-toggle="${goalIdAttr}">${completed ? "Reopen" : "Mark Done"}</button>
                      <button class="goal-action-btn is-danger" type="button" data-store-goal-delete="${goalIdAttr}">Delete</button>
                    </div>
                  </div>
                `;
              })
              .join("")
          : `
              <div class="surface-item">
                <div>
                  <strong>No goals yet</strong>
                  <small>Create a ${panelView === "long" ? "long-term" : "short-term"} goal to start planning.</small>
                </div>
              </div>
            `;
      }

      if (timelineLabel) {
        timelineLabel.textContent = selectedRange === "month"
          ? "This Month"
          : panelView === "long"
            ? "Roadmap Milestones"
            : "Sprint Milestones";
      }

      if (timelineList) {
        const timelineItems = goalRecords.length
          ? goalRecords.slice(0, 4).map((goalRecord) => {
              const targetDate = parseDateOnly(goalRecord.goal.target);
              return {
                time: targetDate ? formatShortDate(targetDate) : "Open",
                title: goalRecord.goal.name || "Untitled goal",
                copy: goalRecord.goal.description || `${goalRecord.linkedTasks.length} linked task${goalRecord.linkedTasks.length === 1 ? "" : "s"} saved.`
              };
            })
          : [
              {
                time: "Start",
                title: "Create the first goal",
                copy: "Saved goals will show target dates, progress, and quick actions here."
              }
            ];

        timelineList.innerHTML = timelineItems
          .map(
            (item) => `
              <div class="timeline-item">
                <span class="timeline-time">${escapeHtml(item.time)}</span>
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(item.copy)}</small>
                </div>
              </div>
            `
          )
          .join("");
      }
    });

    if (pageTitle) {
      const statusLabel = statusFilter ? ` for ${titleCase(statusFilter)}` : "";
      pageTitle.textContent = `Select the ${selectedView === "long" ? "long-term" : "short-term"} dashboard you want to view${statusLabel}`;
    }

    document.title = `TIMENEST ${selectedView === "long" ? "Long-Term Goals" : "Short-Term Goals"}`;
  }

  function renderGoalDetail(state) {
    const titleElement = document.getElementById("goal-detail-title");
    const summaryElement = document.getElementById("goal-detail-summary");
    const eyebrowElement = document.getElementById("goal-detail-eyebrow");
    const statusElement = document.getElementById("goal-detail-status");
    const startElement = document.getElementById("goal-detail-start");
    const targetElement = document.getElementById("goal-detail-target");
    const progressValue = document.getElementById("goal-detail-progress-value");
    const progressBar = document.getElementById("goal-detail-progress-bar");
    const taskList = document.getElementById("goal-detail-task-list");
    const timelineElement = document.getElementById("goal-detail-timeline");
    const timelineLabel = document.getElementById("goal-detail-timeline-label");

    if (
      !titleElement ||
      !summaryElement ||
      !eyebrowElement ||
      !statusElement ||
      !startElement ||
      !targetElement ||
      !progressValue ||
      !progressBar ||
      !taskList ||
      !timelineElement ||
      !timelineLabel
    ) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const goalId = params.get("id");
    const requestedView = params.get("view") === "long" ? "long" : "short";
    const requestedRange = params.get("range") === "month" ? "month" : "all";
    const requestedStatus = normalizeName(params.get("status") || params.get("metric"));
    const goalRecords = getGoalRecordsForView(state, requestedView, requestedRange, requestedStatus);
    const fallbackGoal = goalId
      ? state.goals.find((goal) => goal.id === goalId)
      : goalRecords[0]?.goal || state.goals[0] || null;
    const goalRecord = fallbackGoal ? getGoalRecord(fallbackGoal, state) : null;
    const chipRow = statusElement.closest(".chip-row");

    if (chipRow) {
      chipRow.querySelectorAll("[data-store-goal-detail-action]").forEach((element) => element.remove());
      const existingAddTask = chipRow.querySelector('a.soft-pill:not([data-store-goal-detail-action])');
      if (goalRecord && existingAddTask) {
        existingAddTask.href = `./task-editor.html?goalId=${encodeURIComponent(goalRecord.goal.id)}`;
      }
      if (goalRecord) {
        chipRow.insertAdjacentHTML(
          "beforeend",
          `<a class="soft-pill" data-store-goal-detail-action href="./goal-editor.html?id=${encodeURIComponent(goalRecord.goal.id)}">Edit Goal</a>`
        );
        chipRow.insertAdjacentHTML(
          "beforeend",
          `<button class="soft-pill" data-store-goal-detail-action type="button" data-store-goal-toggle="${escapeHtml(goalRecord.goal.id)}">${goalRecord.goal.status === "completed" ? "Reopen Goal" : "Mark Goal Complete"}</button>`
        );
        chipRow.insertAdjacentHTML(
          "beforeend",
          `<button class="soft-pill" data-store-goal-detail-action type="button" data-store-goal-delete="${escapeHtml(goalRecord.goal.id)}">Delete Goal</button>`
        );
      }
    }

    if (!goalRecord) {
      eyebrowElement.textContent = "Goal Detail";
      titleElement.textContent = "No saved goal found";
      summaryElement.textContent = "Create a short-term or long-term goal to replace the prototype drill-down.";
      statusElement.textContent = "Empty";
      statusElement.className = "status-pill warn";
      startElement.textContent = "Start: Not set";
      targetElement.textContent = "Target: Not set";
      progressValue.textContent = "0%";
      progressBar.style.width = "0%";
      taskList.innerHTML = `
        <div class="surface-item">
          <div>
            <strong>No linked tasks</strong>
            <small>Create a goal first, then attach tasks from the task editor.</small>
          </div>
          <a class="soft-pill" href="./goal-editor.html">Add Goal</a>
        </div>
      `;
      timelineLabel.textContent = "Next Step";
      timelineElement.innerHTML = `
        <div class="timeline-item">
          <span class="timeline-time">Now</span>
          <div>
            <strong>Create the first goal</strong>
            <small>Saved goals will show milestones and linked tasks here.</small>
          </div>
        </div>
      `;
      return;
    }

    const startDate = parseDateOnly(goalRecord.goal.start);
    const targetDate = parseDateOnly(goalRecord.goal.target);

    eyebrowElement.textContent = goalRecord.view === "long" ? "Long-Term Goal" : "Short-Term Goal";
    titleElement.textContent = goalRecord.goal.name || "Untitled goal";
    summaryElement.textContent = goalRecord.goal.description || "Track progress with linked tasks, dates, and milestones.";
    statusElement.textContent = goalRecord.statusLabel;
    statusElement.className = `status-pill ${goalRecord.tone}`;
    startElement.textContent = `Start: ${startDate ? formatLongDate(startDate) : "Not set"}`;
    targetElement.textContent = `Target: ${targetDate ? formatLongDate(targetDate) : "Not set"}`;
    progressValue.textContent = `${clampPercent(goalRecord.progress)}%`;
    progressBar.style.width = `${clampPercent(goalRecord.progress)}%`;

    taskList.innerHTML = goalRecord.linkedTasks.length
      ? goalRecord.linkedTasks
          .map((task) => {
            const taskStatus = getTaskStatus(task, state.now);
            const tone = getStatusTone(taskStatus, task.priority);
            return `
              <a class="surface-item ${taskStatus === "completed" ? "surface-item-status-good" : ""}" href="./task-detail.html?id=${encodeURIComponent(task.id)}">
                <div>
                  <strong>${escapeHtml(task.name || "Untitled task")}</strong>
                  <small>${escapeHtml(formatDueMeta(task, state.now))}</small>
                </div>
                <span class="status-pill ${escapeHtml(tone)}">${escapeHtml(getTaskStatusLabel(task, state.now))}</span>
              </a>
            `;
          })
          .join("")
      : `
          <div class="surface-item">
            <div>
              <strong>No linked tasks yet</strong>
              <small>Add a task to start moving this goal forward.</small>
            </div>
            <a class="soft-pill" href="./task-editor.html?goalId=${encodeURIComponent(goalRecord.goal.id)}">Add Task</a>
          </div>
        `;

    const timelineItems = [];
    if (startDate) {
      timelineItems.push({ time: "Start", title: formatLongDate(startDate), copy: "Goal start date." });
    }
    goalRecord.linkedTasks.slice(0, 3).forEach((task) => {
      timelineItems.push({
        time: formatDueLabel(task, state.now),
        title: task.name || "Untitled task",
        copy: getTaskStatusLabel(task, state.now)
      });
    });
    if (targetDate) {
      timelineItems.push({ time: "Target", title: formatLongDate(targetDate), copy: "Planned finish line." });
    }
    if (!timelineItems.length) {
      timelineItems.push({
        time: "Next",
        title: "Add the first task",
        copy: "Attach work to this goal to build a real timeline."
      });
    }

    timelineLabel.textContent = "Milestones";
    timelineElement.innerHTML = timelineItems
      .map(
        (item) => `
          <div class="timeline-item">
            <span class="timeline-time">${escapeHtml(item.time)}</span>
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.copy)}</small>
            </div>
          </div>
        `
      )
      .join("");

    document.title = `TIMENEST ${goalRecord.goal.name || "Goal Detail"}`;
  }

  /* Track which habit is selected in the list (used by renderHabitCalendar) */
  let _selectedHabitId = null;
  function getSelectedHabitId() { return _selectedHabitId; }

  function renderHabitsPage(state) {
    const habitList = document.getElementById("habit-list");
    if (!habitList) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const range = params.get("range") === "this-month" ? "this-month" : "all";

    // Auto-select first habit if nothing selected yet
    if (!_selectedHabitId && state.habits.length) {
      _selectedHabitId = state.habits[0].id;
    }

    // "Add Habit" button always first
    const addHabitBtn = `
      <a class="habit-list-item habit-list-add" href="./habit-editor.html">
        <span class="habit-list-add-icon" aria-hidden="true">+</span>
        <span>Add Habit</span>
      </a>
    `;

    const habitItems = state.habits.map((habit) => {
      const counts = finalizeHabitCounts(getHabitCounts(habit, range, state.now));
      const streak = getHabitCurrentStreak(habit, state.now);
      const reliability = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
      const editHref = `./habit-editor.html?id=${encodeURIComponent(habit.id)}`;
      const isSelected = _selectedHabitId === habit.id;
      const safeName = escapeHtml(habit.name || "habit");
      return `
        <div class="habit-list-item${isSelected ? " is-selected" : ""}" data-habit-select="${escapeHtml(habit.id)}" role="button" tabindex="0">
          <div class="habit-list-info">
            <strong>${escapeHtml(habit.name || "Untitled habit")}</strong>
            <small>${escapeHtml(habit.category || "Habit")} · ${pad(streak)} day streak · ${clampPercent(reliability)}%</small>
          </div>
          <div class="habit-list-actions">
            <a class="habit-list-icon-btn habit-list-edit" href="${editHref}" aria-label="Edit ${safeName}" title="Edit habit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </a>
            <button type="button" class="habit-list-icon-btn habit-list-delete" data-store-habit-delete="${escapeHtml(habit.id)}" aria-label="Delete ${safeName}" title="Delete habit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join("");

    habitList.innerHTML = addHabitBtn + (habitItems || `
      <p class="habit-list-empty">No habits yet. Tap Add Habit to create one.</p>
    `);

    // Attach click handlers for selecting a habit
    habitList.querySelectorAll("[data-habit-select]").forEach((el) => {
      el.addEventListener("click", (e) => {
        // Don't fire if they clicked the edit or delete icon
        if (e.target.closest(".habit-list-icon-btn")) return;
        e.preventDefault();
        const habitId = el.dataset.habitSelect;
        if (_selectedHabitId === habitId) return;
        _selectedHabitId = habitId;
        // Re-render list (to update selected state) and calendar
        renderHabitsPage(state);
        renderHabitCalendar(state);
        // Scroll calendar into view on mobile
        const tracker = document.querySelector(".habit-tracker-panel");
        if (tracker) tracker.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      });
    });
  }

  function renderHabitCalendar(state) {
    const eyebrow = document.getElementById("habit-calendar-eyebrow");
    const titleElement = document.getElementById("habit-calendar-title");
    const summaryElement = document.getElementById("habit-calendar-summary");
    const selectorRow = document.getElementById("habit-selector-row");
    const sideLabel = document.getElementById("habit-calendar-side-label");
    const streakElement = document.getElementById("habit-calendar-streak");
    const sideCopy = document.getElementById("habit-calendar-side-copy");
    const monthLabel = document.getElementById("habit-calendar-month-label");
    const monthInput = document.getElementById("habit-calendar-month-input");
    const completedCount = document.getElementById("habit-completed-count");
    const missedCount = document.getElementById("habit-missed-count");
    const futureCount = document.getElementById("habit-future-count");
    const calendarGrid = document.getElementById("habit-calendar-grid");

    if (
      !eyebrow ||
      !titleElement ||
      !summaryElement ||
      !selectorRow ||
      !sideLabel ||
      !streakElement ||
      !sideCopy ||
      !monthLabel ||
      !monthInput ||
      !completedCount ||
      !missedCount ||
      !futureCount ||
      !calendarGrid
    ) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedHabitId = params.get("habitId");
    const requestedHabitName = params.get("habit");
    const currentMonthDate = new Date(state.now.getFullYear(), state.now.getMonth(), 1);
    const minMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 11, 1);
    const parsedMonth = parseHabitMonthParam(params.get("month")) || currentMonthDate;
    const selectedMonthDate = parsedMonth > currentMonthDate
      ? currentMonthDate
      : parsedMonth < minMonthDate
        ? minMonthDate
        : parsedMonth;
    const activeHabit = (_selectedHabitId && state.habits.find((habit) => habit.id === _selectedHabitId))
      || state.habits.find((habit) => habit.id === requestedHabitId)
      || state.habits.find((habit) => slugifyHabitName(habit.name) === slugifyHabitName(requestedHabitName))
      || state.habits[0]
      || null;
    const monthKey = getHabitMonthKey(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth());

    selectorRow.innerHTML = state.habits.length
      ? state.habits
          .map((habit) => {
            const isActive = activeHabit?.id === habit.id;
            return `
              <a class="soft-pill habit-selector ${isActive ? "is-active" : ""}" href="./calendar.html?habitId=${encodeURIComponent(habit.id)}&month=${monthKey}">
                ${escapeHtml(habit.name || "Untitled habit")}
              </a>
            `;
          })
          .join("")
      // No habits saved yet — render a real link so tapping this pill takes
      // the user straight to the habit editor. The static HTML ships as a
      // <span>, which was non-interactive.
      : '<a class="soft-pill habit-selector is-active" href="./habit-editor.html">Add a habit to begin tracking</a>';

    if (!activeHabit) {
      eyebrow.textContent = "Habit Calendar";
      titleElement.textContent = "Consistency tracker for every recurring habit";
      summaryElement.textContent = "Create a habit first, then come back here to track daily completions.";
      sideLabel.textContent = "Current Streak";
      streakElement.textContent = "00 Days";
      sideCopy.textContent = "No saved habit data is available yet.";
      monthLabel.textContent = selectedMonthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      monthInput.value = monthKey;
      completedCount.textContent = "00";
      missedCount.textContent = "00";
      futureCount.textContent = "00";
      calendarGrid.innerHTML = `
        <div class="task-empty-state" style="grid-column: 1 / -1;">
          <h3>No habits yet</h3>
          <p>Create a habit to start tracking progress on the calendar.</p>
        </div>
      `;
      return;
    }

    const daysInMonth = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0).getDate();
    const isCurrentMonth = selectedMonthDate.getFullYear() === state.now.getFullYear()
      && selectedMonthDate.getMonth() === state.now.getMonth();
    const editableDays = isCurrentMonth ? Math.min(state.now.getDate(), daysInMonth) : daysInMonth;
    const monthDays = new Set(getHabitMonthDays(activeHabit, monthKey).filter((day) => day <= editableDays));
    const streak = getHabitCurrentStreak(activeHabit, state.now);
    const reliability = editableDays ? Math.round((monthDays.size / editableDays) * 100) : 0;
    const monthTitle = selectedMonthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const firstDay = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1).getDay();
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const previousMonthButton = document.getElementById("habit-month-prev");
    const nextMonthButton = document.getElementById("habit-month-next");

    eyebrow.textContent = "Habit Calendar";
    titleElement.textContent = `${activeHabit.name} calendar`;
    summaryElement.textContent = activeHabit.notes || `${activeHabit.schedule || "Custom cadence"}${activeHabit.time ? ` at ${activeHabit.time}` : ""}.`;
    sideLabel.textContent = "Current Streak";
    streakElement.textContent = `${pad(streak)} Days`;
    sideCopy.textContent = `${clampPercent(reliability)}% completion reliability for ${monthTitle}.`;
    monthLabel.textContent = monthTitle;
    monthInput.value = monthKey;
    monthInput.max = getHabitMonthKey(currentMonthDate.getFullYear(), currentMonthDate.getMonth());
    monthInput.min = getHabitMonthKey(minMonthDate.getFullYear(), minMonthDate.getMonth());
    completedCount.textContent = pad(monthDays.size);
    missedCount.textContent = pad(Math.max(editableDays - monthDays.size, 0));
    futureCount.textContent = pad(Math.max(daysInMonth - editableDays, 0));
    if (previousMonthButton) {
      previousMonthButton.disabled =
        selectedMonthDate.getFullYear() === minMonthDate.getFullYear()
        && selectedMonthDate.getMonth() === minMonthDate.getMonth();
    }
    if (nextMonthButton) {
      nextMonthButton.disabled =
        selectedMonthDate.getFullYear() === currentMonthDate.getFullYear()
        && selectedMonthDate.getMonth() === currentMonthDate.getMonth();
    }

    const gridParts = [];
    weekdayLabels.forEach((label) => {
      gridParts.push(`<div class="habit-weekday">${label}</div>`);
    });
    for (let index = 0; index < firstDay; index += 1) {
      gridParts.push('<div class="habit-day-cell is-empty"></div>');
    }
    for (let dayValue = 1; dayValue <= daysInMonth; dayValue += 1) {
      const dateValue = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), dayValue);
      const isFuture = dayValue > editableDays;
      const isComplete = !isFuture && monthDays.has(dayValue);
      const stateLabel = isFuture ? "Future" : isComplete ? "Completed" : "Missed";
      gridParts.push(`
        <button
          class="habit-day-cell ${isFuture ? "is-future" : ""} ${isComplete ? "is-complete" : ""} ${sameDay(dateValue, state.now) ? "is-today" : ""}"
          type="button"
          data-store-habit-day="${dayValue}"
          ${isFuture ? "disabled" : ""}
          aria-pressed="${isComplete}"
          aria-label="${escapeHtml(`${activeHabit.name}, ${formatLongDate(dateValue)}, ${stateLabel}`)}"
        >
          <strong class="habit-day-number">${dayValue}</strong>
          <div class="habit-day-meta">
            <span class="habit-status-dot is-${isFuture ? "future" : isComplete ? "complete" : "missed"}" aria-hidden="true"></span>
            <span class="habit-day-state">${stateLabel}</span>
          </div>
        </button>
      `);
    }
    const trailingCells = (7 - ((firstDay + daysInMonth) % 7)) % 7;
    for (let index = 0; index < trailingCells; index += 1) {
      gridParts.push('<div class="habit-day-cell is-empty"></div>');
    }

    calendarGrid.innerHTML = gridParts.join("");
  }

  function applyGoalEditorDefaults() {
    const goalTypeField = document.getElementById("goal-editor-type-input");
    const titleElement = document.getElementById("goal-editor-title");
    const eyebrowElement = document.getElementById("goal-editor-eyebrow");
    if (!goalTypeField) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("id")) {
      return;
    }

    const requestedType = normalizeName(params.get("goalType"));
    if (requestedType === "short term" || requestedType === "short-term") {
      goalTypeField.value = "Short-Term";
      if (titleElement) {
        titleElement.textContent = "Create Short-Term Goal";
      }
      if (eyebrowElement) {
        eyebrowElement.textContent = "Short-Term Goal";
      }
    } else if (requestedType === "long term" || requestedType === "long-term") {
      goalTypeField.value = "Long-Term";
      if (titleElement) {
        titleElement.textContent = "Create Long-Term Goal";
      }
      if (eyebrowElement) {
        eyebrowElement.textContent = "Long-Term Goal";
      }
    }
  }

  function deleteTask(taskId) {
    writeStore(
      STORE_KEYS.tasks,
      readStore(STORE_KEYS.tasks).filter((task) => task.id !== taskId)
    );
    writeStore(
      STORE_KEYS.subtasks,
      readStore(STORE_KEYS.subtasks).filter((subtask) => subtask.parentTaskId !== taskId)
    );
  }

  function toggleTask(taskId) {
    const tasks = readStore(STORE_KEYS.tasks);
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return;
    }

    const nextComplete = !isTaskComplete(tasks[taskIndex]);
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      isComplete: nextComplete,
      status: nextComplete ? "completed" : "pending",
      updatedAt: new Date().toISOString()
    };
    writeStore(STORE_KEYS.tasks, tasks);
  }

  function toggleSubtask(subtaskId) {
    const subtasks = readStore(STORE_KEYS.subtasks);
    const subtaskIndex = subtasks.findIndex((subtask) => subtask.id === subtaskId);
    if (subtaskIndex === -1) {
      return;
    }

    const nextComplete = !isSubtaskComplete(subtasks[subtaskIndex]);
    subtasks[subtaskIndex] = {
      ...subtasks[subtaskIndex],
      isComplete: nextComplete,
      status: nextComplete ? "Completed" : "Pending",
      updatedAt: new Date().toISOString()
    };
    writeStore(STORE_KEYS.subtasks, subtasks);
  }

  function deleteSubtask(subtaskId) {
    writeStore(
      STORE_KEYS.subtasks,
      readStore(STORE_KEYS.subtasks).filter((subtask) => subtask.id !== subtaskId)
    );
  }

  function toggleGoal(goalId) {
    const goals = readStore(STORE_KEYS.goals);
    const goalIndex = goals.findIndex((goal) => goal.id === goalId);
    if (goalIndex === -1) {
      return null;
    }
    const currentStatus = normalizeName(goals[goalIndex].status);
    const nextStatus = currentStatus === "completed" ? "active" : "completed";
    goals[goalIndex] = {
      ...goals[goalIndex],
      status: nextStatus,
      completedAt: nextStatus === "completed" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    writeStore(STORE_KEYS.goals, goals);
    return nextStatus;
  }

  function deleteGoal(goalId) {
    writeStore(
      STORE_KEYS.goals,
      readStore(STORE_KEYS.goals).filter((goal) => goal.id !== goalId)
    );
    const tasks = readStore(STORE_KEYS.tasks).map((task) => {
      if (task.goalId !== goalId) {
        return task;
      }

      return {
        ...task,
        goalId: null,
        updatedAt: new Date().toISOString()
      };
    });
    writeStore(STORE_KEYS.tasks, tasks);
  }

  function deleteHabit(habitId) {
    const habits = readStore(STORE_KEYS.habits);
    const habit = habits.find((item) => item.id === habitId);
    writeStore(
      STORE_KEYS.habits,
      habits.filter((item) => item.id !== habitId)
    );

    if (!habit || typeof readHabitCalendarStorage !== "function" || typeof writeHabitCalendarStorage !== "function") {
      return;
    }

    const legacyState = readHabitCalendarStorage();
    delete legacyState[slugifyHabitName(habit.name || habit.id)];
    writeHabitCalendarStorage(legacyState);
  }

  function snoozeTask(taskId) {
    const tasks = readStore(STORE_KEYS.tasks);
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return;
    }

    const currentTask = tasks[taskIndex];
    const currentDateTime = parseTaskDateTime(currentTask) || new Date();
    currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
    tasks[taskIndex] = {
      ...currentTask,
      date: `${currentDateTime.getFullYear()}-${pad(currentDateTime.getMonth() + 1)}-${pad(currentDateTime.getDate())}`,
      time: `${pad(currentDateTime.getHours())}:${pad(currentDateTime.getMinutes())}`,
      isComplete: false,
      status: "pending",
      updatedAt: new Date().toISOString()
    };
    writeStore(STORE_KEYS.tasks, tasks);
  }

  function refreshAll() {
    const state = getState(new Date());
    syncTaskDashboardRecords(state);
    updateSidebarCounts(state);
    renderDashboard(state);
    renderTaskBoard(state);
    renderTaskDetail(state);
    renderGoalsPage(state);
    renderGoalDetail(state);
    renderHabitsPage(state);
    renderHabitCalendar(state);
    applyGoalEditorDefaults();
  }

  function bindInteractions() {
    if (document.documentElement.dataset.storeUiBound === "true") {
      return;
    }

    document.documentElement.dataset.storeUiBound = "true";

    if (taskBoard) {
      taskBoard.addEventListener(
        "click",
        (event) => {
          const subtaskDelete = event.target.closest("[data-store-subtask-delete]");
          if (subtaskDelete) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const subtaskId = subtaskDelete.getAttribute("data-store-subtask-delete") || "";
            if (subtaskId && window.confirm("Delete this subtask permanently?")) {
              deleteSubtask(subtaskId);
              showToast("Subtask deleted");
              refreshAll();
            }
            return;
          }

          const taskDelete = event.target.closest("[data-store-task-delete]");
          if (taskDelete) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const taskId = taskDelete.getAttribute("data-store-task-delete") || "";
            if (taskId && window.confirm("Delete this task permanently?")) {
              const taskName = readStore(STORE_KEYS.tasks).find((t) => t.id === taskId)?.name || "(task)";
              deleteTask(taskId);
              showToast("Task deleted");
              window.timenestNotify?.confirm("Task deleted", taskName, { taskId });
              refreshAll();
            }
            return;
          }

          const subtaskToggle = event.target.closest("[data-store-subtask-toggle]");
          if (subtaskToggle) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const subtaskId = subtaskToggle.getAttribute("data-store-subtask-toggle") || "";
            if (subtaskId) {
              // Confirm before toggling — distinguish complete vs. reopen so
              // the prompt matches the user's intent.
              const existing = readStore(STORE_KEYS.subtasks).find((s) => s.id === subtaskId);
              const willComplete = !isSubtaskComplete(existing || {});
              const prompt = willComplete
                ? "Mark this subtask as complete?"
                : "Reopen this completed subtask?";
              if (!window.confirm(prompt)) return;
              toggleSubtask(subtaskId);
              refreshAll();
            }
            return;
          }

          const taskToggle = event.target.closest("[data-store-task-toggle]");
          if (taskToggle) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const taskId = taskToggle.getAttribute("data-store-task-toggle") || "";
            if (taskId) {
              const existing = readStore(STORE_KEYS.tasks).find((t) => t.id === taskId);
              const willComplete = !isTaskComplete(existing || {});
              const prompt = willComplete
                ? "Mark this task as complete?"
                : "Reopen this completed task?";
              if (!window.confirm(prompt)) return;
              toggleTask(taskId);
              const task = readStore(STORE_KEYS.tasks).find((t) => t.id === taskId);
              const isDone = isTaskComplete(task || {});
              window.timenestNotify?.confirm(
                isDone ? "Task completed" : "Task reopened",
                task?.name || "",
                { taskId, linkUrl: `./task-detail.html?id=${encodeURIComponent(taskId)}` }
              );
              refreshAll();
            }
          }
        },
        true
      );
    }

    document.addEventListener(
      "click",
      (event) => {
        const goalToggleButton = event.target.closest("[data-store-goal-toggle]");
        if (goalToggleButton) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const goalId = goalToggleButton.getAttribute("data-store-goal-toggle") || "";
          if (goalId) {
            const existing = readStore(STORE_KEYS.goals).find((g) => g.id === goalId);
            const willComplete = String(existing?.status || "").toLowerCase() !== "completed";
            const prompt = willComplete
              ? "Mark this goal as complete?"
              : "Reopen this completed goal?";
            if (!window.confirm(prompt)) return;
            const nextStatus = toggleGoal(goalId);
            showToast(nextStatus === "completed" ? "Goal marked complete" : "Goal reopened", "success");
            refreshAll();
          }
          return;
        }

        const goalDeleteButton = event.target.closest("[data-store-goal-delete]");
        if (goalDeleteButton) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const goalId = goalDeleteButton.getAttribute("data-store-goal-delete") || "";
          if (goalId && window.confirm("Delete this goal permanently? Linked tasks will stay saved but become unlinked.")) {
            deleteGoal(goalId);
            showToast("Goal deleted");
            if (document.getElementById("goal-detail-title")) {
              window.location.href = "./goals.html";
              return;
            }
            refreshAll();
          }
          return;
        }

        const habitDeleteButton = event.target.closest("[data-store-habit-delete]");
        if (habitDeleteButton) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const habitId = habitDeleteButton.getAttribute("data-store-habit-delete") || "";
          if (!habitId) return;
          const allHabits = readStore(STORE_KEYS.habits);
          const habitRecord = allHabits.find((h) => h.id === habitId);
          const habitName = habitRecord?.name || "this habit";
          // First confirmation
          if (!window.confirm(`Are you sure you want to delete "${habitName}"?`)) {
            return;
          }
          // Second confirmation (double-confirm before destructive action)
          if (!window.confirm(`This action cannot be undone. Permanently delete "${habitName}" and all its tracking history?`)) {
            showToast("Delete cancelled", "info");
            return;
          }
          deleteHabit(habitId);
          showToast("Habit deleted");
          if (document.getElementById("habit-calendar-grid") && !document.getElementById("habit-list")) {
            window.location.href = "./habits.html";
            return;
          }
          refreshAll();
          return;
        }

        const taskDetailAction = event.target.closest("[data-task-detail-action]");
        if (taskDetailAction && document.getElementById("task-detail-title")) {
          const params = new URLSearchParams(window.location.search);
          const taskId = params.get("id");
          const action = taskDetailAction.getAttribute("data-task-detail-action") || "";
          if (!taskId) {
            return;
          }

          if (action === "complete") {
            const existing = readStore(STORE_KEYS.tasks).find((t) => t.id === taskId);
            const willComplete = !isTaskComplete(existing || {});
            const prompt = willComplete
              ? "Mark this task as complete?"
              : "Reopen this completed task?";
            if (!window.confirm(prompt)) return;
            toggleTask(taskId);
            showToast("Task updated");
            refreshAll();
          } else if (action === "skip") {
            const tasks = readStore(STORE_KEYS.tasks);
            const taskIndex = tasks.findIndex((task) => task.id === taskId);
            if (taskIndex !== -1) {
              tasks[taskIndex] = {
                ...tasks[taskIndex],
                isComplete: false,
                status: "skipped",
                updatedAt: new Date().toISOString()
              };
              writeStore(STORE_KEYS.tasks, tasks);
              showToast("Task marked as skipped", "info");
              refreshAll();
            }
          } else if (action === "reschedule") {
            window.location.href = `./task-editor.html?id=${encodeURIComponent(taskId)}`;
          } else if (action === "snooze") {
            snoozeTask(taskId);
            showToast("Task snoozed for 30 minutes", "info");
            refreshAll();
          } else if (action === "delete" && window.confirm("Delete this task permanently?")) {
            deleteTask(taskId);
            showToast("Task deleted");
            window.location.href = "./daily-tasks.html";
          }
        }
      },
      true
    );

    const monthInput = document.getElementById("habit-calendar-month-input");
    monthInput?.addEventListener(
      "change",
      (event) => {
        if (!document.getElementById("habit-calendar-grid")) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        const nextMonth = parseHabitMonthParam(monthInput.value);
        if (!nextMonth) {
          refreshAll();
          return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set("month", getHabitMonthKey(nextMonth.getFullYear(), nextMonth.getMonth()));
        window.history.replaceState({}, "", url);
        refreshAll();
      },
      true
    );

    const previousMonthButton = document.getElementById("habit-month-prev");
    previousMonthButton?.addEventListener(
      "click",
      (event) => {
        if (!document.getElementById("habit-calendar-grid")) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        const currentDate = parseHabitMonthParam(document.getElementById("habit-calendar-month-input")?.value) || new Date();
        currentDate.setMonth(currentDate.getMonth() - 1);
        const url = new URL(window.location.href);
        url.searchParams.set("month", getHabitMonthKey(currentDate.getFullYear(), currentDate.getMonth()));
        window.history.replaceState({}, "", url);
        refreshAll();
      },
      true
    );

    const nextMonthButton = document.getElementById("habit-month-next");
    nextMonthButton?.addEventListener(
      "click",
      (event) => {
        if (!document.getElementById("habit-calendar-grid")) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        const currentDate = parseHabitMonthParam(document.getElementById("habit-calendar-month-input")?.value) || new Date();
        currentDate.setMonth(currentDate.getMonth() + 1);
        const url = new URL(window.location.href);
        url.searchParams.set("month", getHabitMonthKey(currentDate.getFullYear(), currentDate.getMonth()));
        window.history.replaceState({}, "", url);
        refreshAll();
      },
      true
    );

    const calendarGrid = document.getElementById("habit-calendar-grid");
    calendarGrid?.addEventListener(
      "click",
      (event) => {
        const clickedDay = event.target.closest("[data-store-habit-day]");
        if (!clickedDay) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const params = new URLSearchParams(window.location.search);
        const fallbackState = getState(new Date());
        const habitId = params.get("habitId") || fallbackState.habits[0]?.id || "";
        const monthKey = document.getElementById("habit-calendar-month-input")?.value
          || getHabitMonthKey(new Date().getFullYear(), new Date().getMonth());
        const habit = fallbackState.habits.find((item) => item.id === habitId);
        if (!habit) {
          return;
        }

        const selectedDay = Number(clickedDay.getAttribute("data-store-habit-day"));
        const currentDays = new Set(getHabitMonthDays(habit, monthKey));
        if (currentDays.has(selectedDay)) {
          currentDays.delete(selectedDay);
        } else {
          currentDays.add(selectedDay);
        }

        writeHabitMonthDays(habitId, monthKey, currentDays);
        refreshAll();
      },
      true
    );

    [...dashboardRangeRadios, ...goalViewRadios, ...goalRangeRadios].forEach((input) => {
      input?.addEventListener("change", () => {
        refreshAll();
      });
    });

    document.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-goal-status-filter]");
      if (!tab || !document.body.classList.contains("goals-page")) return;
      event.preventDefault();
      const filter = tab.getAttribute("data-goal-status-filter") || "active";
      document.querySelectorAll("[data-goal-status-filter]").forEach((el) => {
        const isMatch = el.getAttribute("data-goal-status-filter") === filter;
        el.classList.toggle("is-active", isMatch);
        el.setAttribute("aria-pressed", isMatch ? "true" : "false");
      });
      refreshAll();
    });
  }

  purgeDemoRecords();
  bindInteractions();
  refreshAll();

  window.addEventListener("pageshow", () => {
    refreshAll();
  });
  window.addEventListener("storage", (event) => {
    if (!event.key || Object.values(STORE_KEYS).includes(event.key)) {
      refreshAll();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshAll();
    }
  });
  window.addEventListener("focus", () => {
    refreshAll();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      refreshAll();
    });
  }
  window.addEventListener("timenest-sync-complete", () => {
    refreshAll();
  });
})();
