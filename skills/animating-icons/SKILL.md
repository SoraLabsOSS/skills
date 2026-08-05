---
name: animating-icons
description: >-
  Author, review, or batch-produce SVG icon hover gestures and icon↔icon morphs
  (Hugeicons/Lucide/Phosphor). Use for animated icon, icon hover, per-icon
  gesture, icon morph, menu↔cross, stroke-dashoffset draw-on, pathLength,
  transform-box. Not for page transitions, Lottie, or general UI chrome motion.
license: MIT. See LICENSE
compatibility: >-
  Verify with Node 18+; first run installs Playwright into
  ~/.cache/animating-icons-verify. Contact sheets use ffmpeg if present,
  else Playwright. Default: node scripts/verify-icon.mjs (all OS). Hover
  gestures are CSS keyframes; icon-swap may use Motion.
metadata:
  author: SoraLabs
  version: "1.3.1"
  origin: https://github.com/kai956/animating-icons
---

# Animating Icons

An icon is not a picture you move. It is an object that **does something**, and the animation is that thing happening once.

**Core principle: the gesture is the icon's meaning acting on itself.** A bell rings, a plug disconnects, a package lands. The motion has to be something only _that_ object could do. Whole-`<svg>` shakes that would look identical on any glyph are decoration — delete them.

## Read next

| Situation                             | Open                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Hover gesture on one glyph            | [references/FAMILIES.md](references/FAMILIES.md), then [references/EXAMPLES.md](references/EXAMPLES.md) |
| Shape itself bends (book, hand, flap) | [references/MORPH.md](references/MORPH.md)                                                              |
| Icon A becomes icon B (menu↔cross)    | [references/ICON-MORPH.md](references/ICON-MORPH.md)                                                    |
| Authoring CSS / SVG / driver          | [references/TECHNIQUE.md](references/TECHNIQUE.md) + [references/FAILURES.md](references/FAILURES.md)   |
| Fill (Phosphor-style) ink             | [references/FILL.md](references/FILL.md)                                                                |
| Easing / peak speed                   | [references/EASING.md](references/EASING.md)                                                            |
| Done coding                           | [references/VERIFY.md](references/VERIFY.md) + `scripts/verify-icon.mjs`                                |

## The swap test

**Could these exact keyframes be pasted onto a different icon and still look fine?** If yes, it is decoration. Run twice: once on the idea, once on the finished icon.

| Fails                                     | Passes                                     |
| ----------------------------------------- | ------------------------------------------ |
| Whole `<svg>` shakes / bounces / spins    | One part moves against another part        |
| Every icon in a batch got the same recipe | The recipe was chosen from the icon's verb |
| "Pulse" or "wiggle" applied to a noun     | The object's own mechanism operates        |

## The four gates

Every icon passes all four. Verify by rendering — never by reasoning. Details in [VERIFY.md](references/VERIFY.md).

1. **Swap test** — gesture unique to this icon's meaning.
2. **Rest test** — frame 0 and final frame are pixel-identical to the source glyph (difference overlay). Licensed exception: a deliberate redraw, stated out loud.
3. **Strip test** — every intermediate frame still reads as the icon.
4. **Motion test** — peak speed under the aliasing ceiling; min speed ~0 in any beat meant to stop; claimed ratios measured off the computed matrix.

## Landing on rest

Gate 2 shapes the gesture. Name which landing you use **before** designing beats:

1. **Symmetry** — end on a rotation/reflection that maps the drawing onto itself. **Measure the symmetry, never count the lobes** (optical adjustment often lowers the true order).
2. **Congruence** — identical parts (up to translation) can end swapped; check absolute point sets, not command fingerprints.
3. **Re-arm while invisible** — jump state outside the clip / behind a part / at `opacity: 0` / `scale(0)` on a hundredth-of-a-percent frame; prove invisibility by measurement.
4. **Return** — go out and come back with a different character on the return leg (not a plain undo).

If you cannot name which of the four, you do not have a gesture yet.

## Choose the mechanism

| What is happening                                  | Reach for                                                        | Not                    |
| -------------------------------------------------- | ---------------------------------------------------------------- | ---------------------- |
| Part slides / turns / drops; shape unchanged       | CSS **transform** on a wrapper `<g>`                             | a morph                |
| Shape genuinely changes (paper bends, book closes) | **`d`-morph** ([MORPH.md](references/MORPH.md))                  | `scaleY`/`skew` fakery |
| Something goes inside / in front / is a hole       | **mask** or **clipPath**                                         | opacity; z-order       |
| A line is written or erased                        | **`stroke-dashoffset`**                                          | a fade                 |
| Any icon becomes any other in one UI slot          | **three-line morph** ([ICON-MORPH.md](references/ICON-MORPH.md)) | a crossfade            |

