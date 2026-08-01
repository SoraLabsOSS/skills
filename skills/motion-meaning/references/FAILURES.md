# Failures

Stop and fix these. Related: [STRATEGIES.md](STRATEGIES.md) · [AUDIT.md](AUDIT.md) · [PATTERNS.md](PATTERNS.md)

---

## 1. Dead reduced branch

**Smell:** File mentions `prefersReducedMotion` / `prefers-reduced-motion`, and there is a careful end-state helper — but an outer `if (reduced) return` (or `if (!shouldAnimate) return`) runs **before** that helper is called.

**Why it hurts:** Reduced users get the raw default DOM: overlapping layers, wrong transforms, empty meaning. Grep still passes.

**Fix:** Gate only on “do we have content to show?” Let the inner setup choose full motion vs snap end state.

---

## 2. One-shot `matchMedia`

**Smell:**

```js
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// used once at mount; no addEventListener("change", ...)
```

**Why it hurts:** Preference changes mid-session leave the page on the old path.

**Fix:** Subscribe to `change` (live preference), or use a library API that tears down/rebuilds on change (`gsap.matchMedia`, Framer `MotionConfig` / `useReducedMotion`).

---

## 3. `duration: 0` on sequence-as-content

**Smell:** Multi-step scroll or timeline kept intact; every tween duration forced to 0.

**Why it hurts:** The browser applies every key pose in one frame — stacked/teleported UI, not “same destination, no journey.”

**Fix:** Strategy 2 — one immediate end state; skip creating the journey driver.

---

## 4. Grep theater

**Smell:** “100% of files touch prefers-reduced-motion” as a ship gate.

**Why it hurts:** Touches ≠ reachable ≠ correct. Dead branches and wrong strategies both grep clean.

**Fix:** Dual-state verify + meaning/broken-invariant asserts ([VERIFY.md](VERIFY.md)). Audit asks whether the reduce path runs and what remains.

---

## 5. `duration: 0` / `0s` vs completion listeners

**Smell:** Reduced path sets `transition: … 0s` or `duration: 0` while other code awaits `transitionend`, `animationend`, or `onComplete`.

**Why it hurts:** Some engines drop completion events for true zero-length transitions; state machines hang.

**Fix:** Use ~`0.01ms` when something must observe completion; use true instant writes (`gsap.set`, snap styles) when nothing listens.

---

## 6. Global `* { animation-duration: 0 !important }` alone

**Smell:** Only a blanket reduce rule; no intentional overrides for essential opacity/focus/loading cues.

**Why it hurts:** Over-removes useful feedback that should survive reduce (short opacity fades, focus-ring transitions, essential loading cues); can still break completion listeners if set to `0s`.

**Fix:** Optional global backstop with `0.01ms` + `animation-iteration-count: 1`, then **intentional** per-component strategies on top ([PATTERNS.md](PATTERNS.md)).

---

## 7. JS motion ungated

**Smell:** CSS has a media query; GSAP/Motion/Lenis/canvas keep running.

**Why it hurts:** CSS cannot stop JS-driven timelines.

**Fix:** Same preference boolean (live) gates library setup; destroy scroll hijackers under reduce.
