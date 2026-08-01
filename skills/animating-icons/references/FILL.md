# Fill weight

Stroke icons are lines. Fill icons are solid ink with white cut into them — that flips which techniques apply. Everything here is specific to filled (Phosphor-style) glyphs.

Related: [TECHNIQUE.md](TECHNIQUE.md) · [FAILURES.md](FAILURES.md) · [MORPH.md](MORPH.md)

---

## Material rules

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
