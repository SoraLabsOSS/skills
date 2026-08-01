#!/usr/bin/env node
/**
 * contact-sheet.mjs — tile frames side-by-side into one image.
 *
 * Usage:
 *   node scripts/contact-sheet.mjs sheet.png frame-0.png frame-0.5.png frame-1.png
 *
 * Prefers ffmpeg on PATH; if missing, falls back to Playwright
 * (~/.cache/animating-icons-verify from verify-icon.mjs).
 * Cross-platform. Prefer this over contact-sheet.sh.
 *
 * Adapted from iart-ai/web-animation-skills (MIT).
 */

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.error(
    "Usage: node scripts/contact-sheet.mjs <out.png> <frame.png> [frame.png ...]",
  );
  process.exit(args.length ? 0 : 1);
}

const out = resolve(args[0]);
const frames = args.slice(1).map((f) => resolve(f));
if (!frames.length) {
  console.error("  ✗ need at least one frame");
  process.exit(1);
}
for (const f of frames) {
  if (!existsSync(f)) {
    console.error(`  ✗ missing frame: ${f}`);
    process.exit(1);
  }
}

if (frames.length === 1) {
  copyFileSync(frames[0], out);
  console.log(`  contact sheet (1 frame) -> ${out}`);
  process.exit(0);
}

function tileWithFfmpeg() {
  const ffmpegArgs = [
    "-y",
    ...frames.flatMap((f) => ["-i", f]),
    "-filter_complex",
    `hstack=inputs=${frames.length}`,
    out,
  ];
  const tiled = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf8" });
  if (tiled.status === 0) return { ok: true };
  const detail = [
    tiled.error?.message,
    (tiled.stderr || "").trim(),
    (tiled.stdout || "").trim(),
  ]
    .filter(Boolean)
    .join("\n");
  return { ok: false, detail: detail || "unknown error" };
}

function tileWithPlaywright() {
  const cache = join(homedir(), ".cache", "animating-icons-verify");
  const nodePath = join(cache, "node_modules");
  if (!existsSync(join(nodePath, "playwright", "package.json"))) {
    return {
      ok: false,
      detail:
        "Playwright cache missing — run verify-icon.mjs once, or install ffmpeg",
    };
  }

  const work = dirname(out);
  mkdirSync(work, { recursive: true });
  const htmlPath = join(work, "_contact-sheet.html");
  const imgs = frames
    .map((f) => `<img src="${pathToFileURL(f).href}" height="200" />`)
    .join("");
  writeFileSync(
    htmlPath,
    `<!doctype html><html><body style="margin:0;display:flex;align-items:stretch;background:#fff">${imgs}</body></html>`,
  );

  const runner = join(work, "_contact-sheet-runner.cjs");
  writeFileSync(
    runner,
    `
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(${JSON.stringify(pathToFileURL(htmlPath).href)}, { waitUntil: "load" });
  await page.waitForTimeout(100);
  const body = await page.$("body");
  await body.screenshot({ path: ${JSON.stringify(out)} });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
`,
  );

  const run = spawnSync(process.execPath, [runner], {
    encoding: "utf8",
    env: { ...process.env, NODE_PATH: nodePath },
  });
  if (run.status !== 0) {
    return {
      ok: false,
      detail: (run.stderr || run.stdout || "playwright tile failed").trim(),
    };
  }
  return { ok: true, via: "playwright" };
}

const ff = tileWithFfmpeg();
if (ff.ok) {
  console.log(`  contact sheet (${frames.length} frame(s)) -> ${out}`);
  process.exit(0);
}

const pw = tileWithPlaywright();
if (pw.ok) {
  console.log(
    `  contact sheet (${frames.length} frame(s), via playwright) -> ${out}`,
  );
  process.exit(0);
}

console.error(
  "  ✗ could not tile contact sheet.\n" +
    `    ffmpeg: ${ff.detail}\n` +
    `    playwright: ${pw.detail}`,
);
process.exit(1);
