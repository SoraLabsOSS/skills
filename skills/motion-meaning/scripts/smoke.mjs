#!/usr/bin/env node
/**
 * smoke.mjs — smoke tests for motion-meaning verify-reduced.
 *
 * Usage: node skills/motion-meaning/scripts/smoke.mjs
 *    or: npm run test:motion-meaning
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const verify = join(here, "verify-reduced.mjs");
const fixtures = join(here, "fixtures");

let passed = 0;
let failed = 0;

function run(label, fn) {
  process.stdout.write(`  ${label} … `);
  try {
    fn();
    console.log("ok");
    passed++;
  } catch (e) {
    console.log("FAIL");
    console.error(`    ${e.message || e}`);
    failed++;
  }
}

function node(args) {
  return spawnSync(process.execPath, [verify, ...args], {
    encoding: "utf8",
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("motion-meaning script smoke\n");

const work = mkdtempSync(join(tmpdir(), "motion-meaning-smoke-"));

try {
  run("default fixtures (all four strategies) dual-state", () => {
    const r = node(["--out", join(work, "good")]);
    assert(
      r.status === 0,
      `exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 500)}`,
    );
  });

  run("dead-branch fixture fails under reduce (--expect-fail)", () => {
    const r = node([
      "--expect-fail",
      join(fixtures, "dead-branch.html"),
      "--out",
      join(work, "dead"),
    ]);
    assert(
      r.status === 0,
      `exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 500)}`,
    );
  });

  run("dead-branch without --expect-fail exits non-zero", () => {
    const r = node([
      join(fixtures, "dead-branch.html"),
      "--out",
      join(work, "dead-raw"),
    ]);
    assert(r.status !== 0, "expected non-zero exit for unbroken dead-branch");
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
