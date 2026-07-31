---
name: animating-icons
description: Use when authoring, reviewing, or batch-producing hover animations for SVG icons — a Hugeicons/Lucide/Phosphor glyph that should move on hover, an icon library where every icon needs its own gesture, an existing icon animation that reads as generic jiggle, or icons that morph into each other (menu↔cross, play↔pause). Triggers on animated icon, icon hover, per-icon animation, icon gesture, icon morph, morphing icons, stroke-dashoffset draw-on, pathLength, transform-box, transform-origin, icon keyframes.
---

# Animating Icons

## Overview

An icon is not a picture you move. It is an object that **does something**, and the animation is that thing happening once.

**Core principle: the gesture is the icon's meaning acting on itself.** A bell rings, a plug disconnects, a package lands, a branch is written. The motion has to be something only *that* object could do.

This is the whole difference between a library worth starring and 400 icons that wobble. Existing animated-icon libraries fail here constantly: `lucide-animated`'s search icon translates the entire `<svg>` by `x:[0,0,-3,0], y:[0,-4,0,0]` — nothing inside the glyph moves relative to anything else, and those exact keyframes would look identical on any of its 435 icons. That is decoration. It is not what we are making.

## The swap test

**Could these exact keyframes be pasted onto a different icon and still look fine?**

If yes, it is decoration. Delete it and start over. Run this twice: once when you have the idea, before writing any CSS, and once on the finished icon.

| Fails | Passes |
|---|---|
| Whole `<svg>` shakes / bounces / spins | One part moves against another part |
| Every icon in a batch got the same recipe | The recipe was chosen from the icon's verb |
| "Pulse" or "wiggle" applied to a noun | The object's own mechanism operates |
| Motion decorates the glyph | Motion *is* the glyph doing its job |

## The four gates

Every icon passes all four, on both review passes. No exceptions, no "close enough at 16px."

1. **Swap test** — the gesture is unique to this icon's meaning.
2. **Rest test** — frame 0 and the final frame are **pixel-identical to the untouched source glyph**. Verified with a difference overlay, not by looking. The library ships icons people already use; hovering one must never change what it looks like afterward.
3. **Strip test** — render the paused frame strip. Every intermediate frame still reads as the icon, not as a pile of disassembled parts.
4. **Motion test** — read the delivered motion back off the browser's own computed matrix and differentiate it. Peak speed under the aliasing ceiling, minimum speed ~0 in any beat that is meant to stop, and any ratio you claimed between two parts actually measured.

**Verify by rendering, never by reasoning — and verify motion by measuring, because rendering cannot show it.** Every real geometry bug this technique has produced was invisible in the code and obvious in the strip; every real *timing* bug was invisible in both, and only the numbers found it. See `VERIFY.md` for the harness.

The one licensed exception to gate 2 is a deliberate redraw: when the author decides the icon should rest as a *different* picture (a reframed viewBox, a corrected pose). That is a design decision, stated out loud, not a tolerance. You still verify the new rest is exactly the new intended picture, pixel for pixel.

## Landing on rest

Gate 2 takes one sentence to state and it is the constraint that actually shapes gestures, because a performance that ends somewhere new fails it. Decide which of these four brings the icon home **before** designing the beats. They are in order of cost: the first two are free, the third costs a covered instant, the fourth costs a beat.

**1. Symmetry** — end on a rotation or reflection that maps the drawing onto itself. **Measure the symmetry, never count the lobes.** Icon sets optically adjust radial shapes, so the exact order is usually lower than the shape advertises. Rotating Phosphor `GearSix`'s 773 sampled outline points about its axis and taking each point's distance to the nearest original: 60° → 2.113u, 120° → 2.131u, **180° → 0.086u**. Six teeth, exactly two-fold. So a one-tooth index can never land clean and a three-tooth index is pixel-exact — the drawing chose the throw, not the author.

**2. Congruence** — parts that are identical up to a translation can end **swapped**, because the picture depends only on which slots are filled, not on which element sits in which. This is what buys a one-way gesture on an icon that must rest unchanged, and it is the most reusable idea in this kit. Kanban's two cards are congruent at Δx = +144 exactly, so they swap and stay swapped. ListChecks' three rows are congruent at one row pitch, so three elements rotating through three slots come home after **two** turns instead of three. Check congruence on absolute point sets, never on command fingerprints: `H84` and `h48` can be the same point, and the fingerprint will tell you they are not.

**3. Re-arm while genuinely invisible** — one element plays a part repeatedly by jumping between two states where nothing can see it: outside the clip, behind another part, at `opacity: 0`, at `scale(0)`. Put the jump on two keyframes a hundredth of a percent apart, and **prove the instant is invisible by measurement, not by geometry**.

