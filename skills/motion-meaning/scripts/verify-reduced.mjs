#!/usr/bin/env node
/**
 * verify-reduced.mjs — dual-state meaning checks for bundled fixtures.
 *
 * SECURITY: By default only opens HTML under scripts/fixtures/ (shipped with
 * this skill). Paths outside that directory are refused unless you pass
 * --allow-any-html (trusted local pages only — never untrusted remote HTML).
 * The runner reads a fixed, typed subset of window.__mm — never arbitrary
 * page text — to limit third-party content flowing into the agent loop.
 *
 * Usage:
 *   node scripts/verify-reduced.mjs
 *   node scripts/verify-reduced.mjs fixtures/dead-branch.html --expect-fail
 *   node scripts/verify-reduced.mjs path/to/trusted.html --allow-any-html
 *
 * Needs: Node 18+. First run installs Playwright into ~/.cache/motion-meaning-verify
 * and Chromium (network). Production pages without window.__mm are not auto-asserted —
 * see references/VERIFY.md § Pages without __mm.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, "fixtures");

const ALLOWED_CONTRACTS = new Set([
  "decorative-bail",
  "communicative-snap",
  "collapse-transition",
  "reduce-complexity",
]);

function ensurePlaywright() {
  const cache = join(homedir(), ".cache", "motion-meaning-verify");
  const pkg = join(cache, "node_modules", "playwright", "package.json");
  mkdirSync(cache, { recursive: true });
  if (!existsSync(join(cache, "package.json"))) {
    writeFileSync(
      join(cache, "package.json"),
      JSON.stringify({ private: true, name: "motion-meaning-verify-cache" }),
    );
  }
  if (!existsSync(pkg)) {
    console.log(
      "  installing playwright into ~/.cache/motion-meaning-verify …",
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
  spawnSync(
    process.execPath,
    [
      join(cache, "node_modules", "playwright", "cli.js"),
      "install",
      "chromium",
      "chromium-headless-shell",
    ],
    { encoding: "utf8", shell: true },
  );
  return { ok: true, nodePath: join(cache, "node_modules") };
}

function isUnderFixtures(absPath) {
  const resolved = resolve(absPath);
  const rel = relative(fixturesDir, resolved);
  return Boolean(rel) && !rel.startsWith("..") && !isAbsolute(rel);
}

function usage(code = 1) {
  console.error(`Usage:
  node scripts/verify-reduced.mjs
  node scripts/verify-reduced.mjs <fixture.html> [--out dir] [--expect-fail]
  node scripts/verify-reduced.mjs <page.html> --allow-any-html [--out dir]

  Default: only HTML under scripts/fixtures/ (skill-shipped).
  --allow-any-html  open a trusted local file outside fixtures (opt-in).`);
  process.exit(code);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) usage(0);

const expectFail = args.includes("--expect-fail");
const allowAnyHtml = args.includes("--allow-any-html");
let outDir = resolve(process.cwd(), "verify-out");
const paths = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out" && args[i + 1]) {
    outDir = resolve(args[++i]);
    continue;
  }
  if (args[i] === "--expect-fail" || args[i] === "--allow-any-html") continue;
  if (!args[i].startsWith("-")) paths.push(resolve(args[i]));
}

const targets =
  paths.length > 0
    ? paths.map((p) => ({ path: p, expectFail }))
    : [
        {
          path: join(fixturesDir, "decorative-bail.html"),
          expectFail: false,
        },
        {
          path: join(fixturesDir, "communicative-snap.html"),
          expectFail: false,
        },
        {
          path: join(fixturesDir, "collapse-transition.html"),
          expectFail: false,
        },
        {
          path: join(fixturesDir, "reduce-complexity.html"),
          expectFail: false,
        },
      ];

for (const t of targets) {
  if (!existsSync(t.path)) {
    console.error(`  ✗ file not found: ${t.path}`);
    process.exit(1);
  }
  if (!allowAnyHtml && !isUnderFixtures(t.path)) {
    console.error(
      `  ✗ refused path outside scripts/fixtures/:\n    ${t.path}\n` +
        `    Copy a fixture there, or pass --allow-any-html for a trusted local file.`,
    );
    process.exit(1);
  }
}

mkdirSync(outDir, { recursive: true });

const pw = ensurePlaywright();
if (!pw.ok) {
  console.error("  ✗ could not install playwright:", pw.error);
  process.exit(1);
}

const allowedContractsJson = JSON.stringify([...ALLOWED_CONTRACTS]);

const runner = `
const { chromium } = require("playwright");
const fs = require("fs");
const targets = ${JSON.stringify(
  targets.map((t) => ({
    fileUrl: pathToFileURL(t.path).href,
    expectFail: t.expectFail,
    name: t.path.split(/[/\\\\]/).pop(),
  })),
)};
const outDir = ${JSON.stringify(outDir)};
const ALLOWED = new Set(${allowedContractsJson});

function check(mm, reducedEmulated) {
  if (!mm || !mm.contract) {
    return { ok: false, reason: "missing window.__mm.contract" };
  }
  if (!ALLOWED.has(mm.contract)) {
    return { ok: false, reason: "unknown contract " + mm.contract };
  }
  if (mm.contract === "decorative-bail") {
    if (reducedEmulated) {
      if (mm.decorativeVisible) {
        return { ok: false, reason: "decorative still visible under reduce" };
      }
    } else if (!mm.decorativeVisible) {
      return { ok: false, reason: "decorative hidden when motion allowed" };
    }
    return { ok: true };
  }
  if (mm.contract === "communicative-snap") {
    if (reducedEmulated) {
      if (!mm.allEnded) {
        return {
          ok: false,
          reason: "end state not applied under reduce (dead branch or missing snap)",
        };
      }
    }
    return { ok: true };
  }
  if (mm.contract === "collapse-transition") {
    if (reducedEmulated) {
      if (!mm.collapsed || !mm.atTarget) {
        return {
          ok: false,
          reason: "pill not collapsed to target under reduce",
        };
      }
    } else if (mm.collapsed) {
      return { ok: false, reason: "collapse flag set while motion allowed" };
    }
    return { ok: true };
  }
  if (mm.contract === "reduce-complexity") {
    if (reducedEmulated) {
      if (mm.layerCount > (mm.maxAllowedWhenReduced || 1)) {
        return {
          ok: false,
          reason:
            "too many layers under reduce (" +
            mm.layerCount +
            " > " +
            (mm.maxAllowedWhenReduced || 1) +
            ")",
        };
      }
    } else if (mm.layerCount <= (mm.maxAllowedWhenReduced || 1)) {
      return {
        ok: false,
        reason: "full-motion path should use more layers than reduced",
      };
    }
    return { ok: true };
  }
  return { ok: false, reason: "unknown contract " + mm.contract };
}

/** Typed probe only — never return arbitrary page DOM/text to the host. */
function readMm() {
  const o = window.__mm;
  if (!o || typeof o !== "object") return null;
  const contract = typeof o.contract === "string" ? o.contract : "";
  return {
    contract,
    decorativeVisible: Boolean(o.decorativeVisible),
    allEnded: Boolean(o.allEnded),
    anyEnded: Boolean(o.anyEnded),
    collapsed: Boolean(o.collapsed),
    atTarget: Boolean(o.atTarget),
    layerCount: Number(o.layerCount) || 0,
    maxAllowedWhenReduced: Number(o.maxAllowedWhenReduced) || 1,
    reduce: Boolean(o.reduce),
  };
}

