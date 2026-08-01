# Failure catalog

Seventeen ways an icon animation breaks. Most are invisible in code review and obvious in a frame strip. Read this before authoring, not after.

Related: [TECHNIQUE.md](TECHNIQUE.md) · [EASING.md](EASING.md) · [FILL.md](FILL.md) · [VERIFY.md](VERIFY.md)

---

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
| A genuine 3D tumble | Move it onto an HTML wrapper *outside* the svg. The transform is then real screen px and must be computed from `size` ([TECHNIQUE.md](TECHNIQUE.md) § Units). Reserve this for a gesture that cannot work any other way. |

The one shipped exception is the extruded key toss, which lives on nested HTML `<span>`s with `preserve-3d` and computes its depth from the render size. That is the whole cost of a real 3D flip: it leaves the SVG coordinate system and stops scaling for free.

---

### 10. Motion in the wrong coordinate space

**Symptom:** the animation is perfect at 24px and wrong at 96px.

See [TECHNIQUE.md](TECHNIQUE.md) § Units. Short version: keep motion inside the `<svg>`.

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

Declare the window's resting position in a **base rule** (#2) or the covered thing
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
el.getAnimations({ subtree: true }).filter((a) => a.animationName?.startsWith("ig-")).length
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

The better fix is usually to remove the need: re-time the gesture so the parts never overlap ([TECHNIQUE.md](TECHNIQUE.md) § Prove clearance) and then nothing has to occlude anything, so nothing can halo.

---
