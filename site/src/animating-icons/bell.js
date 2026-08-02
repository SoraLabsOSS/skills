/**
 * Bell hover gesture — hinge (family 3). Lucide bell-ring source.
 *
 * Verb: it rings — shell swings one way, clapper the other, they strike.
 * Landing: return — decayed oscillation onto exactly 0°.
 *
 * Geometry (24 box, Lucide bell-ring paths, stroke-width 2):
 *   shell dome A6 6 from (18,8)→(6,8), centre (12, 8), r=6 → crown (12, 2)
 *   clapper M10.268 21 a2 2 … — chord centre (12, 21), r=2
 *   waves M22 8… / M4 2… — hold still (sound marks, not the mechanism)
 *   Shared hinge transform-origin: 12px 2px (crown tip).
 *   ±14° — left flare (~3.26,15.3) stays inside the 24 box (measured).
 *   Decay ~0.64/swing: 14 → 9 → 5.5 → 2.5 → 0 (EASING.md budget).
 *   Clapper = mirrored shell track; delay 22ms = 2.5% of 900ms (inertia).
 *   Clapper duration 878ms + 22ms delay → both clocks end at 900ms.
 */

const SHELL =
  "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326";
const CLAPPER = "M10.268 21a2 2 0 0 0 3.464 0";
const WAVE_R = "M22 8c0-2.3-.8-4.3-2-6";
const WAVE_L = "M4 2C2.8 3.7 2 5.7 2 8";

const CSS = `
/* Rest = identity (no transform). Origin only — gate 2 holds when animation is off. */
.ig-bell .bell-shell,
.ig-bell .bell-clapper {
  transform-box: view-box;
  transform-origin: 12px 2px;
}

/* Shell: clockwise first. */
@keyframes ig-bell-shell {
  0%   { transform: rotate(0deg);    animation-timing-function: cubic-bezier(0.45,0,0.15,1); }
  18%  { transform: rotate(14deg);   animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  42%  { transform: rotate(-9deg); }
  64%  { transform: rotate(5.5deg); }
  82%  { transform: rotate(-2.5deg); }
  100% { transform: rotate(0deg); }
}

/* Clapper: opposite signs — meets the shell at each peak (the strike). */
@keyframes ig-bell-clapper {
  0%   { transform: rotate(0deg);    animation-timing-function: cubic-bezier(0.45,0,0.15,1); }
  18%  { transform: rotate(-14deg);  animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  42%  { transform: rotate(9deg); }
  64%  { transform: rotate(-5.5deg); }
  82%  { transform: rotate(2.5deg); }
  100% { transform: rotate(0deg); }
}

.icon-gesture[data-go] .ig-bell .bell-shell {
  animation: ig-bell-shell 900ms both;
}
/* 878ms + 22ms delay = both clocks end at 900ms (gate 2 final frame). */
.icon-gesture[data-go] .ig-bell .bell-clapper {
  animation: ig-bell-clapper 878ms 22ms both;
}

@media (prefers-reduced-motion: reduce) {
  .icon-gesture[data-go] .ig-bell .bell-shell,
  .icon-gesture[data-go] .ig-bell .bell-clapper {
    animation: none !important;
  }
}
`;

function bellSvg() {
  return `
<svg class="bell-svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round" aria-hidden="true">
  <path class="bell-wave" d="${WAVE_R}"/>
  <path class="bell-wave" d="${WAVE_L}"/>
  <path class="bell-shell" d="${SHELL}"/>
  <path class="bell-clapper" d="${CLAPPER}"/>
</svg>`;
}

function ensureCss() {
  if (document.getElementById("bell-live-css")) return;
  const style = document.createElement("style");
  style.id = "bell-live-css";
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

export function mountBell(host) {
  if (!host) return;
  ensureCss();
  const wrap = host.querySelector(".ig-bell") || host;
  wrap.innerHTML = bellSvg();
  if (!host.classList.contains("icon-gesture")) {
    host.classList.add("icon-gesture");
  }
  bindIconGesture(host);
}
