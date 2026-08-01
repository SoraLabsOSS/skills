# AGENTS.md

Guidance for coding agents working in this repository.

This project ships [Agent Skills](https://agentskills.io/home) under `skills/` (`animating-icons`, `motion-meaning`). Treat skill authoring and edits as work against the open Agent Skills standard — not ad-hoc prompt files.

Source for the philosophy below: [Agent Skills Overview](https://agentskills.io/home) (agentskills.io).

---

## What are Agent Skills?

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.

At its core, a skill is a folder containing a `SKILL.md` file. This file includes metadata (`name` and `description`, at minimum) and instructions that tell an agent how to perform a specific task. Skills can also bundle scripts, reference materials, templates, and other resources.

```
my-skill/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

## Why Agent Skills?

Agents are increasingly capable, but often don't have the context they need to do real work reliably. Skills solve this by packaging procedural knowledge and company-, team-, and user-specific context into portable, version-controlled folders that agents load on demand. This gives agents:

- **Domain expertise**: Capture specialized knowledge — from legal review processes to data analysis pipelines to presentation formatting — as reusable instructions and resources.
- **Repeatable workflows**: Turn multi-step tasks into consistent, auditable procedures.
- **Cross-product reuse**: Build a skill once and use it across any skills-compatible agent.

## How do Agent Skills work?

Agents load skills through **progressive disclosure**, in three stages:

1. **Discovery**: At startup, agents load only the name and description of each available skill, just enough to know when it might be relevant.

2. **Activation**: When a task matches a skill's description, the agent reads the full `SKILL.md` instructions into context.

3. **Execution**: The agent follows the instructions, optionally executing bundled code or loading referenced files as needed.

Full instructions load only when a task calls for them, so agents can keep many skills on hand with only a small context footprint.

## Where can I use Agent Skills?

Agent Skills are supported by a large number of AI tools and agentic clients — see the [Client Showcase](https://agentskills.io/clients).

## Open development

The Agent Skills format was originally developed by [Anthropic](https://www.anthropic.com/), released as an open standard, and has been adopted by a growing number of agent products. The standard is open to contributions from the broader ecosystem.

Discussion: [GitHub](https://github.com/agentskills/agentskills) · [Discord](https://discord.gg/MKPE9g8aUy)

## Spec pointers

| Doc                        | URL                                                           |
| -------------------------- | ------------------------------------------------------------- |
| Overview (this philosophy) | https://agentskills.io/home                                   |
| Specification              | https://agentskills.io/specification                          |
| Best practices             | https://agentskills.io/skill-creation/best-practices          |
| Using scripts              | https://agentskills.io/skill-creation/using-scripts           |
| Optimizing descriptions    | https://agentskills.io/skill-creation/optimizing-descriptions |

Validate locally:

```bash
npx skills-ref validate ./skills/animating-icons
npx skills-ref validate ./skills/motion-meaning
```

---

## This repository

| Path                                                                       | Role                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`skills/animating-icons/SKILL.md`](skills/animating-icons/SKILL.md)       | Lean skill brain — principle, gates, procedure, routing     |
| [`skills/animating-icons/references/`](skills/animating-icons/references/) | On-demand depth (families, failures, morph, verify, …)      |
| [`skills/animating-icons/scripts/`](skills/animating-icons/scripts/)       | Cross-platform verify helpers (Node); `.sh` = thin wrappers |
| [`skills/motion-meaning/SKILL.md`](skills/motion-meaning/SKILL.md)         | Reduced-motion role → strategy → meaning under reduce       |
| [`skills/motion-meaning/references/`](skills/motion-meaning/references/)   | Classify, strategies, audit, patterns, failures, verify     |
| [`skills/motion-meaning/scripts/`](skills/motion-meaning/scripts/)         | Dual-state verify harness (`verify-reduced.mjs`)            |
| [`docs/`](docs/)                                                           | GitHub Pages output (`npm run docs:build` from `site/`)         |
| [`site/`](site/)                                                           | Vite source for the landing (domain: skills.soralabs.io.vn)     |

**Implications for agents editing these skills:**

1. Keep `SKILL.md` lean; put detail in `references/` and link one level deep.
2. Frontmatter `name` must match the skill directory; `description` must cover WHAT + WHEN (and useful negative triggers).
3. Prefer progressive disclosure: discovery → activation → execution — do not dump every reference into `SKILL.md`.
4. Scripts should be self-contained or declare deps in `compatibility` / headers. Verify entrypoints: `node skills/animating-icons/scripts/verify-icon.mjs`, `node skills/motion-meaning/scripts/verify-reduced.mjs`.
5. After script changes, run `npm test` and/or `npm run test:motion-meaning`. After structural skill changes, run `npx skills-ref validate` on the skill folder you edited. Motion-meaning verify needs Playwright Chromium (first run downloads into `~/.cache/motion-meaning-verify`; CI may set `PLAYWRIGHT_BROWSERS_PATH`).
