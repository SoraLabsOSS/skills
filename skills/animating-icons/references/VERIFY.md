# Verification

**Verify by rendering, never by reasoning.** Every real bug this technique has produced was invisible in the code and obvious in a frame strip. An animation you have only read is not an animation you have checked.

Two passes per icon. Pass 1 on authoring, pass 2 with fresh eyes — a different day if possible, after the batch at minimum.

---

## Gate 2: the difference overlay (rest state)

**Question:** is the icon at rest still exactly the source glyph?

1. Render the animated icon at rest, at 96px.
2. Render the untouched source glyph at the same size, absolutely positioned on top, tinted red, `mix-blend-mode: difference`.
3. **Pass = uniform colour, no fringe on either side.**

Any bright edge means the geometry moved. Any halo on one side only means a stroke width or a cap changed. Both are gate-2 failures even if the icon "looks the same."

Run it on the **final frame** too, not just frame 0. An animation that ends 0.4% off its start will drift visibly when a user hovers the same icon repeatedly.

---

## Gate 3: the frame strip

**Question:** does every intermediate frame still read as the icon?

Clone the icon N times (12–16 is enough), pin each clone to a paused negative `animation-delay`, screenshot the row.

```css
.strip .cell:nth-child(n) svg * {
  animation-play-state: paused;
  animation-delay: calc(var(--dur) * -1 * var(--i) / var(--n));
}
```

**Two gotchas that will silently produce a fake strip:**

1. **Duplicate ids.** Clones with `mask="url(#m)"` all resolve to the first mask in the document, so every cell renders cell 1's mask. Rewrite the id per clone ([FAILURES.md](FAILURES.md) #6).
2. **A parked cursor.** Hover away before capturing a "rest" shot or your rest frame is a hover frame.

**Reading the strip:**

