import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const MASK = join(dirname(fileURLToPath(import.meta.url)), "mask-keys.mjs");
const KEYS = "sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(ANTHROPIC|OPENAI)[A-Z0-9_]*KEY";
// Key prefixes built from parts, so this file never holds a key-shaped literal itself.
const ANT = "sk-" + "ant-", PROJ = "sk-" + "proj-";
const rnd = (n) => randomBytes(n * 2).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, n);
const b64 = (n) => randomBytes(n).toString("base64").slice(0, n);   // has + / = in it

// A repo with real-looking keys of every shape, placeholders, references, values in env and JSON files,
// a fallback literal, a value on the line after its name, an ignored .env, and a key that lives in history only.
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "mask-keys-"));
  const sh = (cmd, args, input) => execFileSync(cmd, args, { cwd: dir, input, encoding: "utf8" });
  const git = (...a) => sh("git", ["-c", "user.name=t", "-c", "user.email=t@e.x", ...a]);
  const s = {
    real: `${ANT}api03-${rnd(93)}AA`, gone: `${PROJ}${rnd(60)}`, legacy: `sk-${rnd(48)}`,
    svcacct: `sk-svcacct-${rnd(60)}`, admin: `sk-admin-${rnd(60)}`,
    envValue: rnd(40), slashy: b64(44), fallback: rnd(32), orFallback: rnd(30), pyDefault: rnd(36),
    nextLine: rnd(40), yamlBlock: rnd(40), ignored: `${ANT}api03-${rnd(93)}AA`, ignoredValue: rnd(40),
    splitRest: rnd(80), pySplitRest: rnd(80), azure: rnd(32), pydantic: rnd(36), union: rnd(30), trailing: rnd(40),
    opNext: rnd(34), lettersOnly: "qwertyuiopasdfghjklzxcvbnmQWERTY", hex: randomBytes(20).toString("hex"),
  };
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src/a.ts"), [
    `const k = "${s.real}";`,
    `const p = "${ANT}xxxxxxxxxxxx";`,
    `const q = "${ANT}api03-${"a".repeat(40)}";`,
    `const legacy = '${s.legacy}';`,
    `const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });`,
    `const task = "task-abcdefghijklmnopqrstuvwxyz0123";`,
    `const svc = "${s.svcacct}";`,
    `const adm = \`${s.admin}\`;`,
    `const f = process.env.ANTHROPIC_API_KEY ?? "${s.fallback}";`,
    `const g = process.env.EXPO_PUBLIC_ANTHROPIC_KEY || '${s.orFallback}';`,
  ].join("\n"));
  writeFileSync(join(dir, "src/c.ts"), [
    `import Anthropic from "@anthropic-ai/sdk";`,
    `const k1 = "${ANT}api03-" +`,
    `  "${s.splitRest}";`,
    "const k2 = `" + ANT + "api03-${suffix}`;",
    `const AZURE_OPENAI_API_KEY: string = "${s.azure}";`,
    `const OPENAI_API_KEY: string | undefined = process.env.OPENAI_API_KEY ?? "${s.union}";`,
    `const ANTHROPIC_API_KEY =`,
    `  "${s.trailing}";`,
    `const k3 = process.env.ANTHROPIC_API_KEY`,
    `  ?? "${s.opNext}";`,
    `const resp = await client.messages.create({ model: MODELS.default, max_tokens: 1024 });`,
    "const t = `",
    s.hex,
    "`;",
  ].join("\n"));
  writeFileSync(join(dir, "settings.py"), `class S(BaseSettings):\n    ANTHROPIC_API_KEY: str = "${s.pydantic}"\n\nKEY = ("${ANT}api03-"\n       "${s.pySplitRest}")\n`);
  writeFileSync(join(dir, "src/b.py"), `key = os.getenv("OPENAI_API_KEY", "${s.pyDefault}")\nother = os.environ["ANTHROPIC_API_KEY"]\n`);
  writeFileSync(join(dir, ".env.example"), `ANTHROPIC_API_KEY=your-key-here\nOPENAI_API_KEY="${s.envValue}"\nNEXT_PUBLIC_OPENAI_API_KEY=${s.slashy}\n`);
  writeFileSync(join(dir, "config.json"), `{\n  "ANTHROPIC_API_KEY":\n    "${s.nextLine}",\n  "other": 1\n}\n`);
  writeFileSync(join(dir, "ci.yml"), `env:\n  ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}\n  OPENAI_API_KEY: >\n    ${s.yamlBlock}\n  REF: \${ANTHROPIC_API_KEY}\n  OPENAI_KEY: ${s.lettersOnly}\n`);
  writeFileSync(join(dir, ".gitignore"), ".env\n");
  writeFileSync(join(dir, ".env"), `ANTHROPIC_API_KEY=${s.ignored}\nOPENAI_API_KEY=${s.ignoredValue}\n`);
  writeFileSync(join(dir, "old.py"), `old = "${s.gone}"\n`);
  sh("git", ["init", "-q"]);
  git("add", "-A"); git("commit", "-qm", "one");
  git("rm", "-q", "old.py"); git("commit", "-qm", "two");
  const code = sh("node", [MASK, "code"], sh("git", ["grep", "-nIE", "-A1", "--untracked", KEYS]));
  const ignored = sh("node", [MASK, "code"],
    sh("git", ["grep", "-nIE", "-A1", "--untracked", "--no-exclude-standard", KEYS, "--", ".env*", "**/.env*"]));
  const history = sh("node", [MASK, "history"],
    sh("git", ["log", "--all", "-p", "-G", KEYS, "--format=commit %h %ad", "--date=short"]));
  const files = ["src/a.ts", "src/b.py", "src/c.ts", "settings.py", ".env.example", "config.json", "ci.yml", ".env"];
  const show = files.map((f) => sh("node", [MASK, "show", f])).join("\n");
  const piped = sh("node", [MASK, "show"], sh("git", ["grep", "-n", "-A1", "--untracked", "--no-exclude-standard", "-e", "=", "-e", ":"]));
  return { s, code, ignored, history, show, piped };
}

