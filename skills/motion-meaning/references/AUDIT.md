# Audit

Retroactive fix workflow. Related: [CLASSIFY.md](CLASSIFY.md) · [FAILURES.md](FAILURES.md) · [VERIFY.md](VERIFY.md)

## Inventory

Search the target surface for motion sources:

- CSS: `transition`, `animation`, `@keyframes`, `scroll-behavior`
- JS: `Animation` / WAAPI, `gsap.`, `ScrollTrigger`, Framer/Motion (`animate`, `motion.`), Lenis/Locomotive
- React: `useGSAP`, `animate`, custom `requestAnimationFrame` loops
- Strings: `prefers-reduced-motion`, `useReducedMotion`, `usePrefersReducedMotion`, `matchMedia`

List each distinct behavior (not each file). Note whether PRM is mentioned.

## Per-item gates

For each behavior:

1. **Role** — sequence = content, or decorating a result?
2. **Hazard** — large motion / autoplay >5s / flash?
3. **Reduce path** — strategies 1–4 present? Preference live?
4. **Meaning** — mentally (then actually) run with reduce on: what remains?

Mark **dead branch** if PRM is mentioned but the reduce applicator is unreachable ([FAILURES.md](FAILURES.md) #1).

## Report format

Group by file. Prefer `file:line`. Minimal patches only.

```text
## src/CardStack.tsx

src/CardStack.tsx:42 - outer `if (prefersReducedMotion) return` skips end-state applicator
  role: communicative (scroll sequence is the content)
  why: reduced users get default stacked cards; grep still green
  fix: gate on hasCards only; call applyEndState inside setup when reduced

src/Skeleton.tsx:18 - one-shot matchMedia, no change listener
  role: decorative pulse
  why: stale preference mid-session
  fix: use shared live hook (change listener)

## src/Highlight.tsx

✓ pass — collapse transition; live preference
```

Borrow the discipline: quote snippet → why (one sentence) → concrete fix. Do not refactor unrelated a11y (names, focus traps, contrast) unless asked — defer to a general accessibility skill.

## Bars (do not confuse)

| Claim                   | How you know                            |
| ----------------------- | --------------------------------------- |
| Touches PRM             | Grep                                    |
| Reduce branch reachable | Trace call graph / dual-state runtime   |
| Correct                 | Meaning survives; strategy matches role |

Ship only on the third bar.

## After patches

Re-run [VERIFY.md](VERIFY.md) on both preference states. Confirm dead branches are gone and Gate 4 still holds.