Ask every time: is the _object_ changing shape, or my _view_ of a rigid object? Almost always the second → transform. Prefer a hard-swap at a covered instant over a morph when coverage is provable.

## Procedure

1. **Read the geometry** — open the source; count elements; find hinges, seams, symmetry. Hugeicons free is usually pre-split. Hand-drawn storyboards: classify the second pose (byte-identical / translated / fuller redraw) before designing — see [MORPH.md](references/MORPH.md).
2. **Name the verb** — one sentence the _object_ does ("a plug comes out"), not a shape description.
3. **Pick the one part** that carries the verb; the rest holds still as the frame.
4. **Choose a family** from [FAMILIES.md](references/FAMILIES.md). Do not invent a gesture per icon.
5. **Decide the landing** (symmetry / congruence / re-arm / return) — it often sets the numbers.
6. **Derive every number from the geometry.** Measure, do not taste. Dwells/decay ratios come from the budget table below.
7. **Write it** — non-negotiable constraints:
   - CSS keyframes, no JS animation library (exception: icon-swap / Motion).
   - No layout triggers. Prefer `transform` / `opacity`; `stroke-dashoffset` and discrete `d` / `visibility` OK. Never `width`/`height`/`x`/`y`/`r`/`cx`/`cy`.
   - No `px` on the root `<svg>` or HTML wrapper unless computed from `size` ([TECHNIQUE.md](references/TECHNIQUE.md) § Units).
   - Last keyframe is rest. Declare rest in a **base rule**, not only at `0%` ([FAILURES.md](references/FAILURES.md) #2).
   - Animation names prefixed `ig-` so the driver and harness can count them.
8. **Verify** — run [VERIFY.md](references/VERIFY.md); second pass with fresh eyes.

## The budget

**Gesture** — plays once on hover (library browse = rare):

|                             |                             |
| --------------------------- | --------------------------- |
| Duration, ONE event         | **600–1100ms**              |
| Duration, N countable beats | **~350–400ms per beat**     |
| Dwell before start          | 130ms                       |
| Abandoned mid-flight        | speed up ×2.2, never cancel |

Derive duration from the set you ship into, not vibe:

```bash
grep -oE 'animation: *ig-[a-z0-9-]+ +[0-9.]+s' . | grep -oE '[0-9.]+s' | sort -n | uniq -c
```

Beats below ~250ms blur into one event. Anticipation needs real time (~40ms+), not a percentage of a tiny beat.

**Reduced** — sidebar / 100+ hovers a day: 140–220ms, ≤1px translate, scale ≤1.10, rotate ≤16°, holds while hovered. Ask how often it is seen before picking a tier.

## Playback contract

Play once on hover, **guaranteed to finish**. Drive off `data-go` + dwell, not bare `:hover` ([TECHNIQUE.md](references/TECHNIQUE.md) § Driver). Honour `prefers-reduced-motion: reduce` with `animation: none` (safe only because of gate 2). Icon-swap under reduce: instant coordinate set, no tween.

## Done checklist

- [ ] Landing strategy named (one of four)
- [ ] Family chosen from [FAMILIES.md](references/FAMILIES.md); numbers derived from this glyph
- [ ] Rest declared in base rules; `ig-` prefix on animation names
- [ ] `scripts/verify-icon.mjs` run (or equivalent strip + rest shots); sheet Read
- [ ] Difference overlay clean at frame 0 and final
- [ ] Motion: peak under ceiling; holds actually stop (~0 speed)
- [ ] Swap test against another family's icon
- [ ] Reviewed at 24px and 96px; `prefers-reduced-motion` sits at rest
- [ ] Duplicate-id safe if the icon can appear twice
- [ ] Second pass done

Full gate list: [VERIFY.md](references/VERIFY.md).

## Red flags — stop and re-derive

- Keyframes written before opening the source `d`
- Cannot name the landing
- Curve chosen by name for a large turn without computing peak slope ([EASING.md](references/EASING.md))
- Transform on the root `<svg>`
- Two icons share keyframe values not derived from matching geometry
- A number ends in 0 or 5 with no geometric source
- `ease: linear` on anything that is not a spin or marquee
- Looks right only because it is small
- Probe returned 0 and was not shown capable of returning non-zero