**4. Return** — when none of the above exists, the gesture goes out and comes back. That is a real answer, not a failure, but the return has to be given a reason and a different character from the outward leg or it reads as an undo. A geared clock can only land one-way after twelve hours (hour −30T and minute −360T are whole turns together only when T is a multiple of 12), and twelve minute-turns strobes, so the honest mechanism is the one a rewind knob actually has: wound back, then released.

If you cannot name which of the four you are using, you do not have a gesture yet.

## Choose the mechanism

Before you touch a keyframe, decide which of four things is actually happening. Most wasted work in this technique is a morph where a transform would do, or a deform where the object is really rigid.

| What is happening | Reach for | Not |
|---|---|---|
| A part slides, turns, or drops; the shape does not change | a CSS **transform** on a wrapper `<g>` (translate / rotate / scale) | a morph — rigid things do not deform |
| The shape itself genuinely changes: paper bends, a book closes, a finger folds | a **`d`-morph** — the path authored twice, identical command structure, CSS `d` interpolated (see `MORPH.md`) | `scaleY`/`skew` fakery — a shear reads as squashing, not bending |
| Something goes **inside** a container, **in front of** another part, or is a **hole** in a filled shape | a **mask** or **clipPath** carrying the mover's own silhouette | opacity; z-order — strokes do not occlude |
| A line is written or erased | **`stroke-dashoffset`** | a fade |
| One UI slot where **any icon becomes any other** (menu↔cross, play↔pause, arrow directions) | the **three-line morph system** — every icon is exactly three `<line>`s, rotation groups rotate, everything else tweens coordinates (see `ICON-MORPH.md`) | a crossfade; hand-matching `d` structures per pair |

**The rigid-versus-deform call is the one people get wrong.** A stack of layers, a tray, a set of cards, a chevron closing over a pill — these look like they deform, and they do not. A chevron is just what a whole pill looks like when the pill above it covers most of it. The layers stay whole and slide; the covering is occlusion. Ask every time: is this the *object* changing shape, or my *view* of a rigid object changing? It is almost always the second, and the second is a transform, not a morph.

**Matching command structure only buys a morph that runs, not one that is right.** Which point becomes which is a separate decision, and it is where multi-part morphs actually fail: a stroke resampled by arc length maps a thumb onto a fingertip, a digit stroked the other way round in one drawing flips over, a part with no counterpart evaporates into a lump. `MORPH.md` § Correspondence.

**Prefer a hard-swap to a morph wherever coverage is provable.** If there is an instant when the changing part is fully hidden (behind another part, off the clip, under a mask), swap its `d` — or the whole element — discretely at that instant, on a hundredth-of-a-percent frame. No two paths to hand-match, no ugly interpolation to police, and the source arcs stay verbatim. Morph only when the material genuinely bends *and* there is no covered instant to swap at. This one call saved three rebuilds in the fill set.

## Procedure

### 1. Read the geometry first

Before designing anything, open the source. Count the elements, read the `d` attributes, find the real coordinates. Hugeicons free ships every icon **already split into separate `<path>`/`<circle>` elements** (24×24 box, stroke 1.5, round caps; ~80% of icons have ≤4 parts) — the parts you need to move are usually already separate elements, which is the expensive half of this job done for you.

You are looking for: where the hinge actually is, which line is the one that means something, what is symmetric, what is already a closed path you could draw on.

**If the source is a hand-drawn storyboard** — a Figma frame with several poses side by side — the frame and layer names are the brief, and every pose is a keyframe to pass through. The MCP flattens a parent vector frame to one image, so pull the canvas at depth 3 to see the sub-frames, and download each pose by its own node id. Before designing, classify the second drawing: a byte-identical duplicate (there is only one state, and its title is the whole brief), the original translated (command structures already match, so the morph is free), or a fuller redraw (you cannot have both "rest is the old original" and "the moving parts are the new drawing" — pick one and say so out loud). Then overlay the poses and write down what changed. That list is the mechanism. Full method in `MORPH.md`.

### 2. Name the verb

One sentence, and it must be a verb the *object* does, not a shape description.

- ✅ "a magnifier sweeps across a surface and stops on something"
- ✅ "a plug comes out of a socket and goes back in"
- ❌ "a circle with a handle" / "it should feel lively"

If you cannot name a verb, the icon is a noun with no mechanism (a heart, a square). Those get the smallest treatment in the catalog, not an invented one.

### 3. Pick the one part that carries the verb

Almost always exactly one. The rest of the glyph holds still and is what the moving part is read *against*. A part moving against a fixed frame reads as motion; the whole glyph moving reads as nothing.

