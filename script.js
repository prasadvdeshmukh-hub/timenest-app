const taskRows = document.querySelectorAll(".task-row");
const completeButton = document.querySelector("#complete-task");
const detailTitle = document.querySelector("#detail-title");
const detailState = document.querySelector("#detail-state");
const detailNotes = document.querySelector("#detail-notes");

const taskNotes = {
  "Submit investor-ready roadmap":
    "Finalize the milestone slide, revise financial assumptions, and send the updated version before the evening review meeting.",
  "Complete 45 min workout":
    "Focus on cardio and mobility today. This recurring wellness task also contributes to the current streak.",
  "Practice spoken Marathi lesson":
    "Complete one guided speaking session and one revision block. Mark complete only after both are done.",
  "Review monthly budget targets":
    "Compare target versus actual spend, then update the Financial Goal with the next savings adjustment.",
  "Renew hosting and production services":
    "Verify billing, renew the required subscription, and confirm that downtime alerts remain active after payment.",
  "Prepare Q2 learning sprint plan":
    "Split the quarter plan into weekly milestones, course sessions, and evaluation checkpoints."
};

let selectedTask = taskRows[0] || null;

function updateDetail(taskButton) {
  const title = taskButton.querySelector("strong").textContent;
  const meta = taskButton.querySelector("small").textContent;
  const metaParts = meta.split("·").map((item) => item.trim());
  const deadlineLabel = metaParts.slice(-2).join(" · ");

  selectedTask = taskButton;
  detailTitle.textContent = title;
  detailNotes.textContent = taskNotes[title] || "Task details will appear here.";
  detailState.textContent = taskButton.classList.contains("is-complete")
    ? "Completed"
    : "Pending";

  document.querySelectorAll(".task-row.is-selected").forEach((task) => {
    task.classList.remove("is-selected");
  });
  taskButton.classList.add("is-selected");

  const detailMeta = document.querySelector(".detail-meta");
  detailMeta.children[1].textContent = `Deadline: ${deadlineLabel}`;
}

if (taskRows.length && completeButton && detailTitle && detailState && detailNotes) {
  taskRows.forEach((taskButton) => {
    taskButton.addEventListener("click", () => updateDetail(taskButton));
  });

  completeButton.addEventListener("click", () => {
    if (!selectedTask) {
      return;
    }

    selectedTask.classList.toggle("is-complete");
    detailState.textContent = selectedTask.classList.contains("is-complete")
      ? "Completed"
      : "Pending";
  });

  updateDetail(selectedTask);
}

const CYAN = "#00C8FF";
const PURPLE = "#6C63FF";
const clockCanvas = document.getElementById("hud-clock");
const clockContext = clockCanvas ? clockCanvas.getContext("2d") : null;
let size = clockCanvas?.classList.contains("hud-clock-login") ? 520 : 320;
let clockResizeFrame = 0;
let clockResizeObserver = null;

function syncClockCanvasSize() {
  if (!clockCanvas || !clockContext) {
    return;
  }

  const measuredWidth = Math.round(clockCanvas.getBoundingClientRect().width);
  if (!measuredWidth) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const backingSize = Math.max(1, Math.round(measuredWidth * pixelRatio));

  size = measuredWidth;

  if (clockCanvas.width !== backingSize || clockCanvas.height !== backingSize) {
    clockCanvas.width = backingSize;
    clockCanvas.height = backingSize;
  }

  // Keep layout sizing in CSS so the canvas can stay fluid across breakpoints.
  clockCanvas.style.removeProperty("height");
  clockCanvas.style.removeProperty("width");
  clockContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function queueClockCanvasSync() {
  if (!clockCanvas || !clockContext) {
    return;
  }

  cancelAnimationFrame(clockResizeFrame);
  clockResizeFrame = requestAnimationFrame(syncClockCanvasSize);
}

if (clockCanvas && clockContext) {
  syncClockCanvasSize();
  window.addEventListener("resize", queueClockCanvasSync);

  if ("ResizeObserver" in window) {
    clockResizeObserver = new ResizeObserver(queueClockCanvasSync);
    clockResizeObserver.observe(clockCanvas.parentElement ?? clockCanvas);
  }
}

let frame = 0;

function drawHudClock() {
  frame += 1;

  const now = new Date();
  const compactClock = size < 170;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const scaleDown = (desktopValue, mobileMin) => clamp((desktopValue * size) / 320, mobileMin, desktopValue);
  const cx = size / 2;
  const cy = size / 2;
  const radiusPadding = scaleDown(24, compactClock ? 12 : 16);
  const radius = Math.max(size / 2 - radiusPadding, size * 0.24);
  const outerRadius = radius - scaleDown(2, 1);
  const majorTickLength = scaleDown(16, compactClock ? 6 : 10);
  const minorTickLength = scaleDown(8, compactClock ? 3 : 5);
  const outerRingWidth = scaleDown(1, 0.8);
  const middleRingWidth = scaleDown(1.5, 0.9);
  const majorRingWidth = scaleDown(2.5, 1.2);
  const secondRingOffset = scaleDown(4, 2);
  const minuteRingOffset = scaleDown(3, 1.5);
  const orbitOffset = scaleDown(12, 6);
  const scanHalfHeight = scaleDown(25, 10);
  const scanWidthOffset = scaleDown(5, 2);
  const scanHeight = scanHalfHeight * 2;
  const innerRingWidth = scaleDown(2, 1.1);
  const pulseShadow = scaleDown(18, 8);
  const secondArcWidth = scaleDown(3, 1.4);
  const minuteArcWidth = scaleDown(2.5, 1.2);
  const hourArcWidth = scaleDown(2, 1);
  const orbitDotSize = scaleDown(2, 1);
  const orbitDotGlow = scaleDown(8, 4);
  const secondDotSize = scaleDown(4, 2);
  const secondDotGlow = scaleDown(12, 5);
  const centerYOffset = scaleDown(10, compactClock ? 5 : 7);
  const timeFontSize = scaleDown(42, compactClock ? 17 : 24);
  const secondsFontSize = scaleDown(18, compactClock ? 8 : 10);
  const periodFontSize = scaleDown(14, compactClock ? 7 : 9);
  const brandFontSize = scaleDown(9, compactClock ? 5 : 6);
  const sideInfoFontSize = scaleDown(8, 6);
  const statusFontSize = scaleDown(7, 5);
  const bracketLength = scaleDown(20, compactClock ? 8 : 12);
  const bracketDotSize = scaleDown(2, 1);
  const timeGlowRadius = radius * (compactClock ? 0.3 : 0.35);
  const secondsOffsetY = scaleDown(22, compactClock ? 14 : 17);
  const periodOffsetY = scaleDown(42, compactClock ? 25 : 33);

  clockContext.clearRect(0, 0, size, size);

  const bgGlow = clockContext.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2);
  bgGlow.addColorStop(0, "rgba(0,200,255,0.03)");
  bgGlow.addColorStop(0.5, "rgba(108,99,255,0.02)");
  bgGlow.addColorStop(1, "transparent");
  clockContext.fillStyle = bgGlow;
  clockContext.fillRect(0, 0, size, size);

  clockContext.save();
  clockContext.translate(cx, cy);
  clockContext.rotate(((now.getSeconds() + now.getMilliseconds() / 1000) / 60) * Math.PI * 2);
  for (let i = 0; i < 60; i += 1) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const length = isMajor ? majorTickLength : minorTickLength;
    clockContext.beginPath();
    clockContext.moveTo(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle));
    clockContext.lineTo((outerRadius - length) * Math.cos(angle), (outerRadius - length) * Math.sin(angle));
    clockContext.strokeStyle = isMajor ? CYAN : "rgba(0,200,255,0.25)";
    clockContext.lineWidth = isMajor ? majorRingWidth : outerRingWidth;
    clockContext.stroke();
  }
  clockContext.restore();

  clockContext.beginPath();
  clockContext.arc(cx, cy, radius, 0, Math.PI * 2);
  clockContext.strokeStyle = "rgba(0,200,255,0.12)";
  clockContext.lineWidth = outerRingWidth;
  clockContext.stroke();

  const middleRadius = radius * 0.78;
  clockContext.save();
  clockContext.translate(cx, cy);
  clockContext.rotate(-((now.getMinutes() + now.getSeconds() / 60) / 60) * Math.PI * 2);
  clockContext.beginPath();
  clockContext.arc(0, 0, middleRadius, 0, Math.PI * 2);
  clockContext.strokeStyle = "rgba(108,99,255,0.2)";
  clockContext.lineWidth = middleRingWidth;
  clockContext.stroke();
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    const middleTickOffset = scaleDown(5, compactClock ? 2.5 : 3.5);
    clockContext.beginPath();
    clockContext.moveTo((middleRadius - middleTickOffset) * Math.cos(angle), (middleRadius - middleTickOffset) * Math.sin(angle));
    clockContext.lineTo((middleRadius + middleTickOffset) * Math.cos(angle), (middleRadius + middleTickOffset) * Math.sin(angle));
    clockContext.strokeStyle = i % 6 === 0 ? "rgba(108,99,255,0.7)" : "rgba(108,99,255,0.35)";
    clockContext.lineWidth = i % 6 === 0 ? scaleDown(2, 1) : middleRingWidth;
    clockContext.stroke();
  }
  clockContext.restore();

  const pulse = 0.95 + Math.sin(frame * 0.03) * 0.05;
  const innerRadius = radius * 0.55 * pulse;
  clockContext.beginPath();
  clockContext.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  clockContext.strokeStyle = "rgba(0,200,255,0.12)";
  clockContext.lineWidth = innerRingWidth;
  clockContext.shadowBlur = pulseShadow;
  clockContext.shadowColor = "rgba(0,200,255,0.2)";
  clockContext.stroke();
  clockContext.shadowBlur = 0;

  const secondFraction = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
  clockContext.beginPath();
  clockContext.arc(cx, cy, radius + secondRingOffset, -Math.PI / 2, -Math.PI / 2 + secondFraction * Math.PI * 2);
  clockContext.strokeStyle = CYAN;
  clockContext.lineWidth = secondArcWidth;
  clockContext.shadowBlur = scaleDown(14, 6);
  clockContext.shadowColor = CYAN;
  clockContext.lineCap = "round";
  clockContext.stroke();
  clockContext.shadowBlur = 0;
  clockContext.lineCap = "butt";

  const secondEndAngle = -Math.PI / 2 + secondFraction * Math.PI * 2;
  const dotX = cx + (radius + secondRingOffset) * Math.cos(secondEndAngle);
  const dotY = cy + (radius + secondRingOffset) * Math.sin(secondEndAngle);
  clockContext.beginPath();
  clockContext.arc(dotX, dotY, secondDotSize, 0, Math.PI * 2);
  clockContext.fillStyle = CYAN;
  clockContext.shadowBlur = secondDotGlow;
  clockContext.shadowColor = CYAN;
  clockContext.fill();
  clockContext.shadowBlur = 0;

  const minuteFraction = (now.getMinutes() + now.getSeconds() / 60) / 60;
  clockContext.beginPath();
  clockContext.arc(cx, cy, middleRadius + minuteRingOffset, -Math.PI / 2, -Math.PI / 2 + minuteFraction * Math.PI * 2);
  clockContext.strokeStyle = PURPLE;
  clockContext.lineWidth = minuteArcWidth;
  clockContext.shadowBlur = scaleDown(12, 5);
  clockContext.shadowColor = PURPLE;
  clockContext.lineCap = "round";
  clockContext.stroke();
  clockContext.shadowBlur = 0;
  clockContext.lineCap = "butt";

  const hourFraction = ((now.getHours() % 12) + now.getMinutes() / 60) / 12;
  clockContext.beginPath();
  clockContext.arc(cx, cy, innerRadius + scaleDown(2, 1), -Math.PI / 2, -Math.PI / 2 + hourFraction * Math.PI * 2);
  clockContext.strokeStyle = "rgba(255,109,0,0.5)";
  clockContext.lineWidth = hourArcWidth;
  clockContext.shadowBlur = scaleDown(8, 3);
  clockContext.shadowColor = "rgba(255,109,0,0.3)";
  clockContext.lineCap = "round";
  clockContext.stroke();
  clockContext.shadowBlur = 0;
  clockContext.lineCap = "butt";

  const scanY = cy - radius + ((frame * 1.8) % (radius * 2));
  const scanGradient = clockContext.createLinearGradient(0, scanY - scanHalfHeight, 0, scanY + scanHalfHeight);
  scanGradient.addColorStop(0, "transparent");
  scanGradient.addColorStop(0.5, "rgba(0,200,255,0.05)");
  scanGradient.addColorStop(1, "transparent");
  clockContext.fillStyle = scanGradient;
  clockContext.fillRect(cx - radius - scanWidthOffset, scanY - scanHalfHeight, (radius + scanWidthOffset) * 2, scanHeight);

  const period = now.getHours() >= 12 ? "PM" : "AM";
  const hour12 = now.getHours() % 12 || 12;
  const hours = String(hour12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const timeGlow = clockContext.createRadialGradient(cx, cy, 0, cx, cy, timeGlowRadius);
  timeGlow.addColorStop(0, "rgba(0,200,255,0.06)");
  timeGlow.addColorStop(1, "transparent");
  clockContext.fillStyle = timeGlow;
  clockContext.fillRect(cx - timeGlowRadius, cy - timeGlowRadius, timeGlowRadius * 2, timeGlowRadius * 2);

  clockContext.font = `800 ${timeFontSize}px 'Courier New', monospace`;
  clockContext.textAlign = "center";
  clockContext.textBaseline = "middle";
  clockContext.fillStyle = "rgba(108,99,255,0.1)";
  clockContext.fillText(`${hours}:${minutes}`, cx + scaleDown(2, 1), cy - centerYOffset + scaleDown(2, 1));

  clockContext.fillStyle = CYAN;
  clockContext.shadowBlur = scaleDown(25, 10);
  clockContext.shadowColor = CYAN;
  clockContext.fillText(`${hours}:${minutes}`, cx, cy - centerYOffset);
  clockContext.shadowBlur = 0;

  if (now.getMilliseconds() < 500) {
    clockContext.fillStyle = "rgba(0,200,255,0.3)";
    clockContext.fillText(`${hours} ${minutes}`, cx, cy - centerYOffset);
  }

  clockContext.font = `600 ${secondsFontSize}px 'Courier New', monospace`;
  clockContext.fillStyle = "rgba(0,200,255,0.55)";
  clockContext.fillText(seconds, cx, cy + secondsOffsetY);

  clockContext.font = `600 ${periodFontSize}px 'Courier New', monospace`;
  clockContext.fillStyle = "rgba(0,200,255,0.52)";
  clockContext.fillText(period, cx, cy + periodOffsetY);

  const bracketOffset = radius * 0.42;
  clockContext.strokeStyle = "rgba(0,200,255,0.35)";
  clockContext.lineWidth = middleRingWidth;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
    clockContext.beginPath();
    clockContext.moveTo(cx + dx * bracketOffset, cy + dy * (bracketOffset - bracketLength));
    clockContext.lineTo(cx + dx * bracketOffset, cy + dy * bracketOffset);
    clockContext.lineTo(cx + dx * (bracketOffset - bracketLength), cy + dy * bracketOffset);
    clockContext.stroke();

    clockContext.beginPath();
    clockContext.arc(cx + dx * bracketOffset, cy + dy * bracketOffset, bracketDotSize, 0, Math.PI * 2);
    clockContext.fillStyle = "rgba(0,200,255,0.3)";
    clockContext.fill();
  });

  clockContext.font = `500 ${brandFontSize}px 'Courier New', monospace`;
  clockContext.textAlign = "center";
  clockContext.fillStyle = "rgba(0,200,255,0.4)";
  clockContext.fillText("TIMENEST", cx, cy - radius * 0.68);
  if (!compactClock) {
    clockContext.fillText("SYS.CLOCK v2.1", cx, cy + radius * 0.72);
  }

  if (!compactClock) {
    clockContext.textAlign = "left";
    clockContext.font = `500 ${sideInfoFontSize}px 'Courier New', monospace`;
    clockContext.fillStyle = "rgba(108,99,255,0.35)";
    clockContext.fillText(`HR: ${hours}`, cx + radius * 0.48, cy - radius * 0.22);
    clockContext.fillText(`MN: ${minutes}`, cx + radius * 0.48, cy - radius * 0.12);
    clockContext.fillText(`SC: ${seconds}`, cx + radius * 0.48, cy - radius * 0.02);
  }

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  if (!compactClock) {
    clockContext.textAlign = "right";
    clockContext.fillStyle = "rgba(0,200,255,0.3)";
    clockContext.fillText(dayNames[now.getDay()], cx - radius * 0.48, cy - radius * 0.22);
    clockContext.fillText(`${now.getDate()} ${monthNames[now.getMonth()]}`, cx - radius * 0.48, cy - radius * 0.12);
    clockContext.fillText(String(now.getFullYear()), cx - radius * 0.48, cy - radius * 0.02);
  }

  const orbitAngle = (frame * 0.02) % (Math.PI * 2);
  const orbitX = cx + (radius + orbitOffset) * Math.cos(orbitAngle);
  const orbitY = cy + (radius + orbitOffset) * Math.sin(orbitAngle);
  clockContext.beginPath();
  clockContext.arc(orbitX, orbitY, orbitDotSize, 0, Math.PI * 2);
  clockContext.fillStyle = "rgba(0,200,255,0.6)";
  clockContext.shadowBlur = orbitDotGlow;
  clockContext.shadowColor = CYAN;
  clockContext.fill();
  clockContext.shadowBlur = 0;

  if (!compactClock) {
    clockContext.textAlign = "center";
    clockContext.font = `500 ${statusFontSize}px 'Courier New', monospace`;
    clockContext.fillStyle = "rgba(0,200,255,0.25)";
    clockContext.fillText(`* SYNC ACTIVE  * PRECISION MODE  * UTC${formatUtcOffset(now)}`, cx, cy + radius * 0.85);
  }

  requestAnimationFrame(drawHudClock);
}

