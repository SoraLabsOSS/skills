# Technique: SVG/CSS mechanics

Everything here was paid for once already. Read the failure catalog before authoring, not after.

---

## The failure catalog

Seventeen ways an icon animation breaks. Most are invisible in code review and obvious in a frame strip.

### 1. The gesture is cut off on hover-out

**Symptom:** sweep the pointer across a list and every icon snaps from wherever it had got to straight back to rest. The ugliest frame in the set is the one where the gesture never finished.

**Cause:** driving the animation off `:hover`. The instant the pointer leaves, the rule stops matching, the animation is torn off, and the element jumps to its base style.

**Fix:** the gesture is a discrete event, not a hover state. Start it after a dwell, and clear it only when the animation has actually **finished**.

```js
const DWELL = 130;      // ms of intent before a gesture is earned
const EXIT_RATE = 2.2;  // how fast an abandoned gesture wraps up

const play = (el) => {
  el.setAttribute("data-go", "");
  // getAnimations() flushes style, so freshly-matched rules are already live
  const running = el.getAnimations({ subtree: true }).filter(isOurs);
  if (!running.length) return void el.removeAttribute("data-go");
  Promise.allSettled(running.map((a) => a.finished))
    .then(() => el.removeAttribute("data-go"));
};
```

On pointer-out: if the dwell has not elapsed, cancel the timer (nothing has moved yet). If the gesture is already running, **do not cancel it** — raise its playback rate so it wraps up instead of performing to an empty seat:

```js
el.getAnimations({ subtree: true }).filter(isOurs)
  .forEach((a) => a.updatePlaybackRate(EXIT_RATE));
```

Use a **data attribute, not a class**. In React, `className` is a prop: any re-render patches the class straight off the element mid-gesture. React does not touch attributes it was never given.

---

### 2. No rest state declared

**Symptom:** the icon looks subtly different before and after hover. A shape is heavier, a band is present, a wave is at full amplitude when it should be flat.

**Cause:** *a keyframe's `0%` only exists while the animation is attached.* At rest there is no animation at all, so the element falls back to its base rule — and with no base rule that means `transform: none`, `opacity: 1`.

This bit three separate glyphs in the Phosphor set. The sparkle's ripple bands defaulted to `opacity: 1` at `scale(1)`, parking two translucent rings exactly on the star's outline and permanently dimming its rim by 60%; the resting star was thinner than the hovered one and hovering appeared to fatten it.

```css
/* WRONG — at rest this is scaleY(1), i.e. full wave */
.wave { }
@keyframes ripple { 0% { transform: scaleY(0.05) } ... }

/* RIGHT — the rest state said out loud */
.wave { transform: scaleY(0.05); }
```

`animation-fill-mode: both` covers the **delay**. Only a base rule covers **rest**. Any element whose rest value is not the identity transform / `opacity: 1` needs one.

---

### 3. Transform list mismatch

**Symptom:** the element snaps between two keyframes instead of interpolating.

**Cause:** CSS can only interpolate two `transform` values componentwise when the function lists match. `translateY(0)` → `translateY(0) rotate(0) scale(1)` is a list of one against a list of three; the browser falls back to matrix interpolation or a discrete jump.

```css
/* WRONG */
0%  { transform: translateY(0); }
36% { transform: translateY(0) rotate(0deg) scale(1); }

/* RIGHT — every frame writes the full list, in the same order */
0%  { transform: translateY(0) rotate(0deg) scale(1); }
36% { transform: translateY(0) rotate(0deg) scale(1); }
```

Rule: **pick the transform list for an element once, and write all of it in every keyframe**, including the identity values.

Corollary — if two transforms need *different timing functions*, they cannot live on one element, because `transform` is one property with one timing function per segment. Split them across nested elements. The key toss puts the parabolic arc on the outer wrapper and the linear spin on the inner one for exactly this reason.

---

### 4. Wrong pivot

**Symptom:** a part rotates or scales about a useless point and drifts across the glyph.

**Cause:** `transform-origin` on an SVG child defaults to a percentage of a box you did not choose. You must state both the box and the origin.

```css
/* pivot at a known point in viewBox coordinates */
.needle { transform-box: view-box; transform-origin: 128px 192px; }

/* pivot relative to the element's own bounding box */
.bar    { transform-box: fill-box; transform-origin: 50% 100%; }
```

- `view-box` — when the pivot is a real coordinate in the icon (a hinge, the dial centre, the emitter). Use this when several parts must share one pivot.
- `fill-box` — when the pivot is relative to the part itself (a bar growing off its own base).

Scaling a group about the **icon's** centre rather than each part's own centre is what makes a set of marks fly outward together instead of each merely growing in place. That is a `view-box` origin on the parent group.

