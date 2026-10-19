import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const MASK = join(dirname(fileURLToPath(import.meta.url)), "mask-keys.mjs");
const KEYS = "sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{0,19}([^A-Za-z0-9_-]|$)|(ANTHROPIC|OPENAI)[A-Z0-9_]*KEY";
// Key prefixes built from parts, so this file never holds a key-shaped literal itself.
const ANT = "sk-" + "ant-", PROJ = "sk-" + "proj-";
// random letters and digits, never holding a stand-in word (xxx, fake, …) that would make it a placeholder by chance
const rnd = (n) => {
  for (;;) { const v = randomBytes(n * 2).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, n); if (v.length === n && !/xxx|your|example|placeholder|fake|dummy|changeme/i.test(v)) return v; }
};
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
    envWhole: `${ANT}api03-${rnd(93)}AA`, pyWhole: `${ANT}api03-${rnd(93)}AA`, jsonWhole: `${PROJ}${rnd(60)}`,
    tsWhole: `${ANT}api03-${rnd(93)}AA`, joinRest: rnd(80), uncommitted: `${ANT}api03-${rnd(93)}AA`, local: rnd(40),
    dated: `${ANT}api03-${rnd(93)}AA`, escaped: `${ANT}api03-${rnd(93)}AA`, percent: `${PROJ}${rnd(60)}`,
    opNext: rnd(34), lettersOnly: "qwertyuiopasdfghjklzxcvbnmQWERTY",
    pieces: `${ANT}api03-${rnd(40)}`, piecesML: `${ANT}api03-${rnd(40)}`, plusRest: rnd(40), slashRest: rnd(60), readable: `${ANT}api03-${rnd(93)}AA`,
  };
  const quads = (k) => k.match(/.{1,4}/g).map((q) => `"${q}"`).join(", ");
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
    randomBytes(20).toString("hex"),                                   // not a key: shown as it is
    "`;",
  ].join("\n"));
  writeFileSync(join(dir, "src/d.ts"), [
    `const whole = "${s.tsWhole}"`,
    `const joined = ["${ANT}api03-", "${s.joinRest}"].join("");`,
    `if (k.startsWith("${ANT}")) throw new Error("not an Anthropic key");`,
  ].join("\n"));
  writeFileSync(join(dir, "pieces.ts"), [
    `const a = [${quads(s.pieces)}].join("");`,                        // the auditor's array of 4-character pieces
    `const b = [`,
    `  ${quads(s.piecesML)}`,
    `].join("");`,
    `const c = "${ANT}" + "${s.plusRest.slice(0, 10)}" + "${s.plusRest.slice(10, 20)}" +`,
    `  "${s.plusRest.slice(20)}";`,
    `const d = "${ANT}api03-\\`,
    `${s.slashRest}";`,
    ``,
    `export const shown = 1;`,
  ].join("\n"));
  writeFileSync(join(dir, "readable.ts"), [
    `const KEY = "${s.readable}";`,
    ``,
    "const system = `Today is ${new Date().toISOString()}. Answer in one line.`;",
    "const wrap = `<email>${email}</email>`;",
    `if (block.type === "tool_result") count++;`,
    `const model = "claude-haiku-5-5";`,
    `const url = "https://api.anthropic.com/v1/messages";`,
  ].join("\n"));
  mkdirSync(join(dir, "db/migrations"), { recursive: true });
  writeFileSync(join(dir, "db/migrations/2024-01-15-seed.sql"), `INSERT INTO settings VALUES ('anthropic', '${s.dated}');\n`);
  writeFileSync(join(dir, "escaped.json"), `{ "msg": "key:\\n${s.escaped}", "url": "https://x.example/auth?h=Bearer%20${s.percent}" }\n`);
  writeFileSync(join(dir, "app.ts"), [
    `const res = await fetch("https://api.anthropic.com/v1/messages", {`,
    `  headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },`,
    `  body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 512 }),`,
    `});`,
  ].join("\n"));
  writeFileSync(join(dir, "keys.env"), `CLIENT_ANTHROPIC=${s.envWhole}\n`);
  writeFileSync(join(dir, "client.py"), `CLIENT = "${s.pyWhole}"\n`);
  writeFileSync(join(dir, "last.json"), `{\n  "name": "x",\n  "key": "${s.jsonWhole}"\n}\n`);
  writeFileSync(join(dir, "settings.py"), `class S(BaseSettings):\n    ANTHROPIC_API_KEY: str = "${s.pydantic}"\n\nKEY = ("${ANT}api03-"\n       "${s.pySplitRest}")\n`);
  writeFileSync(join(dir, "src/b.py"), `key = os.getenv("OPENAI_API_KEY", "${s.pyDefault}")\nother = os.environ["ANTHROPIC_API_KEY"]\n`);
  writeFileSync(join(dir, ".env.example"), `ANTHROPIC_API_KEY=your-key-here\nOPENAI_API_KEY="${s.envValue}"\nNEXT_PUBLIC_OPENAI_API_KEY=${s.slashy}\n`);
  writeFileSync(join(dir, "config.json"), `{\n  "ANTHROPIC_API_KEY":\n    "${s.nextLine}",\n  "other": 1\n}\n`);
  writeFileSync(join(dir, "ci.yml"), `env:\n  ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}\n  OPENAI_API_KEY: >\n    ${s.yamlBlock}\n  REF: \${ANTHROPIC_API_KEY}\n  OPENAI_KEY: ${s.lettersOnly}\n`);
  writeFileSync(join(dir, ".gitignore"), ".env\n.claude/settings.local.json\n");
  mkdirSync(join(dir, ".claude"));
  writeFileSync(join(dir, ".claude/settings.local.json"), `{\n  "env": { "ANTHROPIC_API_KEY": "${s.local}" }\n}\n`);
  writeFileSync(join(dir, "gone.ts"), `export const K = "${s.uncommitted}";\n`);
  writeFileSync(join(dir, ".env"), `ANTHROPIC_API_KEY=${s.ignored}\nOPENAI_API_KEY=${s.ignoredValue}\n`);
  writeFileSync(join(dir, "old.py"), `old = "${s.gone}"\n`);
  sh("git", ["init", "-q"]);
  git("add", "-A"); git("commit", "-qm", "one");
  git("rm", "-q", "old.py"); git("commit", "-qm", "two");
  git("rm", "-q", "gone.ts");                                            // removed, not committed yet
  const code = sh("node", [MASK, "code"], sh("git", ["grep", "-nIE", "-A1", "--untracked", KEYS]));
  const ignored = sh("node", [MASK, "code"],
    sh("git", ["grep", "-nIE", "-A1", "--untracked", "--no-exclude-standard", KEYS, "--", ".env*", "**/.env*", "*.env", "**/*.env",
      ".claude/settings.local.json", "**/.claude/settings.local.json"]));
  const diff = sh("node", [MASK, "history"], sh("git", ["diff", "-G", KEYS, "HEAD"]));
  const diffShown = sh("node", [MASK, "show"], sh("git", ["diff", "HEAD"]));
  // every key shape, dressed as a model id, a URL path, a header, a MIME type, or given to a key name
  const wrapped = [];
  for (let i = 0; i < 300; i++) {
    const k = [`${ANT}api03-${rnd(93)}AA`, `${PROJ}${rnd(48)}`, `sk-svcacct-${rnd(48)}`, `sk-admin-${rnd(48)}`, `sk-${rnd(48)}`][i % 5];
    const v = rnd(20 + (i % 60));
    s[`w${i}`] = k; s[`v${i}`] = v;
    wrapped.push(`const w${i} = ["claude-${k}", "https://hooks.example.com/services/${k}", "x-${k}", "application/${k}", "${k}"];`);
    wrapped.push(`const T${i}_ANTHROPIC_API_KEY: string = "${v}";`);
  }
  writeFileSync(join(dir, "wrapped.ts"), wrapped.join("\n"));
  const wrappedShown = sh("node", [MASK, "show", "wrapped.ts"]);
  const history = sh("node", [MASK, "history"],
    sh("git", ["log", "--all", "-p", "-G", KEYS, "--format=commit %h %ad", "--date=short"]));
  const files = ["pieces.ts", "readable.ts", "app.ts", "escaped.json", "db/migrations/2024-01-15-seed.sql", ".claude/settings.local.json", "src/a.ts", "src/b.py", "src/c.ts", "src/d.ts", "keys.env", "client.py", "last.json", "settings.py", ".env.example", "config.json", "ci.yml", ".env"];
  const show = files.map((f) => sh("node", [MASK, "show", f])).join("\n");
  const piped = sh("node", [MASK, "show"], sh("git", ["grep", "-n", "-A1", "--untracked", "--no-exclude-standard", "-e", "=", "-e", ":"]));
  const one = (f) => sh("node", [MASK, "show", f]);
  return { s, code, ignored, history, show, piped, diff, diffShown, wrappedShown, pieces: one("pieces.ts"), readable: one("readable.ts") };
}

