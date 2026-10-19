import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const MASK = join(dirname(fileURLToPath(import.meta.url)), "mask-keys.mjs");
const KEYS = "sk-(ant-|proj-|[A-Za-z0-9]{20})|(ANTHROPIC|OPENAI)_API_KEY";
const rnd = (n) => randomBytes(n * 2).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, n);

// A repo with a real-looking key, placeholders, an env assignment, and a key that lives in history only.
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "mask-keys-"));
  const sh = (cmd, args, input) => execFileSync(cmd, args, { cwd: dir, input, encoding: "utf8" });
  const real = `sk-ant-api03-${rnd(93)}AA`, gone = `sk-proj-${rnd(60)}`, legacy = `sk-${rnd(48)}`, envValue = rnd(40);
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src/a.ts"), [
    `const k = "${real}";`,
    `const p = "sk-ant-xxxxxxxxxxxx";`,
    `const q = "sk-ant-api03-${"a".repeat(40)}";`,
    `const legacy = '${legacy}';`,
    `const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });`,
    `const task = "task-abcdefghijklmnopqrstuvwxyz0123";`,
  ].join("\n"));
  writeFileSync(join(dir, ".env.example"), `ANTHROPIC_API_KEY=your-key-here\nOPENAI_API_KEY="${envValue}"\n`);
  writeFileSync(join(dir, "old.py"), `old = "${gone}"\n`);
  sh("git", ["init", "-q"]);
  sh("git", ["-c", "user.name=t", "-c", "user.email=t@e.x", "add", "-A"]);
  sh("git", ["-c", "user.name=t", "-c", "user.email=t@e.x", "commit", "-qm", "one"]);
  sh("git", ["rm", "-q", "old.py"]);
  sh("git", ["-c", "user.name=t", "-c", "user.email=t@e.x", "commit", "-qm", "two"]);
  const code = sh("node", [MASK, "code"], sh("git", ["grep", "-nIE", "--untracked", KEYS]));
  const history = sh("node", [MASK, "history"],
    sh("git", ["log", "--all", "-p", "-G", KEYS, "--format=commit %h %ad", "--date=short"]));
  const show = sh("node", [MASK, "show", "src/a.ts"]) + sh("node", [MASK, "show", ".env.example"])
    + sh("node", [MASK, "show"], sh("git", ["grep", "-n", "-e", "const", "-e", "API_KEY"]));
  return { secrets: [real, gone, legacy, envValue], code, history, show };
}

// No 5 characters in a row of a secret appear in the output beyond its first 4.
function leaks(secret, text) {
  for (let i = 1; i + 5 <= secret.length; i++) if (text.includes(secret.slice(i, i + 5))) return secret.slice(0, 4) + "…@" + i;
  return null;
}

test("nothing beyond the first 4 characters of a key is ever printed", () => {
  const r = repo();
  for (const s of r.secrets) for (const out of [r.code, r.history, r.show]) assert.equal(leaks(s, out), null);
});

test("each match is tagged and masked", () => {
  const { code, history, show } = repo();
  assert.match(code, /^src\/a\.ts:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:2  Anthropic key  sk-a….*placeholder$/m);
  assert.match(code, /^src\/a\.ts:3  Anthropic key  sk-a….*placeholder$/m);
  assert.match(code, /^src\/a\.ts:4  OpenAI key \(legacy\)  sk-.….*looks real$/m);
  assert.match(code, /^src\/a\.ts:5  ANTHROPIC_API_KEY named, no value here$/m);
  assert.doesNotMatch(code, /src\/a\.ts:6/);
  assert.match(code, /^\.env\.example:1  ANTHROPIC_API_KEY value  your….*placeholder$/m);
  assert.match(code, /^\.env\.example:2  OPENAI_API_KEY value  .{4}….*looks real$/m);
  assert.doesNotMatch(code, /old\.py/);
  assert.match(show, /^src\/a\.ts:1:const k = "sk-a…";$/m);
  assert.match(show, /^     2\tOPENAI_API_KEY=".{4}…"$/m);
  assert.match(history, /^[0-9a-f]+ \d{4}-\d\d-\d\d old\.py removed  OpenAI key  sk-p….*looks real$/m);
  assert.match(history, /^[0-9a-f]+ \d{4}-\d\d-\d\d old\.py added  OpenAI key  sk-p….*looks real$/m);
});
