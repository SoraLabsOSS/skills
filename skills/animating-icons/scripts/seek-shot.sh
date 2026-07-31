#!/usr/bin/env bash
# seek-shot.sh — freeze the icon's animation at given times and screenshot each.
#
# Drives the harness page's `?t=N` hook (VERIFY.md § The ?t=N seek harness): the page starts
# the gesture, then pauses every animation at t seconds, so every shot lands on a
# deterministic still frame.
#
# Usage:
#   scripts/seek-shot.sh icon.html 0 0.4 0.8    # screenshot at t=0, 0.4, 0.8 seconds
#   scripts/seek-shot.sh icon.html              # defaults to 0, 0.5, 1
# Output: frame-<t>.png in the current directory.
# Needs: npx (Playwright fetches Chromium on first run: `npx playwright install chromium`).
#
# Adapted from iart-ai/web-animation-skills (MIT).
set -euo pipefail
html="${1:?usage: seek-shot.sh <file.html> [t1 t2 ...]}"; shift || true
times=("$@"); [ "${#times[@]}" -eq 0 ] && times=(0 0.5 1)
abs="$(cd "$(dirname "$html")" && pwd)/$(basename "$html")"
for t in "${times[@]}"; do
  out="frame-${t}.png"
  npx -y playwright screenshot --wait-for-timeout=600 "file://${abs}?t=${t}" "$out" >/dev/null 2>&1
  echo "  t=${t}s -> $out"
done
echo "  tile them: scripts/contact-sheet.sh sheet.png frame-*.png"