// No 5 characters in a row of a secret appear in the output beyond its first 4.
// The ids (8 hex of a hash) and commit hashes are dropped first: a hex secret can share 5 characters with them by chance.
function leaks(secret, text) {
  text = text.replace(/id [0-9a-f]{8}\b/g, "id").replace(/^[0-9a-f]{7,40} /gm, "");
  for (let i = 1; i + 5 <= secret.length; i++) if (text.includes(secret.slice(i, i + 5))) return secret.slice(0, 4) + "…@" + i;
  return null;
}

const r = repo();

test("nothing beyond the first 4 characters of a key or value is ever printed", () => {
  for (const [name, secret] of Object.entries(r.s))
    for (const out of ["code", "ignored", "history", "show", "piped", "diff", "diffShown", "wrappedShown"]) assert.equal(leaks(secret, r[out]), null, `${name} in ${out}`);
});

test("each key shape is found, named and tagged", () => {
  const { code } = r;
  assert.match(code, /^src\/a\.ts:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:2  Anthropic key  sk-a….*placeholder$/m);
  assert.match(code, /^src\/a\.ts:3  Anthropic key  sk-a….*placeholder$/m);
  assert.match(code, /^src\/a\.ts:4  OpenAI key \(legacy\)  sk-.….*\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:5  ANTHROPIC_API_KEY named, no value here$/m);
  assert.match(code, /^src\/a\.ts:6  key-shaped text$/m);
  assert.match(code, /^src\/a\.ts:7  OpenAI key  sk-s….*\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:8  OpenAI key  sk-a….*\)  looks real$/m);
  assert.doesNotMatch(code, /old\.py/);
});

