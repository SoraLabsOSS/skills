# Patterns

Thin recipes for web CSS / JS / React. Prefer the smallest change that implements the chosen strategy. Related: [STRATEGIES.md](STRATEGIES.md) · [FAILURES.md](FAILURES.md) · [CREDITS.md](CREDITS.md)

---

## CSS — opt-in motion (safest for elaborate effects)

```css
.hero {
  opacity: 1; /* visible, static by default */
}
@media (prefers-reduced-motion: no-preference) {
  .hero {
    animation: zoom-in 1.2s ease both;
  }
}
```

## CSS — override under reduce

```css
.card {
  transition:
    transform 400ms ease,
    opacity 400ms ease,
    background-color 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .card {
    /* strategy 3 / soften: drop displacement, keep cheap cues */
    transition:
      opacity 150ms ease,
      background-color 150ms ease;
  }
  .parallax-layer {
    transform: none !important; /* hazard off */
  }
}
```

## Optional global backstop

Do **not** rely on this alone. If used, prefer `0.01ms` over `0s` so completion events can still fire; force infinite animations to one iteration:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Then layer intentional strategy overrides so essential fades / focus rings survive.

---

## JS — live preference

```js
const REDUCE = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.(REDUCE).matches;
}

export function onReducedMotionChange(cb) {
  const mq = window.matchMedia(REDUCE);
  const handler = (e) => cb(e.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
```

## React — shared hook (live preference)

```jsx
import { useState, useEffect } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
```

SSR: default `false` (motion) and sync in `useEffect` to avoid hydration mismatch — or design static-first and opt motion in.

---

## Strategy 1 — Bail

```jsx
const reduced = usePrefersReducedMotion();
if (reduced) return null;
return <CustomCursorLayer />;
```

## Strategy 2 — Snap end state (GSAP-shaped)

```js
function mountCards({ prefersReducedMotion, refs, timing }) {
  if (prefersReducedMotion) {
    gsap.set(refs.frontEl, { rotationY: 180 });
    // …set each card to final layout
    return; // do not create ScrollTrigger
  }
  // full scroll-linked timeline…
}
// Effect dependency: hasCards — NOT (hasCards && !prefersReducedMotion)
```

## Strategy 3 — Collapse transition (Motion-shaped)

```js
function resolveTransition(transition, prefersReducedMotion) {
  return prefersReducedMotion ? { duration: 0 } : transition;
}
```

Motion-only trees may use the library’s `useReducedMotion` / `MotionConfig reducedMotion="user"`. Own a shared boolean when GSAP and Motion coexist.

## Strategy 4 — Reduce complexity

```js
const layers = prefersReducedMotion ? 1 : MAX_LAYERS;
// carousel: autoplay off, fewer clones, no momentum scroll under reduce
```

---

## Force reduce in demos / harness

Query flag for JS paths (CSS still needs browser emulation for media queries):

```js
const q = new URLSearchParams(location.search);
const reduce =
  q.get("reduce") === "1" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

Playwright: `context` / page with `reducedMotion: 'reduce'` (see [VERIFY.md](VERIFY.md)).
