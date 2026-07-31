# animating-icons

[![skills.sh](https://skills.sh/b/SoraLabsOSS/skills)](https://skills.sh/SoraLabsOSS/skills)

A Claude Code skill for animating SVG icons.

An icon is not a picture you move. It is an object that **does something**, and the animation is that thing happening once. A bell rings, a plug comes out of its socket, a branch writes itself. The motion has to be something only *that* object could do.

That is the whole idea, and the rest of the skill is what it takes to actually hold the line: twelve gesture families, a seventeen-item catalog of the ways these break, the vector-morph correspondence method, the three-line icon-to-icon morph system, and a verification harness that measures instead of eyeballing.

Built while animating a set of icons by hand, one at a time. Every number in it was paid for once.

## Install

**As a plugin** (recommended — you get it in every project, and `/plugin update` pulls changes). Inside Claude Code:

```
/plugin marketplace add SoraLabsOSS/skills
/plugin install animating-icons@soralabs
```

**Via [skills.sh](https://skills.sh)** — works for Claude Code, Cursor, Codex, and other agents:

```bash
npx skills add SoraLabsOSS/skills
```

**Or drop the files in** — no npm account or plugin system involved:

```bash
npx github:SoraLabsOSS/skills            # into ./.claude/skills  (this project)
npx github:SoraLabsOSS/skills --global   # into ~/.claude/skills  (every project)
```

**Or just copy it.** It is six markdown files and two helper scripts. `skills/animating-icons/` into your `.claude/skills/`.

## Using it

It fires on its own when you ask for icon animation work. You can also invoke it by name.

Prompts that work well with it:

> Animate the calendar icon on hover. Here are the poses I drew in Figma, left to right. Every drawing is a keyframe, morph through all of them in order. Rest is the original icon, pixel for pixel.

> This is a filled icon. Probe whether the details are holes or marks first, then tell me whether this wants a transform, a morph, or a mask. Do not reach for a morph if a transform can do it.

> Before we animate this icon, is there an honest gesture here, or is it a noun with no mechanism? If there is no real verb, say so and leave it still.

> This gesture plays but it feels generic. Run the swap test: could these exact keyframes sit on a different icon and still look fine? If yes, throw it out and start again from this icon's own verb.

## What is in it

| File | |
|---|---|
| `SKILL.md` | The core principle, the swap test, the four gates, **landing on rest**, choosing the mechanism, the procedure, the budget |
| `FAMILIES.md` | The twelve gesture families — draw-on, travel-and-return, hinge, separate-and-rejoin, fall-and-land, fill-and-drain, pulse-from-source, step-and-hold, free revolution, contents-in-frame, reshape, icon-swap |
| `TECHNIQUE.md` | SVG/CSS mechanics: the failure catalog, fill weight, clearance sweeps, units, easing, the playback driver |
| `MORPH.md` | The vector morph, and **correspondence** — which point becomes which, and why arc length is not it |
| `ICON-MORPH.md` | Icon-to-icon morphing — the three-line system: every icon is three SVG lines, rotation groups rotate, everything else tweens coordinates |
| `VERIFY.md` | Frame strips, difference overlays, the noise floor, reading motion off the computed matrix, and why a probe that returns zero may be measuring nothing |
| `scripts/` | `seek-shot.sh` freezes the `?t=N` harness and screenshots each moment; `contact-sheet.sh` tiles the frames into one image |

## The parts I would read first

**The swap test.** Could these exact keyframes be pasted onto a different icon and still look fine? If yes, it is decoration. Most animated icon sets fail this: keyframes that translate the whole `<svg>` would look identical on any icon in the library.

**Landing on rest.** Hovering an icon must never change what it looks like afterward, and that constraint shapes gestures more than anything else. There are four ways to satisfy it — symmetry, congruence, re-arming while invisible, and returning — and if you cannot name which one you are using, you do not have a gesture yet.

**Verify the motion, not just the pixels.** A frame strip checks geometry. It cannot tell you how fast anything is going, and timing bugs are invisible in both the code and the render. Read the transform back off the browser's own computed matrix and differentiate it.

## Credit

The morphing technique came from [Benji Taylor's article](https://benji.org/morphing-icons-with-claude). The timing instincts are [Emil Kowalski's](https://animations.dev) — his course is the thing to read on motion. The `seek-shot`/`contact-sheet` verify scripts are adapted from [iart-ai/web-animation-skills](https://github.com/iart-ai/web-animation-skills) (MIT).

MIT.
