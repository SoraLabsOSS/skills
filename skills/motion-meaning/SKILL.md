---
name: motion-meaning
description: >-
  Web (CSS/JS/React + GSAP/Motion): classify UI motion as communicative
  (sequence is the content) or decorative (decorating a result), then fix or
  apply prefers-reduced-motion so meaning survives under reduce. Use when
  auditing existing animation, gating new motion, verifying both preference
  states, catching a dead reduced-motion branch, snapping to an end state, or
  collapsing a transition without nuking essential cues. Not for React Native,
  full WCAG encyclopedias, keyboard traps, color contrast, focus management, or
  ARIA pattern audits.
license: MIT
compatibility: >-
  Verify with Node 18+. First run installs Playwright into
  ~/.cache/motion-meaning-verify and downloads Chromium (needs network;
  set PLAYWRIGHT_BROWSERS_PATH if CI caches browsers elsewhere). Default:
  node skills/motion-meaning/scripts/verify-reduced.mjs
metadata:
  author: SoraLabs
  version: "0.1.3"
---

# Motion Meaning

**Reduced motion isn't about removing animation. It's about deciding what remains when animation disappears.**

Ask once, before writing or patching any reduce branch:

> **Is the motion sequence the content, or is it decorating a result that exists either way?**

- **Communicative** (sequence = content) → keep the destination; change how you get there (snap end state, or reduce complexity).
- **Decorative** (decorating a result) → bail, or collapse the transition. No substitute required.

Grep for `prefers-reduced-motion` proves almost nothing. **Touches ≠ reachable ≠ correct.**

## Read next

| Situation                           | Open                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Pick a strategy                     | [references/CLASSIFY.md](references/CLASSIFY.md)                            |
| Reduce strategies + picture stories | [references/STRATEGIES.md](references/STRATEGIES.md)                        |
| Audit / fix existing code           | [references/AUDIT.md](references/AUDIT.md)                                  |
| Code patterns (CSS / JS / React)    | [references/PATTERNS.md](references/PATTERNS.md)                            |
| Failure modes                       | [references/FAILURES.md](references/FAILURES.md)                            |
| Done coding                         | [references/VERIFY.md](references/VERIFY.md) + `scripts/verify-reduced.mjs` |
| Sources & credit                    | [references/CREDITS.md](references/CREDITS.md)                              |

## Four reduce strategies

Pick **one** of these for what the screen becomes under reduce. Picture the outcome first; then open [STRATEGIES.md](references/STRATEGIES.md) for the full story.

| #   | Strategy                | When                                              | Under reduce **looks like**                                                                             |
| --- | ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Bail**                | Pure decoration; no honest reduced form           | Effect is **gone** — OS cursor back, no custom layer                                                    |
| 2   | **Snap to end state**   | Sequence _is_ the content (staged journey)        | **Same final layout** as the last frame of the full animation — no travel, no mid poses piled on screen |
| 3   | **Collapse transition** | Motion only decorates a result already in the DOM | Control **jumps to the right place** (tab pill, underline) — instant, not a slide                       |
| 4   | **Reduce complexity**   | Cost/layers/autoplay matter, not only duration    | **Same silhouette**, cheaper — fewer blur layers, autoplay off, fewer clones                            |

**Always also — live preference** (not a fifth “look”): read `prefers-reduced-motion` with a `change` listener (or library equivalent). One-shot `.matches` at mount goes stale mid-session. See [PATTERNS.md](references/PATTERNS.md).

Quick fork: decorative → **1** or **3**. Communicative journey → **2**. Still useful but heavy → **4**.

## The four gates

Every animation under authorship or audit passes all four. Verify by running both preference states — never by grepping alone. Details in [VERIFY.md](references/VERIFY.md).

1. **Role** — Communicative or decorative? (sequence = content?)
2. **Hazard** — Large viewport motion, parallax, spin, autoplay >5s, seizure flash?
3. **Reduce path** — Which strategy (1–4)? Is preference live?
4. **Meaning** — With reduce on, can the user still know the state / outcome?

## Author new motion

1. Name the role (gate 1) out loud before keyframes.
2. Pick strategy 1–4 from [CLASSIFY.md](references/CLASSIFY.md) — use the “looks like” column above.
3. Wire a **live** preference read — [PATTERNS.md](references/PATTERNS.md).
4. Implement the reduce branch _inside_ the setup that also owns the full-motion path (avoid outer gates that skip the end-state applicator — [FAILURES.md](references/FAILURES.md) #1).
5. Verify both states ([VERIFY.md](references/VERIFY.md)).

Companion: icon hover gestures from `animating-icons` are decorative → `animation: none` at rest. Icon-swap is communicative → instant coordinates, no tween.

## Audit existing motion

1. Inventory motion sources (CSS transitions/keyframes, WAAPI, GSAP, Motion, canvas, smooth-scroll hijack).
2. Per item: run the four gates; assign a strategy.
3. Report each finding as:
   - `file:line` + quoted snippet
   - role + failure (one short sentence)
   - concrete minimal fix
4. Prefer targeted patches. Do not rewrite unrelated UI.
5. Re-verify both preference states after the patch.

Full procedure: [AUDIT.md](references/AUDIT.md).

## Done checklist

- [ ] Role named (communicative vs decorative)
- [ ] Strategy 1–4 chosen; you can picture what “looks like” under reduce
- [ ] Preference is live (`change` listener — not one-shot at mount)
- [ ] Reduce branch is reachable (not dead behind an outer `if (reduced) return`)
- [ ] Gate 4: meaning survives under reduce (end state / bail / collapse as intended)
- [ ] No `duration: 0` on sequence-as-content without a snap end state
- [ ] If something waits on `transitionend` / `onComplete`, use `~0.01ms` not `0s`
- [ ] `scripts/verify-reduced.mjs` (or equivalent dual-state check) run on fixtures or the page
- [ ] Autoplay >5s still has a pause control (WCAG 2.2.2) even when motion is allowed
- [ ] Interaction-triggered motion is disable-able via PRM unless essential (WCAG 2.3.3) — meaning still survives under the chosen strategy

## Red flags — stop and re-derive

- "Just set `duration: 0` everywhere"
- Grep is green so shipping
- Outer `if (prefersReducedMotion) return` before the function that applies the end state
- One-shot `matchMedia(...).matches` with no `change` listener
- Reduced path teleports overlapping mid-states instead of a single destination
- Decorative flourish kept "because it is small"
