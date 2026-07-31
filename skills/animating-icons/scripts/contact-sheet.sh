#!/usr/bin/env bash
# contact-sheet.sh — tile frames side-by-side into one image for one-glance inspection.
#
# A frame strip you flip through is a frame strip you misread; start | mid | end seen
# together is what catches a dead segment or a jump between adjacent frames.
#
# Usage:
#   scripts/contact-sheet.sh sheet.png frame-0.png frame-0.5.png frame-1.png
# All inputs must share the same height (frames from the same render do). Needs: ffmpeg.
#
# Adapted from iart-ai/web-animation-skills (MIT).
set -euo pipefail
out="${1:?usage: contact-sheet.sh <out.png> <frame.png> [frame.png ...]}"; shift
[ "$#" -ge 1 ] || { echo "need at least one frame"; exit 1; }
inputs=(); for f in "$@"; do inputs+=(-i "$f"); done
if [ "$#" -eq 1 ]; then cp "$1" "$out"; else
  ffmpeg -y "${inputs[@]}" -filter_complex "hstack=inputs=$#" "$out" -loglevel error
fi
echo "  contact sheet ($# frame(s)) -> $out"
