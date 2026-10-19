#!/usr/bin/env node
// Says where AI keys are without ever printing one: every match is masked to its first 4 characters and "…".
//   KEYS='sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(ANTHROPIC|OPENAI)[A-Z0-9_]*KEY'
//   code:    git grep -nIE -A1 --untracked "$KEYS" | node mask-keys.mjs code
//            (ignored .env files: add --no-exclude-standard -- '.env*' '**/.env*')
//   history: git log --all -p -G "$KEYS" --format='commit %h %ad' --date=short | node mask-keys.mjs history
//   show:    node mask-keys.mjs show <file>     (the file, numbered, with every key masked)
//            any-search | node mask-keys.mjs show   (the lines, with every key masked)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// sk-ant-, sk-proj-, sk-svcacct-, sk-admin-, and any other sk- key of 20 or more characters (legacy OpenAI keys)
const KEY = /(?<![A-Za-z0-9])sk-(?:(ant|proj|svcacct|admin)-[A-Za-z0-9_-]*|[A-Za-z0-9_-]{20,})/g;
// A variable that names an AI key: ANTHROPIC_API_KEY, OPENAI_API_KEY, EXPO_PUBLIC_ANTHROPIC_KEY, …
const NAME = String.raw`\b([A-Z0-9_]*(?:ANTHROPIC|OPENAI)[A-Z0-9_]*KEY)\b`;
// NAME = value, NAME: value, "NAME": "value"; group 2 the separator, group 3 a quoted value, group 4 a bare one
const ASSIGN = new RegExp(NAME + String.raw`["']?[ \t]*(:|=(?!=))[ \t]*(?:["'\`]([^"'\`\n]*)["'\`]|([^\s"'\`,;)}\]]*))`, 'dg');
// a literal used when the variable is empty: NAME ?? "value", NAME || 'value', getenv("NAME", "value"), NAME") or "value"
const FALLBACK = new RegExp(NAME + String.raw`["'\`\]]*\)?[ \t]*(?:\?\?|\|\||,|\bor\b)[ \t]*(["'\`])((?:(?!\2)[^\n])*)\2`, 'dg');
const NAMED = new RegExp(NAME);
// a value that only points somewhere else
const REFERENCE = /^(\$|process\.env|os\.environ|os\.getenv|import\.meta\.env)/;

const mask = (v) => `${v.slice(0, 4)}…`;
// The same key gets the same id in the code and in history; 8 hex characters of a hash give nothing of the key away.
const idOf = (v) => createHash('sha256').update(v).digest('hex').slice(0, 8);
const kindOf = (sub) => (sub === 'ant' ? 'Anthropic key' : sub ? 'OpenAI key' : 'OpenAI key (legacy)');

function tag(value, prefix) {
  if (REFERENCE.test(value)) return 'reference';
  const body = value.slice(prefix.length).replace(/^[a-z]+\d+-/, '');   // drop a version part such as api03-
  const placeholder =
    body.length < 20 ||
    /xxx|your|example|placeholder|fake|dummy|changeme|<|>/i.test(value) ||
    /^(.)\1*$/.test(body);
  return placeholder ? 'placeholder' : 'looks real';
}