// No 5 characters in a row of a secret appear in the output beyond its first 4.
function leaks(secret, text) {
  for (let i = 1; i + 5 <= secret.length; i++) if (text.includes(secret.slice(i, i + 5))) return secret.slice(0, 4) + "…@" + i;
  return null;
}

const r = repo();

test("nothing beyond the first 4 characters of a key or value is ever printed", () => {
  for (const [name, secret] of Object.entries(r.s))
    for (const out of ["code", "ignored", "history", "show", "piped"]) assert.equal(leaks(secret, r[out]), null, `${name} in ${out}`);
});

test("each key shape is found, named and tagged", () => {
  const { code } = r;
  assert.match(code, /^src\/a\.ts:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:2  Anthropic key  sk-a….*placeholder$/m);
  assert.match(code, /^src\/a\.ts:3  Anthropic key  sk-a….*placeholder$/m);
  assert.match(code, /^src\/a\.ts:4  OpenAI key \(legacy\)  sk-.….*looks real$/m);
  assert.match(code, /^src\/a\.ts:5  ANTHROPIC_API_KEY named, no value here$/m);
  assert.doesNotMatch(code, /src\/a\.ts:6/);
  assert.match(code, /^src\/a\.ts:7  OpenAI key  sk-s….*looks real$/m);
  assert.match(code, /^src\/a\.ts:8  OpenAI key  sk-a….*looks real$/m);
  assert.doesNotMatch(code, /old\.py/);
});

