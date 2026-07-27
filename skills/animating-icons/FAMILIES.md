# The gesture catalog

Eleven families. Every icon gets one. A family is a **keyframe recipe parameterised by the icon's own geometry** — the shape of the motion is fixed, the numbers come from the file you are looking at.

This is what makes 5,400 icons a production line instead of 5,400 art projects. The name prefixes cluster hard: 94 `Arrow*`, 58 `Folder*`, 53 `Mail*`, 50 `Chart*`, 47 `Calendar*`, 34 `Cloud*`, 32 `Sun*`, 24 `Wifi*`. One family decision covers a whole cluster, and only the coordinates change per icon.

**Picking:** name the verb (SKILL.md step 2), then find the family whose verb matches. If two fit, pick the one that moves fewer parts.

**Adding:** a new family is allowed and should be rare. Add it here with a worked example the first time you need it.

---

## 1. Draw-on

**Verb:** it is written, drawn, routed, measured, signed, connected.

**Mechanism:** `stroke-dashoffset` from hidden to 0. Stroke icons get this for free — every path already has a length.

```css
.part { stroke-dasharray: 1.02; stroke-dashoffset: 0; }  /* rest state, always */
@keyframes ig-draw {
  0%   { stroke-dashoffset: 1.02; animation-timing-function: cubic-bezier(0.45,0,0.15,1); }
  70%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}
```

Set `pathLength="1"` on the path so the CSS talks in 0→1 instead of arc lengths.

