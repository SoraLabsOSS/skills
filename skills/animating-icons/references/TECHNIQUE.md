# Technique: SVG/CSS mechanics

Mechanics that are not the failure catalog, fill rules, or easing tables. Read [FAILURES.md](FAILURES.md) before authoring.

| Need | File |
|---|---|
| Failure catalog (1–17) | [FAILURES.md](FAILURES.md) |
| Fill / Phosphor ink | [FILL.md](FILL.md) |
| Easing / peak slope | [EASING.md](EASING.md) |
| Verify by rendering | [VERIFY.md](VERIFY.md) |

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
| `vector-effect: non-scaling-stroke` width | real CSS pixels | **No** — see [FAILURES.md](FAILURES.md) #7 |

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

`prefixIds` at build time is the static cousin of the per-instance `useId` fix ([FAILURES.md](FAILURES.md) #6) — use it when many icons are inlined into one document.

---

## Sleight of hand

Three shipped gestures use the same trick: **do the impossible bit where nobody is looking.**

- The bolt cuts out where it stands (47ms, gone before you register it leaving), is repositioned below the frame while genuinely invisible, and strikes back up.
- The rocket exits past its nose and, while outside the tile and clipped, is repositioned to the opposite corner to fly back in — reading as one continuous lap.
- The branch's travelling head, at the frame where it sits exactly where the ring lives and draws pixel-for-pixel the same shape, hands off: ring on, head off, same frame. Nothing crossfades because there is no visual difference to see.

The blind window wants to be **~80ms**: long enough to reposition, short enough that you read an object arriving rather than a gap.

---

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

---

## Reduced motion

A hover gesture is decorative by definition — the icon means the same thing whether or not it performs. So the reduced-motion answer for this entire library is the flat gate above: `animation: none`, sit at rest. Gate 2 is what makes that a one-liner instead of a per-icon audit; an icon whose rest lives only in its `0%` keyframe breaks the moment the animation is removed ([FAILURES.md](FAILURES.md) #2).

Three cases are not covered by the flat gate:

- **Icon-swap (family 12) is a state change, not decoration.** The menu must still become a cross or the user is lost. Under reduce, keep the swap but make it instant — set the target coordinates with no tween. Never leave the old glyph on screen.
- **A spinner that means "loading" is essential motion** and may keep spinning; that information has no still equivalent. Slow it before killing it.
- **The JS driver must not re-add what CSS removed.** The driver waits on `animation.finished`; with `animation: none` there are no animations, and the existing `if (!running.length) return` branch already exits cleanly. Keep that branch when adapting the driver.

Test it live: toggle emulation in DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion" with the page open, and hover — the icon must sit still and look exactly like rest.