test("values: assigned, with + / =, a fallback literal, the next line, a YAML block; references stay references", () => {
  const { code } = r;
  assert.match(code, /^\.env\.example:1  ANTHROPIC_API_KEY value  your….*placeholder$/m);
  assert.match(code, /^\.env\.example:2  OPENAI_API_KEY value  .{4}….*\)  looks real$/m);
  assert.match(code, /^\.env\.example:3  NEXT_PUBLIC_OPENAI_API_KEY value  .{4}…  \(44 chars.*\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:9  ANTHROPIC_API_KEY value  .{4}….*\)  looks real$/m);
  assert.match(code, /^src\/a\.ts:10  EXPO_PUBLIC_ANTHROPIC_KEY value  .{4}….*\)  looks real$/m);
  assert.match(code, /^src\/b\.py:1  OPENAI_API_KEY value  .{4}….*\)  looks real$/m);
  assert.match(code, /^ci\.yml:6  OPENAI_KEY value  qwer…  \(32 chars.*\)  looks real$/m);
  assert.match(code, /^src\/b\.py:2  ANTHROPIC_API_KEY named, no value here$/m);
  assert.match(code, /^config\.json:3  ANTHROPIC_API_KEY value  .{4}…  \(40 chars.*\)  looks real$/m);
  assert.doesNotMatch(code, /config\.json:2 .*\(0 chars/);
  assert.match(code, /^ci\.yml:2  ANTHROPIC_API_KEY value  \$\{\{….*reference$/m);
  assert.match(code, /^ci\.yml:4  OPENAI_API_KEY value  .{4}…  \(40 chars.*\)  looks real$/m);
  assert.match(code, /^ci\.yml:5  ANTHROPIC_API_KEY named, no value here$/m);
  assert.doesNotMatch(code, /^\.env:/m);
});

test("split keys, typed assignments, a value after a trailing = or before a ?? on the next line", () => {
  const { code, history } = r;
  assert.match(code, /^src\/c\.ts:2  Anthropic key  sk-a….*split, looks real$/m);
  assert.match(code, /^src\/c\.ts:4  Anthropic key  sk-a….*split, looks real$/m);
  assert.match(code, /^settings\.py:4  Anthropic key  sk-a….*split, looks real$/m);
  assert.match(code, /^src\/c\.ts:5  AZURE_OPENAI_API_KEY value  .{4}…  \(32 chars.*\)  looks real$/m);
  assert.match(code, /^src\/c\.ts:6  OPENAI_API_KEY value  .{4}…  \(30 chars.*\)  looks real$/m);
  assert.doesNotMatch(code, /src\/c\.ts:[56] .*strin…/);
  assert.match(code, /^src\/c\.ts:8  ANTHROPIC_API_KEY value  .{4}…  \(40 chars.*\)  looks real$/m);
  assert.match(code, /^src\/c\.ts:9  ANTHROPIC_API_KEY named, no value here$/m);
  assert.match(code, /^src\/c\.ts:10  ANTHROPIC_API_KEY value  .{4}…  \(34 chars.*\)  looks real$/m);
  assert.match(code, /^settings\.py:2  ANTHROPIC_API_KEY value  .{4}…  \(36 chars.*\)  looks real$/m);
  assert.match(history, /src\/c\.ts added  AZURE_OPENAI_API_KEY value/);
  assert.match(history, /src\/c\.ts added  ANTHROPIC_API_KEY value  .{4}…  \(40 chars/);
});

test("a whole key at the end of a line is not split; a bare prefix is split or prefix only, never a placeholder", () => {
  const { code } = r;
  assert.match(code, /^keys\.env:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^client\.py:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^last\.json:3  OpenAI key  sk-p…  \(68 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^src\/d\.ts:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(code, /^src\/d\.ts:2  Anthropic key  sk-a…  \(13 chars, id [0-9a-f]{8}\)  split, looks real$/m);
  assert.match(code, /^src\/d\.ts:3  Anthropic key  sk-a…  \(7 chars, id [0-9a-f]{8}\)  prefix only$/m);
  assert.doesNotMatch(code, /^(keys\.env:1|client\.py:1|last\.json:3|src\/d\.ts:1) .*split/m);
});

test("show keeps lines without a key as they are", () => {
  assert.match(r.show, /^     1\timport Anthropic from "@anthropic-ai\/sdk";$/m);
  assert.match(r.show, /^    11\tconst resp = await client\.messages\.create\(\{ model: MODELS\.default, max_tokens: 1024 \}\);$/m);
  assert.match(r.readable, /^     3\tconst system = `Today is \$\{new Date\(\)\.toISOString\(\)\}\. Answer in one line\.`;$/m);
  assert.match(r.readable, /^     4\tconst wrap = `<email>\$\{email\}<\/email>`;$/m);
  assert.match(r.readable, /^     5\tif \(block\.type === "tool_result"\) count\+\+;$/m);
  assert.match(r.readable, /^     6\tconst model = "claude-haiku-5-5";$/m);
  assert.match(r.readable, /^     7\tconst url = "https:\/\/api\.anthropic\.com\/v1\/messages";$/m);
  assert.match(r.readable, /^     1\t<line 1 hidden: holds an AI key — Anthropic key sk-a…>$/m);
  assert.match(r.show, /fetch\("https:\/\/api\.anthropic\.com\/v1\/messages", \{/);
  assert.match(r.show, /headers: \{ "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application\/json" \}/);
});

test("a key statement is hidden whole: pieces, + chains, a \\ continuation, a value on the next line", () => {
  const hidden = (out, n) => new RegExp(`^ *${n}\\t<line ${n} hidden: holds an AI key — `, "m").test(out);
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) assert.ok(hidden(r.pieces, n), `pieces.ts:${n}`);
  assert.match(r.pieces, /^    10\texport const shown = 1;$/m);
  // no 4 characters in a row of a key's body (after its prefix) anywhere in the output
  for (const k of [r.s.pieces, r.s.piecesML, r.s.plusRest, r.s.slashRest]) {
    const body = k.replace(new RegExp(`^${ANT}api03-`), "");
    for (let i = 0; i + 4 <= body.length; i++) assert.ok(!r.pieces.includes(body.slice(i, i + 4)), `${body.slice(i, i + 4)} shown`);
  }
  assert.match(r.show, /^     7\t<line 7 hidden: holds an AI key — .*>\n     8\t<line 8 hidden: holds an AI key — /m);   // c.ts: NAME =⏎ "value"
  assert.match(r.show, /^     9\t<line 9 hidden: holds an AI key — .*>\n    10\t<line 10 hidden: holds an AI key — /m);  // c.ts: NAME⏎ ?? "value"
});

test("references and named reads stay readable; a value tied to a name is hidden", () => {
  assert.match(r.show, /^     2\t  ANTHROPIC_API_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}$/m);
  assert.match(r.show, /^     2\tother = os\.environ\["ANTHROPIC_API_KEY"\]$/m);
  assert.match(r.show, /^     3\t<line 3 hidden: holds an AI key — ANTHROPIC_API_KEY value .{4}…>$/m);   // config.json
  assert.match(r.piped, /^src\/a\.ts:1:<line 1 hidden: holds an AI key — Anthropic key sk-a…>$/m);
  assert.match(r.piped, /^config\.json-3-<line 3 hidden: holds an AI key — /m);
  // a hidden line still says which key variables it reads (G1 needs EXPO_PUBLIC_…), and nothing else of the line
  assert.match(r.show, /^    10\t<line 10 hidden: holds an AI key — EXPO_PUBLIC_ANTHROPIC_KEY value .{4}…; the line names EXPO_PUBLIC_ANTHROPIC_KEY>$/m);
  assert.match(r.code, /^src\/a\.ts:10  the line names EXPO_PUBLIC_ANTHROPIC_KEY$/m);
});

test("ignored .env files are found only by the --no-exclude-standard search", () => {
  assert.match(r.ignored, /^\.env:1  Anthropic key  sk-a….*\)  looks real$/m);
  assert.match(r.ignored, /^\.env:2  OPENAI_API_KEY value  .{4}….*\)  looks real$/m);
});

test("ignored .claude/settings.local.json is screened; a key removed in uncommitted changes is found", () => {
  assert.match(r.ignored, /^\.claude\/settings\.local\.json:2  ANTHROPIC_API_KEY value  .{4}…  \(40 chars.*\)  looks real$/m);
  assert.doesNotMatch(r.code, /settings\.local/);
  assert.match(r.diff, /^diff gone\.ts removed  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
});

test("a path with -NN- in it, an escaped or %-encoded key, and a matched line the finder cannot read", () => {
  const { code } = r;
  assert.match(code, /^db\/migrations\/2024-01-15-seed\.sql:1  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.doesNotMatch(code, /^db\/migrations\/2024:/m);
  assert.match(code, /^escaped\.json:1  Anthropic key  sk-a…  \(108 chars/m);
  assert.match(code, /^escaped\.json:1  OpenAI key  sk-p…  \(68 chars/m);
});

test("show reads a diff: headers and +/- lines stay, key lines are hidden", () => {
  assert.match(r.diffShown, /^diff --git a\/gone\.ts b\/gone\.ts$/m);
  assert.match(r.diffShown, /^-<line hidden: holds an AI key — Anthropic key sk-a…>$/m);
});

test("every key shape and every named value is hidden however it is dressed", () => {
  const shown = r.wrappedShown.trimEnd().split("\n");
  assert.equal(shown.length, 600);
  for (const l of shown) assert.match(l, /^ *\d+\t<line \d+ hidden: holds an AI key — /, l.slice(0, 60));
});

test("history finds a key that was deleted", () => {
  assert.match(r.history, /^[0-9a-f]+ \d{4}-\d\d-\d\d old\.py removed  OpenAI key  sk-p….*\)  looks real$/m);
  assert.match(r.history, /^[0-9a-f]+ \d{4}-\d\d-\d\d old\.py added  OpenAI key  sk-p….*\)  looks real$/m);
  assert.match(r.history, /config\.json added  ANTHROPIC_API_KEY value  .{4}….*\)  looks real$/m);
});

// ---------- audit 7: keys after escapes and colours, the space form, commit messages, and statements that stay readable ----------

function shapes() {
  const dir = mkdtempSync(join(tmpdir(), "mask-keys-shapes-"));
  const sh = (cmd, args, input) => execFileSync(cmd, args, { cwd: dir, input, encoding: "utf8" });
  const git = (...a) => sh("git", ["-c", "user.name=t", "-c", "user.email=t@e.x", ...a]);
  const ant = () => `${ANT}api03-${rnd(93)}AA`;
  const s = {
    ansiRaw: ant(), ansiU: ant(), ansiX: ant(), u20: ant(), x20: ant(), ubrace: ant(), glued: ant(), legacyAnsi: `sk-${rnd(48)}`,
    gluedLegacy: `sk-${rnd(48)}`, docker: rnd(32), dockerArg: rnd(40), csh: rnd(40), spaced: `${rnd(10)}7${rnd(20)}`,
    splitA: rnd(16), splitB: rnd(24), inTest: rnd(80), message: ant(), messageValue: rnd(40), settings: ant(), expo: ant(),
  };
  const files = {
    "run.log": `\x1b[32m${s.ansiRaw}\x1b[0m logged in\n\x1b[31m${s.legacyAnsi}\x1b[0m\nplain line\n`,
    "ansi.ts": [
      `const banner = "\\u001b[32m${s.ansiU}\\u001b[0m";`,
      `const banner2 = "\\x1b[32m${s.ansiX}\\x1b[0m";`,
      `const s = "key:\\u0020${s.u20}";`,
      `const t = "key:\\x20${s.x20}";`,
      `const u = \`key:\\u{20}${s.ubrace}\`;`,
      `const g = "Bearer${s.glued}";`,
      `const h = "token${s.gluedLegacy}";`,
      `export const shown = 1;`,
    ].join("\n"),
    "Dockerfile": `FROM node:22\nENV AZURE_OPENAI_API_KEY ${s.docker}\nARG OPENAI_API_KEY ${s.dockerArg}\nRUN npm ci\n`,
    "env.csh": `setenv OPENAI_API_KEY ${s.csh}\n`,
    "notes.txt": `OPENAI_API_KEY ${s.spaced}\nANTHROPIC_API_KEY is required\n`,
    "split.ts": `const OPENAI_API_KEY = "${s.splitA}" +\n  "${s.splitB}";\nconst after = 2;\n`,
    "llm.test.ts": [
      `describe("llm", () => {`,
      `  it("builds", () => {`,
      `    const k = ["${ANT}api03-", "${s.inTest}"].join("");`,
      `    expect(k).toBeTruthy();`,
      `  });`,
      `});`,
    ].join("\n"),
    "client.ts": [
      `import Anthropic from "@anthropic-ai/sdk";`,
      `export const client = new Anthropic({`,
      `  apiKey: "${ANT}test",`,
      `  baseURL,`,
      `  maxRetries: 0,`,
      `});`,
    ].join("\n"),
    ".claude/settings.json": [
      `{`,
      `  "env": {`,
      `    "ANTHROPIC_API_KEY": "${s.settings}"`,
      `  },`,
      `  "permissions": {`,
      `    "deny": ["Read(**/.env)", "Read(**/.env.*)"]`,
      `  },`,
      `  "hooks": {`,
      `    "PreToolUse": [{ "matcher": "Write|Edit|NotebookEdit|Bash", "hooks": [{ "type": "command", "command": "node" }] }]`,
      `  }`,
      `}`,
    ].join("\n"),
    "app.json": [
      `{`,
      `  "expo": {`,
      `    "name": "shop",`,
      `    "slug": "shop",`,
      `    "extra": {`,
      `      "anthropicKey": "${s.expo}"`,
      `    }`,
      `  }`,
      `}`,
    ].join("\n"),
  };
  mkdirSync(join(dir, ".claude"));
  for (const [f, t] of Object.entries(files)) writeFileSync(join(dir, f), t);
  sh("git", ["init", "-q"]);
  git("add", "-A"); git("commit", "-qm", "one");
  writeFileSync(join(dir, "later.txt"), "later\n");
  git("add", "-A"); git("commit", "-qm", `use key ${s.message} for now`, "-m", `OPENAI_API_KEY=${s.messageValue}`);
  const one = (f) => sh("node", [MASK, "show", f]);
  const show = Object.fromEntries(Object.keys(files).map((f) => [f, one(f)]));
  const code = sh("node", [MASK, "code"], sh("git", ["grep", "-nIE", "-A1", "--untracked", KEYS]));
  const history = sh("node", [MASK, "history"],
    sh("git", ["log", "--all", "-p", "-G", KEYS, "--format=commit %h %ad", "--date=short"]));
  const messages = sh("node", [MASK, "history"],
    sh("git", ["log", "--all", "--format=commit %h %ad%n%w(0,4,4)%B", "--date=short"]));
  const oneline = sh("node", [MASK, "show"], sh("git", ["log", "--oneline", "-60", "--name-only"]));
  const logp = sh("node", [MASK, "show"], sh("git", ["log", "-p"]));
  const piped = sh("node", [MASK, "show"], sh("git", ["grep", "-n", "--untracked", "-e", "=", "-e", ":"]));
  return { s, show, code, history, messages, oneline, logp, piped, all: [...Object.values(show), code, history, messages, oneline, logp, piped].join("\n") };
}

const x = shapes();
// the key's body: after its prefix and a version part such as api03-
const bodyOf = (k) => k.replace(/^sk-(ant-|proj-|svcacct-|admin-)?([a-z]+\d+-)?/, "");
const noRun = (k, text) => {
  text = text.replace(/[0-9a-f]{7,}/g, "");   // ids, commit hashes, index lines: hex by chance (so no key here is hex)
  const b = bodyOf(k), from = b === k ? 1 : 0;                          // a named value shows its first 4 by design
  for (let i = from; i + 4 <= b.length; i++) if (text.includes(b.slice(i, i + 4))) return b.slice(i, i + 4);
  return null;
};

test("no 4 characters in a row of a key's body appear in any mode's output, for the new shapes", () => {
  for (const [name, k] of Object.entries(x.s)) assert.equal(noRun(k, x.all), null, name);
});

test("a key after an ANSI colour, \\x20, \\u0020, \\u{20} or glued to a word is found, in the code and in history", () => {
  for (const n of [1, 2]) assert.match(x.code, new RegExp(`^run\\.log:${n}  (Anthropic key  sk-a…  \\(108|OpenAI key \\(legacy\\)  sk-.…  \\(51) chars, id [0-9a-f]{8}\\)  looks real$`, "m"));
  for (const n of [1, 2, 3, 4, 5, 6]) assert.match(x.code, new RegExp(`^ansi\\.ts:${n}  Anthropic key  sk-a…  \\(108 chars, id [0-9a-f]{8}\\)  looks real$`, "m"));
  assert.match(x.code, /^ansi\.ts:7  key-shaped text$/m);                  // sk- and 48 characters right after a word
  assert.match(x.history, /^[0-9a-f]+ \d{4}-\d\d-\d\d run\.log added  Anthropic key  sk-a…  \(108 chars/m);
  assert.match(x.history, /^[0-9a-f]+ \d{4}-\d\d-\d\d ansi\.ts added  key-shaped text$/m);
  for (const n of [1, 2, 3, 4, 5, 6, 7]) assert.match(x.show["ansi.ts"], new RegExp(`^ +${n}\\t<line ${n} hidden: `, "m"));
  assert.match(x.show["ansi.ts"], /^ +7\t<line 7 hidden: key-shaped text>$/m);
  assert.match(x.show["ansi.ts"], /^ +8\texport const shown = 1;$/m);
  assert.match(x.show["run.log"], /^ +1\t<line 1 hidden: .*\n +2\t<line 2 hidden: .*\n +3\tplain line$/m);
});

test("ENV NAME value, ARG, setenv and a bare secret-like token after a name", () => {
  assert.match(x.code, /^Dockerfile:2  AZURE_OPENAI_API_KEY value  .{4}…  \(32 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(x.code, /^Dockerfile:3  OPENAI_API_KEY value  .{4}…  \(40 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(x.code, /^env\.csh:1  OPENAI_API_KEY value  .{4}…  \(40 chars/m);
  assert.match(x.code, /^notes\.txt:1  OPENAI_API_KEY value  .{4}…  \(31 chars/m);
  assert.match(x.code, /^notes\.txt:2  ANTHROPIC_API_KEY named, no value here$/m);
  assert.match(x.show.Dockerfile, /^ +1\tFROM node:22\n +2\t<line 2 hidden: .*\n +3\t<line 3 hidden: .*\n +4\tRUN npm ci$/m);
  assert.match(x.show["notes.txt"], /^ +2\tANTHROPIC_API_KEY is required$/m);
});

test("a key in a commit message is found by the message search and hidden in git log through show", () => {
  assert.match(x.messages, /^[0-9a-f]+ \d{4}-\d\d-\d\d message  Anthropic key  sk-a…  \(108 chars, id [0-9a-f]{8}\)  looks real$/m);
  assert.match(x.messages, /^[0-9a-f]+ \d{4}-\d\d-\d\d message  OPENAI_API_KEY value  .{4}…  \(40 chars/m);
  assert.doesNotMatch(x.messages, /message .*one/);
  assert.match(x.oneline, /^<line hidden: holds an AI key — Anthropic key sk-a…>$/m);
  assert.match(x.oneline, /^[0-9a-f]{7,} one$/m);                          // a message without a key reads normally
  assert.match(x.oneline, /^later\.txt$/m);
});

test("a key whole on its line hides that line only: the client, the settings and the app config stay readable", () => {
  const c = x.show["client.ts"].trimEnd().split("\n");
  assert.deepEqual(c.map((l) => l.split("\t")[1]), [
    `import Anthropic from "@anthropic-ai/sdk";`, `export const client = new Anthropic({`,
    `<line 3 hidden: holds an AI key — Anthropic key sk-a…>`, `  baseURL,`, `  maxRetries: 0,`, `});`]);
  const st = x.show[".claude/settings.json"].trimEnd().split("\n").map((l) => l.split("\t")[1]);
  assert.equal(st.filter((l) => /hidden/.test(l)).length, 1);
  assert.equal(st[2], `<line 3 hidden: holds an AI key — Anthropic key sk-a…; the line names ANTHROPIC_API_KEY>`);
  assert.equal(st[1], `  "env": {`);
  assert.equal(st[4], `  "permissions": {`);
  assert.equal(st[5], `    "deny": ["Read(**/.env)", "Read(**/.env.*)"]`);
  assert.match(st[8], /"matcher": "Write\|Edit\|NotebookEdit\|Bash"/);
  const ap = x.show["app.json"].trimEnd().split("\n").map((l) => l.split("\t")[1]);
  assert.deepEqual(ap.filter((l) => /hidden/.test(l)), [`<line 6 hidden: holds an AI key — Anthropic key sk-a…>`]);
  assert.equal(ap[4], `    "extra": {`);
  assert.equal(ap[2], `    "name": "shop",`);
});

test("a split key hides its own statement, not the block or describe around it; a split named value hides its rest", () => {
  const t = x.show["llm.test.ts"].trimEnd().split("\n").map((l) => l.split("\t")[1]);
  assert.deepEqual(t.map((l) => /hidden/.test(l)), [false, false, true, false, false, false]);
  assert.equal(t[0], `describe("llm", () => {`);
  assert.equal(t[3], `    expect(k).toBeTruthy();`);
  assert.match(x.show["split.ts"], /^ +1\t<line 1 hidden: .*\n +2\t<line 2 hidden: .*\n +3\tconst after = 2;$/m);
  assert.match(x.code, /^split\.ts:1  OPENAI_API_KEY value  .{4}…  \(16 chars.*split, looks real$/m);
});

test("git log -p and piped search output go through show: key lines hidden, the rest readable", () => {
  assert.match(x.logp, /^\+<line hidden: holds an AI key — Anthropic key sk-a…>$/m);
  assert.match(x.logp, /^\+FROM node:22$/m);
  assert.match(x.piped, /^client\.ts:3:<line 3 hidden: holds an AI key — Anthropic key sk-a…>$/m);
  assert.match(x.piped, /^client\.ts:2:export const client = new Anthropic\(\{$/m);
});
