# Reduce strategies

Four ways the **screen** changes under reduce, plus one always-on preference rule. Stories are self-contained — you do not need any external component library open. Related: [CLASSIFY.md](CLASSIFY.md) · [FAILURES.md](FAILURES.md) · [PATTERNS.md](PATTERNS.md)

| #   | Strategy            | Under reduce **looks like**                  |
| --- | ------------------- | -------------------------------------------- |
| 1   | Bail                | Effect gone                                  |
| 2   | Snap to end state   | Last frame of the sequence, no travel        |
| 3   | Collapse transition | Jumps to the correct spot                    |
| 4   | Reduce complexity   | Same silhouette, cheaper                     |
| —   | Live preference     | _(not a look — how you read the OS setting)_ |

---

## 1. Bail — render nothing

**Looks like:** The effect is simply not there.

**When:** Pure decoration. There is no honest reduced version — only off.

**Do:** Skip mounting the effect (return `null`, do not create the tween, do not hijack the pointer).

**Don't:** Leave a half-visible custom layer that still tracks the pointer at zero duration.

**Story:** A page replaces the system cursor with an animated shape that follows the mouse. Under reduce (and usually on coarse pointers too), render nothing and leave the OS cursor. Bundling “touch screen” and “reduced motion” in one branch is fine — both ask whether the effect makes sense for this user at all.

---

## 2. Snap to end state

**Looks like:** Whatever the full animation’s **last frame** would have been — cards already dismissed/rotated, layout settled — with no scroll-driven journey.

**When:** The sequence _is_ the content. Cards take turns, a scroll-linked pin stages enter → flip → dismiss, physics would settle to a layout. Deleting duration without choosing a destination teleports through overlapping mid-states.

**Do:** Compute the destination the full animation would have ended in. Apply it immediately (`gsap.set`, static `style`, instant state). Do **not** create the scroll/timeline driver for reduced users if that driver _is_ the journey.

**Don't:** Outer-gate the whole effect with `if (reduced) return` **before** the function that applies the end state. That leaves default DOM (stacked, unrotated, wrong z-index) — and grep still finds `prefersReducedMotion` in the file.

**Story:** A scroll-pinned stack of cards flips through as you scroll. The honest reduce path sets each card to its final rotation/position with an immediate write, then returns before creating the scroll trigger. If instead the effect bails at the top whenever reduce is on, the end-state helper never runs: users see every card piled at the center. The bug is unreachable code, not missing media-query strings.

---

## 3. Collapse transition

**Looks like:** The pill/underline/active chrome is **already on the right item** — it did not slide over.

**When:** Motion decorates a result that already exists — active tab pill, underline, small state chrome. Instant arrival is a faithful reduced version of “slide there.”

**Hard boundary vs 2:** If the active index/target is already in state and only the chrome travels → **this strategy**. If you would need to invent/apply a multi-step end layout that is not already on screen → **2 Snap**, not collapse.

**Do:** Swap the transition config for `{ duration: 0 }` (or CSS `transition: none` / instant) and let the library still commit the final values.

**Don't:** Use this on sequence-as-content UIs (strategy 2). Zero-duration staging across multiple poses is not the same as “appear in the right spot.”

**Story:** A highlight pill slides between nav items to mark the active one. Under reduce, resolve the Motion transition to `{ duration: 0 }`. The active item is already known; only the travel was decorative.

---

## 4. Reduce complexity, not just duration

**Looks like:** Still the same kind of UI (blur band, image strip) but **thinner** — one layer instead of many, autoplay stopped, fewer copies on screen.

**When:** The preference correlates with “less visual cost,” not only “shorter tweens.” Multi-layer paints, endless carousels, keyboard momentum scroll. The component **stays mounted** — you thin it, you do not delete it (that would be Bail) and you are not writing a multi-pose end layout (that would be Snap).

**Do:** Drop layer counts, kill autoplay, reduce visible duplicates, disable scroll hijacking. Keep silhouette / meaning.

**Don't:** Only shorten durations while 16 expensive layers or an infinite marquee keep running.

**Story:** A gradient blur faked with many `backdrop-filter` layers (each a paint). Under reduce, one layer is enough — same silhouette, far less work. An infinite image strip similarly drops autoplay and trims how many copies stay mounted.

---

## Live preference (always — not a fifth “look”)

This is **how you read the setting**, not what the screen becomes. Still required on every path that uses strategies 1–4.

**When:** Always. Users flip OS accessibility settings mid-session (demo, screen-share, borrowed laptop).

**Do:** Subscribe to `matchMedia("(prefers-reduced-motion: reduce)")` `change` events (or the animation library’s equivalent that reverts on change). Own one boolean at the app boundary if you mix GSAP and Motion.

**Don't:** Read `.matches` once inside a mount effect and never again.

**Story:** A shared hook updates React state on `change` and every primitive reads that boolean. A loading skeleton that inlines a one-shot `matchMedia` check only at the instant content resolves will not restyle if the user toggles the setting while the page stays open — textbook stale preference.

---

## Footnote (origin)

These shapes were distilled from production React primitives (GSAP + Motion). Named components in the source post are optional reading, not required context: [prefers-reduced-motion in React](https://ui.soralabs.io.vn/blog/prefers-reduced-motion-react).
