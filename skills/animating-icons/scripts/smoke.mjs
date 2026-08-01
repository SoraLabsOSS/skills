#!/usr/bin/env node
/**
 * smoke.mjs — lightweight smoke tests for the verify scripts.
 *
 * Usage: node skills/animating-icons/scripts/smoke.mjs
 *    or: npm test
 *
 * Needs Node 18+. First run may install Playwright into ~/.cache/animating-icons-verify.
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "fixtures");
const verify = join(here, "verify-icon.mjs");
const seek = join(here, "seek-shot.mjs");
const contact = join(here, "contact-sheet.mjs");

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

function node(script, args, opts = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    ...opts,
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("animating-icons script smoke\n");

const work = mkdtempSync(join(tmpdir(), "animating-icons-smoke-"));

try {
  run("verify-icon happy path (ig-* assert + sheet)", () => {
    const out = join(work, "happy");
    const r = node(verify, [
      join(fixtures, "icon.html"),
      "--dur",
      "0.9",
      "--out",
      out,
    ]);
    assert(
      r.status === 0,
      `exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 400)}`,
    );
    assert(existsSync(join(out, "rest.png")), "missing rest.png");
    assert(existsSync(join(out, "frame-0.png")), "missing frame-0.png");
    assert(existsSync(join(out, "frame-0.45.png")), "missing mid frame");
    assert(existsSync(join(out, "frame-0.9.png")), "missing final frame");
    assert(existsSync(join(out, "sheet.png")), "missing sheet.png");
    assert(
      existsSync(join(out, "verify-meta.json")),
      "missing verify-meta.json",
    );
    const meta = JSON.parse(readFileSync(join(out, "verify-meta.json"), "utf8"));
    assert(
      meta.animCount >= 1,
      `animCount expected >=1, got ${meta.animCount}`,
    );
  });

  run("verify-icon rejects harness with no ig-* animations", () => {
    const out = join(work, "broken");
    const r = node(verify, [
      join(fixtures, "broken.html"),
      "--dur",
      "0.3",
      "--out",
      out,
    ]);
    assert(r.status !== 0, "expected non-zero exit");
    assert(
      /no ig-\* animations|measuring nothing/i.test(r.stderr + r.stdout),
      "expected measuring-nothing message",
    );
  });

  run("verify-icon rejects missing file", () => {
    const r = node(verify, [join(work, "nope.html")]);
    assert(r.status !== 0, "expected non-zero exit");
    assert(
      /not found/i.test(r.stderr + r.stdout),
      "expected not-found message",
    );
  });

  run("seek-shot writes frames", () => {
    const cwd = join(work, "seek");
    mkdirSync(cwd, { recursive: true });
    const r = node(seek, [join(fixtures, "icon.html"), "0", "0.45"], { cwd });
    assert(
      r.status === 0,
      `exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 400)}`,
    );
    assert(existsSync(join(cwd, "frame-0.png")), "missing frame-0.png");
    assert(
      existsSync(join(cwd, "frame-0.45.png")),
      "missing frame-0.45.png",
    );
  });

  run("contact-sheet single frame copy", () => {
    const src = join(work, "happy", "rest.png");
    assert(existsSync(src), "happy rest.png missing — prior test must pass");
    const dest = join(work, "solo.png");
    const r = node(contact, [dest, src]);
    assert(
      r.status === 0,
      `exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 400)}`,
    );
    assert(existsSync(dest), "missing solo.png");
  });

  run("contact-sheet multi-frame tile", () => {
    const happy = join(work, "happy");
    const dest = join(work, "tiled.png");
    const r = node(contact, [
      dest,
      join(happy, "frame-0.png"),
      join(happy, "frame-0.45.png"),
      join(happy, "frame-0.9.png"),
    ]);
    assert(
      r.status === 0,
      `exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 400)}`,
    );
    assert(existsSync(dest), "missing tiled.png");
  });
} finally {
  try {
    rmSync(work, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
