#!/usr/bin/env bash
# Thin wrapper — logic lives in seek-shot.mjs (cross-platform).
# Prefer: node scripts/seek-shot.mjs …
# Full verify: node scripts/verify-icon.mjs …
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
exec node "$here/seek-shot.mjs" "$@"