---

### 5. A CSS transform wipes the SVG `transform` attribute

**Symptom:** a placed element flies off to raw artboard coordinates the instant its animation starts.

**Cause:** SVG's `transform=` is a presentation attribute. A CSS `transform` animation **replaces** it outright rather than composing with it.

**Fix:** put placement on a wrapper `<g>` and animation on the child. On a parent, placement and animation compose.

```jsx
<g transform="translate(-34,-20)">     {/* placement */}
  <path className="pill" d={D} />       {/* animation */}
</g>
```

---

### 6. Duplicate mask / clipPath ids

**Symptom:** the same icon rendered twice on a page — hovering the first animates the second, and the second never animates at all. Or every cell in a frame strip shows the first cell's mask.

**Cause:** `url(#id)` resolves document-wide. Two instances with a hard-coded id both resolve to whichever came first.

**Fix:** generate the id per instance.

```jsx
const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
const msk = `iconMask-${uid}`;
```

This also breaks the verification harness specifically: cloning an icon N times for a frame strip creates N duplicate ids. Rewrite ids per clone or the strip is a lie.

---

### 7. `non-scaling-stroke` reads CSS pixels

**Symptom:** a stroke authored as `stroke-width="20"` in a 256 viewBox eats the entire glyph.

**Cause:** Chromium's `vector-effect="non-scaling-stroke"` ignores the viewBox transform, so `stroke-width` is read in **CSS pixels**, not user units — unlike every other length in the file.

**Fix:** state it in the units the attribute actually listens to, scaled off the render size:

```jsx
strokeWidth={size * 0.044}   // ≈0.7px at 16px, still proportional if drawn larger
```

Worth the trouble: `non-scaling-stroke` is what keeps a growing ring one constant width, so it reads as a wave travelling rather than a shape inflating.

---

### 8. `pathLength="1"` leaves a hairline seam on closed paths

**Symptom:** a circle drawn with `stroke-dasharray: 1` has a visible nick at its start point **in the rest state**.

**Cause:** a dash of exactly 1 is exactly one lap, so the dash's two butt caps land on the same point.

**Fix:** hide at `1.02`, not `1`. Two percent of overlap runs the dash past its own start so the caps bury each other.

```css
.stroke { stroke-dasharray: 1.02; stroke-dashoffset: 0; }
```

Related: to re-arm a drawn path invisibly mid-animation, jump `stroke-dashoffset` on a hundredth-of-a-percent frame while the element is at `opacity: 0`:

```css
10%    { opacity: 0; stroke-dashoffset: 0; }
10.01% { opacity: 1; stroke-dashoffset: 1.02; }
```

Sign matters. `stroke-dashoffset` toward `+1` erases from the end; toward `−1` erases from the **start**, so the visible remainder shrinks toward the path's origin. Use the negative direction when a stroke should drain *into* something.

---

### 9. 3D transforms inside an `<svg>`

**Symptom:** a flip or a spin looks right in one browser and renders flat, wrong, or not at all in another.

**Cause:** SVG does not render `rotateX`, `rotateY`, `translateZ` or `perspective` reliably across browsers. There is no polyfill.

**Fix:** substitute the 2D equivalent. At icon size this is not a downgrade, it reads the same.

| You wanted | Use instead |
|---|---|
| A flap hinging toward the viewer | `scaleY` about the crease line |
| A card or coin flipping | `scaleX` through edge-on |
| A globe or dial spinning on its axis | a `scaleX` squeeze, e.g. `[1, 0.32, 1]` |
| A genuine 3D tumble | Move it onto an HTML wrapper *outside* the svg. The transform is then real screen px and must be computed from `size` (§ Units). Reserve this for a gesture that cannot work any other way. |

The one shipped exception is the extruded key toss, which lives on nested HTML `<span>`s with `preserve-3d` and computes its depth from the render size. That is the whole cost of a real 3D flip: it leaves the SVG coordinate system and stops scaling for free.

---

### 10. Motion in the wrong coordinate space

**Symptom:** the animation is perfect at 24px and wrong at 96px.

See § Units below. Short version: keep motion inside the `<svg>`.

---

### 11. Nothing actually changes on screen

**Symptom:** the animation runs and you cannot see it.

The first version of the log-scroll icon slid four identical full-width lines past each other. Sliding identical things changes literally nothing. **A scroll you cannot see is not a scroll.** If a gesture moves repeated elements, the elements must differ — ragged widths, uneven spacing — because the *irregularity* is the motion.

Same class of bug: any part that moves entirely behind another part, or outside the clip, or by less than a rendered pixel at ship size.

---

