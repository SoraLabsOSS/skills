#!/usr/bin/env bash
# Thin wrapper — logic lives in contact-sheet.mjs (cross-platform).
# Prefer: node scripts/contact-sheet.mjs …
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
exec node "$here/contact-sheet.mjs" "$@"