function formatUtcOffset(date) {
  const offsetHours = -date.getTimezoneOffset() / 60;
  return offsetHours >= 0 ? `+${offsetHours}` : `${offsetHours}`;
}

if (clockCanvas && clockContext) {
  drawHudClock();
}

const nativePickerInputs = Array.from(
  document.querySelectorAll(
    'input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"]'
  )
);

function tryOpenNativePicker(input) {
  if (
    !input ||
    input.disabled ||
    input.readOnly ||
    typeof input.showPicker !== "function"
  ) {
    return;
  }

  try {
    input.showPicker();
  } catch (error) {
    // Some browsers restrict picker opening to specific trusted gestures.
  }
}

nativePickerInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    tryOpenNativePicker(input);
  });

  input.addEventListener("pointerdown", () => {
    tryOpenNativePicker(input);
  });
});

const loginCard = document.querySelector(".login-card");
const loginActions = document.querySelectorAll(".login-action, .login-submit");
const animatedTaglines = document.querySelectorAll("[data-animate-chars='true']");

animatedTaglines.forEach((tagline) => {
  const text = tagline.dataset.text || tagline.textContent;
  tagline.textContent = "";

  [...text].forEach((character, index) => {
    const span = document.createElement("span");
    span.className = "tagline-char";
    span.textContent = character === " " ? "\u00A0" : character;
    span.style.animationDelay = `${index * 0.04}s`;
    tagline.appendChild(span);
  });
});

if (loginCard) {
  loginCard.addEventListener("pointermove", (event) => {
    const bounds = loginCard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const tiltY = (x - 0.5) * 8;
    const tiltX = (0.5 - y) * 8;

    loginCard.style.setProperty("--login-tilt-x", `${tiltX.toFixed(2)}deg`);
    loginCard.style.setProperty("--login-tilt-y", `${tiltY.toFixed(2)}deg`);
  });

  loginCard.addEventListener("pointerleave", () => {
    loginCard.style.setProperty("--login-tilt-x", "0deg");
    loginCard.style.setProperty("--login-tilt-y", "0deg");
  });
}

loginActions.forEach((button) => {
  button.addEventListener("click", () => {
    button.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-2px) scale(1.02)" },
        { transform: "translateY(0) scale(1)" }
      ],
      {
        duration: 260,
        easing: "ease-out"
      }
    );
  });
});

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeIcon = document.querySelector("[data-theme-icon]");

const themeIcons = {
  dark: `
    <path
      d="M20 14.2A8 8 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
  `,
  light: `
    <circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
  `
};

function getActiveTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("timenest-theme", theme);

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );
  }

  if (themeLabel) {
    themeLabel.textContent = theme === "light" ? "Light Mode" : "Dark Mode";
  }

  if (themeIcon) {
    themeIcon.innerHTML = themeIcons[theme];
  }
}

applyTheme(localStorage.getItem("timenest-theme") === "light" ? "light" : "dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    applyTheme(getActiveTheme() === "light" ? "dark" : "light");
  });
}

const quickAddOpenButton = document.querySelector("[data-quick-add-open]");
const quickAddSheet = document.querySelector("[data-quick-add-sheet]");
const quickAddBackdrop = document.querySelector("[data-quick-add-backdrop]");
const quickAddSteps = document.querySelectorAll("[data-quick-add-step]");
const quickAddBackButton = document.querySelector("[data-quick-add-back]");
const quickAddCloseButtons = document.querySelectorAll("[data-quick-add-close]");
const quickAddChoiceButtons = document.querySelectorAll("[data-add-choice]");
const quickAddUrlButtons = document.querySelectorAll("[data-add-url]");
const pageSearchParams = new URLSearchParams(window.location.search);
const hideOnQuickAddElements = document.querySelectorAll("[data-hide-on-quick-add]");
const isQuickAddEntry = pageSearchParams.get("entry") === "quick-add";
const closeWindowPageFallbacks = {
  "forgot-password.html": "./login.html",
  "goal-detail.html": "./goals.html",
  "goal-editor.html": "./goals.html",
  "habit-editor.html": "./calendar.html?view=habits",
  "notifications.html": "./index.html",
  "profile.html": "./index.html",
  "settings.html": "./index.html",
  "signup.html": "./login.html",
  "subtask-editor.html": "./daily-tasks.html",
  "task-detail.html": "./daily-tasks.html",
  "task-editor.html": "./daily-tasks.html"
};
const closeWindowStorageKey = "timenest-close-return";

function getPageName(urlLike = window.location.href) {
  try {
    return new URL(urlLike, window.location.href).pathname.split("/").pop().toLowerCase();
  } catch (error) {
    return "";
  }
}

function normalizeAppUrl(urlLike) {
  if (!urlLike) {
    return "";
  }

  try {
    const nextUrl = new URL(urlLike, window.location.href);
    if (nextUrl.origin !== window.location.origin) {
      return "";
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  } catch (error) {
    return "";
  }
}

function getCurrentAppUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function getStoredCloseReturn(pageName) {
  const rawValue = sessionStorage.getItem(closeWindowStorageKey);
  if (!rawValue) {
    return "";
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (parsedValue?.targetPage !== pageName) {
      return "";
    }

    return normalizeAppUrl(parsedValue.returnTo);
  } catch (error) {
    return "";
  }
}

function storeCloseReturn(urlLike) {
  const targetPage = getPageName(urlLike);
  if (!closeWindowPageFallbacks[targetPage]) {
    return;
  }

  sessionStorage.setItem(
    closeWindowStorageKey,
    JSON.stringify({
      targetPage,
      returnTo: getCurrentAppUrl()
    })
  );
}

function resolveCloseReturnUrl() {
  const currentPage = getPageName();
  const currentUrl = getCurrentAppUrl();
  const requestedReturn = normalizeAppUrl(pageSearchParams.get("returnTo"));
  const storedReturn = getStoredCloseReturn(currentPage);
  const referrerReturn = normalizeAppUrl(document.referrer);
  const candidates = [requestedReturn, storedReturn, referrerReturn];

  for (const candidate of candidates) {
    if (candidate && candidate !== currentUrl) {
      return candidate;
    }
  }

  return closeWindowPageFallbacks[currentPage] || "./index.html";
}

function mountCloseWindowButton() {
  const currentPage = getPageName();
  if (!closeWindowPageFallbacks[currentPage] || document.querySelector("[data-window-close-button]")) {
    return;
  }

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "window-close-button";
  closeButton.setAttribute("aria-label", "Close window and go back");
  closeButton.setAttribute("title", "Close");
  closeButton.dataset.windowCloseButton = "true";
  closeButton.innerHTML = '<span aria-hidden="true">×</span>';
  closeButton.addEventListener("click", () => {
    const nextUrl = resolveCloseReturnUrl();
    sessionStorage.removeItem(closeWindowStorageKey);
    window.location.href = nextUrl;
  });

  document.body.append(closeButton);
}

if (hideOnQuickAddElements.length && isQuickAddEntry) {
  hideOnQuickAddElements.forEach((element) => {
    element.hidden = true;
  });
}

document.addEventListener(
  "click",
  (event) => {
    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) {
      return;
    }

    storeCloseReturn(link.href);
  },
  true
);

mountCloseWindowButton();

function setQuickAddStep(step) {
  quickAddSteps.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.quickAddStep === step);
  });
}

function openQuickAdd() {
  if (!quickAddSheet || !quickAddBackdrop || !quickAddOpenButton) {
    return;
  }

  setQuickAddStep("root");
  quickAddSheet.hidden = false;
  quickAddBackdrop.hidden = false;
  quickAddOpenButton.setAttribute("aria-expanded", "true");
  quickAddOpenButton.hidden = true;
}

function closeQuickAdd() {
  if (!quickAddSheet || !quickAddBackdrop || !quickAddOpenButton) {
    return;
  }

  quickAddSheet.hidden = true;
  quickAddBackdrop.hidden = true;
  quickAddOpenButton.setAttribute("aria-expanded", "false");
  quickAddOpenButton.hidden = false;
}

if (quickAddOpenButton && quickAddSheet && quickAddBackdrop) {
  closeQuickAdd();
  quickAddOpenButton.addEventListener("click", openQuickAdd);
  quickAddBackdrop.addEventListener("click", closeQuickAdd);
  window.addEventListener("pageshow", closeQuickAdd);

  quickAddCloseButtons.forEach((button) => {
    button.addEventListener("click", closeQuickAdd);
  });

  quickAddChoiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.addChoice === "goal") {
        setQuickAddStep("goal");
      }
    });
  });

  quickAddUrlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetUrl = button.dataset.addUrl;
      if (targetUrl) {
        storeCloseReturn(targetUrl);
        window.location.href = targetUrl;
      }
    });
  });

  if (quickAddBackButton) {
    quickAddBackButton.addEventListener("click", () => setQuickAddStep("root"));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !quickAddSheet.hidden) {
      closeQuickAdd();
    }
  });
}