(async () => {
  const browser = await chromium.launch();
  const report = [];

  for (const t of targets) {
    for (const reduced of [false, true]) {
      const context = await browser.newContext({
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      const url =
        t.fileUrl +
        (t.fileUrl.includes("?") ? "&" : "?") +
        (reduced ? "reduce=1" : "reduce=0");
      await page.goto(url, { waitUntil: "load" });
      try {
        await page.waitForFunction(() => window.__ready === true, null, {
          timeout: 4000,
        });
      } catch (_) {}
      const mm = await page.evaluate(readMm);
      const result = check(mm, reduced);
      const entry = {
        file: t.name,
        reduced,
        expectFail: t.expectFail,
        mm,
        ...result,
      };
      if (t.expectFail && reduced) {
        entry.ok = !result.ok;
        if (result.ok) {
          entry.reason = "expected failure under reduce but contract passed";
        } else {
          entry.reason = "expected failure observed: " + result.reason;
        }
      } else if (t.expectFail && !reduced) {
        entry.ok = true;
        entry.reason = "skip expect-fail on motion-allowed pass";
      }
      report.push(entry);
      await context.close();
    }
  }

  await browser.close();
  fs.writeFileSync(
    outDir + "/verify-reduced-meta.json",
    JSON.stringify(report, null, 2),
  );
  process.stdout.write(JSON.stringify(report));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
`;

const runnerPath = join(outDir, "_verify-reduced-runner.cjs");
writeFileSync(runnerPath, runner);

console.log("  motion-meaning dual-state verify");
console.log(`  out → ${outDir}`);
if (allowAnyHtml) {
  console.warn(
    "  ! --allow-any-html: opening paths outside fixtures — use only trusted local HTML",
  );
}

const nodeRun = spawnSync(process.execPath, [runnerPath], {
  encoding: "utf8",
  env: { ...process.env, NODE_PATH: pw.nodePath },
});

if (nodeRun.status !== 0) {
  console.error((nodeRun.stderr || nodeRun.stdout || "").trim());
  process.exit(1);
}

let report;
try {
  const lines = (nodeRun.stdout || "").trim().split("\n").filter(Boolean);
  report = JSON.parse(lines[lines.length - 1]);
} catch {
  console.error("  ✗ could not parse runner output");
  console.error(nodeRun.stdout);
  process.exit(1);
}

let failed = 0;
for (const row of report) {
  const flag = row.reduced ? "reduce" : "motion";
  if (row.ok) {
    console.log(`  ✓ ${row.file} [${flag}]`);
  } else {
    failed++;
    console.error(`  ✗ ${row.file} [${flag}] — ${row.reason}`);
  }
}

if (failed) {
  console.error(
    `\n  ${failed} check(s) failed. See ${join(outDir, "verify-reduced-meta.json")}`,
  );
  process.exit(1);
}

console.log(`
  Dual-state checks passed.
  Remaining (agent eyes): live OS toggle without reload; autoplay pause controls;
  references/VERIFY.md checklist.
`);