### 12. A mask on an element inside a transformed wrapper double-transforms

**Symptom:** an occluder whose cut line is supposed to sit still sags, tilts, or drifts, exposing the thing it was meant to hide — but only while its wrapper is moving.

**Cause:** a `mask` (or `clipPath`) applied to an element that also rides a parent transform is resolved in the moved coordinate space, so the cut inherits the wrapper's motion *on top of* its own. The mask that was hand-placed in world space is no longer in world space.

**Fix:** decide, per part, whether the cut belongs to the **world** or to the **mover**, and structure accordingly.

```jsx
{/* cut lives in world space: mask on the OUTER, untransformed group */}
<g mask="url(#m)"><g className="mover">…</g></g>

{/* cut rides the mover: mask on the group that carries the animation */}
<g className="mover" mask="url(#m)">…</g>
```

The stack occluder wanted world space (a fixed separation line the falling layers slide under); the chat bubble's dot-holes wanted the mover (they collapse *with* the bubble). Same construct, opposite nesting.

---

### 13. An occluder that shares a resting edge is visible at rest

**Symptom:** a mask or clip whose boundary coincides with a real drawn edge leaves a hairline, a doubled stroke, or a faint notch **in the rest state**, even though it "does nothing" until the gesture.

**Cause:** an occluder sitting exactly on an edge the icon already draws is re-cutting that edge every frame, and CSS `visibility` resolves to `visible` across any segment where either end is visible, so a naive gate does not actually hide it at rest.

**Fix:** gate the occluder's `visibility: hidden` in a base rule and flip it to `visible` inside the same keyframe set that moves it, on a hundredth-of-a-percent window so the flip lands exactly when the part has moved off the shared edge:

```css
.occ { visibility: hidden; }               /* rest: no cut at all */
@keyframes ig-occ {
  0%     { visibility: hidden; }
  28%    { visibility: hidden; }
  28.01% { visibility: visible; }           /* on, the instant it has moved clear */
  100%   { visibility: visible; }
}
```

A mask whose content is only the white show-everything rect erases nothing, so gating the occluder off is exactly equivalent to having no mask at rest. Never mask something that is coincident with the moving part at rest; gate it, or gate the visible copy instead.

---

### 14. A mask whose content is animated loses opacity, and the erased thing ghosts through

**Symptom:** a mask cuts perfectly at rest and leaks the moment the gesture starts. The
thing that should be hidden shows at roughly 10–15% for the whole gesture, which reads as
exactly the ghost the house rules ban.

**Cause:** attaching an animation to an element **inside** a `<mask>` promotes it, and the
promoted layer composites into the mask's luminance with an alpha that is no longer fully
opaque. The cut stops being a cut and becomes a dim.

Measured on Notebook: the page text erased by an animated cover silhouette came back at
**481px, max 33/255** the instant `data-go` landed, against **0px** at rest. The shipped
`AddressBookGlyph` has the same leak (289px, max 68) from the same construct.

**Fix:** use a **`clipPath`**, not a mask. A clip is a geometric intersection, so there is
no alpha to lose. Animating the clipPath's *own child* is fine and measured 0px — the
fragility is specific to mask content, not clip content.

