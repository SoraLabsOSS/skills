#!/usr/bin/env node
/**
 * verify-icon.mjs — one-command spot-check for an animated icon harness page.
 *
 * Captures rest + seek frames, asserts ig-* animations exist (fails loudly if
 * the probe would be measuring nothing), and tiles a contact sheet when ffmpeg
 * is available. Does NOT claim a full gate pass — Read the sheet and finish
 * VERIFY.md gates by hand.
 *
 * Usage:
 *   node scripts/verify-icon.mjs path/to/icon.html [--dur 0.9] [--out ./verify-out]
 *
 * Needs: Node 18+. First run installs Playwright into ~/.cache/animating-icons-verify.
 * Prefers ffmpeg on PATH; falls back to Playwright tile if ffmpeg is missing.
 *
 * The HTML page should implement the ?t=N seek hook from references/VERIFY.md:
 * set data-go, pause ig-* animations at t seconds, set window.__ready = true.
 *
 * Default verify entrypoint for all platforms. Prefer this over the .sh helpers.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Persistent Playwright install so `require("playwright")` works (npx -p does not). */
function ensurePlaywright() {
  const cache = join(homedir(), ".cache", "animating-icons-verify");
  const pkg = join(cache, "node_modules", "playwright", "package.json");
  mkdirSync(cache, { recursive: true });
  if (!existsSync(join(cache, "package.json"))) {
    writeFileSync(
      join(cache, "package.json"),
      JSON.stringify({ private: true, name: "animating-icons-verify-cache" }),
    );
  }
  if (!existsSync(pkg)) {
    console.log(
      "  installing playwright into ~/.cache/animating-icons-verify …",
    );
    const inst = spawnSync(
      "npm",
      ["install", "playwright@1", "--no-fund", "--no-audit", "--no-progress"],
      { cwd: cache, encoding: "utf8", shell: true },
    );
    if (inst.status !== 0 || !existsSync(pkg)) {
      return {
        ok: false,
        error: (
          inst.stderr ||
          inst.stdout ||
          "npm install playwright failed"
        ).trim(),
      };
    }
  }
  const install = spawnSync(
    process.execPath,
    [
      join(cache, "node_modules", "playwright", "cli.js"),
      "install",
      "chromium",
    ],
    { encoding: "utf8", shell: true },
  );
  // install may already be present; ignore non-zero if browsers exist
  return {
    ok: true,
    nodePath: join(cache, "node_modules"),
    installLog: (install.stderr || install.stdout || "").trim(),
  };
}

function usage(code = 1) {
  console.error(
    "Usage: node scripts/verify-icon.mjs <icon.html> [--dur 0.9] [--out ./verify-out]",
  );
  process.exit(code);
}

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  usage(args.length ? 0 : 1);
}

const htmlArg = args.find((a) => !a.startsWith("--") && !a.startsWith("-"));
if (!htmlArg) usage(1);

let dur = 0.9;
let outDir = resolve(process.cwd(), "verify-out");
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dur" && args[i + 1]) dur = parseFloat(args[++i]);
  if (args[i] === "--out" && args[i + 1]) outDir = resolve(args[++i]);
}
if (!Number.isFinite(dur) || dur <= 0) {
  console.error("  ✗ --dur must be a positive number of seconds");
  process.exit(1);
}

const htmlPath = resolve(htmlArg);
if (!existsSync(htmlPath)) {
  console.error(`  ✗ file not found: ${htmlPath}`);
  process.exit(1);
}