const goalDetailDrilldowns = {
  short: {
    completed: {
    eyebrow: "Completed Goals",
    title: "Completed goals closed with strong finish quality",
    summary:
      "These goals crossed the line this month with the core tasks wrapped, documented, and reviewed.",
    statusText: "Completed",
    statusTone: "good",
    start: "Closed: 28 Mar 2026",
    target: "Review: 05 Apr 2026",
    progressValue: "100%",
    timelineLabel: "Completion Highlights",
    tasks: [
      { title: "Ship dashboard responsiveness pass", meta: "Done · Mobile and tablet review complete", badge: "Done", tone: "good" },
      { title: "Finish investor roadmap pack", meta: "Done · Shared with stakeholders on time", badge: "Done", tone: "good" },
      { title: "Close workout cycle streak", meta: "Done · 30-day strength plan archived", badge: "Done", tone: "good" },
      { title: "Publish Q1 learning wrap-up", meta: "Done · Notes and next sprint synced", badge: "Done", tone: "good" }
    ],
    timeline: [
      { label: "Week 1", title: "Final tasks cleared", copy: "Outstanding actions were completed and marked verified." },
      { label: "Week 2", title: "Quality review finished", copy: "Each closed goal was checked for deadline accuracy and follow-up needs." },
      { label: "Week 3", title: "Results shared", copy: "Wins were rolled into the next planning cycle and monthly recap." }
    ]
  },
    active: {
    eyebrow: "Goals In Progress",
    title: "Active goals moving through the current sprint",
    summary:
      "This drill-down shows the goals still moving, the next tasks underneath them, and where momentum is strongest.",
    statusText: "In Progress",
    statusTone: "warn",
    start: "Started: 01 Apr 2026",
    target: "Next checkpoint: 12 Apr 2026",
    progressValue: "68%",
    timelineLabel: "Momentum Map",
    tasks: [
      { title: "Refine dashboard light theme", meta: "Today · UI polish sprint", badge: "Active", tone: "warn" },
      { title: "Connect recurring habit history", meta: "Tomorrow · Calendar flow", badge: "Planned", tone: "warn" },
      { title: "Update goal editor shortcuts", meta: "03 Apr · Quick-add path", badge: "Queued", tone: "warn" },
      { title: "Review delayed goal recovery plan", meta: "04 Apr · Weekly operations check", badge: "At Risk", tone: "alert" }
    ],
    timeline: [
      { label: "Now", title: "Execution sprint", copy: "Active work is concentrated on dashboard, habits, and editing flows." },
      { label: "Next", title: "Validation pass", copy: "Once UI tasks land, the app flow will be checked against mobile use cases." },
      { label: "Later", title: "Reminder tuning", copy: "After the UI stabilizes, reminders and recurrences get their next pass." }
    ]
  },
    "on-time": {
    eyebrow: "Completed On Time",
    title: "On-time delivery trend across current goal work",
    summary:
      "These tasks and milestones landed on schedule, which is why this metric is staying healthy this month.",
    statusText: "On Time",
    statusTone: "good",
    start: "Window: Mar 2026",
    target: "Accuracy: 91%",
    progressValue: "91%",
    timelineLabel: "Deadline Discipline",
    tasks: [
      { title: "Morning summary automation", meta: "Done · 08:00 AM trigger delivered on schedule", badge: "On Time", tone: "good" },
      { title: "Investor roadmap submission", meta: "Done · Sent before 07:30 PM deadline", badge: "On Time", tone: "good" },
      { title: "Budget review checkpoint", meta: "Done · Completed within target window", badge: "On Time", tone: "good" },
      { title: "Marathi practice streak review", meta: "Done · Logged before night cutoff", badge: "On Time", tone: "good" }
    ],
    timeline: [
      { label: "08:00", title: "Morning planning", copy: "Daily prep keeps the highest-value tasks visible early." },
      { label: "18:00", title: "Priority check", copy: "A late-day checkpoint reduces deadline slippage on important work." },
      { label: "20:00", title: "Closeout review", copy: "Evening review locks in what shipped and what needs rescheduling." }
    ]
  },
    delayed: {
    eyebrow: "Delayed Goals",
    title: "Goals needing intervention before they drift further",
    summary:
      "These goals are behind plan and need narrowed scope, updated dates, or better task support to recover.",
    statusText: "Needs Follow-Up",
    statusTone: "alert",
    start: "Delayed since: 30 Mar 2026",
    target: "Recovery review: 03 Apr 2026",
    progressValue: "42%",
    timelineLabel: "Recovery Plan",
    tasks: [
      { title: "Reset annual savings checkpoint", meta: "Today · Rework milestone pacing", badge: "Delayed", tone: "alert" },
      { title: "Fix sleep routine inconsistency", meta: "Tomorrow · Habit misses need review", badge: "Delayed", tone: "alert" },
      { title: "Update hosting renewal follow-up", meta: "03 Apr · Deadline slipped once", badge: "Watch", tone: "warn" },
      { title: "Break large feature goal into smaller tasks", meta: "04 Apr · Reduce delivery risk", badge: "Action", tone: "warn" }
    ],
    timeline: [
      { label: "Step 1", title: "Identify blockers", copy: "Separate deadline risk from workload size and missing reminders." },
      { label: "Step 2", title: "Shrink next milestone", copy: "Convert the recovery target into a smaller, achievable checkpoint." },
      { label: "Step 3", title: "Track daily", copy: "Use the dashboard to review recovery progress until the goal is back on track." }
    ]
    }
  },
  long: {
    completed: {
      eyebrow: "Completed Long-Term Goals",
      title: "Long-term goals that closed key milestones successfully",
      summary:
        "These long-term goals hit meaningful yearly checkpoints and moved into maintenance or the next strategic phase.",
      statusText: "Completed",
      statusTone: "good",
      start: "Milestone closed: 28 Mar 2026",
      target: "Annual review: 30 Jun 2026",
      progressValue: "100%",
      timelineLabel: "Milestone Archive",
      tasks: [
        { title: "Finalize TIMENEST MVP milestone", meta: "Done Â· Core release checkpoint marked complete", badge: "Done", tone: "good" },
        { title: "Close annual savings milestone", meta: "Done Â· Reserve target for the quarter achieved", badge: "Done", tone: "good" },
        { title: "Complete Marathi fluency checkpoint", meta: "Done Â· Conversation benchmark reached", badge: "Done", tone: "good" },
        { title: "Finish strength baseline block", meta: "Done Â· Mobility and performance review closed", badge: "Done", tone: "good" }
      ],
      timeline: [
        { label: "Q1", title: "Roadmap commitment cleared", copy: "Core annual milestones were completed without pushing scope into the next cycle." },
        { label: "Q2", title: "Review and document", copy: "Each finished goal was recorded with lessons, risks, and carry-forward ideas." },
        { label: "Q3", title: "Transition to next phase", copy: "Closed yearly goals now feed the next strategic milestone or maintenance rhythm." }
      ]
    },
    active: {
      eyebrow: "Active Long-Term Goals",
      title: "Long-term goals progressing through the yearly roadmap",
      summary:
        "These goals are still moving through active execution with milestone pacing, task support, and monthly reviews.",
      statusText: "In Progress",
      statusTone: "warn",
      start: "Year plan started: 01 Jan 2026",
      target: "Next milestone review: 30 Apr 2026",
      progressValue: "63%",
      timelineLabel: "Yearly Momentum",
      tasks: [
        { title: "Ship auth and dashboard milestone", meta: "Active Â· Product roadmap remains in motion", badge: "Active", tone: "warn" },
        { title: "Grow savings runway checkpoint", meta: "Planned Â· Monthly review still open", badge: "Planned", tone: "warn" },
        { title: "Deepen Marathi speaking practice", meta: "Queued Â· Fluency milestone scheduled", badge: "Queued", tone: "warn" },
        { title: "Advance annual fitness target", meta: "Watch Â· Weekly consistency needs review", badge: "Watch", tone: "alert" }
      ],
      timeline: [
        { label: "Q2", title: "Build current milestone", copy: "The active yearly goals are concentrated on the next meaningful milestone rather than the full annual scope." },
        { label: "Q3", title: "Validate delivery pace", copy: "Monthly reviews confirm whether current progress is strong enough to hold the annual target." },
        { label: "Q4", title: "Prepare closeout phase", copy: "The strongest active goals move into completion planning before the year-end review." }
      ]
    },
    delayed: {
      eyebrow: "Delayed Long-Term Goals",
      title: "Long-term goals that need recovery before annual drift grows",
      summary:
        "These yearly goals slipped behind the expected pace and need smaller milestones, better support tasks, or timeline correction.",
      statusText: "Needs Follow-Up",
      statusTone: "alert",
      start: "Delay noticed: 20 Mar 2026",
      target: "Recovery checkpoint: 10 Apr 2026",
      progressValue: "49%",
      timelineLabel: "Recovery Map",
      tasks: [
        { title: "Reset annual savings milestone", meta: "Delayed Â· Contribution pace fell behind target", badge: "Delayed", tone: "alert" },
        { title: "Stabilize sleep consistency plan", meta: "Delayed Â· Habit execution still uneven", badge: "Delayed", tone: "alert" },
        { title: "Reduce yearly scope into smaller phases", meta: "Action Â· Break the roadmap into tighter checkpoints", badge: "Action", tone: "warn" },
        { title: "Rebuild review cadence", meta: "Watch Â· Add stronger monthly follow-up", badge: "Watch", tone: "warn" }
      ],
      timeline: [
        { label: "Step 1", title: "Identify the drag", copy: "Separate missed execution from unrealistic yearly pacing before deciding the recovery plan." },
        { label: "Step 2", title: "Reset the milestone", copy: "Move the annual goal back onto a smaller checkpoint that can realistically be hit next." },
        { label: "Step 3", title: "Track recovery weekly", copy: "Use shorter review loops until the yearly goal is back on sustainable pace." }
      ]
    },
    "on-time": {
      eyebrow: "Long-Term Goals On Time",
      title: "Yearly goals staying on schedule across milestone reviews",
      summary:
        "This view highlights the long-term goals that are still landing milestones on time and protecting yearly momentum.",
      statusText: "On Time",
      statusTone: "good",
      start: "Tracking window: Jan to Apr 2026",
      target: "Annual schedule health: 78%",
      progressValue: "78%",
      timelineLabel: "Schedule Reliability",
      tasks: [
        { title: "Quarter roadmap checkpoint", meta: "On Time Â· Product milestone landed within plan", badge: "On Time", tone: "good" },
        { title: "Savings review cycle", meta: "On Time Â· Monthly audit completed in target window", badge: "On Time", tone: "good" },
        { title: "Language fluency review", meta: "On Time Â· Practice review logged on schedule", badge: "On Time", tone: "good" },
        { title: "Fitness baseline reassessment", meta: "On Time Â· Review completed before due week", badge: "On Time", tone: "good" }
      ],
      timeline: [
        { label: "Month 1", title: "Commit early", copy: "Early milestone commitment makes the rest of the yearly schedule easier to protect." },
        { label: "Month 2", title: "Review consistently", copy: "Regular milestone reviews keep long-term goals from quietly drifting." },
        { label: "Month 3", title: "Correct quickly", copy: "On-time performance stays high when small slips are fixed before the next review cycle." }
      ]
    }
  }
};

const legacyGoalDetailAliases = {
  "completed-goals": { view: "short", metric: "completed" },
  "in-progress": { view: "short", metric: "active" },
  "completed-on-time": { view: "short", metric: "on-time" },
  "delayed-goals": { view: "short", metric: "delayed" }
};

const goalDetailRangeOverrides = {
  short: {
    completed: {
      month: {
        summary:
          "These short-term goals were fully completed in the current month and closed with the final review already logged.",
        start: "Closed this month: Apr 2026",
        target: "Monthly wrap-up: 30 Apr 2026",
        tasks: [
          { title: "Ship dashboard responsiveness pass", meta: "Done · Mobile view polish signed off", badge: "Done", tone: "good" },
          { title: "Finish investor roadmap pack", meta: "Done · Shared during April review", badge: "Done", tone: "good" },
          { title: "Close workout cycle streak", meta: "Done · Sprint habit target completed", badge: "Done", tone: "good" },
          { title: "Publish Q1 learning wrap-up", meta: "Done · Monthly notes archived", badge: "Done", tone: "good" }
        ]
      }
    },
    active: {
      month: {
        summary:
          "Five short-term goals are still active this month, each with live delivery work or a review still in flight.",
        target: "Monthly checkpoint: 30 Apr 2026",
        progressValue: "74%",
        tasks: [
          { title: "Refine dashboard light theme", meta: "Today · UI polish sprint", badge: "Active", tone: "warn" },
          { title: "Connect recurring habit history", meta: "Tomorrow · Calendar flow", badge: "Planned", tone: "warn" },
          { title: "Update goal editor shortcuts", meta: "05 Apr · Quick-add path", badge: "Queued", tone: "warn" },
          { title: "Review delayed goal recovery plan", meta: "08 Apr · Weekly operations check", badge: "At Risk", tone: "alert" },
          { title: "Finalize savings review checklist", meta: "11 Apr · Monthly budget checkpoint", badge: "Active", tone: "warn" }
        ]
      }
    },
    delayed: {
      month: {
        summary:
          "Only one short-term goal is delayed this month, so the recovery work is focused and specific.",
        progressValue: "61%",
        tasks: [
          { title: "Reset sleep routine consistency", meta: "Delayed · Habit misses need a tighter evening reset", badge: "Delayed", tone: "alert" }
        ],
        timeline: [
          { label: "Step 1", title: "Reduce the scope", copy: "Shrink the current target into one realistic recovery step for the rest of the month." },
          { label: "Step 2", title: "Rebuild the streak", copy: "Focus on consistency first instead of trying to recover every missed action at once." }
        ]
      }
    },
    "on-time": {
      month: {
        target: "Accuracy: 94%",
        progressValue: "94%",
        tasks: [
          { title: "Morning summary automation", meta: "Done · Delivered on schedule this month", badge: "On Time", tone: "good" },
          { title: "Investor roadmap submission", meta: "Done · Shared before the April deadline", badge: "On Time", tone: "good" },
          { title: "Budget review checkpoint", meta: "Done · Closed inside the target window", badge: "On Time", tone: "good" },
          { title: "Marathi practice streak review", meta: "Done · Logged before the night cutoff", badge: "On Time", tone: "good" }
        ]
      }
    }
  },
  long: {
    completed: {
      month: {
        summary:
          "One long-term goal reached its monthly milestone this month and moved into the next yearly phase.",
        start: "Milestone closed this month: Apr 2026",
        target: "Next annual review: 30 Jun 2026",
        tasks: [
          { title: "Finalize TIMENEST MVP milestone", meta: "Done · Current monthly milestone approved", badge: "Done", tone: "good" }
        ]
      }
    },
    active: {
      month: {
        summary:
          "Two long-term goals are actively moving through this month’s milestone plan.",
        progressValue: "71%",
        tasks: [
          { title: "Ship auth and dashboard milestone", meta: "Active · Product roadmap remains in motion", badge: "Active", tone: "warn" },
          { title: "Deepen Marathi speaking practice", meta: "Queued · Fluency checkpoint is scheduled", badge: "Queued", tone: "warn" }
        ]
      }
    },
    delayed: {
      month: {
        summary:
          "No long-term goals are marked delayed in the current month view.",
        progressValue: "0%",
        tasks: [],
        timeline: [
          { label: "This Month", title: "No delayed long-term goals", copy: "The yearly roadmap has no delayed items in the current month snapshot." }
        ]
      }
    },
    "on-time": {
      month: {
        target: "Annual schedule health: 84%",
        progressValue: "84%",
        tasks: [
          { title: "Quarter roadmap checkpoint", meta: "On Time · Product milestone landed within plan", badge: "On Time", tone: "good" },
          { title: "Language fluency review", meta: "On Time · Practice review logged on schedule", badge: "On Time", tone: "good" },
          { title: "Fitness baseline reassessment", meta: "On Time · Review completed before the due week", badge: "On Time", tone: "good" }
        ]
      }
    }
  }
};

// Clear the hardcoded sample tasks and milestones from the drill-down
// structures — real content is rendered from the user's own goals/tasks
// by store-ui.js. The surrounding copy (titles, summaries, status pill)
// is kept so empty drill-down views still read as proper scaffolding.
(function clearGoalDrilldownSamples() {
  const views = ["short", "long"];
  const metrics = ["completed", "active", "delayed", "on-time"];
  for (const v of views) {
    for (const m of metrics) {
      const d = goalDetailDrilldowns[v]?.[m];
      if (d) {
        if (Array.isArray(d.tasks)) d.tasks = [];
        if (Array.isArray(d.timeline)) d.timeline = [];
      }
      const o = goalDetailRangeOverrides[v]?.[m]?.month;
      if (o) {
        if (Array.isArray(o.tasks)) o.tasks = [];
        if (Array.isArray(o.timeline)) o.timeline = [];
      }
    }
  }
})();

function getGoalDetailView(view, metric, range = "all") {
  const selectedView = goalDetailDrilldowns[view] ? view : "short";
  const baseDetail = goalDetailDrilldowns[selectedView]?.[metric] || null;
  if (!baseDetail) {
    return null;
  }

  if (range !== "month") {
    return baseDetail;
  }

  const monthOverride = goalDetailRangeOverrides[selectedView]?.[metric]?.month || null;
  return monthOverride ? { ...baseDetail, ...monthOverride } : baseDetail;
}

function buildGoalMetricData() {
  const buildMetricsForRange = (view, range) => {
    const completedDetail = getGoalDetailView(view, "completed", range);
    const activeDetail = getGoalDetailView(view, "active", range);
    const delayedDetail = getGoalDetailView(view, "delayed", range);
    const onTimeDetail = getGoalDetailView(view, "on-time", range);

    return [
      { key: "completed", label: "Completed", value: String(completedDetail?.tasks?.length || 0).padStart(2, "0") },
      { key: "active", label: "Active", value: String(activeDetail?.tasks?.length || 0).padStart(2, "0") },
      { key: "delayed", label: "Delayed", value: String(delayedDetail?.tasks?.length || 0).padStart(2, "0") },
      { key: "on-time", label: "On Time", value: onTimeDetail?.progressValue || "0%" }
    ];
  };

  return {
    short: {
      all: buildMetricsForRange("short", "all"),
      month: buildMetricsForRange("short", "month")
    },
    long: {
      all: buildMetricsForRange("long", "all"),
      month: buildMetricsForRange("long", "month")
    }
  };
}

function renderGoalDetailItems(items) {
  if (!items?.length) {
    return `
      <div class="surface-item">
        <div>
          <strong>No goals in this drill-down</strong>
          <small>This view is clear for the selected range.</small>
        </div>
        <span class="status-pill good">Clear</span>
      </div>
    `;
  }

  return items
    .map(
      (item) => `
        <a class="surface-item" href="./task-detail.html">
          <div>
            <strong>${item.title}</strong>
            <small>${item.meta}</small>
          </div>
          <span class="status-pill ${item.tone}">${item.badge}</span>
        </a>
      `
    )
    .join("");
}