### 4. Choose a family

Do not invent a gesture per icon — 5,400 icons is not an art project, it is a production line. Pick from the catalog in **`FAMILIES.md`**: draw-on, travel-and-return, hinge, separate-and-rejoin, fall-and-land, fill-and-drain, pulse-from-source, step-and-hold, free-revolution, contents-in-frame, reshape, icon-swap. Each family is a keyframe recipe parameterised by the icon's own geometry.

Reaching for a new family is allowed and should be rare. Add it to `FAMILIES.md` when you do.

### 5. Decide how it lands

Name which of the four in § Landing on rest is bringing the icon home, and check it now rather than discovering at the end that the gesture cannot finish. This is not bookkeeping: the landing routinely decides the gesture's own numbers. The gear indexes THREE teeth and not one because three is the only throw its drawing is exact at; the clock winds back and is released rather than rewinding one way because a 12:1 train has no one-way landing short of twelve hours.

### 6. Derive every number from the geometry

**Measure, do not taste.** This is what separates this technique from tuning by feel, and it is why it scales: the number is *findable*, so it is not a decision.

Worked example, from the shipped Phosphor set — the key toss rotates exactly 45° before flipping, because Phosphor draws the key on an exact diagonal (shaft runs dx −55.22, dy +55.22). 45° is that diagonal cancelled out, which lands the shaft horizontal so the flip rolls about the key's own length instead of squashing the picture. Not a taste value. A measurement.

When a number genuinely has no geometric source (a dwell, a decay ratio), it comes from the budget table below, not from the vibe.

### 7. Write it

Constraints, all non-negotiable:

- **CSS keyframes, no JS animation library.** These fire constantly and must run off the main thread. It also means the icon has zero runtime dependency and works in every framework — the reason `lucide-animated` needed four separate community ports. The one scoped exception is the **icon-swap family** (`ICON-MORPH.md`): that is a state transition driven by app state, not a hover gesture, and it tweens line coordinates with Motion by design.
- **Nothing that triggers layout.** `transform` and `opacity` are the cheap pair; `stroke-dashoffset` and `stroke-dasharray` are paint-level and fine; `d` is the morph (`MORPH.md`) and `visibility` is the gate (failure #13), both discrete and both needing **both ends stated** (failure #16). Never `width`, `height`, `x`, `y`, `r`, `cx`, `cy`.
- **Nothing in `px` outside the `<svg>`.** Inside an SVG, CSS transform lengths are *user units* and scale with the viewBox for free, so one keyframe set serves 16px and 96px. A transform on an HTML wrapper element is real screen px and silently breaks at every other size. See `TECHNIQUE.md` § Units.
- **Authored to end on the resting picture.** The last keyframe is the rest state. Never rely on the animation being removed to get back.
- **Declare the rest state in a base rule**, not only in the `0%` keyframe. See failure #2.

### 8. Verify, then verify again

Run `VERIFY.md`. Second pass on a different day, or at minimum after the whole batch, with fresh eyes.

## The budget

Two different budgets. Confusing them is the most common mistake.

**Gesture** — a discrete performance that plays once on hover and returns to rest. This is what this library ships.

| | |
|---|---|
| Duration, ONE event | **600–1100ms** |
| Duration, N countable beats | **~350–400ms per beat** — three beats is legitimately 1.0–1.3s |
| Dwell before it starts | 130ms of hover intent |
| Abandoned mid-flight | speed up ×2.2, never cancel |
| Travel / rotation | whatever the gesture needs — these are performances, not feedback |

The "keep UI under 300ms" rule does **not** apply here, and applying it produces limp icons. That rule governs state changes the user is *waiting on*. A gesture is something they are *watching*.

**Derive the number from the set, not from this table.** A duration is only wrong relative to its neighbours, so read the distribution you are shipping into before choosing:

```bash
grep -oE 'animation: *lg-[a-z0-9-]+ +[0-9.]+s' Board.tsx | grep -oE '[0-9.]+s' | sort -n | uniq -c
```

The set that produced this skill runs 0.62s to 1.72s, clustered at 0.85–1.3, and the outliers are all multi-beat: a three-page calendar tear at 1.24s, a six-pose hand at 1.55s, a recursive tree at 1.5s. A tear shipped at 129ms was not "snappy", it was 3.5× faster than anything else on the board, and that comparison is the whole diagnosis.

**Beats have to be countable.** Below ~250ms per beat a viewer stops resolving them as separate events and reads one blur; that is what a 243ms tear failed at. And anticipation needs real time inside the beat — 40ms of wind-up reads, the same 8% of a shorter beat is 19ms and does not.

**Reduced** — the same icon dropped into a sidebar row someone hovers dozens of times a day. If the library ships this tier, derive it from the gesture; do not author it separately.

| | |
|---|---|
| Duration | 140–220ms |
| Translate | ≤1px · Scale ≤1.10 · Rotate ≤16° |
| Shape | holds while hovered, unwinds on leave — never performs twice |

**Which budget: ask how often it is seen.** The two tiers are the frequency rule from `web-animation-design` applied to icons. That skill gates on how often a user meets the animation: seen 100+ times a day → do not animate, or barely; occasional → standard; rare or first-run → it can be special. An icon met once while browsing a library is *rare*, which is what buys the Gesture tier its 600–900ms. The same icon sitting in a sidebar row someone hovers all day is *100+/day*, which is the Reduced tier — and 140–220ms lands squarely in that skill's own micro-interaction bucket (100–250ms). Same icon, different context, different budget. Decide which context you are shipping for before you pick a number.

## Playback contract

Play once on hover, **guaranteed to finish**. Driven off `:hover` alone, leaving the row kills the animation mid-flight and snaps the icon back to rest — that was the single ugliest frame in the entire Phosphor set. Dwell guards the start; `animation.finished` guards the end. Implementation in `TECHNIQUE.md` § Driver.

Every animated icon honours `prefers-reduced-motion: reduce` by dropping to `animation: none` and sitting at its rest state, which is already correct because of gate 2.

## Rationalizations

| Excuse | Reality |
|---|---|
| "It's 5,400 icons, I can't derive every number" | That is what `FAMILIES.md` is for. The family carries the recipe; you supply this icon's coordinates. If you are guessing numbers you skipped step 1. |
| "A generic pulse is fine for the boring ones" | The boring ones are most of the library. Generic motion on 3,000 icons is what the library will be judged as. Use the smallest honest family instead. |
| "It looks fine at 24px" | Ship-size is not review-size. Review at 96px and on the frame strip; bugs invisible at 24px are the ones users screenshot. |
| "The rest state is basically identical" | Basically is not identical. Run the difference overlay. This one has bitten this technique three separate times. |
| "I'll verify the whole batch at the end" | Two passes per icon is the stated bar. A batch review catches layout bugs, not motion bugs. |
| "The whole-icon shake reads fine" | It reads fine and it means nothing. That is exactly the bar the competing library sets and the reason to build this one. |
| "The gesture is mechanically perfect, ship it" | Perfect and pointless is still filler. A flawless gesture on an icon nobody has a story for gets cut. Meaningful beats correct — spend the effort where the verb is one a person actually feels. |

## Red flags — stop and re-derive

- You wrote the keyframes before opening the source `d` attribute
- You cannot name which of the four landings brings the icon home
- A curve was chosen by its name for something that turns more than about 90°, without computing its peak slope
- A "step" or a "tick" whose minimum speed you have not measured
- Two parts were given a stated ratio but different timing functions
- A probe returned 0 and you did not show it capable of returning anything else
- The transform applies to the root `<svg>` rather than a child
- Two icons in the batch share keyframe values that were not derived from matching geometry
- A number ends in 0 or 5 and you cannot say where it came from
- `ease: linear` on anything that is not a spin or a marquee
- The animation looks right only because it is small

## Reference

- **`FAMILIES.md`** — the gesture catalog. Start here for any new icon.
- **`EXAMPLES.md`** — four golden examples worked end-to-end (hinge bell, travel-and-return send, sequenced draw-on, three-line icon-swap with real coordinates): every number annotated with where it came from. Copy the shape, derive your own numbers.
- **`MORPH.md`** — the vector-morph technique: authoring two paths, matching command structure, **correspondence (which point becomes which, and why arc length is not it)**, recovering geometry that is not in the file, and when NOT to morph. Read it before any hand-gesture or shape-change icon.
- **`ICON-MORPH.md`** — icon-to-icon morphing: the three-line system where every icon is exactly three SVG lines (extras collapsed to invisible center points), rotation groups for same-shape icons, coordinate tweening for everything else. Read it when icons swap into each other's place rather than gesturing.
- **`TECHNIQUE.md`** — SVG/CSS mechanics, the failure catalog, the playback driver, units.
- **`VERIFY.md`** — frame strips, difference overlays, the noise floor, the two-pass review.

**BACKGROUND (use if installed, not required):** `web-animation-design` for the duration/easing rules and the frequency gate; `emil-design-eng` for easing and duration judgment; `animation-craft` for the project's motion vocabulary. This skill stands alone without them — the budget table and `TECHNIQUE.md` § Easing carry the essentials.