const htmlSrc = readFileSync(htmlPath, "utf8");
const hasSeekHook =
  /URLSearchParams/.test(htmlSrc) ||
  /searchParams\.get\(\s*['"]t['"]\s*\)/.test(htmlSrc) ||
  /\?t=/.test(htmlSrc);
if (!hasSeekHook) {
  console.warn(
    "  ! warning: page may lack the ?t=N seek hook (references/VERIFY.md).\n" +
      "    Seek frames may be empty or mid-flight. Continuing anyway.",
  );
}

mkdirSync(outDir, { recursive: true });

const mid = Math.round((dur / 2) * 1000) / 1000;
const times = [0, mid, dur];
const fileUrl = pathToFileURL(htmlPath).href;

const runner = `
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  const base = ${JSON.stringify(fileUrl)};
  const outDir = ${JSON.stringify(outDir)};
  const times = ${JSON.stringify(times)};
  const results = { animCount: 0, frames: [] };

  await page.goto(base, { waitUntil: "load" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: outDir + "/rest.png" });

  for (const t of times) {
    const url = base + (base.includes("?") ? "&" : "?") + "t=" + t;
    await page.goto(url, { waitUntil: "load" });
    try {
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 4000 });
    } catch (_) {}
    await page.waitForTimeout(250);
    const count = await page.evaluate(() => {
      const root =
        document.querySelector("[data-icon]") ||
        document.querySelector("svg") ||
        document.body;
      return root
        .getAnimations({ subtree: true })
        .filter((a) => a.animationName && a.animationName.startsWith("ig-")).length;
    });
    if (t === times[0]) results.animCount = count;
    const name = "frame-" + t + ".png";
    await page.screenshot({ path: outDir + "/" + name });
    results.frames.push({ t, name, animCount: count });
  }

  await browser.close();
  fs.writeFileSync(outDir + "/verify-meta.json", JSON.stringify(results, null, 2));
  process.stdout.write(JSON.stringify(results));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
`;

const runnerPath = join(outDir, "_verify-runner.cjs");
writeFileSync(runnerPath, runner);

console.log(`  verifying ${htmlPath}`);
console.log(`  out → ${outDir}`);
console.log(`  times → ${times.join(", ")}s`);

const pw = ensurePlaywright();
let nodeRun = { status: 1, stdout: "", stderr: pw.ok ? "" : pw.error };
if (pw.ok) {
  nodeRun = spawnSync(process.execPath, [runnerPath], {
    encoding: "utf8",
    env: { ...process.env, NODE_PATH: pw.nodePath },
  });
} else {
  console.error("  ✗ could not install playwright:", pw.error);
}

function captureWithCli() {
  console.warn(
    "  ! falling back to playwright screenshot CLI (no anim-count assert)",
  );
  const restOut = join(outDir, "rest.png");
  const r = spawnSync(
    "npx",
    [
      "-y",
      "playwright",
      "screenshot",
      "--wait-for-timeout=400",
      fileUrl,
      restOut,
    ],
    { encoding: "utf8", shell: true },
  );
  if (r.status !== 0) {
    console.error(
      "  ✗ could not capture rest.png — run: npx playwright install chromium",
    );
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  for (const t of times) {
    const url = `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}t=${t}`;
    const out = join(outDir, `frame-${t}.png`);
    const s = spawnSync(
      "npx",
      ["-y", "playwright", "screenshot", "--wait-for-timeout=600", url, out],
      { encoding: "utf8", shell: true },
    );
    if (s.status !== 0) {
      console.error(`  ✗ failed at t=${t}`);
      process.exit(1);
    }
    console.log(`  t=${t}s → ${out}`);
  }
  console.warn(
    "  ! anim count was not checked (CLI fallback). Confirm ig-* animations exist with ?t=0.",
  );
}

if (nodeRun.status !== 0) {
  const err = (nodeRun.stderr || nodeRun.stdout || "").trim();
  if (err) console.error(err);
  captureWithCli();
} else {
  let meta = null;
  try {
    const lines = (nodeRun.stdout || "").trim().split("\n").filter(Boolean);
    meta = JSON.parse(lines[lines.length - 1]);
  } catch {
    meta = null;
  }
  if (!meta) {
    console.warn("  ! could not parse runner output");
    captureWithCli();
  } else {
    console.log(`  ig-* animations at t=0: ${meta.animCount}`);
    if (meta.animCount === 0) {
      console.error(
        "  ✗ no ig-* animations found — the harness is measuring nothing.\n" +
          "    Prefix keyframes with ig-, fire via data-go, and implement the ?t=N seek hook.",
      );
      process.exit(1);
    }
    for (const f of meta.frames) {
      console.log(
        `  t=${f.t}s → ${join(outDir, f.name)} (${f.animCount} anims)`,
      );
    }
    console.log(`  rest → ${join(outDir, "rest.png")}`);
  }
}

const sheet = join(outDir, "sheet.png");
const frames = times
  .map((t) => join(outDir, `frame-${t}.png`))
  .filter(existsSync);
const contactJs = join(here, "contact-sheet.mjs");
if (frames.length && existsSync(contactJs)) {
  const tiled = spawnSync(process.execPath, [contactJs, sheet, ...frames], {
    encoding: "utf8",
  });
  if (tiled.status === 0) {
    const line = (tiled.stdout || "").trimEnd() || `  sheet → ${sheet}`;
    console.log(line.startsWith(" ") ? line : `  ${line}`);
  } else {
    console.warn(
      "  ! contact-sheet skipped (need ffmpeg on PATH):",
      (tiled.stderr || tiled.stdout || "").trim() || "unknown error",
    );
    console.log("  frames:", frames.join("  "));
  }
} else {
  console.log("  frames:", frames.join("  "));
}

console.log(`
  Harness captures done. Remaining gates (agent eyes):
  - Read rest.png + sheet.png (or frames)
  - Difference overlay: source vs rest, frame 0 vs final
  - Motion matrix (VERIFY.md gate 4)
  - Swap test + live hover through the real driver
  - Full checklist: references/VERIFY.md § Before shipping
`);
