#!/usr/bin/env node
/**
 * seek-shot.mjs — freeze the icon animation at given times and screenshot each.
 *
 * Drives the harness page's `?t=N` hook (references/VERIFY.md).
 *
 * Usage:
 *   node scripts/seek-shot.mjs icon.html 0 0.4 0.8
 *   node scripts/seek-shot.mjs icon.html              # defaults to 0, 0.5, 1
 *
 * Output: frame-<t>.png in the current directory.
 * Needs: Node 18+, Playwright (`npx playwright install chromium` once).
 * Cross-platform. Prefer this over seek-shot.sh.
 * For the full gate runner (rest + ig-* assert + sheet), use verify-icon.mjs.
 *
 * Adapted from iart-ai/web-animation-skills (MIT).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.error("Usage: node scripts/seek-shot.mjs <file.html> [t1 t2 ...]");
  process.exit(args.length ? 0 : 1);
}

const htmlPath = resolve(args[0]);
if (!existsSync(htmlPath)) {
  console.error(`  ✗ file not found: ${htmlPath}`);
  process.exit(1);
}

const times = args.slice(1).map(Number);
const seekTimes =
  times.length && times.every((t) => Number.isFinite(t)) ? times : [0, 0.5, 1];

const fileUrl = pathToFileURL(htmlPath).href;

for (const t of seekTimes) {
  const url = `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}t=${t}`;
  const out = resolve(`frame-${t}.png`);
  const shot = spawnSync(
    "npx",
    ["-y", "playwright", "screenshot", "--wait-for-timeout=600", url, out],
    { encoding: "utf8", shell: true },
  );
  if (shot.status !== 0) {
    console.error(`  ✗ failed at t=${t}`);
    console.error((shot.stderr || shot.stdout || "").trim());
    process.exit(1);
  }
  console.log(`  t=${t}s -> ${out}`);
}

console.log(
  "  tile them: node scripts/contact-sheet.mjs sheet.png frame-*.png",
);
