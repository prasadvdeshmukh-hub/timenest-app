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
const pixelRatio = window.devicePixelRatio || 1;
const clockContext = clockCanvas ? clockCanvas.getContext("2d") : null;
let size = 320;

function syncClockCanvasSize() {
  if (!clockCanvas || !clockContext) return;
  // Use parent container width, clamped to a safe range
  const parent = clockCanvas.parentElement;
  const parentWidth = parent ? Math.round(parent.getBoundingClientRect().width) : 320;
  size = Math.max(Math.min(parentWidth, 920), 140);
  clockCanvas.width = size * pixelRatio;
  clockCanvas.height = size * pixelRatio;
  clockCanvas.style.width = `${size}px`;
  clockCanvas.style.height = `${size}px`;
  clockContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

if (clockCanvas && clockContext) {
  syncClockCanvasSize();
  window.addEventListener("resize", syncClockCanvasSize);
}

let frame = 0;

function drawHudClock() {
  frame += 1;
  if (!clockContext) return;

  const now = new Date();
  const cx = size / 2;
  const cy = size / 2;

  // Everything is based on `r` — the safe drawing radius.
  // All rings, text, and orbits MUST stay within 0..size.
  const margin = size * 0.08; // 8% margin on each side
  const r = cx - margin;      // maximum outer radius

  clockContext.clearRect(0, 0, size, size);

  // ── Background glow ──
  const bgGlow = clockContext.createRadialGradient(cx, cy, 0, cx, cy, r * 1.1);
  bgGlow.addColorStop(0, "rgba(0,200,255,0.03)");
  bgGlow.addColorStop(0.5, "rgba(108,99,255,0.02)");
  bgGlow.addColorStop(1, "transparent");
  clockContext.fillStyle = bgGlow;
  clockContext.fillRect(0, 0, size, size);

  // ── Outer ring: seconds tick marks (rotating) ──
  const outerR = r * 0.92;
  clockContext.save();
  clockContext.translate(cx, cy);
  clockContext.rotate(((now.getSeconds() + now.getMilliseconds() / 1000) / 60) * Math.PI * 2);
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const len = isMajor ? r * 0.1 : r * 0.05;
    clockContext.beginPath();
    clockContext.moveTo(outerR * Math.cos(angle), outerR * Math.sin(angle));
    clockContext.lineTo((outerR - len) * Math.cos(angle), (outerR - len) * Math.sin(angle));
    clockContext.strokeStyle = isMajor ? CYAN : "rgba(0,200,255,0.25)";
    clockContext.lineWidth = isMajor ? Math.max(r * 0.016, 1) : Math.max(r * 0.006, 0.5);
    clockContext.stroke();
  }
  clockContext.restore();

  // ── Outer circle ──
  clockContext.beginPath();
  clockContext.arc(cx, cy, outerR, 0, Math.PI * 2);
  clockContext.strokeStyle = "rgba(0,200,255,0.12)";
  clockContext.lineWidth = Math.max(r * 0.006, 0.5);
  clockContext.stroke();

  // ── Second progress arc (just inside outer ring) ──
  const secArcR = outerR + r * 0.04;
  const secondFraction = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
  clockContext.beginPath();
  clockContext.arc(cx, cy, Math.min(secArcR, r * 0.97), -Math.PI / 2, -Math.PI / 2 + secondFraction * Math.PI * 2);
  clockContext.strokeStyle = CYAN;
  clockContext.lineWidth = Math.max(r * 0.02, 1.5);
  clockContext.shadowBlur = r * 0.08;
  clockContext.shadowColor = CYAN;
  clockContext.lineCap = "round";
  clockContext.stroke();
  clockContext.shadowBlur = 0;
  clockContext.lineCap = "butt";

  // ── Second dot ──
  const secEndAngle = -Math.PI / 2 + secondFraction * Math.PI * 2;
  const dotArcR = Math.min(secArcR, r * 0.97);
  clockContext.beginPath();
  clockContext.arc(cx + dotArcR * Math.cos(secEndAngle), cy + dotArcR * Math.sin(secEndAngle), Math.max(r * 0.025, 2), 0, Math.PI * 2);
  clockContext.fillStyle = CYAN;
  clockContext.shadowBlur = r * 0.06;
  clockContext.shadowColor = CYAN;
  clockContext.fill();
  clockContext.shadowBlur = 0;

  // ── Middle ring: 24h marks (counter-rotating) ──
  const midR = r * 0.7;
  clockContext.save();
  clockContext.translate(cx, cy);
  clockContext.rotate(-((now.getMinutes() + now.getSeconds() / 60) / 60) * Math.PI * 2);
  clockContext.beginPath();
  clockContext.arc(0, 0, midR, 0, Math.PI * 2);
  clockContext.strokeStyle = "rgba(108,99,255,0.2)";
  clockContext.lineWidth = Math.max(r * 0.008, 0.8);
  clockContext.stroke();
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const tickLen = r * 0.035;
    clockContext.beginPath();
    clockContext.moveTo((midR - tickLen) * Math.cos(angle), (midR - tickLen) * Math.sin(angle));
    clockContext.lineTo((midR + tickLen) * Math.cos(angle), (midR + tickLen) * Math.sin(angle));
    clockContext.strokeStyle = i % 6 === 0 ? "rgba(108,99,255,0.7)" : "rgba(108,99,255,0.35)";
    clockContext.lineWidth = i % 6 === 0 ? Math.max(r * 0.012, 1) : Math.max(r * 0.008, 0.7);
    clockContext.stroke();
  }
  clockContext.restore();

  // ── Minute progress arc ──
  const minuteFraction = (now.getMinutes() + now.getSeconds() / 60) / 60;
  clockContext.beginPath();
  clockContext.arc(cx, cy, midR + r * 0.02, -Math.PI / 2, -Math.PI / 2 + minuteFraction * Math.PI * 2);
  clockContext.strokeStyle = PURPLE;
  clockContext.lineWidth = Math.max(r * 0.015, 1.2);
  clockContext.shadowBlur = r * 0.06;
  clockContext.shadowColor = PURPLE;
  clockContext.lineCap = "round";
  clockContext.stroke();
  clockContext.shadowBlur = 0;
  clockContext.lineCap = "butt";

  // ── Inner pulsing ring ──
  const pulse = 0.95 + Math.sin(frame * 0.03) * 0.05;
  const innerR = r * 0.45 * pulse;
  clockContext.beginPath();
  clockContext.arc(cx, cy, innerR, 0, Math.PI * 2);
  clockContext.strokeStyle = "rgba(0,200,255,0.12)";
  clockContext.lineWidth = Math.max(r * 0.012, 1);
  clockContext.shadowBlur = r * 0.1;
  clockContext.shadowColor = "rgba(0,200,255,0.2)";
  clockContext.stroke();
  clockContext.shadowBlur = 0;

  // ── Hour progress arc ──
  const hourFraction = ((now.getHours() % 12) + now.getMinutes() / 60) / 12;
  clockContext.beginPath();
  clockContext.arc(cx, cy, innerR + r * 0.015, -Math.PI / 2, -Math.PI / 2 + hourFraction * Math.PI * 2);
  clockContext.strokeStyle = "rgba(255,109,0,0.5)";
  clockContext.lineWidth = Math.max(r * 0.012, 1);
  clockContext.shadowBlur = r * 0.05;
  clockContext.shadowColor = "rgba(255,109,0,0.3)";
  clockContext.lineCap = "round";
  clockContext.stroke();
  clockContext.shadowBlur = 0;
  clockContext.lineCap = "butt";

  // ── Scan line ──
  const scanY = cy - r + ((frame * 1.8) % (r * 2));
  const scanH = r * 0.15;
  const scanGrad = clockContext.createLinearGradient(0, scanY - scanH, 0, scanY + scanH);
  scanGrad.addColorStop(0, "transparent");
  scanGrad.addColorStop(0.5, "rgba(0,200,255,0.05)");
  scanGrad.addColorStop(1, "transparent");
  clockContext.fillStyle = scanGrad;
  clockContext.fillRect(cx - outerR, scanY - scanH, outerR * 2, scanH * 2);

  // ── Digital time display ──
  const period = now.getHours() >= 12 ? "PM" : "AM";
  const hour12 = now.getHours() % 12 || 12;
  const hours = String(hour12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Glow behind text
  const timeGlow = clockContext.createRadialGradient(cx, cy, 0, cx, cy, innerR * 0.8);
  timeGlow.addColorStop(0, "rgba(0,200,255,0.06)");
  timeGlow.addColorStop(1, "transparent");
  clockContext.fillStyle = timeGlow;
  clockContext.fillRect(cx - innerR, cy - innerR, innerR * 2, innerR * 2);

  // Time: font sized to 55% of inner radius — always fits
  const timeFontPx = Math.max(Math.round(innerR * 0.55), 10);
  clockContext.font = `800 ${timeFontPx}px 'Courier New', monospace`;
  clockContext.textAlign = "center";
  clockContext.textBaseline = "middle";

  // Shadow text
  clockContext.fillStyle = "rgba(108,99,255,0.1)";
  clockContext.fillText(`${hours}:${minutes}`, cx + r * 0.008, cy - innerR * 0.12 + r * 0.008);

  // Main text
  clockContext.fillStyle = CYAN;
  clockContext.shadowBlur = r * 0.12;
  clockContext.shadowColor = CYAN;
  clockContext.fillText(`${hours}:${minutes}`, cx, cy - innerR * 0.12);
  clockContext.shadowBlur = 0;

  // Blink effect
  if (now.getMilliseconds() < 500) {
    clockContext.fillStyle = "rgba(0,200,255,0.3)";
    clockContext.fillText(`${hours} ${minutes}`, cx, cy - innerR * 0.12);
  }

  // Seconds
  const secFontPx = Math.max(Math.round(innerR * 0.24), 7);
  clockContext.font = `600 ${secFontPx}px 'Courier New', monospace`;
  clockContext.fillStyle = "rgba(0,200,255,0.55)";
  clockContext.fillText(seconds, cx, cy + innerR * 0.28);

  // AM/PM
  const periodFontPx = Math.max(Math.round(innerR * 0.18), 6);
  clockContext.font = `600 ${periodFontPx}px 'Courier New', monospace`;
  clockContext.fillStyle = "rgba(0,200,255,0.52)";
  clockContext.fillText(period, cx, cy + innerR * 0.55);

  // ── Corner brackets ──
  const bLen = r * 0.12;
  const bOff = innerR * 0.85;
  clockContext.strokeStyle = "rgba(0,200,255,0.35)";
  clockContext.lineWidth = Math.max(r * 0.008, 0.8);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
    clockContext.beginPath();
    clockContext.moveTo(cx + dx * bOff, cy + dy * (bOff - bLen));
    clockContext.lineTo(cx + dx * bOff, cy + dy * bOff);
    clockContext.lineTo(cx + dx * (bOff - bLen), cy + dy * bOff);
    clockContext.stroke();
    clockContext.beginPath();
    clockContext.arc(cx + dx * bOff, cy + dy * bOff, Math.max(r * 0.012, 1), 0, Math.PI * 2);
    clockContext.fillStyle = "rgba(0,200,255,0.3)";
    clockContext.fill();
  });

  // ── Labels ──
  const lblPx = Math.max(Math.round(r * 0.055), 5);
  clockContext.font = `500 ${lblPx}px 'Courier New', monospace`;
  clockContext.textAlign = "center";
  clockContext.fillStyle = "rgba(0,200,255,0.4)";
  clockContext.fillText("TIMENEST", cx, cy - r * 0.6);
  clockContext.fillText("SYS.CLOCK v2.1", cx, cy + r * 0.64);

  // Side data — only on larger screens
  if (size >= 280) {
    const sidePx = Math.max(Math.round(r * 0.048), 5);
    clockContext.font = `500 ${sidePx}px 'Courier New', monospace`;
    clockContext.textAlign = "left";
    clockContext.fillStyle = "rgba(108,99,255,0.35)";
    clockContext.fillText(`HR: ${hours}`, cx + r * 0.42, cy - r * 0.18);
    clockContext.fillText(`MN: ${minutes}`, cx + r * 0.42, cy - r * 0.09);
    clockContext.fillText(`SC: ${seconds}`, cx + r * 0.42, cy);

    const dayNames2 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const monthNames2 = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    clockContext.textAlign = "right";
    clockContext.fillStyle = "rgba(0,200,255,0.3)";
    clockContext.fillText(dayNames2[now.getDay()], cx - r * 0.42, cy - r * 0.18);
    clockContext.fillText(`${now.getDate()} ${monthNames2[now.getMonth()]}`, cx - r * 0.42, cy - r * 0.09);
    clockContext.fillText(String(now.getFullYear()), cx - r * 0.42, cy);
  }

  // ── Orbiting dot (inside outer ring) ──
  const orbitAngle = (frame * 0.02) % (Math.PI * 2);
  const orbitR = outerR + r * 0.02; // stays within margin
  clockContext.beginPath();
  clockContext.arc(cx + orbitR * Math.cos(orbitAngle), cy + orbitR * Math.sin(orbitAngle), Math.max(r * 0.012, 1.2), 0, Math.PI * 2);
  clockContext.fillStyle = "rgba(0,200,255,0.6)";
  clockContext.shadowBlur = r * 0.05;
  clockContext.shadowColor = CYAN;
  clockContext.fill();
  clockContext.shadowBlur = 0;

  // ── Bottom status text ──
  if (size >= 240) {
    const statusPx = Math.max(Math.round(r * 0.04), 5);
    clockContext.textAlign = "center";
    clockContext.font = `500 ${statusPx}px 'Courier New', monospace`;
    clockContext.fillStyle = "rgba(0,200,255,0.25)";
    const utcOff = -now.getTimezoneOffset() / 60;
    const utcStr = utcOff >= 0 ? `+${utcOff}` : `${utcOff}`;
    clockContext.fillText(`SYNC ACTIVE  ·  PRECISION MODE  ·  UTC${utcStr}`, cx, cy + r * 0.78);
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
const animatedTaglines = document.querySelectorAll(".login-tagline, .brand-subline");

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