| Look for                                      | Means                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| A frame where the glyph is unrecognisable     | The gesture disassembles the icon. Reduce the travel or move fewer parts.                                                  |
| Two adjacent frames identical                 | A dead segment. Either a hold you did not intend, or a keyframe that is not interpolating ([FAILURES.md](FAILURES.md) #3). |
| A jump between two adjacent frames            | Transform list mismatch, or a discrete step you did not intend.                                                            |
| A part half-behind another for several frames | The motion is invisible for that stretch ([FAILURES.md](FAILURES.md) #10).                                                 |
| First and last cells not identical            | Gate 2 failure.                                                                                                            |

**Read the strip numerically as well as visually.** Dead air is the opposite of snappy and it is easier to count than to see:

```python
n = sum(1 for p in ImageChops.difference(frame, prev).getdata() if p > 8)
```

Under ~40 is a dead segment. **One still pair is an intended beat; three in a row is a bug** — a 190ms hold produced three consecutive zero-delta frames in a 17-frame strip and read as the gesture stalling. The same numbers also show you the rhythm: in a working step-and-hold the snaps come out around 30,000 and the holds at exactly 0, and that contrast _is_ the tick.

Capture the strip with Playwright (or any headless screenshot), then **Read the PNG** so it is actually looked at. A screenshot nobody opened has verified nothing.

```bash
npx playwright screenshot --viewport-size=1400,200 file://./strip.html strip.png
```

---

## Gate 1: the swap test

Mechanical version, for batch review: take the icon's keyframe block, apply it to a **different** icon from a different family, and render both strips side by side.

- If the second icon looks fine, the gesture is generic. Reject.
- If the second icon looks broken or meaningless, the gesture is specific to the first. Pass.

This is the only gate that catches "technically flawless, means nothing," and it is the one that separates this library from the competition.

---

## Gate 4: verify the MOTION, not just the pixels

A difference overlay and a frame strip check **geometry**. Neither can tell you how fast anything is going, and the worst defects this technique has produced were motion bugs that every pixel gate passed clean. Read the delivered motion back out of the browser's own computed matrix and differentiate it:

```js
const out = [];
for (let t = 0; t <= DUR; t += 5) {
  anims.forEach((a) => (a.currentTime = t));
  const m = new DOMMatrix(getComputedStyle(el).transform);
  out.push([t, (Math.atan2(m.b, m.a) * 180) / Math.PI]); // m.e / m.f for a translate
}
```

Then ask three questions of the numbers, not of the render:

| Question                           | What it catches                                | Seen                                                                                                           |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Peak speed** — max \|dθ/dt\|     | aliasing                                       | a clock hand on the house ease-out-expo peaked at **82.6°/frame**; nothing in the code said so                 |
| **Minimum speed** inside each beat | a step-and-hold that never actually stops      | a gear "ticking" held a **231°/s** floor — a ripple, not a click, and it read as rotating. Rebuilt: **0.0°/s** |
| **The ratio between two parts**    | a relationship you claimed but did not enforce | two hands geared 12:1 measure **12.0000** across the whole run only because they share one timing function     |

Unwrap the angle before differentiating or every wrap reads as a spike. And do it against the **shipped CSS**, not against the model you solved — the point is to prove the browser delivers what you designed.

**Aliasing ceilings.** A thin asymmetric part (a hand, a needle) stops reading past ~**30°/frame**. A part with rotational symmetry stops much earlier, because its own repeat sets the limit: keep a six-fold shape under **a third of its 60° pitch**, 20°/frame, or the direction goes ambiguous and at 60°/frame it looks like it never moved.

## Motion review, in slow motion

Set a global time scale and watch at 4–8×. Do not tune at slow-mo speed and ship at 1×.

**Springs must be rescaled physically, not just slowed.** For time factor `k`: `stiffness /= k²` (since ω=√(k/m)), `damping /= k`, damping ratio held constant. Otherwise slow-mo shows a different shape than the one that ships, and the frames you inspected are not the frames users see.

What to look for at 4×:

- **Anticipation present?** Something that throws, shakes, or launches must load first.
- **Impact present?** Something that lands must squash, rebound, settle.
- **Does the decay decay?** Swings should shrink ~0.6–0.7 each, and land exactly on zero.
- **Does anything ease into its start?** `ease-in` on an entrance is a defect. Watch for it hiding inside a composed curve: `smootherstep` starts at zero velocity, which is ease-in in all but name.
- **Does the spin ease?** A released, tumbling object must be `linear`. Easing it is the tell of a fake coin flip.

---

## Snappiness

The author's word, and it has a concrete definition, learned in `RollingNumber.tsx`:

> A spring's asymptotic tail is what reads as "not snappy"; a tween with high initial velocity and a hard finish snaps.

So for icon gestures:

- **Prefer a steep-front tween over a spring** for anything that must land crisply and stop. Springs are for gestures and interruptible drags, which icon hover is not.
- **High initial velocity.** The bezier's start slope is `y1/x1`. `[0.19,1,0.22,1]` has slope ≈5.3; `[0.23,1,0.32,1]` ≈4.3. `[0.4,0,0.2,1]` has slope **0** — that is ease-in, and it will read as lag.
- **A hard finish**, not a long crawl to the mark.
- If a gesture feels sluggish, the fix is almost never "shorter." It is usually a curve with a flat start, or a dead segment where nothing changes, or a missing anticipation beat.

---

## The noise floor

Establish it before you trust any pixel diff. Attaching a **no-op** animation — an identity transform, zero visual change — re-rasterises a glyph by around **641px at max 93** in Chrome, because a compositable animation promotes the SVG to its own layer with a slightly different antialiasing phase. Every icon does this on hover.

- **Anything below that floor is not a finding.** A 244px residue on some digit caps, all under the floor, is nothing. Knowing the floor is what lets you stop chasing it.
- **A residue that hugs every contour — including elements the change never touched — is compositor re-rasterisation, not geometry.** It is a hairline, roughly 40–90/255, spread evenly. A real geometry error looks different: clustered, shaped, one-sided.
- The harness itself is deterministic: **rest vs rest is 0px.** So real differences are trustworthy once you have controlled for layer promotion.

---

## Measuring occlusion, not eyeballing it

When two moving lines pass close, do not judge by eye whether one covers the other in time. Measure it:

1. Pause every animation, step `currentTime` through ~200 points.
2. At each point read the moving element's live matrix and transform its actual **outline** (~90 sampled points, not its bounding box).
3. Sample each line's **visible** points, honouring the live dash pattern.
4. Report the contiguous touch runs and the closest approach.

For 6-wide strokes: **6 units apart = the two strokes exactly touching** (3 + 3); **8 units = 2 units of white between them.** This finds what eyeballing never will — a line the traveller touches that you did not know it touched, or a gap that opens 12% too late. Prove a hidden handoff the same way: render each copy alone at the swap position and diff; antialiasing-only (max 4–6/255, zero pixels over 8) means the swap is invisible.

---

## A probe that returns 0 may be measuring nothing

The most dangerous result in this whole method is a clean zero, because "no difference" and "no measurement" are the same number. Before believing one, **show the probe capable of returning something else** — move the thing further, break it on purpose, diff two states you know differ. A mask-leak probe once returned 0px twice in a row on a page that was not repainting at all; it was measuring nothing, and it was reported as a pass.

Three specific ways a rig goes silently dead:

- **A gate script that calls `a.cancel()` poisons every later capture on that page.** Re-setting the trigger attribute in the same tick does not recreate the CSS animations, so the handle you kept holds dead objects and `currentTime` does nothing. Re-attach from scratch at the start of every capture, and assert the animation count and `playState` before trusting a frame.
- **The thing you are capturing may not be on the page any more.** Another session, a revert, an HMR reload — the cell is gone and every frame is identical. Re-resolve the target by its label text each run and fail loudly if it is missing.
- **Settle it in isolation.** When a question about a construct will not resolve on the live board, build a standalone `file://` page from the component's own exported CSS and test there. The same mask that "did not animate" on the board moved 4561px at t=300 on that page, and the question evaporated.

## Suspect the harness first

Two of the scariest numbers you will see are your own measurement mistakes. When a render looks catastrophically wrong, check these before touching the icon:

- **Capture rest FIRST, on a clean load, before anything is ever paused.** A paused animation keeps applying its effect after its rule stops matching, so pausing mid-fall and _then_ removing `data-go` reports the mid-fall pose as "rest."
- **When the states being compared can shift the capture by a pixel** (toggling `display`, splitting a node), a 1px shift reads as a thousand-pixel diff. Use a shift-immune measure — ink counts, bounding boxes — not a raw pixel diff.
- **The verifier needs verifying.** SVG duplicates an odd-length `stroke-dasharray` (a three-value list becomes six), so a checker that does not duplicate will score a half-drawn line as fully clear. When a checker reports "all clear" on the first run, suspect the checker.
- **Backticks inside a CSS template literal terminate the string.** Guard any `export const X_CSS = \`…\``you touched:`assert '\`' not in lit`.
- **Re-resolve the cell by its label text every run, never a remembered index** — another agent adding a glyph shifts every `nth-child`.
- **Gate a "settled" screenshot on a real completion flag set in the page** (e.g. `window.__ready`), not an unawaited `animation.finished` promise from outside the page — headless tools often capture mid-gesture otherwise.
- **Cachebust after edits** (`?v=$RANDOM`); HMR sometimes serves a stale component and you measure the old build. And **clear the frame-strip directory when the duration changes**, or an old strip at a different filename interleaves with the new one and reads as insane.

---

## A one-command harness

Run this after authoring. It does not claim a full gate pass — it captures rest + seek frames, asserts `ig-` animations exist, and tiles a contact sheet when ffmpeg is available. You still Read the sheet and run the remaining gates by hand.

```bash
node scripts/verify-icon.mjs path/to/icon.html --dur 0.9
```

Needs: Node 18+. First run installs Playwright into `~/.cache/animating-icons-verify` (Chromium included). Contact sheet prefers ffmpeg on PATH, otherwise tiles via that same Playwright cache. This is the **default** verify entrypoint on Windows, macOS, and Linux — no bash required.

Smoke the scripts after changes:

```bash
npm test
```

The gates that still need agent eyes, in order: **source vs rest** (px > 8 after the corner-AA allowance), **frame 0 vs final** (0 or noise-floor), the **paused strip / sheet** read at 3×, **motion matrix** (gate 4), and a **live hover run** (dispatch pointerover, wait for the driver to clear `data-go`, diff before/after — must be 0).

## The `?t=N` seek harness

Bake a seek hook into the test page: `?t=N` starts the gesture through the real trigger, then pauses every animation at `t` seconds, so a headless screenshot lands on a deterministic still. `verify-icon.mjs` and `seek-shot.mjs` both drive this hook.

```html
<script>
  const t = new URLSearchParams(location.search).get("t");
  if (t !== null) {
    icon.setAttribute("data-go", ""); // the REAL trigger, not a shortcut
    requestAnimationFrame(() => {
      const anims = icon
        .getAnimations({ subtree: true })
        .filter((a) => a.animationName?.startsWith("ig-"));
      console.assert(
        anims.length > 0,
        "no animations — the harness is measuring nothing",
      );
      anims.forEach((a) => {
        a.pause();
        a.currentTime = parseFloat(t) * 1000;
      });
      window.__ready = true;
    });
  }
</script>
```

Assert the animation count before trusting the frame (§ A probe that returns 0), and remember a paused animation keeps applying its effect — capture rest on a clean load with no `?t` at all, never by un-pausing.

Lower-level helpers when you only need one step (same Node scripts; `.sh` files are thin wrappers):

```bash
node scripts/seek-shot.mjs icon.html 0 0.4 0.8
node scripts/contact-sheet.mjs sheet.png frame-0.png frame-0.4.png frame-0.8.png
```

Then **Read the sheet** — one image seen whole is how a dead segment or an adjacent-frame jump actually gets noticed.

---

## Batch review

Reviewing 5,400 icons one at a time is not the job. Review **by family**, in contact sheets.

1. Render every icon in one family as a grid of frame strips, ~20 icons per sheet.
2. Scan for outliers: one strip whose rhythm differs from its neighbours is either a bug or an icon that was assigned the wrong family.
3. Scan for sameness: a whole sheet where every strip looks identical means the family recipe was applied without deriving per-icon geometry. That is the swap test failing at scale, and it is the most likely way this project goes wrong.

The second sweep is a **cross-family** sheet: one icon from each family, side by side. They should look like they came from one hand and one system, without any two being interchangeable.

---

## Before shipping an icon

- [ ] Which of the four landing strategies this gesture uses, named out loud ([SKILL.md](../SKILL.md) § Landing on rest)
- [ ] `node scripts/verify-icon.mjs` run; sheet Read
- [ ] Noise floor known (no-op animation vs detached rest), and rest captured first on a clean load
- [ ] Every probe that returned 0 shown capable of returning non-zero
- [ ] Difference overlay clean at frame 0 **and** the final frame
- [ ] Every re-arm / hard-swap instant proven invisible by measurement, not by geometry
- [ ] Frame strip rendered, opened, and read
- [ ] **Motion read back off the computed matrix**: peak speed under the ceiling, minimum speed ~0 inside any beat that is meant to stop, any claimed ratio measured
- [ ] Live hover run through the real driver: before vs after = 0px
- [ ] Swap test run against an icon from another family
- [ ] No stray backtick inside any `*_CSS` template literal you touched
- [ ] Reviewed at 4× slow motion, springs rescaled
- [ ] Reviewed at 24px **and** 96px
- [ ] `prefers-reduced-motion` renders the rest state, not a broken one
- [ ] No `px` on the root `<svg>` or an HTML wrapper unless computed from `size`
- [ ] Duplicate-id safe (`useId` or equivalent) if the icon can appear twice on a page
- [ ] Second pass done with fresh eyes
