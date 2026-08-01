# SoraLabs skills

[![animating-icons](https://skills.soralabs.io.vn/assets/og-image.png)](https://skills.soralabs.io.vn/)

[![skills.sh](https://skills.sh/b/SoraLabsOSS/skills)](https://skills.sh/SoraLabsOSS/skills)
·
[Website](https://skills.soralabs.io.vn/)
·
[Sora UI](https://ui.soralabs.io.vn/)

Agent skills for motion craft — small, opinionated, measurable. Built while shipping real UI, not from a generic a11y checklist.

Each skill follows the [Agent Skills](https://agentskills.io/specification) progressive-disclosure model: lean `SKILL.md`, depth in `references/`, helpers in `scripts/`.

## Skills

### [animating-icons](./skills/animating-icons/SKILL.md)

An icon is not a picture you move. It is an object that **does something**, and the animation is that thing happening once.

Twelve gesture families, a failure catalog, vector morph + icon↔icon morph, and a verify harness that measures instead of eyeballing.

|                  |                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------- |
| Site             | [skills.soralabs.io.vn/animating-icons](https://skills.soralabs.io.vn/animating-icons/) |
| Icons in product | [Sora UI Icons](https://ui.soralabs.io.vn/docs/icons)                                   |
| Verify           | `node skills/animating-icons/scripts/verify-icon.mjs` · `npm test`                      |

### [motion-meaning](./skills/motion-meaning/SKILL.md)

**Reduced motion isn't about removing animation. It's about deciding what remains when animation disappears.**

Classify motion as communicative (sequence = content) or decorative (decorating a result), pick a reduce strategy, audit dead branches, and verify both preference states.

|             |                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Blog origin | [prefers-reduced-motion in React](https://ui.soralabs.io.vn/blog/prefers-reduced-motion-react) |
| Site        | [skills.soralabs.io.vn/motion-meaning](https://skills.soralabs.io.vn/motion-meaning/)          |
| Verify      | `node skills/motion-meaning/scripts/verify-reduced.mjs` · `npm run test:motion-meaning`        |

## Install

**As a Claude Code plugin** (recommended — updates with `/plugin update`):

```
/plugin marketplace add SoraLabsOSS/skills
/plugin install animating-icons@soralabs
/plugin install motion-meaning@soralabs
```

Install one or both. The package exposes every skill under `skills/`.

**Via [skills.sh](https://skills.sh)** — Claude Code, Cursor, Codex, and other agents:

```bash
npx skills add SoraLabsOSS/skills
```

Pick the skill(s) you want and which agents to install them on.

**Or copy the folder** into your agent skills dir:

```bash
cp -r skills/animating-icons ~/.claude/skills/
cp -r skills/motion-meaning  ~/.claude/skills/
```

**Or drop via the local installer** (animating-icons only today):

```bash
npx github:SoraLabsOSS/skills            # ./.claude/skills
npx github:SoraLabsOSS/skills --global   # ~/.claude/skills
```

## Using them

Skills fire when the task matches their description. You can also invoke by name.

**animating-icons** — icon hover gestures, morphs, “is there an honest verb?”

> Animate the calendar icon on hover. Here are the poses from Figma. Rest must match the source glyph pixel for pixel.

> Run the swap test on this gesture. If the keyframes would look fine on a different icon, throw them out.

**motion-meaning** — reduced-motion audit/fix, gating new GSAP/Motion/CSS

> Audit this component for prefers-reduced-motion. Classify communicative vs decorative, pick a strategy, report file:line with a minimal fix.

> This scroll stack greps clean for reduced motion but looks broken under reduce — check for a dead end-state branch.

## Repo layout

```
skills/
  animating-icons/     # SVG icon gestures + morph + verify
  motion-meaning/      # role → strategy → meaning under reduce
site/                  # Vite landing (skills.soralabs.io.vn)
.github/workflows/     # Pages deploy on push to site/
AGENTS.md              # Notes for agents editing skills in this repo
```

Landing: edit `site/`, push to `main` — Actions builds with Bun and deploys to GitHub Pages. Home `/` · `/animating-icons/` · `/motion-meaning/`. Locally: `bun run site:dev` / `site:build` / `site:preview`. Domain: `skills.soralabs.io.vn`.

## Credit

**animating-icons** — morphing from [Benji Taylor](https://benji.org/morphing-icons-with-claude); timing instincts from [Emil Kowalski](https://animations.dev); verify helpers adapted from [iart-ai/web-animation-skills](https://github.com/iart-ai/web-animation-skills) (MIT).

**motion-meaning** — strategies distilled from [Sora UI production patterns](https://ui.soralabs.io.vn/blog/prefers-reduced-motion-react); audit report shape and library gotchas credited in [`skills/motion-meaning/references/CREDITS.md`](./skills/motion-meaning/references/CREDITS.md).

Built by [SoraLabs](https://github.com/SoraLabsOSS) / [Sora UI](https://ui.soralabs.io.vn/).

MIT.