**Rules**
- **Never `linear`.** A pen leaves fast and eases into its stop; linear is a progress bar. This is the single most common failure in existing animated-icon libraries.
- **Draw in the order a hand would.** Multi-part icons get sequenced strokes, not simultaneous ones: trunk down → loop the ring → back out along the branch → set the dot.
- Closed paths hide at `1.02`, not `1` (TECHNIQUE #8).
- Where a stroke should drain *into* something rather than off its end, go toward `−1.02` instead.

**Hugeicons:** `Edit*`, `PenTool*`, `Signature*`, `Route*`, `Chart Line*`, `Analytics*`, `Connect*`, `Flowchart*`, `Ruler*`, `Draw*`, `Task*` checkmarks.

---

## 2. Travel-and-return

**Verb:** it goes somewhere — send, next, upload, download, export, forward.

**Mechanism:** the moving part exits the frame, and **while it is genuinely invisible** is repositioned to the far side and travels back in. Never a rubber-band out-and-back — that reads as a bounce, not a journey.

```css
@keyframes ig-fly {
  0%     { transform: translate(0,0); animation-timing-function: cubic-bezier(0.6,0,1,1); }
  34%    { transform: translate(19px,-19px); }          /* off-frame, clipped */
  34.01% { transform: translate(-19px,19px);            /* the jump nobody sees */
           animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
  100%   { transform: translate(0,0); }
}
```

**Rules**
- Leaving is the one place **ease-in** is correct. A rocket does not depart at its slowest.
- Arriving is ease-out, and it should take roughly twice as long as leaving. Departure ⅓, return ⅔.
- The travel axis is the icon's own axis. An arrow travels along the direction it points, not "to the right."
- The svg must **clip** (no `overflow: visible`) or the trick is exposed.

**Hugeicons:** the 94 `Arrow*`, `Send*`, `Upload*`, `Download*`, `Export*`, `Import*`, `Share*`, `Logout*`, `Login*`, `Forward*`, `Rocket*`, `Airplane*`, `DeliveryTruck*`.

**Direction is the only parameter.** This one recipe plus a direction vector read off the path covers well over a hundred icons.

---

## 3. Hinge

**Verb:** it opens, closes, swings, tilts, points — the real object has a real hinge.

**Mechanism:** rotate one part about the actual hinge coordinate. Everything else holds still.

```css
.lid { transform-box: view-box; transform-origin: 4px 7px; }  /* the real hinge */
```

**Rules**
- **Find the hinge in the geometry.** Do not rotate about the icon centre because it is convenient. `Folder01`'s lid meets its body at the coordinate where the two subpaths join; that point is the hinge.
- Swing out, hold a beat so the open state registers, swing back. The hold is what makes it read as an action rather than a twitch.
- Overshoot on the return, then settle. Each swing ~0.6–0.7 of the previous, three swings, landing exactly on zero.
- Cap the angle where the part would leave the frame or cross another part. `Gauge`'s needle is capped at ±56° because past that the tail lifts off its hub.

**Worked example — `Bell`.** Hugeicons ships it as two elements: the dome, and the clapper arc `M16 18C16 20.2091 14.2091 22 12 22C9.79086 22 8 20.2091 8 18`. Hinge the dome at the top of its crown; swing ±14°; give the clapper the *same* track offset 2–3% later, so inertia arrives late. The clapper lagging the dome is the entire gesture — a bell where both move together is a picture being rotated.

**Hugeicons:** `Bell*`, `Folder*` lids, `Book*`, `Door*`, `Mail*` flaps, `Toggle*`, `Notification*`, `Login*`, `Attachment*`, `Umbrella*`, `Flag*`.

---

## 4. Separate-and-rejoin

**Verb:** two things come apart and go back together — link/unlink, plug, merge, split, sync, pair.

**Mechanism:** two halves move in **opposite directions along the seam the geometry already declares**, hold apart, then snap back with an overshoot.

**Rules**
- Read the seam off the paths. Where two subpaths butt together *is* the seam, and the halves part **perpendicular** to it. Do not guess a direction.
- Because both halves move, the gap that opens is `2 × travel`, so each half barely has to move. A clear break at icon size costs very little travel.
- Shape it as a yank and a click: fast ease-**in** apart, a real ~90ms hold disconnected, hard ease-out back with a small overshoot past centre. The hold is what makes the return read as *plugging in*.
- If the halves are the same fill, the overshoot is free — passing through each other is invisible and all you read is the impact.

**Hugeicons:** `Link*`, `Unlink*`, `Plug*`, `GitMerge*`, `GitFork*`, `Split*`, `Puzzle*`, `Chain*`, `Sync*`, `Handshake*`.

---

## 5. Fall-and-land

**Verb:** it arrives, drops, is delivered, is discarded.

**Mechanism:** cut out where it stands, reposition above the frame while invisible, fall back in, take the hit.

```css
.box { transform-box: view-box; transform-origin: 12px 22px; }  /* its BASE */
@keyframes ig-drop {
  0%   { opacity: 1; transform: translateY(0) scale(1,1); }
  4%   { opacity: 0; transform: translateY(0) scale(1,1); }
  11%  { opacity: 0; transform: translateY(-14px) scale(1,1); }   /* the blind jump */
  13%  { opacity: 1; transform: translateY(-14px) scale(1,1);
         animation-timing-function: cubic-bezier(0.55,0,0.9,0.45); }  /* gravity */
  44%  { opacity: 1; transform: translateY(0) scale(1,1);
         animation-timing-function: cubic-bezier(0.3,0,0.35,1); }
  54%  { transform: translateY(0) scale(1.09,0.8); }               /* squash */
  70%  { transform: translateY(0) scale(0.97,1.06); }              /* rebound */
  85%  { transform: translateY(0) scale(1.01,0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1,1); }
}
```

**Rules**
- **Origin at the base, not the middle**, or the squash pinches it in midair instead of flattening it onto the floor.
- The drop distance must keep a real slab of the object in frame on the way down. Too far and all you see is its bottom vertex arriving, which reads as a falling chevron, not a falling box.
- Blind window ~80ms. Longer and you read a gap.
- Falling is ease-**in**; gravity accelerates.

**Hugeicons:** `Package*`, `Delivery*`, `Download*` (the payload, not the arrow), `Archive*`, `Inbox*`, `Drop*`, `Gift*`.

---

## 6. Fill-and-drain

**Verb:** it fills, empties, charges, loads, holds a level.

**Mechanism:** a level moves **inside a fixed container**. The container never scales.

**Rules**
- Never scale the vessel. A battery that grows is not charging.
- The level is a clipped rect or a translated bar inside the container's own inner bounds, read off the path.
- Stroke icons usually have no fill element — this is an **additive** family: draw a new bar inside the existing outline and leave the source path untouched. Zero risk to gate 2.
- A liquid surface must **deform**, not just tilt. A tilting edge alone is a plank. Amplitude envelope on top of the level: flat at rest, rough the instant it moves, roughest as the container goes still, then decays. Surface roughness reads far louder at icon size than a couple of degrees of tilt.

**Hugeicons:** `Battery*` (11 of them), `Cup*`, `Bottle*`, `Database*`, `Storage*`, `Loading*`, `Progress*`, `Fuel*`, `Thermometer*`, `Hourglass*`.

---

## 7. Pulse-from-source

**Verb:** it emits, broadcasts, notifies, detects, beats.

**Mechanism:** concentric parts travel outward from the **actual emitter point**, staggered, fading before they reach the edge.

**Rules**
- The emitter is a real coordinate. On `Wifi01` the three arcs are already separate and concentric on a point near the bottom centre — that point is the source, and the stagger runs from the innermost arc outward. Scaling the whole glyph would be the swap-test failure.
- Stagger 60–90ms between rings.
- **Fade each ring out before it reaches the icon's own outline.** A ring that lands exactly on the outline eats it for one frame, which blinks.
- Scale about the **emitter**, not each part's own centre, or the rings merely get longer instead of travelling.
- A ripple loses amplitude as it spreads: opacity decays with distance. That is honest physics and it is what makes the source read as solid.

**Hugeicons:** the 24 `Wifi*`, `Signal*`, `Broadcast*`, `Radar*`, `Bluetooth*`, `Nfc*`, `Heart*` (beat), `Notification*`, `Sensor*`, `Ripple*`, `Alert*`.

---

## 8. Step-and-hold

**Verb:** it counts, ticks, advances, scrolls, sorts, reorders.

**Mechanism:** discrete steps with a **hold on each landing**. Never a continuous slide.

**Rules**
- Each hold is an arrival. Without holds it is one long slide and the counting is lost.
- **A ripple is not a click, and the difference is measurable.** A continuous move whose speed merely *dips* at each landing reads as one slide with a wobble, however carefully the dips are placed. The test is the **minimum speed inside each beat**, read off the computed matrix: it has to reach ~zero. A gear built from a solved detent model modulated 180° with a 2:1 speed ripple and never dropped below **231°/s** — it was reported as "rotating, not ticking", and that was the right call. Rebuilt as hold → impulse → seat → hold it measures **0.0°/s**, with 23% of the clock genuinely still.
- **A tick is four parts, not one.** Recoil (a real escapement kicks back before it releases, and it doubles as the anticipation), impulse, seat, hold. The seat is the click: overshoot about 1.5px of travel at the moving part's outer radius and come back through a hard 0.2 decay.
- **Every intermediate landing must look different from the others, and the first and last must be the source glyph.** If the repeated elements are identical, sliding them changes nothing on screen (TECHNIQUE #10). Where the source is uniform, vary what you add: the log-scroll icon uses six lines of widths `64 64 40 64 64 40` and steps three times, so period-three against a two-line window makes every landing distinct while rest stays exactly the source picture.
- Ease each step with `cubic-bezier(0.3,0,0.2,1)` and hold for roughly as long as the step took.

**Hugeicons:** `Clock*`, `Timer*`, `Calendar*`, `Sort*`, `List*`, `Menu*`, `Queue*`, `Chart Bar*`, `Steps*`, `Pagination*`.

---

## 9. Free revolution

**Verb:** it turns, refreshes, syncs, loads, cycles.

**Mechanism:** a full or symmetric rotation. **Only allowed when the shape has rotational symmetry**, so it lands on the rest picture for free and there is no landing to hide.

**Rules**
- Check the symmetry order first. `Loading03` ships as 8 radial ticks at 45°: it maps onto itself every 45°, so a step-and-hold of 8 × 45° or a smooth 360° both land perfectly. A 4-fold star can spin a half turn and hold there while hovered, because 180° and 0° are the same picture.
- **Measure the symmetry, do not count the teeth.** Icon sets optically adjust radial shapes, so the drawing is often exact at a *lower* order than its lobe count implies, and the shortfall is what lands on gate 2. Phosphor's `GearSix` has six teeth but is exactly **two**-fold: rotating its 773 sampled outline points about the axis and taking each one's distance to the nearest original point gives 60° → 2.113u, 120° → 2.131u, **180° → 0.086u**. Its teeth at 0/180 stand 1.8u prouder and its valleys at 90/270 cut 2.1u deeper than the rest. So indexing one tooth cannot land clean and indexing three can — the drawing chooses the throw. Run that nearest-point test before picking how far to turn.
- **No symmetry, no revolution.** An asymmetric glyph spinning 360° is the whole-icon-jiggle failure with extra steps. Use hinge or step-and-hold instead.
- A *driven* rotation (a gear, a refresh) eases. A *released* rotation (something thrown, tumbling) is `linear` — nothing torques it in flight.
- A rotation this large on a frequently-hovered icon is only justified by the free landing. Say so in the comment.

**Hugeicons:** `Refresh*`, `Reload*`, `Loading*`, `Settings*` gears, `Sun*`, `Recycle*`, `Rotate*`, `Compass*`, `Spinner*`.

---

## 10. Contents-in-frame

**Verb:** something happens *inside* a window, folder, screen, inbox.

**Mechanism:** clip to the frame's interior; move the contents; the frame never moves.

**Rules**
- The frame is the anchor. If the frame moves, the reader has no fixed reference and the gesture disappears.
- Clip to the **interior bounds read off the frame path**, not to the bounding box.
- Contents that are uniform must be made ragged first (see family 8).
- This is the natural home for text/typing effects: one character slot at the source glyph's own arm thickness reads as a *character* being typed; two small ones read as texture. Swap characters on hard steps with a **blank frame between** — that gap is a backspace, and it is what makes the change read as retyped rather than as one shape morphing into another.

**Hugeicons:** `Terminal*`, `Browser*`, `Window*`, `Folder*` contents, `Mail*` contents, `Image*`, `Gallery*`, `Monitor*`, `Code*`, `File*`, `Note*`.

---

## 11. Reshape

**Verb:** it folds, closes, curls, bends, signs — the material itself changes shape, and no transform can fake it.

**Mechanism:** a **`d`-morph**. Author the path twice, once per pose, with the *same command structure* — same `M/C/L/Z` sequence, same number of points, only the coordinates differ — and interpolate the CSS `d` property. Chrome walks every point from one pose to the next. This is the one family that is genuinely a different tool, so it has its own file: **read `MORPH.md` before using it.**

```css
@keyframes ig-close {
  0%   { d: path("…open…");   animation-timing-function: cubic-bezier(0.77,0,0.175,1); }
  46%  { d: path("…closed…"); }
  60%  { d: path("…closed…"); animation-timing-function: cubic-bezier(0.77,0,0.175,1); }
  100% { d: path("…open…"); }
}
```

**Rules**
- **Only when the shape truly changes.** A book closing, a flap tenting open, a hand folding. If a translate, scale, or occlusion can produce the same picture, use that instead — a morph is expensive to author and brittle under edits (see `MORPH.md` § When not to morph).
- **Identical command structure or it will not interpolate.** Two paths with the same drawing but a different point count snap instead of morphing. Match them (de Casteljau subdivision, collapsing spare segments onto a drawn point) as in `MORPH.md`.
- **ease-in-out**, because the shape is on screen the whole time and morphing is "moving on screen," never entering or leaving.
- **A hard-swap beats a morph wherever coverage is provable.** If the change happens while the part is hidden, swap `d` discretely at that instant instead (SKILL.md § Choose the mechanism). Morph only when the bend is visible the whole way.
- Rest lives on the `d` attribute of the element, and the last keyframe returns to it.

**Hugeicons / hand sets:** `Book*` open↔shut, `Notebook*`, `Envelope*`/`Mail*` flaps, folding-hand gestures (fist, sign, pinch), `Origami*`, `Fold*`, anything drawn as two poses of one bending object.

---

## The residue: nouns with no mechanism

Some icons are objects that do not do anything — a heart, a star, a square, an abstract mark. Do **not** invent a mechanism for them.

Options, in order of preference:

1. **A different sense of the same word.** A heart beats (family 7). A star is 4-fold symmetric and can bloom (family 9). Look for the verb hiding in the noun before giving up.
2. **Draw-on** (family 1). Honest, cheap, always available for a stroke icon, and it reads as the object being *made* rather than being wiggled.
3. **The smallest possible reduced-tier gesture** — a hinge of a few degrees, or nothing at all.

An icon with no honest gesture ships with draw-on. It never ships with a wiggle.

---

## Combining families

Real gestures often layer two, on one clock. That is fine and usually better:

- fall-and-land + pulse (the package lands, the impact radiates)
- separate-and-rejoin + pulse (the plug reconnects, the contact arcs — and the sparks relight **after** contact, because the electricity is caused by the landing)
- hinge + fill (the flask is shaken; the liquid does not come along quietly)

**Use one clock when two parts must meet on an exact frame.** Otherwise separate clocks with start times in ms are easier to tune.

Layering more than two families on a 24px glyph is almost always the wrong answer. If the gesture needs three tracks to read, the icon is too small for the idea.