function renderGoalTimeline(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <div class="timeline-item empty-state">
        <span class="timeline-time">—</span>
        <div><strong>No milestones yet</strong><small>Milestones will appear once you create goals with target dates.</small></div>
      </div>
    `;
  }
  return items
    .map(
      (item) => `
        <div class="timeline-item">
          <span class="timeline-time">${item.label}</span>
          <div><strong>${item.title}</strong><small>${item.copy}</small></div>
        </div>
      `
    )
    .join("");
}

const goalDetailTitle = document.getElementById("goal-detail-title");
const goalDetailSummary = document.getElementById("goal-detail-summary");
const goalDetailEyebrow = document.getElementById("goal-detail-eyebrow");
const goalDetailStatus = document.getElementById("goal-detail-status");
const goalDetailStart = document.getElementById("goal-detail-start");
const goalDetailTarget = document.getElementById("goal-detail-target");
const goalDetailProgressValue = document.getElementById("goal-detail-progress-value");
const goalDetailProgressBar = document.getElementById("goal-detail-progress-bar");
const goalDetailTaskList = document.getElementById("goal-detail-task-list");
const goalDetailTimeline = document.getElementById("goal-detail-timeline");
const goalDetailTimelineLabel = document.getElementById("goal-detail-timeline-label");

if (
  goalDetailTitle &&
  goalDetailSummary &&
  goalDetailEyebrow &&
  goalDetailStatus &&
  goalDetailStart &&
  goalDetailTarget &&
  goalDetailProgressValue &&
  goalDetailProgressBar &&
  goalDetailTaskList &&
  goalDetailTimeline &&
  goalDetailTimelineLabel
) {
  const goalDetailParams = new URLSearchParams(window.location.search);
  const requestedView = goalDetailParams.get("view") === "long" ? "long" : "short";
  const requestedMetric = goalDetailParams.get("metric") || "";
  const requestedRange = goalDetailParams.get("range") === "month" ? "month" : "all";
  const legacyDetail = legacyGoalDetailAliases[requestedMetric] || null;
  const detailView = legacyDetail
    ? getGoalDetailView(legacyDetail.view, legacyDetail.metric, requestedRange)
    : getGoalDetailView(requestedView, requestedMetric, requestedRange);

  if (detailView) {
    goalDetailEyebrow.textContent = detailView.eyebrow;
    goalDetailTitle.textContent = detailView.title;
    goalDetailSummary.textContent = detailView.summary;
    goalDetailStatus.textContent = detailView.statusText;
    goalDetailStatus.className = `status-pill ${detailView.statusTone}`;
    goalDetailStart.textContent = detailView.start;
    goalDetailTarget.textContent = detailView.target;
    goalDetailProgressValue.textContent = detailView.progressValue;
    goalDetailProgressBar.style.width = detailView.progressValue;
    goalDetailTaskList.innerHTML = renderGoalDetailItems(detailView.tasks);
    goalDetailTimeline.innerHTML = renderGoalTimeline(detailView.timeline);
    goalDetailTimelineLabel.textContent = detailView.timelineLabel;
    document.title = `TIMENEST ${detailView.eyebrow}`;
  }
}

const goalEditorTitle = document.getElementById("goal-editor-title");
const goalEditorEyebrow = document.getElementById("goal-editor-eyebrow");
const goalEditorTypeLabel = document.getElementById("goal-editor-type-label");
const goalEditorTypeInput = document.getElementById("goal-editor-type-input");

if (goalEditorTitle && goalEditorEyebrow && goalEditorTypeLabel && goalEditorTypeInput) {
  const goalType = new URLSearchParams(window.location.search).get("goalType");
  const goalTypeConfig = {
    "short-term": {
      eyebrow: "Short-Term Goal",
      title: "Create or update a short-term goal",
      label: "Goal Type",
      value: "Short-Term Goal",
      placeholder: "Short-Term Goal"
    },
    "long-term": {
      eyebrow: "Long-Term Goal",
      title: "Create or update a long-term goal",
      label: "Goal Type",
      value: "Long-Term Goal",
      placeholder: "Long-Term Goal"
    }
  };

  const selectedGoalType = goalTypeConfig[goalType];
  if (selectedGoalType) {
    goalEditorEyebrow.textContent = selectedGoalType.eyebrow;
    goalEditorTitle.textContent = selectedGoalType.title;
    goalEditorTypeLabel.textContent = selectedGoalType.label;
    goalEditorTypeInput.value = selectedGoalType.value;
    goalEditorTypeInput.placeholder = selectedGoalType.placeholder;
    document.title = `TIMENEST ${selectedGoalType.eyebrow}`;
  }
}

const goalViewRadios = document.querySelectorAll('input[name="goal-view"]');
const goalRangeRadios = document.querySelectorAll('input[name="goal-range"]');
const goalDashboardPanels = document.querySelectorAll("[data-goal-view]");
const goalNavLinks = document.querySelectorAll("[data-goal-nav]");
const goalMetricGroups = document.querySelectorAll("[data-goal-metrics]");
const goalAddButton = document.querySelector("[data-goal-add-button]");
const goalViewOptions = document.querySelectorAll(".goal-view-option");
const goalRangeOptions = document.querySelectorAll(".goal-range-option");

const goalMetricData = buildGoalMetricData();

// Goal dashboard copy. Portfolio and timeline arrays are intentionally
// empty — real entries are rendered from the user's own goals by
// store-ui.js. The empty-state markup below is shown while the user has
// not created any goals yet.
const goalDashboardContent = {
  short: {
    all: {
      heroTitle: "Short-term goals",
      healthLabel: "Sprint Health",
      healthValue: "—",
      healthCopy: "Create a short-term goal to start tracking sprint momentum here.",
      timelineLabel: "Sprint Milestones",
      portfolio: [],
      timeline: []
    },
    month: {
      heroTitle: "Short-term goals this month",
      healthLabel: "Monthly Health",
      healthValue: "—",
      healthCopy: "Create a short-term goal to see this month's health and focus here.",
      timelineLabel: "This Month",
      portfolio: [],
      timeline: []
    }
  },
  long: {
    all: {
      heroTitle: "Long-term goals",
      healthLabel: "Annual Health",
      healthValue: "—",
      healthCopy: "Create a long-term goal to start tracking annual progress here.",
      timelineLabel: "Quarter Milestones",
      portfolio: [],
      timeline: []
    },
    month: {
      heroTitle: "Long-term goals this month",
      healthLabel: "Monthly Health",
      healthValue: "—",
      healthCopy: "Create a long-term goal to see this month's roadmap here.",
      timelineLabel: "Monthly Roadmap",
      portfolio: [],
      timeline: []
    }
  }
};

function getSelectedGoalRange() {
  const checkedRange = document.querySelector('input[name="goal-range"]:checked');
  return checkedRange?.value === "month" ? "month" : "all";
}

function renderGoalPortfolioItems(items, view, range) {
  if (!Array.isArray(items) || items.length === 0) {
    const label = view === "long" ? "long-term" : "short-term";
    const href = `./goal-editor.html?goalType=${label}`;
    return `
      <div class="surface-item empty-state" style="flex-direction:column;align-items:flex-start;gap:8px;">
        <strong>No ${label} goals yet</strong>
        <small>Create your first ${label} goal to start tracking progress.</small>
        <a class="soft-pill" href="${href}">Add ${label === "long-term" ? "Long-Term" : "Short-Term"} Goal</a>
      </div>
    `;
  }
  return items
    .map(
      (item) => `
        <a class="surface-item" href="./goal-detail.html?view=${view}&metric=active&range=${range}">
          <div>
            <strong>${item.title}</strong>
            <small>${item.meta}</small>
          </div>
          <span class="status-pill ${item.tone}">${item.badge}</span>
        </a>
      `
    )
    .join("");
}

function renderGoalDashboardTimeline(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <div class="timeline-item empty-state">
        <span class="timeline-time">—</span>
        <div><strong>No milestones yet</strong><small>Milestones will appear once you create goals with target dates.</small></div>
      </div>
    `;
  }
  return items
    .map(
      (item) => `
        <div class="timeline-item">
          <span class="timeline-time">${item.label}</span>
          <div><strong>${item.title}</strong><small>${item.copy}</small></div>
        </div>
      `
    )
    .join("");
}

function updateGoalMetrics(view, range) {
  const selectedView = goalMetricData[view] ? view : "short";
  const selectedRange = range === "month" ? "month" : "all";
  const metrics = goalMetricData[selectedView][selectedRange];
  const metricGroup = document.querySelector(`[data-goal-metrics="${selectedView}"]`);

  if (!metricGroup || !metrics) {
    return;
  }

  metricGroup.querySelectorAll("[data-goal-metric-card]").forEach((card, index) => {
    const metric = metrics[index];
    const label = card.querySelector("[data-goal-metric-label]");
    const value = card.querySelector("[data-goal-metric-value]");

    if (!metric || !label || !value) {
      return;
    }

    label.textContent = metric.label;
    value.textContent = metric.value;
    card.dataset.goalMetricKey = metric.key;

    if (card instanceof HTMLAnchorElement) {
      card.href = `./goal-detail.html?view=${selectedView}&metric=${metric.key}&range=${selectedRange}`;
      card.setAttribute("aria-label", `Open ${metric.label} goals drill-down`);
      card.setAttribute("title", `${metric.label} goals`);
    }
  });
}

function updateGoalDashboardContent(view, range) {
  const selectedView = goalDashboardContent[view] ? view : "short";
  const selectedRange = range === "month" ? "month" : "all";
  const panel = document.querySelector(`[data-goal-view="${selectedView}"]`);
  const panelContent = goalDashboardContent[selectedView]?.[selectedRange];

  if (!panel || !panelContent) {
    return;
  }

  const heroTitle = panel.querySelector("[data-goal-hero-title]");
  const healthLabel = panel.querySelector("[data-goal-health-label]");
  const healthValue = panel.querySelector("[data-goal-health-value]");
  const healthCopy = panel.querySelector("[data-goal-health-copy]");
  const portfolioList = panel.querySelector("[data-goal-portfolio-list]");
  const timelineLabel = panel.querySelector("[data-goal-timeline-label]");
  const timelineList = panel.querySelector("[data-goal-timeline-list]");

  if (heroTitle) {
    heroTitle.textContent = panelContent.heroTitle;
  }

  if (healthLabel) {
    healthLabel.textContent = panelContent.healthLabel;
  }

  if (healthValue) {
    healthValue.textContent = panelContent.healthValue;
  }

  if (healthCopy) {
    healthCopy.textContent = panelContent.healthCopy;
  }

  if (portfolioList) {
    portfolioList.innerHTML = renderGoalPortfolioItems(panelContent.portfolio, selectedView, selectedRange);
  }

  if (timelineLabel) {
    timelineLabel.textContent = panelContent.timelineLabel;
  }

  if (timelineList) {
    timelineList.innerHTML = renderGoalDashboardTimeline(panelContent.timeline);
  }
}

function syncGoalAddButton(view) {
  if (!goalAddButton) {
    return;
  }

  const selectedView = view === "long" ? "long" : "short";
  const goalType = selectedView === "long" ? "long-term" : "short-term";
  const goalLabel = selectedView === "long" ? "Add Long-Term Goal" : "Add Short-Term Goal";

  goalAddButton.setAttribute("href", `./goal-editor.html?goalType=${goalType}`);
  goalAddButton.setAttribute("aria-label", goalLabel);
  goalAddButton.setAttribute("title", goalLabel);
}

function applyGoalDashboardView(view, options = {}) {
  const selectedView = goalMetricData[view] ? view : "short";
  const selectedRange = options.range === "month" || options.range === "all"
    ? options.range
    : getSelectedGoalRange();
  const shouldUpdateUrl = options.updateUrl !== false;

  goalViewRadios.forEach((radio) => {
    radio.checked = radio.value === selectedView;
  });

  goalRangeRadios.forEach((radio) => {
    radio.checked = radio.value === selectedRange;
  });

  goalDashboardPanels.forEach((panel) => {
    panel.hidden = panel.dataset.goalView !== selectedView;
  });

  goalNavLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.goalNav === selectedView);
  });

  localStorage.setItem("timenest-goal-view", selectedView);
  updateGoalMetrics(selectedView, selectedRange);
  updateGoalDashboardContent(selectedView, selectedRange);
  syncGoalAddButton(selectedView);
  document.title = selectedView === "long" ? "TIMENEST Goals - Long-Term" : "TIMENEST Goals";

  if (shouldUpdateUrl && window.history && typeof window.history.replaceState === "function") {
    const params = new URLSearchParams(window.location.search);
    params.set("view", selectedView);
    params.set("range", selectedRange);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }
}

if (goalViewRadios.length && goalDashboardPanels.length && goalMetricGroups.length) {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view");
  const requestedRange = params.get("range");
  const storedView = localStorage.getItem("timenest-goal-view");
  const initialView = goalMetricData[requestedView]
    ? requestedView
    : goalMetricData[storedView]
      ? storedView
      : "short";
  const initialRange = requestedRange === "month" ? "month" : "all";

  applyGoalDashboardView(initialView, { range: initialRange, updateUrl: false });

  goalViewRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        applyGoalDashboardView(radio.value, { range: getSelectedGoalRange() });
      }
    });
  });

  goalRangeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        const selectedView = document.querySelector('input[name="goal-view"]:checked')?.value || "short";
        applyGoalDashboardView(selectedView, { range: radio.value });
      }
    });
  });

  goalViewOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const radio = option.querySelector('input[name="goal-view"]');
      if (radio) {
        radio.checked = true;
        applyGoalDashboardView(radio.value, { range: getSelectedGoalRange() });
      }
    });
  });

  goalRangeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const radio = option.querySelector('input[name="goal-range"]');
      const selectedView = document.querySelector('input[name="goal-view"]:checked')?.value || "short";
      if (radio) {
        radio.checked = true;
        applyGoalDashboardView(selectedView, { range: radio.value });
      }
    });
  });
}

const habitCalendarData = {};

function parseHabitMonthParam(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearValue, monthValue] = value.split("-").map(Number);
  if (
    !Number.isInteger(yearValue) ||
    !Number.isInteger(monthValue) ||
    monthValue < 1 ||
    monthValue > 12
  ) {
    return null;
  }

  return new Date(yearValue, monthValue - 1, 1);
}

