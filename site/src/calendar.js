/**
 * Calendar · tear — Lucide calendar-1 + Bakai's tear animation.
 *
 * Glyph: Lucide calendar-1 (24 box, stroke 2).
 * Motion: Bakai's tear-off recipe — peel at the perforation, real d-morph bend,
 * fall about the un-torn left corner, re-arm while clipped out of frame.
 * One sheet, once (this glyph has a single "1", not a 17/18/19 stack).
 *
 * Geometry:
 *   divider M3 9h18 → perforation y=9
 *   hinge (3, 9) — left body edge × divider (Bakai's (62,80) mapped to this box)
 *   sheet FLAT/BENT: M V C H C V C Z, identical commands
 *   Fall translates ≈ Bakai × 0.25 (96→24); angles unchanged
 */

const TR_FLAT =
  "M3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9C15 9 9 9 3 9Z";
const TR_BENT =
  "M3 9V19.5C3.2 21 4.5 21.5 6 21.5H18.5C20 21.2 21.3 20 21.5 18V7.5C15 8.2 9 9.2 3 9Z";

const DIGIT = "M11 13h1v4";
const RING_L = "M8 2v3";
const RING_R = "M16 2v3";
const DIVIDER = "M3 9h18";

const CSS = `
/* Rest in base rules. Outline+fill gated like Bakai — coincident with the pad at home. */
.ig-calendar .cal-ink { visibility: hidden; }
.ig-calendar .cal-under { opacity: 0; }
.ig-calendar .cal-fall {
  transform-box: view-box;
  transform-origin: 3px 9px;
  transform: translate(0px, 0px) rotate(0deg);
}
/* Opaque paper face — same path as the outline, fill matches the button so rest stays clean. */
.ig-calendar .cal-paper {
  fill: var(--box, #f2f2f2);
  stroke: none;
}
.ig-calendar .cal-outline {
  fill: none;
  stroke: currentColor;
}

/* Bakai tear clock, one 800ms beat (his 400ms proportions ×2 for a single event). */
@keyframes ig-calendar-tear {
  0%      { transform: translate(0px,0px) rotate(0deg);   animation-timing-function: cubic-bezier(0.4,0,0.9,0.4); }
  10%     { transform: translate(0px,0.3px) rotate(1.8deg); animation-timing-function: cubic-bezier(0.45,0,0.9,0.35); }
  26%     { transform: translate(0px,2.5px) rotate(15deg);  animation-timing-function: cubic-bezier(0.5,0,0.75,0.5); }
  50%     { transform: translate(-2.5px,13px) rotate(34deg); animation-timing-function: cubic-bezier(0.55,0,0.9,0.45); }
  70%     { transform: translate(-8px,35px) rotate(56deg); }
  70.01%  { transform: translate(0px,0px) rotate(0deg); }
  100%    { transform: translate(0px,0px) rotate(0deg); }
}
@keyframes ig-calendar-ink {
  0%      { visibility: hidden; }
  5%      { visibility: hidden; }
  5.01%   { visibility: visible; }
  70%     { visibility: visible; }
  70.01%  { visibility: hidden; }
  100%    { visibility: hidden; }
}
@keyframes ig-calendar-bend {
  0%      { d: path("${TR_FLAT}"); animation-timing-function: cubic-bezier(0.5,0.05,0.4,1); }
  30%     { d: path("${TR_BENT}"); }
  70%     { d: path("${TR_BENT}"); }
  70.01%  { d: path("${TR_FLAT}"); }
  100%    { d: path("${TR_FLAT}"); }
}
/* Under-digit uncovered while the sheet is off the pad; back to 0 when it re-arms. */
@keyframes ig-calendar-under {
  0%      { opacity: 0; }
  26%     { opacity: 0; }
  40%     { opacity: 1; }
  70%     { opacity: 1; }
  70.01%  { opacity: 0; }
  100%    { opacity: 0; }
}

.icon-gesture[data-go] .ig-calendar .cal-fall { animation: ig-calendar-tear 800ms both; }
.icon-gesture[data-go] .ig-calendar .cal-ink  { animation: ig-calendar-ink  800ms both; }
.icon-gesture[data-go] .ig-calendar .cal-bend { animation: ig-calendar-bend 800ms both; }
.icon-gesture[data-go] .ig-calendar .cal-under { animation: ig-calendar-under 800ms both; }

@media (prefers-reduced-motion: reduce) {
  .icon-gesture[data-go] .ig-calendar .cal-fall,
  .icon-gesture[data-go] .ig-calendar .cal-ink,
  .icon-gesture[data-go] .ig-calendar .cal-bend,
  .icon-gesture[data-go] .ig-calendar .cal-under {
    animation: none !important;
  }
}

.ig-calendar .cal-svg {
  overflow: hidden;
  display: block;
  width: 48px;
  height: 48px;
}
`;

function calendarSvg() {
  return `
<svg class="cal-svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round" aria-hidden="true">
  <path d="${RING_L}"/>
  <path d="${RING_R}"/>
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <path d="${DIVIDER}"/>
  <path class="cal-under" d="${DIGIT}"/>
  <g class="cal-fall">
    <g class="cal-ink">
      <path class="cal-bend cal-paper" d="${TR_FLAT}"/>
      <path class="cal-bend cal-outline" d="${TR_FLAT}"/>
    </g>
    <path d="${DIGIT}"/>
  </g>
</svg>`;
}

function ensureCss() {
  if (document.getElementById("calendar-live-css")) return;
  const style = document.createElement("style");
  style.id = "calendar-live-css";
  style.textContent = CSS;
  document.head.appendChild(style);
}

function bindIconGesture(el) {
  const DWELL = 130;
  const EXIT = 2.2;
  let timer;
  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ours = (a) => a.animationName?.startsWith("ig-");

  const start = () => {
    if (reduceMq.matches) return;
    if (el.hasAttribute("data-go")) return;
    el.setAttribute("data-go", "");
    const running = el.getAnimations({ subtree: true }).filter(ours);
    if (!running.length) {
      el.removeAttribute("data-go");
      return;
    }
    void Promise.allSettled(running.map((a) => a.finished)).then(() =>
      el.removeAttribute("data-go"),
    );
  };

  const over = () => {
    if (reduceMq.matches) return;
    if (el.hasAttribute("data-go") || timer !== undefined) return;
    timer = window.setTimeout(() => {
      timer = undefined;
      start();
    }, DWELL);
  };

  const out = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
      return;
    }
    el.getAnimations({ subtree: true })
      .filter(ours)
      .forEach((a) => a.updatePlaybackRate(EXIT));
  };

  el.addEventListener("pointerover", over);
  el.addEventListener("pointerout", out);
  el.addEventListener("click", (e) => {
    e.preventDefault();
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    start();
  });
}

export function mountCalendar(host) {
  if (!host) return;
  ensureCss();
  const wrap = host.querySelector(".ig-calendar") || host;
  wrap.innerHTML = calendarSvg();
  if (!host.classList.contains("icon-gesture")) {
    host.classList.add("icon-gesture");
  }
  bindIconGesture(host);
}