```jsx
{/* the reveal window: its left edge tracks the mover, so the cut travels for free */}
<clipPath id={clp}><rect className="reveal" x="76" y="20" width="140" height="140" /></clipPath>
<g clipPath={`url(#${clp})`}>…the thing being uncovered…</g>
```

Declare the window's resting position in a **base rule** (failure #2) or the covered thing
is on show at rest. Where the cut must follow a curved silhouette rather than a straight
edge, check first whether the covered content actually reaches that curve: if it stops
short, a straight-edged clip is exact where it matters and a mask buys nothing.

**Corollary for the harness:** diffing rest against frame 0 will not tell you this on its
own, because layer promotion muddies it. Isolate it — at the same paused instant, toggle
the masked content off and diff. That number is the leak, and it should be 0.

---

### 15. Two rules setting `animation` on one element do not compose

**Symptom:** one of the two animations silently never runs. The element moves, so nothing looks broken; it just does not do the second thing.

**Cause:** `animation` is ONE property. Two matching rules do not merge, the later one replaces the other outright. Putting a second class on a path that already carries an animation is enough to do it.

**Fix:** one class, one animation; give the second track its own wrapper `<g>`. Several animations on the *same* rule compose fine — `animation: travel 1s both, switch-on 1s both`.

**Catch it by counting, not by reading CSS.** Know the number you expect before you look:

```js
el.getAnimations({ subtree: true }).filter((a) => a.animationName?.startsWith("lg-")).length
```

---

### 16. A property named in only SOME keyframes

**Symptom:** a discrete property (`visibility`, `display`) flips at the midpoint of a segment instead of where you put it, killing a part half way through its own motion.

**Cause:** the browser synthesises the missing end from the element's own computed value — i.e. from the base rule — and then interpolates. With `visibility: visible` at `0%` only, `100%` resolves to the base rule's `hidden` and the discrete flip lands at 50%.

**Fix:** state **both ends** of every discrete property, in the same keyframe block.

---

### 17. A stroked mask copy haloes the thing it is meant to hide

**Symptom:** a white outline traces the moving part, exactly following it. Reported as "I can see the outline stroke white of the mask."

**Cause:** dilating an occluder by giving the mask copy a `stroke` as well as a `fill` punches **outside** the object's own outline, and the overshoot shows as a halo. It also shaves anything the mask crosses.

**Fix:** **occlusion is a FILL.** `fill="#000" stroke="none"`, and order the paints so the object's own ink covers the seam. If you need the boundary pulled to the inner side of a stroke band, restore that band with a white stroke of the *same path* inside the mask — measured at a seam, glyph colour 64: stroke-7 gave 145/120, fill-only 103/69, fill plus restore stroke **69/69**.

The better fix is usually to remove the need: re-time the gesture so the parts never overlap (§ Prove clearance by sweeping) and then nothing has to occlude anything, so nothing can halo.

---

## Fill weight is a different material

Stroke icons are lines. Fill icons are solid ink with white cut into them, and that flips which techniques apply. Everything below is specific to filled (Phosphor-style) glyphs.

- **An outlined stroke's centreline is recoverable exactly, and recovering it is what unlocks draw-on.** A fill glyph's marks and knockouts are usually a round-capped polyline that has been outlined, and **every cap arc's centre is a vertex**: a semicircular cap (chord = 2r) has its centre at the chord's midpoint, and a 90° cap (chord = r√2) sits at the corner it turns. Read the vertices straight off the source's own arc commands, then re-stroke the polyline at the source's width with round caps and joins and you get the same ink back — ListChecks' four rows came back to **67px at max 29** on a 720px render, every pixel of it on an ink contour. That is the move that gives a filled check or a filled line a *length*, which is what `stroke-dashoffset` needs and what an outlined blob does not have.
- **Splitting a round-jointed polyline at its own elbow is free.** Cut there and each half keeps a round cap at the vertex, and a round **join** is exactly the union of two round caps at that vertex — so the two strokes rebuild the original with no overlap to engineer and no hairline to chase. A clock's two hands split this way measured 58px at max 58, all of it the doubled antialias where two coincident caps now composite separately instead of being unioned first.
- **Details are usually HOLES, not marks.** Chat dots, robot eyes, a die window, an arrow through a cloud — all knockout subpaths. A "separate path" version of a dot is invisible (same fill on same fill), so anything that must move independently goes into a **mask**: the solid shape, plus black shapes that punch it, and the black shapes are what animate.
- **Probe before designing.** Ink and channels are not what they look like. In one circuitry glyph the "traces" turned out to be white grooves *between* plates and the "vias" black dots in white moats — the exact inverse of the assumption, found only by probing `ctx.isPointInPath(new Path2D(d), x, y)` along the planned routes. One scripted call, no rendering. Do this for every route or region assumption in a fill icon; the probe often produces a better mechanism than the guess.
- **Same-fill parts may overlap.** When a compound path must be split into moving parts, extend each part 4–6 units *into* its neighbour. The overlap is invisible (same colour) and makes butted-edge hairlines structurally impossible. Most of the stroke-era "collapse exactly onto the drawn edge" agony disappears in fill weight.
- **Additive black dots have free entrances and exits.** Slide one in from outside the viewBox (a clipped reveal, no materialising), and make it vanish by landing on black ink (a dot absorbed by a via is provably invisible, black on black). Neither direction needs opacity.

---

## Appendages stretch, they do not translate

A part attached to a body — a pin, an antenna, a leg, a tab — moves by **axis-scaling from its attachment edge**, not by translating. A translated pin slides away from the body and opens a white gap at the join, and the eye catches that gap instantly.

```css
/* the pin's inner end is the origin; it extends outward and back, still welded on */
.pin { transform-box: view-box; transform-origin: 128px 44px; }
@keyframes ig-pin { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.22); } }
```

Only detach a part that is genuinely meant to leave the body.

---

## Prove clearance by sweeping, before you write the keyframes

When two parts move near each other, never judge by eye whether they stay apart. Model every element's keyframe track, step it at 1ms, and report the minimum gap. It takes two minutes, it turns "I think this works" into a number, and it happens *before* any CSS exists.

**The floor is the icon's own resting gap.** Not a taste value: whatever separation the drawing already uses is the least the eye will accept from it, because that is the separation it has been taught to read. ListChecks' rows sit 16 units apart at rest (64 of pitch minus 48 of row ink), so 16 is the floor — and the sweep found a simultaneous exit-and-scroll closing it to **−35**, merging two holes into one tall white gash. The same sweep produced the fix: fade the departing row and it never has to reach the frame edge, so every row can move exactly one pitch *together*, and a rigid scroll cannot collide at all. Kanban's two-card swap was settled the same way, at a proven 16.0u minimum.

Reach for this before reaching for a mask. The best outcome of a clearance sweep is discovering that nothing has to occlude anything, because then nothing can halo.

**Measure margins off the INK, not the centreline.** A stroke hangs half its width either side of its path, so a line spanning y94–114 at width 6 occupies y91–117. A blank-frame floor computed off centrelines came out at 61 units; computed off ink it is **67**, and at 62 there was still a visible sliver. The stroke width is the bug.

**Anything that must land exactly where it started should travel a whole number of pixels.** A step of `S` user units renders as `S × size / viewBox` px. At S = 72 in a 96 box that is `0.75 × size`, whole for every size divisible by 4 — which is what ships. At S = 62 the third landing fell on `3 × 62 × 40 / 96 = 77.5px`, and the difference overlay caught the returned digits carrying a one-pixel antialias fringe the resting ones did not have. Same shape, different subpixel phase.

**Two shapes that touch merge.** In fill weight that is absolute — same colour, one silhouette — and it is why an external mechanism cannot be shown in contact with a filled glyph at icon size. It is also why `GearSix` cannot be given a mating gear: its teeth are 41.9° wide at the pitch circle against an 18.1° gap, 2.3× too wide to enter, and a mate would have to reach the valley radius anyway, dropping ~15px of second gear into a 40px icon whose first gear already spans 35px. Measure that before designing a partner for anything.

## A gap that follows a moving object

When something runs *alongside* a line rather than crossing it at one point, the opening the line makes for it has to **travel**. A gap parked at one fraction cannot cover a moving target, and the object keeps clipping the cut ends either side of it.

Set `pathLength="1"` and animate a three-value dasharray whose gap slides. For a gap of width `g` centred at fraction `c`: the first dash is `c − g/2`, the gap is `g`, the last dash is `1 − c − g/2`.

```css
.line { stroke-dasharray: 0.5425 0.001 0.4575; }   /* closed at the crossing */
@keyframes ig-open-and-follow {
  51% { stroke-dasharray: 0.5425 0.001 0.4575; }
  60% { stroke-dasharray: 0.280  0.320 0.400; }     /* gap centred 0.44 */
  74% { stroke-dasharray: 0.360  0.320 0.320; }     /* centred 0.52     */
  84% { stroke-dasharray: 0.500  0.320 0.180; }     /* centred 0.66     */
  94% { stroke-dasharray: 0.5425 0.001 0.4575; }
}
```

Measure the centres, do not invent them: at each sampled time, find the fraction along the line nearest the moving element. And near an end — if the crossing sits closer to the end than half the gap width — do not gap, **retract** the end with `stroke-dashoffset` instead, or the symmetric gap overruns the end and strands a stub past it. A zero-length dash renders as a round-capped dot, so use `0.001`, never `0`.

---

## Units — and why one keyframe set serves every size

The author's question: *if we author keyframes once, do they scale up?* **Yes, as long as the motion lives inside the `<svg>`.**

| Where the transform is | What `10px` means | Scales with icon size? |
|---|---|---|
| On an SVG child (`<path>`, `<g>`, `<circle>`) | 10 **user units** in the local viewBox | **Yes, free** |
| On the root `<svg>` or an HTML wrapper `<span>` | 10 real screen pixels | **No** |
| `perspective`, `translateZ` | real screen pixels, always | **No** — must be derived from `size` |
| `vector-effect: non-scaling-stroke` width | real CSS pixels | **No** — see failure #7 |

So in a 24-box Hugeicon, `transform: translateX(2px)` on a path is **2 of 24 units** — one twelfth of the icon at any render size. The same literal in a 256-box glyph is one 128th. The number is meaningless without its box; always state which box you are in.

**Rule: no transform on the root `<svg>` or an HTML wrapper unless the value is computed from `size`.** Anything needing a wrapper (3D perspective, a parabolic arc that must not share a timing function with a spin) computes its px from the render size in JS.

### Optical size: frame the viewBox on the resting ink

An SVG renders its viewBox into a square, so a non-square or over-wide viewBox silently shrinks the glyph. A 142-wide box scales content by `40/142 ≈ 0.28` while every 96-box glyph gets `40/96 ≈ 0.42` — the same drawing renders at two thirds of the set and reads faint and small, and nothing in the code says why.

- **Frame a square viewBox on the resting ink, centred on it** — not on the artboard, and not on the gesture's full excursion. Let gesture overflow leave the frame; the figure element never clips (the box's papers and the airplane already leave the frame).
- **`getBBox()` lies about optical size.** It includes parked and hidden animation content, so it reports a glyph as far taller or wider than it looks at rest. For sizing, measure ink from *rendered pixels at rest*: screenshot, threshold, take the dark-pixel bounding box.
- **House stroke weight is `strokeWidth / viewBoxWidth × 40 ≈ 2.0–2.5px`.** Same viewBox size across a set means the same stroke number means the same rendered weight. A `6` in a `96` box is `2.5px`; a `4.5` in a `142` box is `1.27px`, which is the tell that the framing is wrong, not the drawing.

---

## Making parts out of one path

Hugeicons free ships pre-split, so most icons need none of this. Reach for it when an icon is drawn as one connected path and the part you need cannot move alone.

**Additive first, always.** If the gesture only *adds* something — a spark leaving a bolt, a ring travelling out of a core — leave the source path completely untouched and draw the new element beside it. Zero risk to gate 2. Always prefer this when it works.

When you must cut:

- **Rebuild from the source's own numbers.** Read the coordinates out of the file; do not trace or eyeball. Same viewBox, same values, split only at the seams the gesture needs. At rest it must be byte-identical.
- **A band becomes a stroke on its centreline.** A 16-wide filled band down `x=80` is `<path d="M80,88V168" stroke-width="16">`. Now it has a path length and can be drawn on with `stroke-dashoffset`.
- **A solid disc becomes ring + plug.** `ring(r24,w16)` with a `disc(r16)` inside is bit-for-bit a `disc(r32)`. Now filled→hollow is a plain `scale` on the plug: no crossfade, no animating `r`, and the outer edge never moves. Overlap the plug by one unit (`r17`) so the two do not share an edge and leave a hairline.
- **Do not hand-author an `A` arc when you mean a circle.** Given two endpoints and a radius there are two candidate circles, and the sweep/large-arc flags will happily pick the other one: two arcs meant to sit at r48 rendered at **r79**. A `<circle>` has no such ambiguity, and with `pathLength="1"` an angular gap becomes a plain fraction of a turn (`dash 130/360, gap 50/360`), which also means the gap holds its angle as the ring scales. Where you must write an arc, write it in the same direction as the source, or the semicircle flips to the wrong side and bulges into the body.
- **Run strokes centreline-to-centreline, not edge-to-edge.** Tangent points that are seamless in one filled outline leave antialias hairlines as separate strokes.
- **Occlude with a mask, do not draw over.** To make one part pass in front of another, paint the front part's own silhouette white inside the mask, ordered after what it should erase and before what it should keep. Pure occlusion — no stroke, no gap, no outline.
- **A translucent stroke in a mask dims; an opaque one cuts.** A cut is destructive: at icon size, a hole wide enough to see turns a solid glyph into a thin hollow outline and it stops reading as the same icon. `stroke-opacity: 0.6` only dims to ~40%, the silhouette stays byte-identical on every frame, and the band can cross the contour and leave.

---

## SVGO will undo this work

An animated icon that passes every gate can be silently destroyed by the build pipeline: SVGO's default preset strips exactly the structure this technique depends on. If the set goes through SVGO, override these off:

| Plugin | What it breaks |
|---|---|
| `cleanupIds` | renames the ids your `mask`/`clipPath` `url(#…)` references point at — the cut silently stops applying |
| `mergePaths` | fuses the separately-animated parts back into one compound path |
| `convertShapeToPath` | turns the unambiguous `<circle>` into an arc pair (§ Making parts — the r48-drawn-at-r79 bug, reintroduced by tooling) |
| `removeHiddenElems` | deletes parked animation content that is legitimately invisible at rest |
| `inlineStyles` | erases the class hooks the keyframes target |
| `removeViewBox` | breaks the user-unit scaling that makes one keyframe set serve every size |

`prefixIds` at build time is the static cousin of the per-instance `useId` fix (failure #6) — use it when many icons are inlined into one document.

---

## Sleight of hand

Three shipped gestures use the same trick: **do the impossible bit where nobody is looking.**

- The bolt cuts out where it stands (47ms, gone before you register it leaving), is repositioned below the frame while genuinely invisible, and strikes back up.
- The rocket exits past its nose and, while outside the tile and clipped, is repositioned to the opposite corner to fly back in — reading as one continuous lap.
- The branch's travelling head, at the frame where it sits exactly where the ring lives and draws pixel-for-pixel the same shape, hands off: ring on, head off, same frame. Nothing crossfades because there is no visual difference to see.

The blind window wants to be **~80ms**: long enough to reposition, short enough that you read an object arriving rather than a gap.

---

## Easing

House tokens, confirmed across the whole codebase — use these before inventing a curve:

| Token | Value | Where it earns its keep |
|---|---|---|
| ease-out-expo | `[0.19, 1, 0.22, 1]` | the default reveal/arrival curve, start slope ≈5.3 |
| ease-out-quint | `[0.16, 1, 0.3, 1]` | slightly softer arrival |
| Emil's ease-out | `[0.23, 1, 0.32, 1]` | press/release feedback |
| ease-in-out-quart | `[0.77, 0, 0.175, 1]` | something already on screen morphing |
| iOS sheet | `[0.32, 0.72, 0, 1]` | exits |

**Exits run ~20% faster than entrances.** Applied consistently everywhere in this codebase.

| Situation | Curve | Why |
|---|---|---|
| A pen writing a stroke | `cubic-bezier(0.45, 0, 0.15, 1)` | Ease-in-**out**, and deliberately so: a pen accelerates into a stroke and decelerates out of it. Plain ease-out dumps two thirds of the line in the first 60ms and then crawls. This is what separates writing from a progress bar. |
| Something leaving / departing | `cubic-bezier(0.45, 0, 0.9, 0.35)` | The one place ease-**in** is right. A rocket does not depart at its slowest; you do not ease a plug out. |
| Something arriving / landing | `cubic-bezier(0.25, 0.9, 0.3, 1)` | Snappy arrival, settles. |
| Settling after impact | `cubic-bezier(0.33, 1, 0.68, 1)` | The standard decay tail. |
| Falling under gravity | `cubic-bezier(0.55, 0, 0.9, 0.45)` | Gravity accelerates. |
| Rising to an apex | fit to `p(t) = 2t − t²` | A bezier's start slope is `y1/x1`, its end slope is `(1−y2)/(1−x2)`. A rise wants 2 and 0; a fall wants 0 and 2. Give rise and fall equal time so the parabola is symmetric — that is what the eye checks. |
| A free spin, once released | **`linear`** | Nothing torques an object in flight, so angular velocity is constant. Easing a spin is the single most common tell of a fake coin flip. One of the very few places linear is correct. |
| Hover in/out on the reduced tier | `cubic-bezier(0.19, 1, 0.22, 1)` @ 190ms | |

Per-keyframe control: put `animation-timing-function` **inside** the keyframe. It governs the segment that *starts* there.

```css
0%   { transform: translateY(0);      animation-timing-function: cubic-bezier(0.4,0,0.7,1); }
7%   { transform: translateY(1.5px);  animation-timing-function: cubic-bezier(0.33,0.66,0.67,1); }
48%  { transform: translateY(-7px);   animation-timing-function: cubic-bezier(0.33,0,0.67,0.34); }
100% { transform: translateY(0); }
```

**Anticipation is not optional.** 50ms and a pixel and a half of wind-up before a throw. Without it the object reads as teleporting.

**Impact is not optional either.** Something that lands squashes against its base (origin at the base, not the middle, or it pinches in midair), rebounds past its height, and settles. Three keyframes, ~30% of the clock.

**Decay ratios.** Each swing smaller than the last, roughly 0.6–0.7 of the previous, three or four swings, landing exactly on zero.

**A repeating shape aliases at a fraction of its own period, not at 30°/frame.** For a rotationally symmetric part the wagon-wheel limit is set by the repeat, not by the eye: a six-lobed gear has a 60° pitch, so a frame step near 30° makes the direction ambiguous and at 60° it looks like it never moved at all. Keep the step under **a third of the repeat** — 20°/frame, 1200°/s, for six-fold. Count the symmetry before picking a duration.

**For anything that turns far, pick the curve by its PEAK SLOPE, not by its name.** A thin part — a clock hand, a needle, a spoke — stops reading as itself past roughly **30° per frame**, so 1800°/s is the ceiling at 60fps, and what matters is not the average but `peak = (the curve's max slope) × travel / duration`. Measured max slopes: `cubic-bezier(0.45,0,0.55,1)` **1.82**, `(0.33,1,0.68,1)` 3.03, `(0.77,0,0.175,1)` 4.95, `(0.19,1,0.22,1)` **5.26**. So the house ease-out-expo needs **1052ms** to turn something 360° without strobing, against 364ms for the sine-ish curve — a 2.9× difference that no amount of staring at the code reveals. The clock's first build used the house curves and ran its minute hand at **82.6°/frame**; the fix was the curve, not the duration. Compute the peak before choosing, then read the delivered speed back out of the browser's own matrices.

**Solve the mechanism, then fit the curve to it.** When the gesture *is* a mechanism with known physics — a detent, a pendulum, a fall, a damped return — do not hand-author the beziers. Integrate the equation of motion once, then fit one cubic-bezier per structural leg with the **endpoint slopes pinned to the solved velocities**: leave only `x1` and `x2` free and set `y1 = s₀·x1`, `y2 = 1 − s₁·(1−x2)`. Velocity continuity across every join is then exact by construction rather than solved by hand, and the fit error is a number you can state — on the gear it was **0.018px at ship size** on the worst leg.

The gear indexes through three detents under `I·θ̈ = τ − A·sin(6θ) − c·θ̇`; `sin(6θ)` because six teeth, so the potential has minima at the valleys and maxima at the crests, and resistance peaks halfway up each flank. What the solver buys that taste cannot is the **character**: the three clicks came out uneven on their own (260 / 170 / 170ms) because the gear is carrying speed by the second crest, so it reads as stiff-then-freeing without anyone deciding that, and every climb decelerates while every fall accelerates for the same reason. Then read the shipped numbers back out of **the browser's own computed matrix** (sample `getComputedStyle(el).transform` across a paused run and differentiate) — that is what proves the CSS reproduces the physics, rather than proving your model agrees with itself.

**Velocity continuity across keyframe joins.** A move that passes through an intermediate pose becomes two keyframe segments. If both get an ease, the object decelerates to a dead stop at the join and sets off again — a hitch that is invisible in code and obvious at 4×. Emil's rule (an element already on screen that moves → ease-in-out) applies to the move *as a whole*; you split it and hand the velocity across the seam. For a bezier the start slope is `y1/x1` and the end slope is `(1−y2)/(1−x2)`; with `avg = distanceFraction / timeFraction` for each segment, solve `endSlope₁ × avg₁ = startSlope₂ × avg₂`. Then verify by sampling actual positions and differentiating — do not trust the curve names. And remember peak speed, not average, is what reads as "too fast": spend the clock where the motion is visible and let the hidden legs be quick.

---

## One clock or many

**One clock** when two parts must meet on an exact frame: a handoff, an occluder riding a traveller, sparks that must relight the frame the plug lands. Same `duration`, same `delay`, percentages counted against each other.

**Separate clocks** when one thing is merely a *consequence* of another and nothing has to line up exactly. Stating a start time in ms is easier to tune than hunting percentages.

Multiple animations on one element compose fine:

```css
.occluder { animation: travel 1s both, switch-on 1s both; }
```

**Beats do not overlap.** Where a gesture has stages, let each finish before the next starts. The dialog's loader→check is three clean beats — the arc spins, the arc *closes into a circle*, and only then is the tick traced inside the finished circle. Overlapping them gave one muddled event instead of three readable ones.

Two related traps from the same work:
- **Never stop a spin by animating it back to 0** — it visibly rewinds. Let it run and hide it instead (once the arc closes into a full circle, its rotation is invisible, so there is nothing to halt and nothing can jerk).
- **A tick is not a shape that appears; it is a stroke that is drawn.** Two lines flying out from a centre point while fading in is a pop. One path revealed along its own length — leg, corner, arm — is a check mark.

---

## Driver

```js
const rowOf = (t) => (t instanceof Element ? t.closest("[data-icon]") : null);
const isOurs = (a) => a.animationName?.startsWith("ig-");

el.addEventListener("pointerover", (e) => {
  const row = rowOf(e.target);
  if (!row || row.contains(e.relatedTarget)) return;
  if (row.hasAttribute("data-go") || timers.has(row)) return;
  timers.set(row, setTimeout(() => { timers.delete(row); play(row); }, DWELL));
});

el.addEventListener("pointerout", (e) => {
  const row = rowOf(e.target);
  if (!row || row.contains(e.relatedTarget)) return;
  const pending = timers.get(row);
  if (pending !== undefined) { clearTimeout(pending); timers.delete(row); return; }
  row.getAnimations({ subtree: true }).filter(isOurs)
    .forEach((a) => a.updatePlaybackRate(EXIT_RATE));
});
```

Gate the hover rules so touch devices never get stuck in a hover state:

```css
@media (hover: hover) and (pointer: fine) { /* [data-go] rules here */ }
@media (prefers-reduced-motion: reduce)   { .ig-part { animation: none; } }
```

`prefers-reduced-motion` is safe to implement as a flat `animation: none` **only because of gate 2** — the rest state is declared in a base rule, so removing the animation leaves the correct picture.