test("values: assigned, with + / =, a fallback literal, the next line, a YAML block; references stay references", () => {
  const { code } = r;
  assert.match(code, /^\.env\.example:1  ANTHROPIC_API_KEY value  your….*placeholder$/m);
  assert.match(code, /^\.env\.example:2  OPENAI_API_KEY value  .{4}….*looks real$/m);
  assert.match(code, /^\.env\.example:3  NEXT_PUBLIC_OPENAI_API_KEY value  .{4}…  \(44 chars.*looks real$/m);
  assert.match(code, /^src\/a\.ts:9  ANTHROPIC_API_KEY value  .{4}….*looks real$/m);
  assert.match(code, /^src\/a\.ts:10  EXPO_PUBLIC_ANTHROPIC_KEY value  .{4}….*looks real$/m);
  assert.match(code, /^src\/b\.py:1  OPENAI_API_KEY value  .{4}….*looks real$/m);
  assert.match(code, /^ci\.yml:6  OPENAI_KEY value  qwer…  \(32 chars.*looks real$/m);
  assert.match(code, /^src\/b\.py:2  ANTHROPIC_API_KEY named, no value here$/m);
  assert.match(code, /^config\.json:3  ANTHROPIC_API_KEY value  .{4}…  \(40 chars.*looks real$/m);
  assert.doesNotMatch(code, /config\.json:2 .*\(0 chars/);
  assert.match(code, /^ci\.yml:2  ANTHROPIC_API_KEY value  \$\{\{….*reference$/m);
  assert.match(code, /^ci\.yml:4  OPENAI_API_KEY value  .{4}…  \(40 chars.*looks real$/m);
  assert.match(code, /^ci\.yml:5  ANTHROPIC_API_KEY named, no value here$/m);
  assert.doesNotMatch(code, /^\.env:/m);
});

test("split keys, typed assignments, a value after a trailing = or before a ?? on the next line", () => {
  const { code, history } = r;
  assert.match(code, /^src\/c\.ts:2  Anthropic key  sk-a….*split, looks real$/m);
  assert.match(code, /^src\/c\.ts:4  Anthropic key  sk-a….*split, looks real$/m);
  assert.match(code, /^settings\.py:4  Anthropic key  sk-a….*split, looks real$/m);
  assert.match(code, /^src\/c\.ts:5  AZURE_OPENAI_API_KEY value  .{4}…  \(32 chars.*looks real$/m);
  assert.match(code, /^src\/c\.ts:6  OPENAI_API_KEY value  .{4}…  \(30 chars.*looks real$/m);
  assert.doesNotMatch(code, /src\/c\.ts:[56] .*strin…/);
  assert.match(code, /^src\/c\.ts:8  ANTHROPIC_API_KEY value  .{4}…  \(40 chars.*looks real$/m);
  assert.match(code, /^src\/c\.ts:9  ANTHROPIC_API_KEY named, no value here$/m);
  assert.match(code, /^src\/c\.ts:10  ANTHROPIC_API_KEY value  .{4}…  \(34 chars.*looks real$/m);
  assert.match(code, /^settings\.py:2  ANTHROPIC_API_KEY value  .{4}…  \(36 chars.*looks real$/m);
  assert.match(history, /src\/c\.ts added  AZURE_OPENAI_API_KEY value/);
  assert.match(history, /src\/c\.ts added  ANTHROPIC_API_KEY value  .{4}…  \(40 chars/);
});

test("show keeps the code readable: names, calls and import specifiers stay", () => {
  assert.match(r.show, /^     1\timport Anthropic from "@anthropic-ai\/sdk";$/m);
  assert.match(r.show, /^    11\tconst resp = await client\.messages\.create\(\{ model: MODELS\.default, max_tokens: 1024 \}\);$/m);
});

test("ignored .env files are found only by the --no-exclude-standard search", () => {
  assert.match(r.ignored, /^\.env:1  Anthropic key  sk-a….*looks real$/m);
  assert.match(r.ignored, /^\.env:2  OPENAI_API_KEY value  .{4}….*looks real$/m);
});

test("history finds a key that was deleted", () => {
  assert.match(r.history, /^[0-9a-f]+ \d{4}-\d\d-\d\d old\.py removed  OpenAI key  sk-p….*looks real$/m);
  assert.match(r.history, /^[0-9a-f]+ \d{4}-\d\d-\d\d old\.py added  OpenAI key  sk-p….*looks real$/m);
  assert.match(r.history, /config\.json added  ANTHROPIC_API_KEY value  .{4}….*looks real$/m);
});

test("show masks keys and values but keeps references and the code around them", () => {
  assert.match(r.show, /^     1\tconst k = "sk-a…";$/m);
  assert.match(r.show, /^     9\tconst f = process\.env\.ANTHROPIC_API_KEY \?\? ".{4}…";$/m);
  assert.match(r.show, /^     2\t  ANTHROPIC_API_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}$/m);
  assert.match(r.show, /^     2\tother = os\.environ\["ANTHROPIC_API_KEY"\]$/m);
  assert.match(r.show, /^     3\t    ".{4}…",$/m);
  assert.match(r.piped, /^src\/a\.ts:1:const k = "sk-a…";$/m);
  assert.match(r.piped, /^config\.json-3-    ".{4}…",$/m);
});
