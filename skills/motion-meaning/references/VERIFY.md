# Verify

Prove both preference states. Related: [FAILURES.md](FAILURES.md) · `scripts/verify-reduced.mjs`

## Bars

1. **Normal** (`prefers-reduced-motion: no-preference`) — full motion behaves as designed.
2. **Reduced** (`reduce`) — chosen strategy applied; **meaning** intact.
3. Never ship on grep alone.

## Meaning / broken-invariant checks

Pick asserts that match the role:

| Role / strategy   | Pass looks like                             | Fail looks like                           |
| ----------------- | ------------------------------------------- | ----------------------------------------- |
| Bail              | Effect absent (`display` none / not in DOM) | Layer still tracking pointer              |
| Snap end state    | Final transforms/positions present          | All items stacked at defaults / mid poses |
| Collapse          | Final active styles on; no long travel      | Stuck at start pose                       |
| Reduce complexity | Fewer layers / autoplay stopped             | Same cost path as full motion             |
| Live preference   | Toggle OS/DevTools updates without reload   | Stale path until refresh                  |

For collapse/expand chrome: check `aria-expanded` / visible open-closed cue still correct under reduce.

## Harness (fixtures)

Default entrypoint runs **all four strategy fixtures**. Use `--expect-fail` for `dead-branch.html`:

```bash
node skills/motion-meaning/scripts/verify-reduced.mjs
node skills/motion-meaning/scripts/verify-reduced.mjs --expect-fail skills/motion-meaning/scripts/fixtures/dead-branch.html
```

| Fixture                    | Contract (`window.__mm.contract`)                        |
| -------------------------- | -------------------------------------------------------- |
| `decorative-bail.html`     | `decorative-bail`                                        |
| `communicative-snap.html`  | `communicative-snap`                                     |
| `collapse-transition.html` | `collapse-transition`                                    |
| `reduce-complexity.html`   | `reduce-complexity`                                      |
| `dead-branch.html`         | `communicative-snap` (intentionally broken under reduce) |

First run installs Playwright + Chromium into `~/.cache/motion-meaning-verify` (needs network). On CI, preinstall browsers or set `PLAYWRIGHT_BROWSERS_PATH`. Missing Chromium is an environment failure, not a skill-structure failure.

## Pages without `__mm` (production)

The harness **only auto-asserts** when the page sets `window.__mm` + `window.__ready` (fixture contract). Real app pages usually do not.

For production UI the agent must still:

1. Emulate both preference states (Playwright `reducedMotion` and/or DevTools).
2. Assert **meaning** with page-specific selectors (ARIA, end transforms, layer counts) — use the table above.
3. Optionally inject a temporary `__mm` probe while auditing, then remove it.

Do not treat “script ran with no `__mm`” as a pass.

For JS paths under test, support `?reduce=1`. Emulate CSS with Playwright `reducedMotion: 'reduce'`.

## Manual spot-check

1. DevTools → emulate `prefers-reduced-motion: reduce`.
2. Exercise the control (hover, scroll, open dialog, swap icon).
3. Confirm Gate 4 (meaning).
4. Toggle emulation off/on with the page still open — live preference must react.

## Before you finish

- [ ] Both states exercised
- [ ] Dead reduced branches ruled out
- [ ] No sequence-as-content left on naked `duration: 0`
- [ ] Completion listeners safe (`0.01ms` or instant set)
- [ ] Autoplay >5s has pause control when motion is allowed
