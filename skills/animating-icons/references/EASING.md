# Easing

House tokens and situation curves. Use these before inventing a curve. Read motion back off the browser matrix — see [VERIFY.md](VERIFY.md) gate 4.

Related: [TECHNIQUE.md](TECHNIQUE.md) · [VERIFY.md](VERIFY.md)

---

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
