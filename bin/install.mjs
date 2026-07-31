#!/usr/bin/env node
/* Copy the animating-icons skill into a Claude Code skills directory.
   No dependencies, no network, no install step — it only ever copies files. */

import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = "animating-icons";
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..", "skills", SKILL);

const args = process.argv.slice(2);
const has = (...f) => f.some((x) => args.includes(x));

if (has("-h", "--help")) {
    console.log(`
  ${SKILL} — install the skill into Claude Code

  npx github:SoraLabsOSS/animating-icons            into ./.claude/skills  (this project)
  npx github:SoraLabsOSS/animating-icons --global   into ~/.claude/skills  (every project)

  --force   overwrite an existing copy
  --help    this
`);
    process.exit(0);
}

const global = has("-g", "--global");
const root = global ? join(homedir(), ".claude") : join(process.cwd(), ".claude");
const dest = join(root, "skills", SKILL);

if (!existsSync(src)) {
    console.error(`  ✗ cannot find the skill at ${src}`);
    process.exit(1);
}

if (existsSync(dest) && !has("-f", "--force")) {
    console.error(`
  ✗ ${dest} already exists.

    Re-run with --force to overwrite it, or move it aside first.
`);
    process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });

const files = readdirSync(dest).sort();
console.log(`
  ✓ installed ${SKILL} -> ${dest}
    ${files.join("  ")}

  Restart Claude Code (or run /doctor) and it will pick the skill up.
  It fires on its own when you ask for icon animation work, or invoke it
  by name with the Skill tool.
`);
