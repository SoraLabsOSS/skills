/**
 * Chat hover gesture — contents-in-frame (family 10) + bubble pop.
 *
 * Verb: the bubble pops; the dots type a reply.
 * Landing: return — scale → 1; each dot → translateY(0).
 *
 * Geometry (24 box, Lucide message-square-more, stroke-width 2):
 *   outline: body x≈2–22, y≈3–19 (tail to ~21.3) → centre (12, 11)
 *   dots: M8 11h.01 / M12 11h.01 / M16 11h.01 — centres (8|12|16, 11), pitch 4u
 *   bob −2u = this glyph's stroke-width (arm thickness = one character slot)
 *   Stagger 70ms (budget 60–90); baked as 9% of 780ms so one clock ends together.
 */

const OUTLINE =
  "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z";

const CSS = `
/* Rest declared in base rules (gate 2). */
.ig-chat .chat-bubble {
  transform-box: view-box;
  transform-origin: 12px 11px;
  transform: translate(0px, 0px) scale(1);
}
.ig-chat .chat-dot {
  transform-box: view-box;
  transform: translate(0px, 0px);
}
.ig-chat .chat-dot-1 { transform-origin: 8px 11px; }
.ig-chat .chat-dot-2 { transform-origin: 12px 11px; }
.ig-chat .chat-dot-3 { transform-origin: 16px 11px; }

@keyframes ig-chat-pop {
  0%   { transform: translate(0px,0px) scale(1);    animation-timing-function: cubic-bezier(0.4,0,0.9,0.4); }
  10%  { transform: translate(0px,0px) scale(0.92); animation-timing-function: cubic-bezier(0.22,1,0.36,1); }
  32%  { transform: translate(0px,0px) scale(1.07); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  48%  { transform: translate(0px,0px) scale(0.98); }
  60%  { transform: translate(0px,0px) scale(1); }
  100% { transform: translate(0px,0px) scale(1); }
}

/* Hold through the pop, then one bob of stroke-width. Stagger via % offset. */
@keyframes ig-chat-type-1 {
  0%   { transform: translate(0px, 0px); }
  40%  { transform: translate(0px, 0px); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  52%  { transform: translate(0px, -2px); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  64%  { transform: translate(0px, 0px); }
  100% { transform: translate(0px, 0px); }
}
@keyframes ig-chat-type-2 {
  0%   { transform: translate(0px, 0px); }
  49%  { transform: translate(0px, 0px); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  61%  { transform: translate(0px, -2px); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  73%  { transform: translate(0px, 0px); }
  100% { transform: translate(0px, 0px); }
}
@keyframes ig-chat-type-3 {
  0%   { transform: translate(0px, 0px); }
  58%  { transform: translate(0px, 0px); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  70%  { transform: translate(0px, -2px); animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  82%  { transform: translate(0px, 0px); }
  100% { transform: translate(0px, 0px); }
}

.icon-gesture[data-go] .ig-chat .chat-bubble {
  animation: ig-chat-pop 780ms both;
}
.icon-gesture[data-go] .ig-chat .chat-dot-1 {
  animation: ig-chat-type-1 780ms both;
}
.icon-gesture[data-go] .ig-chat .chat-dot-2 {
  animation: ig-chat-type-2 780ms both;
}
.icon-gesture[data-go] .ig-chat .chat-dot-3 {
  animation: ig-chat-type-3 780ms both;
}

@media (prefers-reduced-motion: reduce) {
  .icon-gesture[data-go] .ig-chat .chat-bubble,
  .icon-gesture[data-go] .ig-chat .chat-dot {
    animation: none !important;
  }
}
`;

function chatSvg() {
  return `
<svg class="chat-svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round" aria-hidden="true">
  <g class="chat-bubble">
    <path d="${OUTLINE}"/>
    <path class="chat-dot chat-dot-1" d="M8 11h.01"/>
    <path class="chat-dot chat-dot-2" d="M12 11h.01"/>
    <path class="chat-dot chat-dot-3" d="M16 11h.01"/>
  </g>
</svg>`;
}

function ensureCss() {
  if (document.getElementById("chat-live-css")) return;
  const style = document.createElement("style");
  style.id = "chat-live-css";
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

export function mountChat(host) {
  if (!host) return;
  ensureCss();
  const wrap = host.querySelector(".ig-chat") || host;
  wrap.innerHTML = chatSvg();
  if (!host.classList.contains("icon-gesture")) {
    host.classList.add("icon-gesture");
  }
  bindIconGesture(host);
}
