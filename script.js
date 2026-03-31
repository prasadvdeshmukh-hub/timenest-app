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