function slugifyHabitName(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const habitCalendarStorageKey = "timenest-habit-calendar-v1";

function getHabitMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function readHabitCalendarStorage() {
  try {
    const rawValue = window.localStorage.getItem(habitCalendarStorageKey);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch (error) {
    return {};
  }
}

function writeHabitCalendarStorage(value) {
  try {
    window.localStorage.setItem(habitCalendarStorageKey, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures so the calendar remains usable.
  }
}

function getHabitCompletionDays(habitKey, monthKey, fallbackDays) {
  const storedState = readHabitCalendarStorage();
  const storedDays = storedState?.[habitKey]?.[monthKey];
  if (Array.isArray(storedDays)) {
    return storedDays
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day > 0)
      .sort((leftDay, rightDay) => leftDay - rightDay);
  }

  return [...fallbackDays].sort((leftDay, rightDay) => leftDay - rightDay);
}

function saveHabitCompletionDays(habitKey, monthKey, completedDays) {
  const storedState = readHabitCalendarStorage();
  const nextState = {
    ...storedState,
    [habitKey]: {
      ...(storedState[habitKey] || {}),
      [monthKey]: [...completedDays].sort((leftDay, rightDay) => leftDay - rightDay)
    }
  };

  writeHabitCalendarStorage(nextState);
}

function calculateHabitStreak(completedDays, upToDay) {
  let streak = 0;

  for (let day = upToDay; day >= 1; day -= 1) {
    if (!completedDays.has(day)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function calculateHabitReliability(completedDays, upToDay) {
  if (upToDay <= 0) {
    return 0;
  }

  return Math.round((completedDays.size / upToDay) * 100);
}

function getDaysInMonth(yearValue, monthIndex) {
  return new Date(yearValue, monthIndex + 1, 0).getDate();
}

function parseHabitMonthKey(monthKey) {
  const parsedMonth = parseHabitMonthParam(monthKey);
  return parsedMonth || null;
}

function getHabitFallbackDaysForMonth(habitKey, monthKey, referenceDate = new Date()) {
  const habitRecord = habitCalendarData[habitKey];
  if (!habitRecord) {
    return [];
  }

  if (habitRecord.history?.[monthKey]) {
    return habitRecord.history[monthKey];
  }

  const currentMonthKey = getHabitMonthKey(referenceDate.getFullYear(), referenceDate.getMonth());
  return monthKey === currentMonthKey ? habitRecord.completedDays : [];
}

function getHabitTrackedMonthKeys(range = "all", referenceDate = new Date()) {
  const currentMonthKey = getHabitMonthKey(referenceDate.getFullYear(), referenceDate.getMonth());
  if (range === "this-month") {
    return [currentMonthKey];
  }

  const monthKeys = new Set([currentMonthKey]);
  Object.values(habitCalendarData).forEach((habitRecord) => {
    Object.keys(habitRecord.history || {}).forEach((monthKey) => {
      monthKeys.add(monthKey);
    });
  });

  return Array.from(monthKeys).sort();
}

function getHabitCountsForHabit(habitKey, range = "all", referenceDate = new Date()) {
  const trackedMonthKeys = getHabitTrackedMonthKeys(range, referenceDate);
  let completedCount = 0;
  let totalTrackableDays = 0;

  trackedMonthKeys.forEach((monthKey) => {
    const monthDate = parseHabitMonthKey(monthKey);
    if (!monthDate) {
      return;
    }

    const isCurrentMonth =
      monthDate.getFullYear() === referenceDate.getFullYear() &&
      monthDate.getMonth() === referenceDate.getMonth();
    const dayLimit = isCurrentMonth
      ? referenceDate.getDate()
      : getDaysInMonth(monthDate.getFullYear(), monthDate.getMonth());
    const fallbackDays = getHabitFallbackDaysForMonth(habitKey, monthKey, referenceDate);
    const completedDays = getHabitCompletionDays(habitKey, monthKey, fallbackDays).filter(
      (day) => day <= dayLimit
    );

    completedCount += completedDays.length;
    totalTrackableDays += dayLimit;
  });

  return {
    completed: completedCount,
    skipped: Math.max(totalTrackableDays - completedCount, 0),
    total: totalTrackableDays
  };
}

function getHabitAggregateCounts(range = "all", referenceDate = new Date()) {
  return Object.keys(habitCalendarData).reduce(
    (totals, habitKey) => {
      const nextCounts = getHabitCountsForHabit(habitKey, range, referenceDate);
      return {
        completed: totals.completed + nextCounts.completed,
        skipped: totals.skipped + nextCounts.skipped,
        total: totals.total + nextCounts.total
      };
    },
    { completed: 0, skipped: 0, total: 0 }
  );
}

const habitCalendarGrid = document.getElementById("habit-calendar-grid");
const habitCalendarTitle = document.getElementById("habit-calendar-title");
const habitCalendarSummary = document.getElementById("habit-calendar-summary");
const habitCalendarStreak = document.getElementById("habit-calendar-streak");
const habitCalendarSideCopy = document.getElementById("habit-calendar-side-copy");
const habitCalendarMonthLabel = document.getElementById("habit-calendar-month-label");
const habitCalendarMonthInput = document.getElementById("habit-calendar-month-input");
const habitCalendarPrevMonth = document.getElementById("habit-month-prev");
const habitCalendarNextMonth = document.getElementById("habit-month-next");
const habitCompletedCount = document.getElementById("habit-completed-count");
const habitMissedCount = document.getElementById("habit-missed-count");
const habitFutureCount = document.getElementById("habit-future-count");
const habitSelectors = document.querySelectorAll(".habit-selector");

if (
  habitCalendarGrid &&
  habitCalendarTitle &&
  habitCalendarSummary &&
  habitCalendarStreak &&
  habitCalendarSideCopy &&
  habitCalendarMonthLabel &&
  habitCalendarMonthInput &&
  habitCalendarPrevMonth &&
  habitCalendarNextMonth &&
  habitCompletedCount &&
  habitMissedCount &&
  habitFutureCount &&
  Object.keys(habitCalendarData).length
) {
  const params = new URLSearchParams(window.location.search);
  const requestedHabit = slugifyHabitName(params.get("habit"));
  const activeHabitKey = habitCalendarData[requestedHabit]
    ? requestedHabit
    : Object.keys(habitCalendarData)[0];
  const activeHabit = habitCalendarData[activeHabitKey];
  const today = new Date();
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const requestedMonthDate = parseHabitMonthParam(params.get("month"));
  const minMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 11, 1);
  let selectedMonthDate =
    requestedMonthDate && requestedMonthDate <= currentMonthDate
      ? requestedMonthDate
      : currentMonthDate;
  if (selectedMonthDate < minMonthDate) {
    selectedMonthDate = minMonthDate;
  }
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let activeMonthKey = "";
  let activeEditableDayLimit = 0;
  let activeDaysInMonth = 0;
  let activeViewYear = currentMonthDate.getFullYear();
  let activeViewMonth = currentMonthDate.getMonth();
  let completedDays = new Set();

  habitCalendarTitle.textContent = `${activeHabit.name} calendar`;
  habitCalendarSummary.textContent = activeHabit.summary;

  function updateHabitCalendarQuery() {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("habit", activeHabit.name);
    nextUrl.searchParams.set("month", activeMonthKey);
    window.history.replaceState({}, "", nextUrl);
  }

  function getDefaultHabitDaysForMonth(monthKey) {
    if (activeHabit.history?.[monthKey]) {
      return activeHabit.history[monthKey];
    }

    return monthKey === getHabitMonthKey(today.getFullYear(), today.getMonth())
      ? activeHabit.completedDays
      : [];
  }

  function syncHabitMonthControls() {
    habitCalendarMonthInput.value = activeMonthKey;
    habitCalendarMonthInput.max = getHabitMonthKey(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth()
    );
    habitCalendarMonthInput.min = getHabitMonthKey(
      minMonthDate.getFullYear(),
      minMonthDate.getMonth()
    );
    habitCalendarPrevMonth.disabled =
      activeViewYear === minMonthDate.getFullYear() &&
      activeViewMonth === minMonthDate.getMonth();
    habitCalendarNextMonth.disabled =
      activeViewYear === currentMonthDate.getFullYear() &&
      activeViewMonth === currentMonthDate.getMonth();
  }

  function syncHabitSelectorLinks() {
    habitSelectors.forEach((selector) => {
      const selectorUrl = new URL(selector.href, window.location.href);
      const selectorHabit = selectorUrl.searchParams.get("habit") || selector.textContent?.trim() || "";
      selectorUrl.searchParams.set("habit", selectorHabit);
      selectorUrl.searchParams.set("month", activeMonthKey);
      selector.href = selectorUrl.toString();
      selector.classList.toggle(
        "is-active",
        slugifyHabitName(selectorHabit) === activeHabitKey
      );
    });
  }

  function updateHabitOverview() {
    const completedCount = completedDays.size;
    const missedCount = Math.max(activeEditableDayLimit - completedCount, 0);
    const futureCount = Math.max(activeDaysInMonth - activeEditableDayLimit, 0);
    const streak = calculateHabitStreak(completedDays, activeEditableDayLimit);
    const reliability = calculateHabitReliability(completedDays, activeEditableDayLimit);
    const isCurrentMonthView =
      activeViewYear === today.getFullYear() && activeViewMonth === today.getMonth();
    habitCalendarStreak.textContent = `${streak} Days`;
    habitCalendarSideCopy.textContent = `${reliability}% completion reliability for ${habitCalendarMonthLabel.textContent}. ${isCurrentMonthView ? "Tap today or any earlier day" : "Tap any day"} to update the record.`;
    habitCompletedCount.textContent = String(completedCount).padStart(2, "0");
    habitMissedCount.textContent = String(missedCount).padStart(2, "0");
    habitFutureCount.textContent = String(futureCount).padStart(2, "0");
  }

  function renderHabitCalendar() {
    activeViewYear = selectedMonthDate.getFullYear();
    activeViewMonth = selectedMonthDate.getMonth();
    activeMonthKey = getHabitMonthKey(activeViewYear, activeViewMonth);
    const monthLabel = selectedMonthDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });
    const firstDay = new Date(activeViewYear, activeViewMonth, 1).getDay();
    activeDaysInMonth = new Date(activeViewYear, activeViewMonth + 1, 0).getDate();
    const isCurrentMonthView =
      activeViewYear === today.getFullYear() && activeViewMonth === today.getMonth();
    activeEditableDayLimit = isCurrentMonthView ? today.getDate() : activeDaysInMonth;
    const fallbackCompletedDays = getDefaultHabitDaysForMonth(activeMonthKey);
    completedDays = new Set(
      getHabitCompletionDays(activeHabitKey, activeMonthKey, fallbackCompletedDays).filter(
        (day) => day <= activeEditableDayLimit
      )
    );

    habitCalendarMonthLabel.textContent = monthLabel;
    syncHabitMonthControls();
    updateHabitCalendarQuery();
    syncHabitSelectorLinks();
    habitCalendarGrid.innerHTML = "";

    weekdayLabels.forEach((label) => {
      const weekday = document.createElement("div");
      weekday.className = "habit-weekday";
      weekday.textContent = label;
      habitCalendarGrid.appendChild(weekday);
    });

    for (let index = 0; index < firstDay; index += 1) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "habit-day-cell is-empty";
      habitCalendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= activeDaysInMonth; day += 1) {
      const currentDate = new Date(activeViewYear, activeViewMonth, day);
      const isFuture = day > activeEditableDayLimit;
      const isComplete = !isFuture && completedDays.has(day);
      const cell = document.createElement("button");
      const cellKey = `${activeViewYear}-${activeViewMonth}-${day}`;
      const dotTone = isFuture ? "future" : isComplete ? "complete" : "missed";
      const stateLabel = isFuture ? "Future" : isComplete ? "Completed" : "Missed";
      const fullDateLabel = currentDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      cell.type = "button";
      cell.className = `habit-day-cell ${isFuture ? "is-future" : ""} ${isComplete ? "is-complete" : ""}`.trim();
      cell.dataset.habitDay = String(day);
      cell.disabled = isFuture;
      cell.setAttribute("aria-pressed", String(isComplete));
      cell.setAttribute(
        "aria-label",
        `${activeHabit.name}, ${fullDateLabel}, ${stateLabel}${isFuture ? "" : ". Tap to toggle completion."}`
      );

      const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      if (cellKey === todayKey) {
        cell.classList.add("is-today");
      }

      cell.innerHTML = `
        <strong class="habit-day-number">${day}</strong>
        <div class="habit-day-meta">
          <span class="habit-status-dot is-${dotTone}" aria-hidden="true"></span>
          <span class="habit-day-state">${stateLabel}</span>
        </div>
      `;

      habitCalendarGrid.appendChild(cell);
    }

    const trailingCellCount = (7 - ((firstDay + activeDaysInMonth) % 7)) % 7;
    for (let index = 0; index < trailingCellCount; index += 1) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "habit-day-cell is-empty";
      habitCalendarGrid.appendChild(emptyCell);
    }

    updateHabitOverview();
  }

  renderHabitCalendar();

  habitCalendarMonthInput.addEventListener("change", () => {
    const nextMonthDate = parseHabitMonthParam(habitCalendarMonthInput.value);
    if (!nextMonthDate || nextMonthDate > currentMonthDate || nextMonthDate < minMonthDate) {
      syncHabitMonthControls();
      return;
    }

    selectedMonthDate = nextMonthDate;
    renderHabitCalendar();
  });

  habitCalendarPrevMonth.addEventListener("click", () => {
    const previousMonth = new Date(activeViewYear, activeViewMonth - 1, 1);
    if (previousMonth < minMonthDate) {
      return;
    }

    selectedMonthDate = previousMonth;
    renderHabitCalendar();
  });

  habitCalendarNextMonth.addEventListener("click", () => {
    const nextMonth = new Date(activeViewYear, activeViewMonth + 1, 1);
    if (nextMonth > currentMonthDate) {
      return;
    }

    selectedMonthDate = nextMonth;
    renderHabitCalendar();
  });

  habitCalendarGrid.addEventListener("click", (event) => {
    const clickedDay = event.target.closest("[data-habit-day]");
    if (!clickedDay || clickedDay.disabled) {
      return;
    }

    const selectedDay = Number(clickedDay.dataset.habitDay);
    if (!Number.isInteger(selectedDay) || selectedDay > activeEditableDayLimit) {
      return;
    }

    if (completedDays.has(selectedDay)) {
      completedDays.delete(selectedDay);
    } else {
      completedDays.add(selectedDay);
    }

    saveHabitCompletionDays(activeHabitKey, activeMonthKey, completedDays);
    renderHabitCalendar();
  });
}

const habitsOverviewTitle = document.getElementById("habits-overview-title");
const habitsOverviewSummary = document.getElementById("habits-overview-summary");
const habitsOverviewLabel = document.getElementById("habits-overview-label");
const habitsOverviewValue = document.getElementById("habits-overview-value");
const habitsOverviewCopy = document.getElementById("habits-overview-copy");
const habitOverviewCards = document.querySelectorAll("[data-habit-overview-card]");

