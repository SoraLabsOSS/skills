# Classify

Related: [STRATEGIES.md](STRATEGIES.md) · [FAILURES.md](FAILURES.md)

## The one question

**Is the motion sequence the content, or is it decorating a result that exists either way?**

| Answer                                     | Alias         | Under reduce                                              |
| ------------------------------------------ | ------------- | --------------------------------------------------------- |
| Sequence **is** the content                | Communicative | Keep the **destination**; drop or rewrite the journey     |
| Decorating a result that exists either way | Decorative    | Bail, or collapse the transition — no substitute required |

Examples of communicative: expand/collapse that reveals structure, scroll-linked story where cards take turns, menu↔close icon swap, progress that has no honest still equivalent.

Examples of decorative: custom cursor flourish, parallax depth, bounce on hover, staggered marketing reveal on an already-complete layout, icon hover gesture that does not change meaning.

**Hard rule — strategy 2 vs 3 (do not blur these):**

- **Active chrome already known in app state** (which tab/item is selected; highlight only _travels_ there) → **3 Collapse**. The destination exists either way; motion was the travel.
- **Multi-pose journey whose destination is not already sitting in the DOM** (scroll-staged enter → flip → dismiss; physics settle; icon A must become B) → **2 Snap**. You must _write_ the end state; zeroing durations alone teleports through mid poses.

A tab _indicator_ is communicative as a _cue_, but its reduce strategy is still **3** when the active index is already in state. Do not pick **2** just because the cue matters.

**Hard rule — when to use strategy 4 (not 1 or 2):**

- The UI **should still be on screen** under reduce (blur band, image strip, soft wash) — only cheaper: fewer layers, autoplay off, fewer clones → **4**.
- There is **no honest reduced form** (custom cursor, pure flourish) → **1 Bail**, not 4.
- The thing on screen is a **staged multi-pose journey** that needs a written destination → **2 Snap**, not 4. Dropping layers does not replace an end-state applicator.

## Strategy picker

Picture the reduced screen first, then pick:

```
decorative?
  ├─ no honest reduced form at all     → 1 Bail
  │     looks like: effect gone
  └─ result already in the DOM/state   → 3 Collapse transition
        looks like: jumps to final spot

communicative?
  ├─ sequence / staged journey is the UI → 2 Snap to end state
  │     looks like: last frame of the story, no journey
  └─ motion OK but cost/layers/autoplay → 4 Reduce complexity
        looks like: same silhouette, cheaper

always (infrastructure, not a “look”)
  └─ live preference listener — never one-shot matchMedia at mount
```

| #   | Under reduce **looks like**                              |
| --- | -------------------------------------------------------- |
| 1   | Effect is **gone**                                       |
| 2   | **Final layout** of the sequence, applied at once        |
| 3   | Active chrome **appears in place** (no slide)            |
| 4   | **Fewer layers / no autoplay**; shape still recognizable |

If unsure: ask what the screen must show if every tween is deleted mid-flight. That picture is the reduced destination (strategy 2) or proof you should bail (strategy 1).

## Hazard overlay (secondary)

Honoring `prefers-reduced-motion` is the usual technique for **WCAG 2.3.3 Animation from Interactions (AAA)** — motion from interaction must be disable-able unless essential. This skill’s role → strategy path is how you disable without deleting meaning.

Also check vestibular / seizure risk:

- Large viewport translate, parallax, zoom, spin, smooth-scroll hijack → remove under reduce (usually pairs with Bail or Snap without those transforms).
- Autoplay continuous motion >5s → pause control required (**WCAG 2.2.2** Pause, Stop, Hide) regardless of preference; default paused under reduce.
- Flashing >3×/sec → never ship.

Do not replace the primary axis with a generic vestibular “tier list” from other skills. Role first; hazard second.

## Companion: animating-icons

| Case                        | Role          | Reduce                                                       |
| --------------------------- | ------------- | ------------------------------------------------------------ |
| Hover gesture on one glyph  | Decorative    | `animation: none`; sit at rest (rest declared in base rules) |
| Icon A ↔ icon B in one slot | Communicative | Instant target coordinates; no tween                         |

See `skills/animating-icons/references/TECHNIQUE.md` § Reduced motion.
