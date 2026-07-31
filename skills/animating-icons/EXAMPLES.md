# Four golden examples

Four complete, end-to-end icons — one per common family. Copy the **shape** of these, never the numbers: every number below is derived from *this* drawing, and yours must be derived from yours (SKILL.md step 6). Each example names its family, its landing, and where each number came from.

The first three share the same scaffolding:

- The gesture fires on `[data-go]`, set by the driver in `TECHNIQUE.md` § Driver (dwell 130ms, guaranteed finish, ×2.2 exit rate). Never on `:hover` directly.
- Hover rules live inside `@media (hover: hover) and (pointer: fine)`.
- `@media (prefers-reduced-motion: reduce) { .ig-part { animation: none; } }` — safe because rest is declared in base rules (gate 2).
- Animation names are prefixed `ig-` so the driver and the harness can count them (failure #15).

---

## 1. Bell — hinge (family 3)

**Verb:** it rings. **Landing:** return — a decayed oscillation onto exactly 0°.

The dome swings about the real hinge; the clapper runs the *same* track 2.5% late, so inertia arrives late. The lag is the entire gesture — a bell where both move together is a picture being rotated.

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round" data-icon>
  <path class="bell-dome" d="M12 3c-3.3 0-6 2.7-6 6v3.2c0 .8-.5 1.9-1.4 2.8-.6.7-.2 1.9.8 1.9h13.2c1 0 1.4-1.2.8-1.9-.9-.9-1.4-2-1.4-2.8V9c0-3.3-2.7-6-6-6Z"/>
  <path class="bell-clapper" d="M15.5 19.5a3.5 3.5 0 0 1-7 0"/>
</svg>
```

```css
.bell-dome, .bell-clapper { transform-box: view-box; transform-origin: 12px 3px; }

@media (hover: hover) and (pointer: fine) {
  [data-go] .bell-dome    { animation: ig-ring 900ms both; }
  [data-go] .bell-clapper { animation: ig-ring 900ms both; animation-delay: 22ms; }
}

@keyframes ig-ring {
  0%   { transform: rotate(0deg);    animation-timing-function: cubic-bezier(0.45,0,0.15,1); }
  18%  { transform: rotate(14deg);   animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  42%  { transform: rotate(-9deg); }
  64%  { transform: rotate(5.5deg); }
  82%  { transform: rotate(-2.5deg); }
  100% { transform: rotate(0deg); }
}
```

Where each number came from:

- **`transform-origin: 12px 3px`** — the top of the crown, where the drawing's dome meets its mount. Read off the `d`, not guessed. `view-box` because dome and clapper must share one pivot (failure #4).
- **`14° → −9° → 5.5° → −2.5° → 0`** — decay ratio ~0.64 per swing, three returns, landing exactly on zero (TECHNIQUE § Easing, decay ratios). 14° is capped where the dome's skirt would exit the frame.
- **`animation-delay: 22ms`** — 2.5% of 900ms. Same keyframes, offset clock; the clapper is a *consequence*, so it gets a delay, not its own track.
- **No base rule needed** — the rest transform is the identity, so the fallback is already correct (failure #2 only bites non-identity rest values).
- **`900ms`** — one event, inside the 600–1100ms gesture budget.

Gates to run: difference overlay at rest (gate 2 — the delay means the clapper is mid-swing when the dome finishes; the shared 100% frame at 0° is what saves it, verify it), strip at 96px, peak speed of the first swing.

---

## 2. Send — travel-and-return (family 2)

**Verb:** it is sent. **Landing:** re-arm while genuinely invisible — the mover is repositioned outside the clip on a hundredth-of-a-percent frame.

The plane exits along **its own pointing axis** (up-right, 45°), is repositioned to the opposite corner while off-frame, and flies back in. One continuous journey, not a rubber band.

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round" data-icon>
  <!-- svg must clip: no overflow:visible anywhere, or the trick is exposed -->
  <path class="plane" d="M21 3 3 10.5l6 2.5m12-10-5 18-4.5-8m9.5-10L9 13"/>
</svg>
```

```css
@media (hover: hover) and (pointer: fine) {
  [data-go] .plane { animation: ig-fly 800ms both; }
}

@keyframes ig-fly {
  0%     { transform: translate(0,0); animation-timing-function: cubic-bezier(0.6,0,1,1); }
  34%    { transform: translate(19px,-19px); }          /* off-frame, clipped */
  34.01% { transform: translate(-19px,19px);            /* the jump nobody sees */
           animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  100%   { transform: translate(0,0); }
}
```

Where each number came from:

- **`(19px, −19px)`** — 19 *user units* in the 24 box: far enough that the glyph plus half its stroke width is fully outside the viewBox on the diagonal. Measured off the ink, not the centreline (TECHNIQUE § Prove clearance). Inside the `<svg>` these scale for free at any render size.
- **The axis is the icon's own** — this plane points up-right, so it travels up-right. An arrow pointing down would travel down. Direction is the only parameter of this family.
- **Departure ⅓, return ⅔** — 0→34% out, 34→100% back. Leaving is the one place ease-**in** is correct; arriving is ease-out and takes roughly twice as long.
- **`34.01%`** — the blind jump lives on a hundredth-of-a-percent window while the mover is provably outside the clip. Prove the invisibility by measurement: screenshot the 34% frame and diff against rest minus the plane.
- **`800ms`** — one event.

Gates to run: the 34% frame must show *zero* plane pixels (re-arm proof), rest diff, strip — every frame with the plane in transit must still read as "send", not as a detached triangle.

---

## 3. Task done — draw-on, sequenced (family 1)

**Verb:** it is checked off. **Landing:** the last keyframe is the rest picture — both strokes end fully drawn, exactly as the base rules state.

Two parts drawn **in the order a hand would**: ring first, then the tick set inside it. A tick is not a shape that appears; it is a stroke that is drawn (TECHNIQUE § One clock or many).

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round" data-icon>
  <circle class="ring" cx="12" cy="12" r="9" pathLength="1"/>
  <path class="tick" d="M8.5 12.5l2.4 2.4 4.6-5.4" pathLength="1"/>
</svg>
```

```css
/* rest state said out loud: fully drawn (failure #2) */
.ring { stroke-dasharray: 1.02; stroke-dashoffset: 0; }
.tick { stroke-dasharray: 1;    stroke-dashoffset: 0; }

@media (hover: hover) and (pointer: fine) {
  [data-go] .ring { animation: ig-draw-ring 900ms both; }
  [data-go] .tick { animation: ig-draw-tick 900ms both; }
}

@keyframes ig-draw-ring {
  0%   { stroke-dashoffset: 1.02; animation-timing-function: cubic-bezier(0.45,0,0.15,1); }
  55%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}
@keyframes ig-draw-tick {
  0%   { stroke-dashoffset: 1; }
  60%  { stroke-dashoffset: 1; animation-timing-function: cubic-bezier(0.45,0,0.15,1); }
  100% { stroke-dashoffset: 0; }
}
```

Where each number came from:

- **`pathLength="1"`** — the CSS talks in fractions, not arc lengths, so editing the path never breaks the numbers.
- **`1.02` on the circle, `1` on the tick** — the circle is a closed path; a dash of exactly one lap leaves a hairline nick where its two butt caps meet (failure #8). The tick is open, so 1 is exact.
- **Two elements, not one compound path** — a compound path draws all its subpaths at once; sequencing requires separate elements (FAMILIES § 1).
- **One clock, 55% / 60%** — the tick starts only after the ring has finished, with a 5% breath between. Beats do not overlap. One shared duration because the handoff must land relative to the ring's completion.
- **`cubic-bezier(0.45,0,0.15,1)`** — the pen curve. Never `linear`: linear is a progress bar, and it is the single most common failure in existing animated-icon libraries. The timing function sits *inside* the keyframe that starts each drawing segment.
- **Timing function at `60%`, not `0%`, on the tick** — a per-keyframe timing function governs the segment that starts there; the 0→60% segment is a hold and needs none.

Gates to run: rest diff (the base rules are exactly the 100% frames — verify, don't trust), strip — the half-drawn ring must still read as this icon, and the frame where the ring completes must be identical to a plain circle, no seam.

---

## 4. Menu ↔ cross, plus → check — icon-swap (family 12)

**Verb:** it *becomes* another icon. **Landing:** per icon, not per transition — A→B→A must land back on A's exact coordinates.

This is the three-line system (`ICON-MORPH.md`), and it is the scoped exception to CSS-only: a state transition driven by app state, tweened with Motion. Every icon is exactly three `<line>`s in a **14×14 box centred on (7,7)**; unused lines collapse to the centre point at `opacity: 0`.

Real coordinates, verbatim from a working set:

```js
//               line 1                   line 2                   line 3
const ICONS = {
  menu:  [[2.5, 4,    11.5, 4   ], [2.5,  7,    11.5,  7   ], [2.5, 10, 11.5, 10]],
  cross: [[9.828, 4.172, 4.172, 9.828], [4.172, 4.172, 9.828, 9.828], [7, 7, 7, 7]],
  plus:  [[7,   3,    7,    11  ], [3,    7,    11,    7   ], [7, 7, 7, 7]],
  check: [[2.5, 7,    5.5,  10.5], [5.5,  10.5, 11.5,  4   ], [7, 7, 7, 7]],
};
```

```jsx
const collapsed = ([x1, y1, x2, y2]) => x1 === x2 && y1 === y2;

<svg viewBox="0 0 14 14" fill="none" style={{ overflow: "visible" }}>
  {ICONS[name].map((line, i) => (
    <motion.line key={i} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      animate={{ x1: line[0], y1: line[1], x2: line[2], y2: line[3],
                 opacity: collapsed(line) ? 0 : 1 }} />
  ))}
</svg>
```

Where each number came from:

- **`4.172` / `9.828` = 7 ∓ 2√2** — the cross is the plus (arm length 4) rotated 45°: each endpoint lands at `7 ± 4/√2 = 7 ± 2.828`. Not eyeballed diagonals; the rotation of the sibling icon's own geometry.
- **The collapse point is exactly `(7,7)`** — the centre of the box. Collapsing anywhere else makes the dying line visibly drift off-centre mid-tween. `opacity: 0` is mandatory: a zero-length line with a round cap renders as a dot.
- **Check's two legs share the elbow `(5.5, 10.5)`** — line 1 ends where line 2 starts, and the shared round caps weld the corner into one stroke. Tween them separately and the elbow tears open mid-morph; the shared endpoint is what keeps the check whole in flight.
- **Menu → cross tweens coordinates** (different rotation groups — three bars have no rotation that makes an X). **Plus → cross must NOT use these tables**: they are the same shape 45° apart, so that pair animates rotation only (`ICON-MORPH.md` § Rotation groups). Check the group before reaching for the coordinate tween.
- **Menu's third bar dies into the cross's collapsed slot** — 3 lines → 2 lines + centre point. The collapse is doing gesture work: the middle bar shrinking into the intersection reads as the X being *formed*, not as a bar fading out.

Gates to run: cycle every pair in a sequencer (gate 3 becomes the sequencer here); morph A→B→A and diff B's return against A's original coordinates; and the crossfade test — if any transition reads as fade-out/fade-in rather than lines transforming, it fails.