function hydrateHabitsOverviewFromParams() {
  if (
    !habitsOverviewTitle ||
    !habitsOverviewSummary ||
    !habitsOverviewLabel ||
    !habitsOverviewValue ||
    !habitsOverviewCopy ||
    !habitOverviewCards.length
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedStatus = params.get("status");
  const requestedRange = params.get("range") === "this-month" ? "this-month" : "all";

  if (!["completed", "skipped"].includes(requestedStatus || "")) {
    return;
  }

  const aggregateCounts = getHabitAggregateCounts(requestedRange);
  const displayCount = aggregateCounts[requestedStatus];
  const rangeLabel = requestedRange === "this-month" ? "this month" : "all tracked history";
  const statusLabel = requestedStatus === "completed" ? "Completed" : "Skipped";

  habitsOverviewTitle.textContent =
    requestedStatus === "completed"
      ? "Habit check-ins completed across your routines"
      : "Habit check-ins skipped across your routines";
  habitsOverviewSummary.textContent =
    requestedStatus === "completed"
      ? `These totals come from the same habit history used by the calendar view for ${rangeLabel}.`
      : `These skipped totals are derived from the same tracked habit history for ${rangeLabel}.`;
  habitsOverviewLabel.textContent = `${statusLabel} Count`;
  habitsOverviewValue.textContent = String(displayCount).padStart(2, "0");
  habitsOverviewCopy.textContent =
    requestedStatus === "completed"
      ? `${displayCount} habit check-ins were completed across ${rangeLabel}.`
      : `${displayCount} habit check-ins were skipped across ${rangeLabel}.`;

  habitOverviewCards.forEach((card) => {
    const habitKey = card.dataset.habitOverviewCard || "";
    const countSummary = getHabitCountsForHabit(habitKey, requestedRange);
    const nextCount = countSummary[requestedStatus];
    const copyElement = card.querySelector("[data-habit-overview-copy]");
    const progressElement = card.querySelector("[data-habit-overview-progress]");
    const percent = countSummary.total
      ? Math.round((nextCount / countSummary.total) * 100)
      : 0;

    if (copyElement) {
      copyElement.textContent =
        requestedStatus === "completed"
          ? `${nextCount} completed days in ${rangeLabel}.`
          : `${nextCount} skipped days in ${rangeLabel}.`;
    }

    if (progressElement) {
      progressElement.style.width = `${Math.max(0, Math.min(percent, 100))}%`;
    }

    const nextUrl = new URL(card.getAttribute("href") || "./calendar.html", window.location.href);
    nextUrl.searchParams.set("habit", habitCalendarData[habitKey]?.name || "");
    nextUrl.searchParams.set("range", requestedRange);
    card.setAttribute("href", nextUrl.toString());
  });
}

hydrateHabitsOverviewFromParams();

const taskBoard = document.querySelector("[data-task-board]");
const taskBoardEmptyState = document.querySelector("[data-task-empty]");
const taskMetricButtons = Array.from(document.querySelectorAll("[data-task-filter]"));
const taskViewDueSelect = document.querySelector('[data-task-view-select="due"]');
const taskViewStatusSelect = document.querySelector('[data-task-view-select="status"]');
const taskViewCadenceSelect = document.querySelector('[data-task-view-select="cadence"]');
const taskViewReset = document.querySelector("[data-task-filter-reset]");
const taskEmptyTitle = document.querySelector("[data-task-empty-title]");
const taskEmptyCopy = document.querySelector("[data-task-empty-copy]");
const taskDrilldownSummary = document.querySelector("[data-task-drilldown-summary]");
const defaultTaskEmptyTitle = taskEmptyTitle?.textContent || "No tasks left on this screen";
const defaultTaskEmptyCopy =
  taskEmptyCopy?.textContent || "Use Add Task or Add Subtask to create a new item.";
let activeTaskMetricFilter = "";
let activeTaskDashboardStatus = "";
let activeTaskDashboardRange = "all";

const taskDashboardRecords = [
  {
    id: "roadmap",
    due: ["due-today", "this-week", "this-month", "this-year"],
    cadence: "weekly",
    isComplete: false
  },
  {
    id: "marathi-lesson",
    due: ["due-today", "this-week", "this-month", "this-year"],
    cadence: "daily",
    isComplete: false
  },
  {
    id: "monthly-budget",
    due: ["this-year"],
    cadence: "monthly",
    isComplete: false
  },
  {
    id: "workout",
    due: ["this-year"],
    cadence: "daily",
    isComplete: true
  },
  {
    id: "hosting-renewal",
    due: ["overdue", "this-week", "this-month", "this-year"],
    cadence: "yearly",
    isComplete: false
  }
];

function getTaskItems() {
  if (!taskBoard) {
    return [];
  }

  return Array.from(taskBoard.querySelectorAll("[data-task-item]"));
}

function getTaskMetricLabel(filter) {
  const matchingButton = taskMetricButtons.find(
    (button) => button.dataset.taskFilter === filter
  );
  return matchingButton?.querySelector(".mini-label")?.textContent?.trim() || "All Tasks";
}

function getTaskSelectLabel(select, fallbackLabel) {
  return select?.selectedOptions?.[0]?.textContent?.trim() || fallbackLabel;
}

function getTaskSelectValue(select, fallbackValue) {
  return select?.value || fallbackValue;
}

function getTaskDueBuckets(taskItem) {
  return (taskItem?.dataset.taskDue || "").split(/\s+/).filter(Boolean);
}

function getTaskCadence(taskItem) {
  return taskItem?.dataset.taskCadence || "";
}

function isTaskComplete(taskItem) {
  return taskItem?.classList.contains("is-complete");
}

function getTaskNormalizedStatus(taskItem) {
  if (isTaskComplete(taskItem)) {
    return "completed";
  }

  if (getTaskDueBuckets(taskItem).includes("overdue")) {
    return "delayed";
  }

  return "open";
}

function setTaskSelectValue(select, value) {
  if (select) {
    select.value = value;
  }
}

function resetTaskViewInputs() {
  setTaskSelectValue(taskViewDueSelect, "this-week");
  setTaskSelectValue(taskViewStatusSelect, "open");
  setTaskSelectValue(taskViewCadenceSelect, "all");
}

function sortTaskItemsByDueDate() {
  if (!taskBoard) {
    return;
  }

  const sortedItems = getTaskItems().sort((leftTask, rightTask) => {
    const leftSortKey = Number(leftTask.dataset.sortKey || Number.MAX_SAFE_INTEGER);
    const rightSortKey = Number(rightTask.dataset.sortKey || Number.MAX_SAFE_INTEGER);
    return leftSortKey - rightSortKey;
  });

  sortedItems.forEach((taskItem) => {
    taskBoard.appendChild(taskItem);
  });
}

function taskMatchesMetricFilter(taskItem, filter) {
  if (!taskItem || !filter) {
    return true;
  }

  if (filter === "due-today") {
    return getTaskDueBuckets(taskItem).includes("due-today");
  }

  if (filter === "completed") {
    return isTaskComplete(taskItem);
  }

  if (filter === "recurring") {
    return Boolean(getTaskCadence(taskItem));
  }

  if (filter === "overdue") {
    return getTaskDueBuckets(taskItem).includes("overdue") && !isTaskComplete(taskItem);
  }

  const taskGroups = (taskItem.dataset.taskGroups || "").split(/\s+/).filter(Boolean);
  return taskGroups.includes(filter);
}

function taskMatchesViewFilters(taskItem) {
  if (!taskItem) {
    return false;
  }

  const dueValue = getTaskSelectValue(taskViewDueSelect, "this-week");
  const statusValue = getTaskSelectValue(taskViewStatusSelect, "open");
  const cadenceValue = getTaskSelectValue(taskViewCadenceSelect, "all");
  const taskDueBuckets = getTaskDueBuckets(taskItem);
  const taskCadence = getTaskCadence(taskItem);

  if (dueValue !== "view-all" && !taskDueBuckets.includes(dueValue)) {
    return false;
  }

  if (statusValue === "open" && isTaskComplete(taskItem)) {
    return false;
  }

  if (statusValue === "completed" && !isTaskComplete(taskItem)) {
    return false;
  }

  if (cadenceValue !== "all" && taskCadence !== cadenceValue) {
    return false;
  }

  return true;
}

function taskMatchesDashboardDrilldown(taskItem) {
  if (!taskItem || !activeTaskDashboardStatus) {
    return true;
  }

  if (getTaskNormalizedStatus(taskItem) !== activeTaskDashboardStatus) {
    return false;
  }

  if (activeTaskDashboardRange === "this-month") {
    return getTaskDueBuckets(taskItem).includes("this-month");
  }

  return true;
}

function updateTaskSummaryCounts() {
  const taskItems = getTaskItems();
  if (!taskMetricButtons.length) {
    return;
  }

  taskMetricButtons.forEach((button) => {
    const filter = button.dataset.taskFilter || "";
    const countElement = button.querySelector("[data-task-count]");
    if (!countElement) {
      return;
    }

    const matchingCount = taskItems.filter((taskItem) => taskMatchesMetricFilter(taskItem, filter)).length;
    countElement.textContent = String(matchingCount).padStart(2, "0");
  });
}

function syncSubtaskEmptyState(taskItem) {
  if (!taskItem) {
    return;
  }

  const subtaskRows = taskItem.querySelectorAll("[data-subtask-item]");
  const subtaskEmptyState = taskItem.querySelector("[data-subtask-empty]");

  if (subtaskEmptyState) {
    subtaskEmptyState.hidden = subtaskRows.length !== 0;
  }
}

function updateTaskFilterState() {
  const dueLabel = getTaskSelectLabel(taskViewDueSelect, "This Week");
  const statusLabel = getTaskSelectLabel(taskViewStatusSelect, "Open");
  const cadenceLabel = getTaskSelectValue(taskViewCadenceSelect, "all") === "all"
    ? "all cadences"
    : getTaskSelectLabel(taskViewCadenceSelect, "selected cadence").toLowerCase();
}

function syncTaskBoardEmptyState() {
  if (!taskBoard || !taskBoardEmptyState) {
    return;
  }

  const visibleTaskCount = getTaskItems().filter((taskItem) => !taskItem.hidden).length;
  taskBoardEmptyState.hidden = visibleTaskCount !== 0;

  if (!taskEmptyTitle || !taskEmptyCopy) {
    return;
  }

  if (!visibleTaskCount) {
    const dueLabel = getTaskSelectLabel(taskViewDueSelect, "This Week");
    const statusLabel = getTaskSelectLabel(taskViewStatusSelect, "Open").toLowerCase();
    const presetLabel = activeTaskMetricFilter ? `${getTaskMetricLabel(activeTaskMetricFilter).toLowerCase()} preset` : "current filters";
    taskEmptyTitle.textContent = "No tasks match this view";
    taskEmptyCopy.textContent = `Try a different due window, status, or cadence selection. Current view: ${presetLabel}, ${dueLabel.toLowerCase()}, ${statusLabel}.`;
    return;
  }

  taskEmptyTitle.textContent = defaultTaskEmptyTitle;
  taskEmptyCopy.textContent = defaultTaskEmptyCopy;
}

function updateTaskDrilldownSummary() {
  if (!taskDrilldownSummary) {
    return;
  }

  if (!activeTaskDashboardStatus) {
    taskDrilldownSummary.hidden = true;
    taskDrilldownSummary.textContent = "";
    return;
  }

  const visibleCount = getTaskItems().filter((taskItem) => !taskItem.hidden).length;
  const statusLabelMap = {
    open: "open",
    completed: "completed",
    delayed: "delayed"
  };
  const rangeLabel =
    activeTaskDashboardRange === "this-month" ? "this month" : "across all tracked tasks";

  taskDrilldownSummary.hidden = false;
  taskDrilldownSummary.textContent = `${visibleCount} ${statusLabelMap[activeTaskDashboardStatus]} task${visibleCount === 1 ? "" : "s"} ${rangeLabel}`;
}

function applyTaskBoardFilter(filter = activeTaskMetricFilter) {
  activeTaskMetricFilter = filter || "";
  sortTaskItemsByDueDate();

  getTaskItems().forEach((taskItem) => {
    const isVisible =
      taskMatchesViewFilters(taskItem) &&
      taskMatchesMetricFilter(taskItem, activeTaskMetricFilter) &&
      taskMatchesDashboardDrilldown(taskItem);
    taskItem.hidden = !isVisible;
  });

  taskMetricButtons.forEach((button) => {
    const isActive = button.dataset.taskFilter === activeTaskMetricFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateTaskSummaryCounts();
  updateTaskFilterState();
  syncTaskBoardEmptyState();
  updateTaskDrilldownSummary();
}

function handleTaskViewInputChange() {
  activeTaskDashboardStatus = "";
  activeTaskDashboardRange = "all";
  activeTaskMetricFilter = "";
  applyTaskBoardFilter();
}

function applyTaskMetricPreset(filter) {
  activeTaskDashboardStatus = "";
  activeTaskDashboardRange = "all";

  if (!filter) {
    activeTaskMetricFilter = "";
    applyTaskBoardFilter();
    return;
  }

  if (activeTaskMetricFilter === filter) {
    activeTaskMetricFilter = "";
    resetTaskViewInputs();
    applyTaskBoardFilter();
    return;
  }

  resetTaskViewInputs();

  if (filter === "due-today") {
    setTaskSelectValue(taskViewDueSelect, "due-today");
    setTaskSelectValue(taskViewStatusSelect, "all");
  }

  if (filter === "completed") {
    setTaskSelectValue(taskViewDueSelect, "view-all");
    setTaskSelectValue(taskViewStatusSelect, "completed");
  }

  if (filter === "recurring") {
    setTaskSelectValue(taskViewDueSelect, "view-all");
    setTaskSelectValue(taskViewStatusSelect, "all");
    setTaskSelectValue(taskViewCadenceSelect, "all");
  }

  if (filter === "overdue") {
    setTaskSelectValue(taskViewDueSelect, "view-all");
    setTaskSelectValue(taskViewStatusSelect, "open");
  }

  activeTaskMetricFilter = filter;
  applyTaskBoardFilter(activeTaskMetricFilter);
}

function applyTaskDashboardQueryParams() {
  if (!taskBoard) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedStatus = params.get("status");
  const requestedRange = params.get("range") === "this-month" ? "this-month" : "all";

  if (!["open", "completed", "delayed"].includes(requestedStatus || "")) {
    return;
  }

  activeTaskDashboardStatus = requestedStatus;
  activeTaskDashboardRange = requestedRange;
  activeTaskMetricFilter = requestedStatus === "delayed" ? "overdue" : "";

  if (requestedRange === "this-month") {
    setTaskSelectValue(taskViewDueSelect, "this-month");
  } else {
    setTaskSelectValue(taskViewDueSelect, "view-all");
  }

  if (requestedStatus === "completed") {
    setTaskSelectValue(taskViewStatusSelect, "completed");
  } else {
    setTaskSelectValue(taskViewStatusSelect, "all");
  }

  setTaskSelectValue(taskViewCadenceSelect, "all");
}

function setTaskCompletionState(taskItem, isComplete) {
  if (!taskItem) {
    return;
  }

  const completeButton = taskItem.querySelector(".task-card-actions [data-complete-toggle]");
  const completeText = taskItem.querySelector(".task-card-actions [data-complete-text]");
  const statusPill = taskItem.querySelector("[data-status-pill]");
  const pendingLabel = taskItem.dataset.pendingLabel || "Pending";
  const completeLabel = taskItem.dataset.completeLabel || "Completed";
  const pendingTone = taskItem.dataset.pendingTone || "warn";

  taskItem.classList.toggle("is-complete", isComplete);

  if (completeButton) {
    completeButton.setAttribute("aria-pressed", String(isComplete));
  }

  if (completeText) {
    completeText.textContent = isComplete ? completeLabel : "Done";
  }

  if (statusPill) {
    statusPill.textContent = isComplete ? completeLabel : pendingLabel;
    statusPill.className = `status-pill ${isComplete ? "good" : pendingTone}`;
  }
}

function setSubtaskCompletionState(subtaskItem, isComplete) {
  if (!subtaskItem) {
    return;
  }

  const completeButton = subtaskItem.querySelector("[data-complete-toggle]");
  const completeText = subtaskItem.querySelector("[data-complete-text]");
  const stateLabel = subtaskItem.querySelector("[data-state-label]");
  const pendingLabel = subtaskItem.dataset.pendingLabel || "Pending";
  const completeLabel = subtaskItem.dataset.completeLabel || "Completed";

  subtaskItem.classList.toggle("is-complete", isComplete);

  if (completeButton) {
    completeButton.setAttribute("aria-pressed", String(isComplete));
  }

  if (completeText) {
    completeText.textContent = isComplete ? completeLabel : "Done";
  }

  if (stateLabel) {
    stateLabel.textContent = isComplete ? completeLabel : pendingLabel;
  }
}

if (taskBoard) {
  getTaskItems().forEach((taskItem) => {
    syncSubtaskEmptyState(taskItem);
    setTaskCompletionState(taskItem, taskItem.classList.contains("is-complete"));

    taskItem.querySelectorAll("[data-subtask-item]").forEach((subtaskItem) => {
      setSubtaskCompletionState(subtaskItem, subtaskItem.classList.contains("is-complete"));
    });
  });

  [taskViewDueSelect, taskViewStatusSelect, taskViewCadenceSelect].forEach((select) => {
    select?.addEventListener("change", handleTaskViewInputChange);
  });

  taskMetricButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.taskFilter || "";
      applyTaskMetricPreset(selectedFilter);
    });
  });

  if (taskViewReset) {
    taskViewReset.addEventListener("click", () => {
      activeTaskDashboardStatus = "";
      activeTaskDashboardRange = "all";
      activeTaskMetricFilter = "";
      resetTaskViewInputs();
      applyTaskBoardFilter();
    });
  }

  applyTaskDashboardQueryParams();
  applyTaskBoardFilter();

  taskBoard.addEventListener("click", (event) => {
    const clickedDelete = event.target.closest("[data-delete-item]");
    if (clickedDelete) {
      const itemKind = clickedDelete.dataset.deleteItem || "item";
      const itemLabel = clickedDelete.dataset.deleteLabel || itemKind;
      const confirmed = window.confirm(`Delete this ${itemKind}: ${itemLabel}?`);

      if (!confirmed) {
        return;
      }

      if (itemKind === "subtask") {
        const subtaskItem = clickedDelete.closest("[data-subtask-item]");
        const parentTask = clickedDelete.closest("[data-task-item]");

        if (subtaskItem) {
          subtaskItem.remove();
          syncSubtaskEmptyState(parentTask);
          applyTaskBoardFilter(activeTaskMetricFilter);
        }

        return;
      }

      const taskItem = clickedDelete.closest("[data-task-item]");
      if (taskItem) {
        taskItem.remove();
        applyTaskBoardFilter(activeTaskMetricFilter);
      }

      return;
    }

    const clickedComplete = event.target.closest("[data-complete-toggle]");
    if (!clickedComplete) {
      return;
    }

    const subtaskItem = clickedComplete.closest("[data-subtask-item]");
    if (subtaskItem) {
      setSubtaskCompletionState(
        subtaskItem,
        clickedComplete.getAttribute("aria-pressed") !== "true"
      );
      applyTaskBoardFilter(activeTaskMetricFilter);
      return;
    }

    const taskItem = clickedComplete.closest("[data-task-item]");
    if (taskItem) {
      setTaskCompletionState(taskItem, clickedComplete.getAttribute("aria-pressed") !== "true");
      applyTaskBoardFilter(activeTaskMetricFilter);
    }
  });
}

const dashboardRangeRadios = document.querySelectorAll('input[name="dashboard-range"]');
const dashboardStatusCards = document.querySelectorAll("[data-dashboard-card]");

function getTaskDashboardStatus(record) {
  if (record.isComplete) {
    return "completed";
  }

  if (record.due.includes("overdue")) {
    return "delayed";
  }

  return "open";
}

function getTaskDashboardStatusCount(status, range) {
  return taskDashboardRecords.filter((record) => {
    if (range === "this-month" && !record.due.includes("this-month")) {
      return false;
    }

    return getTaskDashboardStatus(record) === status;
  }).length;
}

function getGoalDashboardStatusCount(view, status, range) {
  const metricKey = status === "open" ? "active" : status;
  return getGoalDetailView(view, metricKey, range)?.tasks?.length || 0;
}

function formatDashboardCount(value) {
  return String(value).padStart(2, "0");
}

function getDashboardStatusCount(entity, status, range) {
  if (entity === "tasks") {
    return getTaskDashboardStatusCount(status, range);
  }

  if (entity === "short-goals") {
    return getGoalDashboardStatusCount("short", status, range === "this-month" ? "month" : "all");
  }

  if (entity === "long-goals") {
    return getGoalDashboardStatusCount("long", status, range === "this-month" ? "month" : "all");
  }

  if (entity === "habits") {
    return getHabitAggregateCounts(range)[status] || 0;
  }

  return 0;
}

