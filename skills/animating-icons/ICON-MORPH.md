# Icon-to-icon morphing — the three-line system

The technique for **state-swap icons**: one slot in the UI where any icon must be able to become any other icon. The hamburger that rotates into a cross, play that becomes pause, arrow-right that turns to point down. Not a crossfade, not an opacity trick — the lines themselves move.

Source: [benji.org/morphing-icons-with-claude](https://benji.org/morphing-icons-with-claude). This is a different tool from the hover-gesture kit (`FAMILIES.md`) and from the `d`-morph (`MORPH.md`): it trades per-icon fidelity for universal morphability, and it is the right call only when icons genuinely swap into each other's place.

---

## The key insight

> Every icon should use exactly three SVG lines. Icons that need fewer collapse the extras to invisible points. This means any icon can morph into any other, since they share the same underlying structure.

Every icon, regardless of complexity, is exactly **three `<line>` elements**. Unused lines collapse to a point at the center — `{ x1: 7, y1: 7, x2: 7, y2: 7 }` with `opacity: 0` so you don't see a dot. Because every icon shares the same structure (three lines, eight coordinates each pose), any icon can interpolate into any other with no structure-matching work at all.

The naive first answer — an `AnimatePresence` wrapper that crossfades between SVGs — is technically correct and wrong: the icons fade out and fade in, and there is no sense of transformation. Reject it.

## Mapping icons onto three lines

Some icons map naturally, others need creativity:

| Icon | Mapping |
|---|---|
| menu | three horizontal bars |
| plus | vertical + horizontal, third collapsed |
| cross | plus rotated 45° |
| minus / equals | one / two horizontals, rest collapsed |
| check | two lines for the legs, third collapsed |
| play | three lines forming a triangle, each sharing endpoints with the others |
| pause | two parallel vertical bars, third collapsed |
| arrows | shaft + two head lines |
| chevrons | the two head lines, no shaft |

The reference set is twenty-one icons: menu, cross, plus, minus, equals, asterisk, more, check, play, pause, download, upload, external, arrow →↓←↑, chevron →↓←↑.

When play morphs to pause, one line collapses while the other two separate into parallel bars — the collapse mechanic is doing gesture work, not just bookkeeping.

## Rotation groups

The bug you only find by clicking through transitions: arrow-right to arrow-down looks janky when the coordinates morph, because the lines bend and warp mid-flight. Arrow-right and arrow-down are the **same shape rotated 90°** — so rotate, don't morph.

**Icons in the same rotation group share one set of coordinates and differ only by a rotation on the group.**

| Group | Members | Increment |
|---|---|---|
| Arrows | →, ↓, ←, ↑ | 90° |
| Chevrons | →, ↓, ←, ↑ (same shape as arrows, without the shaft) | 90° |
| Plus / Cross | the same perpendicular lines | 45° |

Within a group: animate `rotate` only, coordinates untouched. It just works. (Watch for rotations that overshoot the short way round — pick the direction with the smaller sweep.)

## Cross-group morphs

Between different groups, the lines interpolate through coordinate space — each of the three lines tweens its `x1 y1 x2 y2` to the target icon's values, with **Motion** (framer-motion) handling the tweening. These are the transitions that feel most magical: shapes genuinely transforming into other shapes. Arrow-to-check is the canonical showpiece.

So the full decision per transition is one branch:

1. Same rotation group → animate rotation only.
2. Different group → tween the three lines' coordinates.

## Build process

The architecture in one line: **three lines per icon, rotation groups for same-shape icons, coordinate morphing for everything else.**

The starter prompt, verbatim from the article:

> Build an icon component where any icon can smoothly morph into any other. Every icon should use exactly three SVG lines. Icons that need fewer lines collapse the extras to invisible center points. For icons that are the same shape at different rotations (like arrows), use rotation instead of coordinate morphing.

From there, it's iteration: **play with the result, notice what's wrong, describe it, repeat.** The machine can't tell when something looks wrong — it optimises for *working* rather than *feeling right*. The rotation-groups insight itself came from a human watching arrow-right→arrow-down and calling it janky. Budget for that loop; it is where the quality comes from.

**Build a sequencer.** A dev-only tool that queues arbitrary icon sequences and cycles through them on click. It turns "something feels off" into "transition 3→4 in this exact sequence feels off, because…", which is the feedback the iteration loop runs on. With hundreds of possible icon pairs, not every transition takes the ideal path — some morphs have awkward intermediate states, some rotations overshoot — and the sequencer is how you find which ones.

## When to use this vs. the rest of the kit

| Situation | Tool |
|---|---|
| One UI slot where icons swap state (menu↔cross, play↔pause, sort arrows) | **This file** — three-line morph |
| An icon performs its own gesture on hover and returns to rest | `FAMILIES.md` |
| A single icon's shape genuinely bends (book closes, hand folds) with full source fidelity | `MORPH.md` — CSS `d` morph |

The three-line constraint is lossy by design: a 21-icon utility set (arrows, chevrons, playback, math marks) fits it; a 24×24 multi-path glyph library does not. Do not force a Hugeicons duotone through three lines, and do not hand-match `d` structures for a hamburger↔cross toggle when three lines and a rotation would do.

## How the four gates apply here

- **Gate 2 (rest test) is per icon, not per transition.** A transition deliberately ends on a *different* icon — that is the point. What must hold: each icon's three-line pose is stable, and morphing A→B→A lands back on A's exact coordinates.
- **Gate 3 (strip test) becomes the sequencer.** The intermediate frames of a morph will not read as either icon; what they must read as is *transformation*, not noise. Awkward intermediate states are the thing to hunt.
- **The swap test inverts.** Here every icon *sharing* the structure is the feature. The test that replaces it: does the transition read as the lines transforming, or as a crossfade? A crossfade fails.
- **CSS-only does not apply** — this family is a JS-driven state transition (SKILL.md step 7, the scoped exception).