// One line: the keys in it, the line with them masked, and the name whose value is on the next line (or null).
// A value is left as it is only when it is a reference or shorter than 8 characters; sk- keys are always masked.
// `from` skips a search prefix (path:line:) before the value of a pending name.
function analyze(text, pending, from = 0) {
  const found = [], spans = [];
  const value = (kind, v, start, prefix = '') => {
    if (v === undefined || v === '') return;
    found.push({ kind, shown: mask(v), tag: tag(v, prefix), length: v.length, id: idOf(v), start });
    if (prefix || (!REFERENCE.test(v) && v.length >= 8)) spans.push([start, start + v.length]);
  };
  let next = null;
  if (pending) {
    const m = text.slice(from).match(/^(\s*)(?:(["'`])((?:(?!\2).)*)\2|([^\s,;]+))/);
    if (m) value(`${pending} value`, m[3] ?? m[4], from + m[1].length + (m[2] ? 1 : 0));
  }
  for (const m of text.matchAll(KEY)) value(kindOf(m[1]), m[0], m.index, m[1] ? `sk-${m[1]}-` : 'sk-');
  const isKey = (start) => spans.some(([a, b]) => start >= a && start < b);
  for (const m of text.matchAll(ASSIGN)) {
    const quoted = m[3] !== undefined, v = (quoted ? m[3] : m[4]) ?? '', start = m.indices[quoted ? 3 : 4][0];
    const rest = text.slice(m.index + m[0].length);
    if (m[2] === ':' && !quoted && /^([|>][-+]?)?\s*$/.test(v + rest)) { next = m[1]; continue; }   // "NAME":⏎ "value", or a YAML block
    if (!isKey(start)) value(`${m[1]} value`, v, start);
  }
  for (const m of text.matchAll(FALLBACK)) {
    const start = m.indices[3][0];
    if (!isKey(start) && !found.some((f) => f.start === start)) value(`${m[1]} fallback value`, m[3], start);
  }
  let masked = text;
  for (const [a, b] of spans.sort((x, y) => y[0] - x[0])) masked = masked.slice(0, a) + mask(text.slice(a, b)) + masked.slice(b);
  return { found, masked, next };
}

const line = (where, k) => `${where}  ${k.kind}  ${k.shown}  (${k.length} chars, id ${k.id})  ${k.tag}`;
const out = new Set();
const say = (s) => { if (!out.has(s)) { out.add(s); console.log(s); } };

const mode = process.argv[2];
if (mode === 'show') {
  const file = process.argv[3];
  const text = readFileSync(file ?? 0, 'utf8').replace(/\n$/, '');
  let pending = null;
  text.split('\n').forEach((l, i) => {
    const prefix = file ? 0 : (l.match(/^[^\s:]*?[:-]\d+[:-]/)?.[0].length ?? 0);   // piped search output: path:line:
    const r = analyze(l, pending, prefix);
    pending = r.next;
    console.log(file ? `${String(i + 1).padStart(6)}\t${r.masked}` : r.masked);
  });
} else if (mode === 'code' || mode === 'history') {
  const input = readFileSync(0, 'utf8').split('\n');
  let commit = '', file = '', pending = null, prev = null;
  for (const l of input) {
    if (mode === 'code') {
      const m = l.match(/^(.*?)[:-](\d+)[:-](.*)$/);   // a match (path:line:) or the line after it (path-line-)
      if (!m) { pending = null; continue; }
      const here = `${m[1]}:${m[2]}`;
      const follows = prev && prev.path === m[1] && prev.n + 1 === Number(m[2]);
      const r = analyze(m[3], follows ? pending : null);
      r.found.forEach((k) => say(line(here, k)));
      if (!r.found.length && !r.next && NAMED.test(m[3]) && l.slice(m[1].length + m[2].length + 1)[0] === ':')
        say(`${here}  ${m[3].match(NAMED)[1]} named, no value here`);
      pending = r.next; prev = { path: m[1], n: Number(m[2]) };
      continue;
    }
    if (l.startsWith('commit ')) { commit = l.slice(7).trim(); pending = null; continue; }
    if (l.startsWith('diff --git ')) { file = l.replace(/^diff --git a\/.* b\//, ''); pending = null; continue; }
    if (l.startsWith('+++ ') || l.startsWith('--- ')) continue;
    if (l[0] !== '+' && l[0] !== '-') { pending = null; continue; }
    const r = analyze(l.slice(1), pending);
    for (const k of r.found) say(line(`${commit} ${file} ${l[0] === '+' ? 'added' : 'removed'}`, k));
    pending = r.next;
  }
} else {
  console.error('usage: mask-keys.mjs code|history|show  (stdin)   or   mask-keys.mjs show <file>');
  process.exit(2);
}