function buildDashboardDrilldownHref(entity, status, range) {
  if (entity === "tasks") {
    return `./daily-tasks.html?status=${status}&range=${range}`;
  }

  if (entity === "short-goals") {
    const goalRange = range === "this-month" ? "month" : "all";
    return `./goals.html?view=short&status=${status}&range=${goalRange}`;
  }

  if (entity === "long-goals") {
    const goalRange = range === "this-month" ? "month" : "all";
    return `./goals.html?view=long&status=${status}&range=${goalRange}`;
  }

  if (entity === "habits") {
    return `./habits.html?status=${status}&range=${range}`;
  }

  return "./index.html";
}

function updateDashboardStatusBoard(range = "all") {
  if (!dashboardStatusCards.length) {
    return;
  }

  dashboardStatusCards.forEach((card) => {
    const entity = card.dataset.dashboardEntity || "";
    const status = card.dataset.dashboardStatus || "";
    const countElement = card.querySelector("[data-dashboard-count]");

    if (countElement) {
      countElement.textContent = formatDashboardCount(
        getDashboardStatusCount(entity, status, range)
      );
    }

    if (card instanceof HTMLAnchorElement) {
      card.href = buildDashboardDrilldownHref(entity, status, range);
    }
  });
}

if (dashboardRangeRadios.length && dashboardStatusCards.length) {
  const dashboardRangeStorageKey = "timenest-dashboard-range";
  const storedRange = localStorage.getItem(dashboardRangeStorageKey);
  const initialRange = storedRange === "this-month" ? "this-month" : "all";

  dashboardRangeRadios.forEach((radio) => {
    radio.checked = radio.value === initialRange;
  });

  updateDashboardStatusBoard(initialRange);

  dashboardRangeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) {
        return;
      }

      localStorage.setItem(dashboardRangeStorageKey, radio.value);
      updateDashboardStatusBoard(radio.value);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   WIRING MODULE — Toast, CRUD, Forms, Channels, Settings
   All editor buttons, auth flows, notification toggles,
   settings cards, and profile preferences.
   ═══════════════════════════════════════════════════════════════ */

// ──────────── Toast Notification System ────────────
(function initToastSystem() {
  let toastContainer = document.getElementById("timenest-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "timenest-toast-container";
    toastContainer.className = "timenest-toast-container";
    document.body.appendChild(toastContainer);
  }

  window.showToast = function showToast(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = "timenest-toast timenest-toast-" + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };
})();

// ──────────── localStorage Data Store ────────────
const STORE_KEYS = {
  goals: "timenest-goals-v1",
  tasks: "timenest-tasks-v1",
  habits: "timenest-habits-v1",
  subtasks: "timenest-subtasks-v1",
  channels: "timenest-channels-v1",
  preferences: "timenest-preferences-v1",
  settings: "timenest-settings-v1",
};

const USER_SCOPE_STORAGE_KEY = "timenest-user-scope";

function getStoreScope() {
  return localStorage.getItem(USER_SCOPE_STORAGE_KEY) || "guest";
}

function getScopedStorageKey(key) {
  return `${key}::${getStoreScope()}`;
}

function readStoredJson(key) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (_) {
    return null;
  }
}

function readStore(key) {
  const scopedValue = readStoredJson(getScopedStorageKey(key));
  if (Array.isArray(scopedValue)) {
    return scopedValue;
  }

  const legacyValue = readStoredJson(key);
  return Array.isArray(legacyValue) ? legacyValue : [];
}

function writeStore(key, data) {
  localStorage.setItem(getScopedStorageKey(key), JSON.stringify(data));
}

function readStoreObject(key, fallback) {
  const scopedValue = readStoredJson(getScopedStorageKey(key));
  if (scopedValue && typeof scopedValue === "object" && !Array.isArray(scopedValue)) {
    return scopedValue;
  }

  const legacyValue = readStoredJson(key);
  if (legacyValue && typeof legacyValue === "object" && !Array.isArray(legacyValue)) {
    return legacyValue;
  }

  return fallback;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ──────────── Goal Editor Wiring ────────────
(function initGoalEditor() {
  const nameField = document.getElementById("goal-field-name");
  const typeField = document.getElementById("goal-editor-type-input");
  const startField = document.getElementById("goal-field-start");
  const targetField = document.getElementById("goal-field-target");
  const descField = document.getElementById("goal-field-desc");
  if (!nameField) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  // Load existing goal for editing
  if (editId) {
    const goals = readStore(STORE_KEYS.goals);
    const goal = goals.find((g) => g.id === editId);
    if (goal) {
      nameField.value = goal.name || "";
      typeField.value = goal.type || "";
      startField.value = goal.start || "";
      targetField.value = goal.target || "";
      descField.value = goal.description || "";
      const titleEl = document.getElementById("goal-editor-title");
      if (titleEl) titleEl.textContent = "Editing: " + goal.name;
      const eyebrowEl = document.getElementById("goal-editor-eyebrow");
      if (eyebrowEl) eyebrowEl.textContent = "Edit Goal";
    }
  }

  function collectGoalData() {
    return {
      name: nameField.value.trim(),
      type: typeField.value.trim(),
      start: startField.value,
      target: targetField.value,
      description: descField.value.trim(),
    };
  }

  function validateGoal(data) {
    if (!data.name) { showToast("Goal name is required", "error"); return false; }
    if (!data.type) { showToast("Goal type is required", "error"); return false; }
    return true;
  }

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]");
    if (!action) return;
    const act = action.dataset.action;

    if (act === "save-goal") {
      const data = collectGoalData();
      if (!validateGoal(data)) return;
      const goals = readStore(STORE_KEYS.goals);

      if (editId) {
        const idx = goals.findIndex((g) => g.id === editId);
        if (idx !== -1) {
          goals[idx] = { ...goals[idx], ...data, updatedAt: new Date().toISOString() };
          writeStore(STORE_KEYS.goals, goals);
          showToast("Goal updated successfully");
          window.timenestNotify?.confirm("Goal updated", data.name, { goalId: editId, linkUrl: `./goal-detail.html?id=${encodeURIComponent(editId)}` });
        }
      } else {
        const newGoal = { id: generateId(), ...data, status: "active", createdAt: new Date().toISOString() };
        goals.push(newGoal);
        writeStore(STORE_KEYS.goals, goals);
        showToast("Goal saved successfully");
        window.timenestNotify?.confirm("Goal created", data.name, { goalId: newGoal.id, linkUrl: `./goal-detail.html?id=${encodeURIComponent(newGoal.id)}` });
      }
      setTimeout(() => { window.location.href = "./goals.html"; }, 800);
    }

    if (act === "duplicate-goal") {
      const data = collectGoalData();
      if (!data.name) { showToast("Enter a goal name to duplicate", "error"); return; }
      data.name = data.name + " (Copy)";
      const goals = readStore(STORE_KEYS.goals);
      goals.push({ id: generateId(), ...data, status: "active", createdAt: new Date().toISOString() });
      writeStore(STORE_KEYS.goals, goals);
      showToast("Goal duplicated");
      setTimeout(() => { window.location.href = "./goals.html"; }, 800);
    }

    if (act === "delete-goal") {
      if (!editId) { showToast("No saved goal to delete", "warn"); return; }
      if (!confirm("Delete this goal permanently?")) return;
      const goalName = readStore(STORE_KEYS.goals).find((g) => g.id === editId)?.name || "(goal)";
      const goals = readStore(STORE_KEYS.goals).filter((g) => g.id !== editId);
      writeStore(STORE_KEYS.goals, goals);
      showToast("Goal deleted");
      window.timenestNotify?.confirm("Goal deleted", goalName, {});
      setTimeout(() => { window.location.href = "./goals.html"; }, 800);
    }
  });
})();

// ──────────── Task Editor Wiring ────────────
(function initTaskEditor() {
  const nameField = document.getElementById("task-field-name");
  const priorityField = document.getElementById("task-field-priority");
  const dateField = document.getElementById("task-field-date");
  const timeField = document.getElementById("task-field-time");
  const notesField = document.getElementById("task-field-notes");
  if (!nameField) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const queryGoalId = params.get("goalId");
  let linkedGoalId = queryGoalId || "";

  // Load existing task for editing
  if (editId) {
    const tasks = readStore(STORE_KEYS.tasks);
    const task = tasks.find((t) => t.id === editId);
    if (task) {
      linkedGoalId = task.goalId || queryGoalId || "";
      nameField.value = task.name || "";
      priorityField.value = task.priority || "";
      dateField.value = task.date || "";
      timeField.value = task.time || "";
      notesField.value = task.notes || "";
      // Restore frequency checkboxes
      if (task.frequency) {
        const freqChecks = document.querySelectorAll('.compact-check-group:first-of-type .compact-check-chip input');
        freqChecks.forEach((cb) => {
          const label = cb.parentElement.querySelector("span").textContent.trim().toLowerCase();
          cb.checked = task.frequency.includes(label);
        });
      }
      // Restore notification checkboxes
      if (task.notifications) {
        const notifChecks = document.querySelectorAll('[data-notification-group] .compact-check-chip input, .compact-check-group:last-of-type .compact-check-chip input');
        const savedChannels = (task.notifications || []).map((v) => String(v).toLowerCase());
        notifChecks.forEach((cb) => {
          const channel = (cb.getAttribute("data-channel") || cb.parentElement.querySelector("span").textContent || "")
            .trim()
            .toLowerCase();
          cb.checked = savedChannels.includes(channel);
        });
      }
    }
  }

  function getCheckedValues(fieldsetIndex) {
    const groups = document.querySelectorAll(".compact-check-group");
    if (!groups[fieldsetIndex]) return [];
    const checked = [];
    groups[fieldsetIndex].querySelectorAll('.compact-check-chip input:checked').forEach((cb) => {
      const channel = cb.getAttribute("data-channel");
      if (channel) {
        checked.push(channel.trim().toLowerCase());
      } else {
        checked.push(cb.parentElement.querySelector("span").textContent.trim().toLowerCase());
      }
    });
    return checked;
  }

  function collectTaskData() {
    return {
      name: nameField.value.trim(),
      priority: priorityField.value.trim(),
      date: dateField.value,
      time: timeField.value,
      notes: notesField.value.trim(),
      frequency: getCheckedValues(0),
      notifications: getCheckedValues(1),
      goalId: linkedGoalId || null,
    };
  }

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]");
    if (!action) return;
    const act = action.dataset.action;

    if (act === "save-task") {
      const data = collectTaskData();
      if (!data.name) { showToast("Task name is required", "error"); return; }
      const tasks = readStore(STORE_KEYS.tasks);

      let savedId = editId;
      if (editId) {
        const idx = tasks.findIndex((t) => t.id === editId);
        if (idx !== -1) {
          tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
          writeStore(STORE_KEYS.tasks, tasks);
          showToast("Task updated successfully");
          window.timenestNotify?.confirm("Task updated", data.name, { taskId: savedId, linkUrl: `./task-detail.html?id=${encodeURIComponent(savedId)}` });
        }
      } else {
        savedId = generateId();
        tasks.push({ id: savedId, ...data, status: "pending", isComplete: false, createdAt: new Date().toISOString() });
        writeStore(STORE_KEYS.tasks, tasks);
        showToast("Task saved successfully");
        window.timenestNotify?.confirm("Task created", data.name, { taskId: savedId, linkUrl: `./task-detail.html?id=${encodeURIComponent(savedId)}` });
      }
      // If the user ticked "Set Alarm", schedule a device/system alarm.
      if (data.notifications.includes("set-alarm") && data.time) {
        const result = window.timenestNotify?.setAlarm({
          __kind: "task",
          id: savedId,
          name: data.name,
          date: data.date,
          time: data.time,
          linkUrl: `./task-detail.html?id=${encodeURIComponent(savedId)}`,
        });
        if (result && result.ok) {
          const via = result.via === "android-intent"
            ? "Opening clock app…"
            : result.via === "ics-calendar"
              ? "Downloading .ics — import to add the alarm"
              : "Alarm scheduled in-app";
          showToast("⏰ " + via, "info");
        } else if (result && result.reason === "no-time") {
          showToast("Set a time to enable the alarm", "warn");
        }
      }
      // Kick off a scan so the due-soon notification fires immediately if applicable.
      setTimeout(() => window.timenestNotify?.scan(), 150);
      setTimeout(() => { window.location.href = "./daily-tasks.html"; }, 800);
    }

    if (act === "preview-reminder") {
      const data = collectTaskData();
      if (!data.name) { showToast("Enter a task name first", "error"); return; }
      const channels = data.notifications.length ? data.notifications.join(", ") : "none selected";
      const freq = data.frequency.length ? data.frequency.join(", ") : "one-time";
      const deadline = data.date ? new Date(data.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "no date set";
      const timeStr = data.time || "no time set";
      showToast("Reminder: \"" + data.name + "\" — " + deadline + " at " + timeStr + " via " + channels + " (" + freq + ")", "info", 6000);
    }

    if (act === "reset-task") {
      nameField.value = "";
      priorityField.value = "";
      dateField.value = "";
      timeField.value = "";
      notesField.value = "";
      document.querySelectorAll('.compact-check-chip input').forEach((cb) => cb.checked = false);
      const noneCheck = document.querySelector('.compact-check-group:first-of-type .compact-check-chip input');
      if (noneCheck) noneCheck.checked = true;
      showToast("Form reset", "info");
    }

    if (act === "delete-task") {
      if (!editId) { showToast("No saved task to delete", "warn"); return; }
      if (!confirm("Delete this task permanently?")) return;
      const deletedTask = readStore(STORE_KEYS.tasks).find((t) => t.id === editId);
      writeStore(
        STORE_KEYS.tasks,
        readStore(STORE_KEYS.tasks).filter((task) => task.id !== editId)
      );
      writeStore(
        STORE_KEYS.subtasks,
        readStore(STORE_KEYS.subtasks).filter((subtask) => subtask.parentTaskId !== editId)
      );
      showToast("Task deleted");
      window.timenestNotify?.confirm("Task deleted", deletedTask?.name || "(task)", {});
      setTimeout(() => { window.location.href = "./daily-tasks.html"; }, 800);
    }
  });
})();

