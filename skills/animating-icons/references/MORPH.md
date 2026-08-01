# The vector morph

The tool for the **Reshape** family ([FAMILIES.md](FAMILIES.md) #11): when the shape itself changes and no transform can fake it. A book folds shut, a closed envelope opens into a tent, a hand curls into a sign. This is the one technique in the kit that is genuinely different, and it is the one people reach for too early. Read § When not to morph first.

The core idea is small: author the path **twice**, once per pose, with the **same command structure** — same `M / C / L / Z` sequence, same number of points, only the coordinates differ — and animate the CSS `d` property between them. Chrome interpolates every point one-to-one, so a genuine transformation happens with zero opacity.

```css
@keyframes ig-close {
  0%   { d: path("…open…");   animation-timing-function: cubic-bezier(0.77,0,0.175,1); }
  46%  { d: path("…closed…"); }
  60%  { d: path("…closed…"); animation-timing-function: cubic-bezier(0.77,0,0.175,1); }
  100% { d: path("…open…"); }
}
```

Rest lives on the element's own `d` attribute, and the last keyframe returns to it.

---

## Before anything: classify the second drawing

When the source is a hand-drawn storyboard, the second pose is one of three things, and each implies a completely different build. Work out which **before** writing any code. The test is mechanical, so run it rather than eyeballing.

| What it is | How to tell | What it means |
|---|---|---|
| A byte-identical duplicate | the path strings compare equal | There is only ONE state. The frame title is the whole brief. |
| The original translated | same point count, a constant delta on every coordinate | They duplicated and edited. Command structures already match, so the morph is free. |
| A separate, fuller redraw | overlaying the pieces does not reproduce the original | You cannot have both "rest is the old original" and "the moving parts are the new drawing." Pick one, and **say so out loud** instead of quietly working around it. |

**Before any of that: check whether the set already ships the other state.** Icon libraries are full of pairs — `Folder`/`FolderOpen`, `Lock`/`LockOpen`, `Eye`/`EyeClosed`, `Bell`/`BellRinging`. When one exists, **that drawing IS the second pose.** Do not author one, and do not approximate it with a transform: an approximated open folder (a −14.8° skew plus a 0.86/0.778 scale) measured **2649px** off the real one, and no affine map could ever have reached it, because the open slab's top edge is 162u against a 179u base and an affine transform cannot narrow one end of a rectangle more than the other. Check the library before you draw.

And when the two states differ in their **white** — a gap that opens, a notch, an aperture — do not morph the compound path and let the hole interpolate. The gap becomes a different shape on every frame, which at ship size reads as a hairline slot cracking open rather than a thing opening. Move a part and let the background be uncovered instead; the white is then never drawn and never interpolated.

The composition test: render the pieces composed, render the original, diff. If a front hand disagrees with the clasped original on tens of thousands of pixels at 25×, that settles the question instantly — do not spend two rebuilds avoiding the answer.

**The command fingerprint is the fastest 30 seconds in the job.** Print each path's command letters:

```python
struct = lambda d: "".join(re.findall(r"[MCLZmclz]", d))
```

Two paths with an identical fingerprint are a morph pair the author made by duplicating a path and dragging points. That tells you the technique before you have designed a single beat.

---

## Making the command structures match

If they duplicated and edited, they already match and there is nothing to do. Otherwise:

- **Subdivide a cubic** (de Casteljau at t=0.5) to turn one `C` into two. The curve is unchanged, only its parameterisation, so rest stays pixel-identical.
- **Collapse spare segments onto a point**, for a shape that exists in only one state. The collapse target must be **a point a stroke already paints**, so the round caps are buried under ink that is already there. A fingertip that collapses onto the knuckle where the original already draws a round join paints the same disc, and rest is untouched.
- **Collapse onto the drawn edge, command for command.** Laying a flap onto the straight chord between its hinge vertices leaves a hairline if the real rim bows off that chord. Re-sampling anchors *and* control points onto the drawn curve still leaves a fainter one, because a cubic does not pass through its control points. What works is exact: make the collapsed shape **be** the drawn edge, command for command, with the spare segments zero-length at each end.

---

## Correspondence: which point becomes which

Matching command structure only buys you a morph that *runs*. It says nothing about whether the right point goes to the right place, and every ugly morph this technique has produced was a correspondence bug, not a structure bug. The whole Love rebuild was this section.

### Arc length is not correspondence

The single most expensive mistake. Resampling two poses to the same anchor count "evenly along the stroke" is only correct if both poses spend their length on the same things in the same order. The moment one pose's outline detours somewhere the other's does not, every anchor after the detour is shifted, and the shift is silent.

Love's hand outline was one merged stroke of palm + thumb + index, resampled by arc length. The open hand's outline detours around the thumb; the heart's runs straight up the index. So anchors 18-22 were the **thumb** (x64-84, y48-56) in one pose and the **index fingertip** (x64-74, y10-33) in the other. Those five points travelled 25-45 units against a mean of 15, and what a person sees is *the thumb morphing into the pointer while the pointer disappears*. Which is exactly how it was reported.

**Match anatomy, not length.** Slice the merged stroke into parts and give each part its own path and its own morph, so every element only ever becomes itself.

### Slice at the shape's own anchors

Cutting at an existing on-curve point costs nothing and is exact. Cutting at an arbitrary arc-length fraction needs a de Casteljau split, which is also exact. What you must never do is *merge* two segments to hit a target count, because merging cubics is a re-fit, and a re-fit is a guess wearing the author's coordinates.

So: pick the part boundaries at anchors, let each part's segment count be the **max** across the poses, and make up any shortfall by subdividing that part's longest segments. Counts only ever go up, and every number stays the author's digit or a de Casteljau product of one.

### Normalise stroke direction BEFORE any sub-split

An author redraws each pose freely, so the same digit can be stroked in opposite directions from one drawing to the next. Love's heart pose draws the middle finger 56.3→43.1 where the other two draw it 37.5→49.3 and 38.0→50.2. Left alone, the stroke's two edges morph into each other and **the finger visibly flips over** mid-gesture.

Detect it by picking the orientation that minimises total anchor travel; reversing is exact (same curve, reversed parameterisation, identical ink). Two rules about *how* you decide:

- **Decide along the animation order**, each pose against the one before it, not all of them against rest. Adjacent drawings are the most similar so the signal is strongest, and chaining guarantees the middle pose and the end pose agree with each other. Comparing both to rest independently picked *opposite* answers for two poses that have to match.
- **Do it on the whole stroke, before any tip split.** Reversing a half cannot fix it. Split at the tip first and you have already pinned one pose's left edge against the other's right edge.

### Split every finger at its tip

A finger, a leaf, a hook, anything stroked up one edge, over an extremum and back down the other, must be split **at that extremum** in each pose. If the tip lands on a different anchor index between drawings, the two edges morph into each other and the shape folds through a lump instead of bending.

Find the tip as the anchor farthest from the chord joining the part's two ends. On Love the ring finger's tip was off by one (anchor 3 in the open hand, 4 in the other two), and the index's inner edge was one segment open against seven in the heart, so grown as a single span it bunched into a wedge at the base.

### A part with no counterpart morphs onto what survives

When a part exists in one pose and not another, it has to go somewhere, and the choice reads. Love's thumb outer edge, which the heart's outline does not contain, was tried three ways:

| target | what it reads as |
|---|---|
| the palm/index junction | the thumb dissolving **into the palm** |
| a point on the surviving thumb | a stubby **lump inside the thumb** as it shrinks |
| **the surviving thumb's own stroke** | the thumb **folding in** |

Collapsing to a point is right for something small (a fingertip onto a knuckle). For anything with real length, morph it **onto the stroke that survives** so it comes to rest coincident with ink that is already there. Same fill, so there is nothing left to see, and the motion reads as the part folding away rather than evaporating.

### Velocity continuity when the morph passes through an in-between

A morph routed through a middle drawing is two keyframe segments. Ease both independently and the shape decelerates to a dead stop at the join and sets off again. Love's close spends 78% of its travel in 70% of its clock, and the original pair lost 17% of its velocity at the join (0.895 against 0.766), which is the hitch a person calls "not smooth".

Solve `endSlope₁ × avg₁ = startSlope₂ × avg₂`, with `avg = distanceFraction / timeFraction` per leg and the bezier slopes `y1/x1` and `(1−y2)/(1−x2)`. The wrapper carrying any rigid rotation has to be keyed to the **same** percentages and the **same** curves, or the two drift apart.

### When the artwork already looks right, fix the mapping and not the ink

Rebuilding Love from the author's original Figma strokes produced a correct morph and a rest state he rejected on sight: his source drawing has a tighter, more pinched thumb than the artwork that had already been tuned in the file. The fix that shipped changes **no artwork at all** and only re-slices what was there.

Check it as a **set difference** (pixels only in A, pixels only in B), not a raw pixel diff. Splitting a stroke adds round caps at the cut, which shows up as tens of pixels of antialiasing on a hundred thousand of ink and is not a finding.

---

## Chrome extrapolates `d` outside [0,1] — so anticipation and overshoot are free

Verified by rendering a two-state morph under `cubic-bezier(0.5,-0.9,0.4,1.9)`: at 12% it sat *below* its start pose, at 88% *past* its target. A timing function with `y1 < 0` gives a real wind-up past the rest pose; `y2 > 1` gives a real overshoot past the target. Neither needs an invented third drawing. One bezier can carry load, drive, overshoot and settle. Test the capability, do not assume it away and reach for a third pose.

---

## Recovering geometry that is not in the file

Four tricks did most of the real work on the hard morphs. All of them replace a guess with a measurement.

- **Centreline from a filled ribbon.** A fill-style shape has no line to send a spark along, but a stroked ribbon's outline runs out one edge and back the other, and the two edges pair one-to-one. Average the pairs, control points included, to recover the exact centreline. Confirm the pairing by checking corresponding endpoints agree, then sample by **arc length** so travel is constant-rate.
- **Pivot from a silhouette.** Project every point onto the object's own axis; the extreme is the end. Having the lever arm lets you state a throw in the units that matter (a 9.5° flick is *this many* px of tip travel at ship size).
- **Circle through three on-curve points.** Gives the centre and radius a blast or a bulge should scale about.
- **Convergence point from a pair of marks.** Two arrowheads colinear on one diagonal aim at their midpoint; scaling the pair about it makes "shrink" and "converge" the same transform.

Use the author's decimals verbatim. Rounding `71.3136` to `71.313` cost a visible antialias trace along a curve that vanished the moment the digits were restored.

---

## When NOT to morph

The mistake to avoid is reaching for a morph because it is the impressive technique. It is expensive to author (two hand-matched paths), brittle under edits, and invisible to code review when the command structures silently drift apart.

| The thing that happens | The right tool |
|---|---|
| Something travels | `transform` |
| Something is revealed or written | `stroke-dashoffset` |
| Something goes behind / inside something | `clipPath` or mask |
| A line opens to let something past | animated `stroke-dasharray` ([TECHNIQUE.md](TECHNIQUE.md) § a gap that follows) |
| A flap hinges toward the viewer | `scaleY` about the crease |
| A page turns about a binding | `scaleX` through edge-on |
| **The change happens while the part is hidden** | **a discrete hard-swap of `d` at the covered instant** — no structure-matching needed at all |

**Morph only when the material genuinely bends and the bend is visible the whole way.** A book closing is a morph; a book sliding is not. And if there is any instant where the changing part is fully covered, swap `d` discretely there instead ([SKILL.md](../SKILL.md) § Choose the mechanism) — a hard-swap at a provably covered frame needs no matched structure and lets the source arcs stay verbatim.

**A morph is only ever as good as its two drawings.** If the two poses are topologically far apart and the return leg skips the hand-drawn in-between, the per-point tween slides each control point in a straight line to its counterpart and passes through a shape that is neither pose. That is the "morphing rather than folding" tell. The fix is not in the CSS; it is redrawing the poses closer, or adding the missing middle frame, so every leg of the trip has a real drawing under it.

---

## Verifying a morph

**The correspondence diagram is the one diagnostic that finds these.** Reasoning about which anchor is which does not work; every correspondence bug above was invisible in the numbers until it was drawn.

1. **Colour each subpath, per pose, side by side.** Confirms parts map to parts before you look at points at all.
2. **Draw a line from every anchor's position in pose A to its position in pose B.** Coherent parallel bundles mean good correspondence. Long lines that cross each other are the bug, and they point straight at it.
3. **Print per-anchor travel.** `max/mean` much over 2 localises it to a span. Love's outline read min 13.8, max 61.3, mean 36.8, and the outliers were the thumb.
4. **Colour the parts in the live, paused animation.** This is what identifies *which* part is misbehaving mid-gesture, as opposed to which is wrong at the endpoints. The flipping finger and the lump inside the thumb were both found this way and neither is visible in the end poses.

Do this in path space, not world space, when a wrapper carries a rigid rotation: the rotation makes every displacement a chord and hides the signal.

Plus two morph-specific notes:

- **Splitting one path into several changes the antialiasing.** Coincident strokes in one path element are unioned before fill; in separate elements they composite twice, and an edge pixel at coverage `a` goes to `2a(1−a)`, up to 25% darker. Expect a small residue whenever you split, and judge it at **ship size**, not at 25× where it looks alarming and means nothing.
- **Diff at the same DOM position.** Two elements side by side rasterise differently for reasons that have nothing to do with the morph. Screenshot, set `element.innerHTML = REF`, screenshot again, diff. That drops a phantom 500-pixel difference to a handful.

**Getting the author's poses out of Figma.** The REST API's `geometry=paths` returns *outlined stroke geometry* — 47 subpaths for one hand, every stroke converted to a filled loop — which is useless for a morph and sends you into ribbon-pairing to recover centrelines. `GET /v1/images?ids=…&format=svg` returns the real stroked paths. Pull the canvas at depth 3 first, because the author's layer names are the brief and a parent frame flattens to one image.

**And suspect the harness.** A raw pixel diff twice reported thousands of "missing" pixels on a pose that was in fact identical; it was the framework's dev badge sitting in the corner of the screenshot. A set difference, reported as *only-in-A* and *only-in-B* separately, makes that obvious instantly.