// ──────────── Habit Editor Wiring ────────────
(function initHabitEditor() {
  const nameField = document.getElementById("habit-field-name");
  const categoryField = document.getElementById("habit-field-category");
  const scheduleField = document.getElementById("habit-field-schedule");
  const timeField = document.getElementById("habit-field-time");
  const channelField = document.getElementById("habit-field-channel");
  const goalField = document.getElementById("habit-field-goal");
  const ruleField = document.getElementById("habit-field-rule");
  const notesField = document.getElementById("habit-field-notes");
  if (!nameField) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  if (editId) {
    const habits = readStore(STORE_KEYS.habits);
    const habit = habits.find((h) => h.id === editId);
    if (habit) {
      nameField.value = habit.name || "";
      categoryField.value = habit.category || "";
      scheduleField.value = habit.schedule || "";
      timeField.value = habit.time || "";
      if (channelField) channelField.value = habit.channel || "";
      goalField.value = habit.linkedGoal || "";
      ruleField.value = habit.successRule || "";
      notesField.value = habit.notes || "";
      // Re-check the saved notification channels.
      const saved = (habit.notifications || []).map((v) => String(v).toLowerCase());
      document
        .querySelectorAll('[data-notification-group] .compact-check-chip input')
        .forEach((cb) => {
          const channel = (cb.getAttribute("data-channel") || "").trim().toLowerCase();
          if (channel) cb.checked = saved.includes(channel);
        });
    }
  }

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]");
    if (!action) return;

    if (action.dataset.action === "save-habit") {
      // Collect selected notification channels from the new In-App / Push /
      // Set Alarm checkbox group. Falls back to the legacy free-text
      // channel input for backward compatibility with older saved habits.
      const notificationChecks = document.querySelectorAll(
        '[data-notification-group] .compact-check-chip input:checked'
      );
      const channels = Array.from(notificationChecks).map((cb) =>
        (cb.getAttribute("data-channel") || "").trim().toLowerCase()
      ).filter(Boolean);
      const data = {
        name: nameField.value.trim(),
        category: categoryField.value.trim(),
        schedule: scheduleField.value.trim(),
        time: timeField.value,
        channel: channelField ? channelField.value.trim() : "",
        notifications: channels,
        linkedGoal: goalField.value.trim(),
        successRule: ruleField.value.trim(),
        notes: notesField.value.trim(),
      };
      if (!data.name) { showToast("Habit name is required", "error"); return; }
      const habits = readStore(STORE_KEYS.habits);

      let savedHabitId = editId;
      if (editId) {
        const idx = habits.findIndex((h) => h.id === editId);
        if (idx !== -1) {
          habits[idx] = { ...habits[idx], ...data, updatedAt: new Date().toISOString() };
          writeStore(STORE_KEYS.habits, habits);
          showToast("Habit updated successfully");
          window.timenestNotify?.confirm("Habit updated", data.name, { habitId: savedHabitId, linkUrl: "./habits.html" });
        }
      } else {
        savedHabitId = generateId();
        habits.push({ id: savedHabitId, ...data, history: {}, createdAt: new Date().toISOString() });
        writeStore(STORE_KEYS.habits, habits);
        showToast("Habit saved successfully");
        window.timenestNotify?.confirm("Habit created", data.name, { habitId: savedHabitId, linkUrl: "./habits.html" });
      }
      // If the user ticked "Set Alarm" for this habit, trigger a device
      // alarm for the configured Preferred Time. Habits repeat daily so
      // the in-page fallback reschedules itself each midnight.
      if (data.notifications.includes("set-alarm") && data.time) {
        const result = window.timenestNotify?.setAlarm({
          __kind: "habit",
          id: savedHabitId,
          name: data.name,
          time: data.time,
          linkUrl: "./habits.html",
        });
        if (result && result.ok) {
          const via = result.via === "android-intent"
            ? "Opening clock app…"
            : result.via === "ics-calendar"
              ? "Downloading .ics — import to add the alarm"
              : "Alarm scheduled in-app";
          showToast("⏰ " + via, "info");
        } else if (result && result.reason === "no-time") {
          showToast("Set a preferred time to enable the alarm", "warn");
        }
      }
      setTimeout(() => window.timenestNotify?.scan(), 150);
      setTimeout(() => { window.location.href = "./habits.html"; }, 800);
    }

    if (action.dataset.action === "delete-habit") {
      if (!editId) { showToast("No saved habit to delete", "warn"); return; }
      if (!confirm("Delete this habit permanently?")) return;
      const habitName = readStore(STORE_KEYS.habits).find((h) => h.id === editId)?.name || "(habit)";
      writeStore(
        STORE_KEYS.habits,
        readStore(STORE_KEYS.habits).filter((habit) => habit.id !== editId)
      );
      showToast("Habit deleted");
      window.timenestNotify?.confirm("Habit deleted", habitName, {});
      setTimeout(() => { window.location.href = "./habits.html"; }, 800);
    }
  });
})();

// ──────────── Subtask Editor Wiring ────────────
(function initSubtaskEditor() {
  const nameField = document.getElementById("subtask-field-name");
  const statusField = document.getElementById("subtask-field-status");
  const dateField = document.getElementById("subtask-field-date");
  const priorityField = document.getElementById("subtask-field-priority");
  const notesField = document.getElementById("subtask-field-notes");
  if (!nameField) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const parentTaskId = params.get("taskId");

  // Helper: lookup the parent task once so we can reject subtask work when the
  // parent doesn't exist or is already closed (completed/cancelled/skipped).
  function findParentTask() {
    const id = parentTaskId || (editId
      ? readStore(STORE_KEYS.subtasks).find((s) => s.id === editId)?.parentTaskId
      : null);
    if (!id) return null;
    return readStore(STORE_KEYS.tasks).find((t) => t.id === id) || null;
  }

  function isParentClosed(task) {
    if (!task) return false;
    if (task.isComplete) return true;
    const status = String(task.status || "").toLowerCase();
    return status === "completed" || status === "closed" || status === "cancelled";
  }

  // Gate 1 — subtask creation requires a main task. If the user opens this
  // editor without a parent taskId (and isn't editing an existing subtask),
  // redirect to the task list with a clear message.
  const parentTask = findParentTask();
  if (!editId && !parentTask) {
    showToast("Create a main task first before adding subtasks", "error");
    setTimeout(() => { window.location.href = "./daily-tasks.html"; }, 900);
    return;
  }

  // Gate 2 — block subtask creation when the parent task is closed/completed.
  // Editing an existing subtask is also blocked so users can't retroactively
  // attach work to a finished task.
  if (parentTask && isParentClosed(parentTask)) {
    showToast("Main task is closed — subtasks can't be added or edited", "error");
    setTimeout(() => {
      window.location.href = `./task-detail.html?id=${encodeURIComponent(parentTask.id)}`;
    }, 1100);
    return;
  }

  if (editId) {
    const subtasks = readStore(STORE_KEYS.subtasks);
    const subtask = subtasks.find((s) => s.id === editId);
    if (subtask) {
      nameField.value = subtask.name || "";
      statusField.value = subtask.status || "";
      dateField.value = subtask.date || "";
      priorityField.value = subtask.priority || "";
      notesField.value = subtask.notes || "";
    }
  }

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]");
    if (!action) return;
    const act = action.dataset.action;

    // Re-check parent task state at action time — the parent may have been
    // closed in another tab while this editor was open.
    const currentParent = findParentTask();
    if ((act === "save-subtask" || act === "mark-subtask-complete") && isParentClosed(currentParent)) {
      showToast("Main task is closed — no further changes allowed", "error");
      return;
    }

    if (act === "save-subtask") {
      const data = {
        name: nameField.value.trim(),
        status: statusField.value.trim() || "Pending",
        date: dateField.value,
        priority: priorityField.value.trim(),
        notes: notesField.value.trim(),
        parentTaskId: parentTaskId || currentParent?.id || null,
      };
      if (!data.name) { showToast("Subtask name is required", "error"); return; }
      if (!data.parentTaskId) {
        showToast("A main task must exist before saving a subtask", "error");
        return;
      }
      const subtasks = readStore(STORE_KEYS.subtasks);

      if (editId) {
        const idx = subtasks.findIndex((s) => s.id === editId);
        if (idx !== -1) {
          subtasks[idx] = { ...subtasks[idx], ...data, updatedAt: new Date().toISOString() };
          writeStore(STORE_KEYS.subtasks, subtasks);
          showToast("Subtask updated");
        }
      } else {
        subtasks.push({ id: generateId(), ...data, createdAt: new Date().toISOString() });
        writeStore(STORE_KEYS.subtasks, subtasks);
        showToast("Subtask saved");
      }
      setTimeout(() => { window.location.href = "./task-detail.html"; }, 800);
    }

    if (act === "mark-subtask-complete") {
      if (!nameField.value.trim()) { showToast("Enter a subtask name first", "error"); return; }
      if (!confirm("Mark this subtask as complete?")) return;
      statusField.value = "Completed";

      if (editId) {
        const subtasks = readStore(STORE_KEYS.subtasks);
        const idx = subtasks.findIndex((s) => s.id === editId);
        if (idx !== -1) {
          subtasks[idx].status = "Completed";
          subtasks[idx].isComplete = true;
          subtasks[idx].updatedAt = new Date().toISOString();
          writeStore(STORE_KEYS.subtasks, subtasks);
        }
      }
      showToast("Subtask marked complete");
    }
  });
})();

// ──────────── Signup Flow Wiring ────────────
(function initSignupFlow() {
  const signupButtons = document.querySelectorAll("[data-action^='signup-']");
  if (!signupButtons.length) return;

  signupButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const method = btn.dataset.action.replace("signup-", "");
      const methodLabel = method === "google" ? "Google" : method === "email" ? "Email" : "Mobile";
      showToast("Starting " + methodLabel + " sign-up flow...", "info");
      localStorage.setItem("timenest-signup-method", method);
      localStorage.setItem("timenest-auth-state", "signed-up");
      setTimeout(() => { window.location.href = "./index.html"; }, 1200);
    });
  });
})();

// ──────────── Forgot Password / Recovery Wiring ────────────
(function initRecoveryFlow() {
  const recoveryButtons = document.querySelectorAll("[data-action^='recovery-']");
  if (!recoveryButtons.length) return;

  recoveryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const method = btn.dataset.action.replace("recovery-", "");
      const labels = { email: "Reset link sent to your email", mobile: "Verification SMS sent", google: "Redirecting to Google account recovery..." };
      showToast(labels[method] || "Recovery initiated", "success");
      btn.textContent = method === "google" ? "Redirecting..." : "Sent";
      btn.style.opacity = "0.6";
      btn.style.pointerEvents = "none";
      if (method === "google") {
        setTimeout(() => { window.location.href = "./login.html"; }, 2000);
      }
    });
  });
})();

// ──────────── Notification Channel Toggles ────────────
(function initChannelToggles() {
  const channelCards = document.querySelectorAll("[data-channel]");
  if (!channelCards.length) return;

  const defaultChannels = {
    push: "enabled", email: "enabled", sms: "disabled",
    whatsapp: "disabled", "in-app": "enabled", snooze: "enabled",
  };
  const savedChannels = readStoreObject(STORE_KEYS.channels, defaultChannels);

  function syncChannelCard(card) {
    const channel = card.dataset.channel;
    const state = savedChannels[channel] || "disabled";
    card.dataset.channelState = state;
    const statusEl = card.querySelector(".channel-status");
    if (statusEl) {
      statusEl.textContent = state === "enabled" ? "Enabled" : "Disabled";
    }
    const toggleEl = card.querySelector(".channel-toggle");
    if (toggleEl) {
      toggleEl.textContent = state === "enabled" ? "Disable" : "Enable";
    }
  }

  channelCards.forEach(syncChannelCard);

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-action='toggle-channel']");
    if (!toggle) return;
    const card = toggle.closest("[data-channel]");
    if (!card) return;
    const channel = card.dataset.channel;
    savedChannels[channel] = savedChannels[channel] === "enabled" ? "disabled" : "enabled";
    writeStore(STORE_KEYS.channels, savedChannels);
    syncChannelCard(card);
    showToast(channel.charAt(0).toUpperCase() + channel.slice(1) + " " + savedChannels[channel]);
  });
})();

// ──────────── Settings Cards Wiring ────────────
(function initSettingsCards() {
  const settingsCards = document.querySelectorAll("[data-action='open-setting']");
  if (!settingsCards.length) return;

  const settingActions = {
    appearance: function (card) {
      const currentTheme = localStorage.getItem("timenest-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("timenest-theme", newTheme);
      document.documentElement.dataset.theme = newTheme;
      document.body.dataset.theme = newTheme;
      showToast("Theme switched to " + newTheme + " mode");
      const desc = card.querySelector("p:last-child");
      if (desc) desc.textContent = newTheme === "dark" ? "Dark mode active with futuristic motion presets." : "Light mode active with futuristic motion presets.";
    },
    language: function (card) {
      const saved = readStoreObject(STORE_KEYS.settings, {});
      const current = saved.language || "english";
      saved.language = current === "english" ? "marathi" : "english";
      writeStore(STORE_KEYS.settings, saved);
      const title = card.querySelector(".section-title");
      if (title) title.textContent = saved.language === "english" ? "English + Marathi" : "Marathi + English";
      showToast("Primary language: " + (saved.language === "english" ? "English" : "Marathi"));
    },
    backup: function () {
      showToast("Backup initiated — exporting data to cloud sync...", "info");
      const allData = {};
      Object.entries(STORE_KEYS).forEach(([key, storeKey]) => {
        const scopedValue = localStorage.getItem(getScopedStorageKey(storeKey));
        const legacyValue = localStorage.getItem(storeKey);
        if (scopedValue) {
          allData[key] = scopedValue;
        } else if (legacyValue) {
          allData[key] = legacyValue;
        }
      });
      localStorage.setItem("timenest-backup-snapshot", JSON.stringify({ timestamp: new Date().toISOString(), data: allData }));
      setTimeout(() => showToast("Backup complete — restore point saved"), 1500);
    },
    security: function () {
      showToast("Session verified — all tokens active", "success");
    },
  };

  settingsCards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const setting = card.dataset.setting;
      if (settingActions[setting]) settingActions[setting](card);
    });
  });
})();

// ──────────── Profile: Connected Access Wiring ────────────
(function initProfileAccess() {
  if (document.body.dataset.authMode !== "prototype") {
    return;
  }

  const accessItems = document.querySelectorAll("[data-action='toggle-access']");
  if (!accessItems.length) return;

  accessItems.forEach((pill) => {
    pill.style.cursor = "pointer";
    pill.addEventListener("click", () => {
      const item = pill.closest("[data-access]");
      if (!item) return;
      const method = item.dataset.access;
      if (method === "google") {
        showToast("Google is the primary sign-in — cannot disable", "warn");
        return;
      }
      const isActive = pill.classList.contains("good");
      if (isActive) {
        pill.classList.remove("good");
        pill.classList.add("warn");
        pill.textContent = "Disabled";
        item.classList.remove("surface-item-status-good");
        showToast(method.charAt(0).toUpperCase() + method.slice(1) + " access disabled", "warn");
      } else {
        pill.classList.remove("warn");
        pill.classList.add("good");
        pill.textContent = "Active";
        item.classList.add("surface-item-status-good");
        showToast(method.charAt(0).toUpperCase() + method.slice(1) + " access enabled");
      }
    });
  });
})();

// ──────────── Profile: Quick Preferences Cycling ────────────
(function initProfilePreferences() {
  const prefPills = document.querySelectorAll("[data-action='cycle-pref']");
  if (!prefPills.length) return;

  const prefOptions = {
    language: ["English", "Marathi", "Hindi"],
    backup: ["Cloud Sync", "Local Only", "Off"],
    export: ["PDF + Excel", "PDF Only", "Excel Only", "JSON"],
    mode: ["Futuristic", "Minimal", "Classic"],
  };

  const savedPrefs = readStoreObject(STORE_KEYS.preferences, {});

  prefPills.forEach((pill) => {
    const key = pill.dataset.pref;
    if (savedPrefs[key]) {
      pill.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ": " + savedPrefs[key];
    }

    pill.style.cursor = "pointer";
    pill.addEventListener("click", () => {
      const options = prefOptions[key];
      if (!options) return;
      const currentText = pill.textContent.split(": ")[1] || options[0];
      const currentIdx = options.indexOf(currentText);
      const nextIdx = (currentIdx + 1) % options.length;
      const newValue = options[nextIdx];
      pill.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ": " + newValue;
      savedPrefs[key] = newValue;
      writeStore(STORE_KEYS.preferences, savedPrefs);
      showToast(key.charAt(0).toUpperCase() + key.slice(1) + " set to " + newValue);
    });
  });
})();

// ──────────── Login Page: Wire preview actions ────────────
(function initLoginActions() {
  if (document.body.dataset.authMode !== "prototype") {
    return;
  }

  const loginSubmit = document.querySelector(".login-submit");
  if (loginSubmit) {
    loginSubmit.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("This is a prototype — use the preview buttons above", "info");
    });
  }

  // Wire the form to prevent actual submission
  const loginForm = document.querySelector(".login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Prototype mode — no real authentication", "info");
    });
  }
})();

import("./auth.js")
  .then(({ initAuth }) => initAuth())
  .catch((error) => {
    console.error("Failed to initialize TIMENEST auth", error);
    const authBanner = document.querySelector("[data-auth-banner], [data-auth-feedback]");
    if (authBanner) {
      authBanner.hidden = false;
      authBanner.dataset.tone = "error";
      authBanner.textContent = "TIMENEST could not initialize Firebase Authentication. Open the browser console to see the exact error.";
    }
  });

// ──────────── In-app notification engine bootstrap ────────────
// Loaded once per page via dynamic <script> injection so individual HTML
// pages don't need a separate <script src="./notifications.js"> include.
(function bootstrapTimenestNotifications() {
  if (window.__timenestNotificationsBooted) return;
  if (document.getElementById("timenest-notifications-script")) return;
  const s = document.createElement("script");
  s.id = "timenest-notifications-script";
  s.src = "./notifications.js";
  s.defer = true;
  document.head.appendChild(s);
})();
