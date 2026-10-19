#!/usr/bin/env node
// Says where AI keys are without ever printing one: every match is masked to its first 4 characters and "…".
//   KEYS='sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(ANTHROPIC|OPENAI)[A-Z0-9_]*KEY'
//   code:    git grep -nIE -A1 --untracked "$KEYS" | node mask-keys.mjs code
//            (ignored files: add --no-exclude-standard -- '.env*' '**/.env*' '*.env' '**/*.env'
//             '.claude/settings.local.json' '**/.claude/settings.local.json')
//   history: git log --all -p -G "$KEYS" --format='commit %h %ad' --date=short | node mask-keys.mjs history
//            git diff -G "$KEYS" <base> | node mask-keys.mjs history   (uncommitted and branch changes: "diff")
//   show:    node mask-keys.mjs show <file>     (the file, numbered, every string and value masked)
//            any-search | node mask-keys.mjs show   (the lines, masked the same way)
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// sk-ant-, sk-proj-, sk-svcacct-, sk-admin-, and any other sk- key of 20 or more characters (legacy OpenAI keys)
const KEY = /(?<![A-Za-z0-9])sk-(?:(ant|proj|svcacct|admin)-[A-Za-z0-9_-]*|[A-Za-z0-9_-]{20,})/g;
// A variable that names an AI key: ANTHROPIC_API_KEY, OPENAI_API_KEY, AZURE_OPENAI_API_KEY, EXPO_PUBLIC_ANTHROPIC_KEY, …
const NAME = /\b([A-Z0-9_]*(?:ANTHROPIC|OPENAI)[A-Z0-9_]*KEY)\b/g;
const ONLY_NAME = /^[A-Z0-9_]*(?:ANTHROPIC|OPENAI)[A-Z0-9_]*KEY$/;
// A string literal, or one left open at the end of the line (it goes on below).
const QUOTED = /(["'`])((?:\\.|(?!\1)[^\\])*)(\1|$)/g;
// A value that only points somewhere else.
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

// ---------- finding (code and history): what is where, and the name whose value is on the next line ----------

function analyze(text, pending) {
  const found = [], named = [];
  const add = (kind, v, start, prefix = '', t) => {
    if (!v || found.some((f) => f.start === start)) return;
    found.push({ kind, shown: mask(v), tag: t ?? tag(v, prefix), length: v.length, id: idOf(v), start });
  };
  const keys = [...text.matchAll(KEY)];
  const inKey = (i) => keys.some((k) => i >= k.index && i < k.index + k[0].length);
  let next = null;

  // pending.op: the line above ended in an operator (=, :, ??, …); otherwise it ended with the name, and the value
  // counts only when this line goes on with an operator (NAME⏎ ?? "value")
  if (pending && !/^\s*[A-Za-z_][\w.]*\s*[:=]/.test(text) && (pending.op || /^\s*(\?\?|\|\||or\b|,)/.test(text))) {
    const q = [...text.matchAll(QUOTED)][0], b = text.match(/^\s*([^\s,;]+)/);
    if (q) add(`${pending.name} value`, q[2], q.index + 1);
    else if (b && pending.op) add(`${pending.name} value`, b[1], b.index + b[0].length - b[1].length);
  }

  for (const m of keys) {
    const after = text.slice(m.index + m[0].length), open = text[m.index - 1];
    const prefix = m[1] ? `sk-${m[1]}-` : 'sk-';
    // a bare prefix: nothing after the prefix (or the prefix and a version part such as api03-); the rest is elsewhere
    const bare = m[1] !== undefined && /^([a-z]+\d+-)?$/.test(m[0].slice(prefix.length));
    const plus = /^\$\{/.test(after) || /^["'`]?\s*\+/.test(after) || /^["'`]\s*["'`]/.test(after);   // + rest, ${rest}, "a" "b"
    const stillOpen = /["'`]/.test(open ?? '') && !after.includes(open);                                // the string goes on below
    const t = stillOpen ? 'split, looks real'
      : bare ? (plus || /^["'`]\s*(,|$)/.test(after) ? 'split, looks real' : 'prefix only')         // ["prefix", rest].join, prefix⏎ rest
      : plus ? 'split, looks real' : undefined;                                                          // a whole key: tagged by its body
    add(kindOf(m[1]), m[0], m.index, prefix, t);
  }

  const names = [...text.matchAll(NAME)];
  names.forEach((m, n) => {
    let from = m.index + m[0].length;
    const before = text[m.index - 1];
    if (before && /["'`]/.test(before) && text[from] === before) from++;    // the name's own closing quote
    const end = n + 1 < names.length ? names[n + 1].index : text.length;  // up to the next name
    const after = text.slice(from, end);
    let has = false;
    for (const q of after.matchAll(QUOTED)) {                           // every literal after the name is its value
      const start = from + q.index + 1;
      if (!q[2] || ONLY_NAME.test(q[2]) || inKey(start)) { has ||= inKey(start); continue; }
      add(`${m[1]} value`, q[2], start); has = true;
    }
    const bare = after.match(/^\s*(:|=(?!=))\s*([^\s"'`,;)}\]{(\[<>|][^\s"'`,;)}\]]*)(.*)$/);   // NAME=value, NAME: value
    if (bare && !has) {
      const typed = bare[1] === ':' && /^\s*(\||=(?!=)|\[\])/.test(bare[3]);  // NAME: string = …, a type, not a value
      const start = from + bare[0].length - bare[3].length - bare[2].length;
      if (!typed && !inKey(start)) { add(`${m[1]} value`, bare[2], start); has = true; }
    }
    if (!has && /^[\])"'`]*(\s*(\?\?|\|\||=(?!=)|:|,|\(|\bor\b|[|>][-+]?))+\s*$/.test(after)) { next = { name: m[1], op: true }; has = true; }
    if (!has && /^[\])"'`]*\s*$/.test(after)) next = { name: m[1], op: false };   // the name ends the line
    if (!has) named.push(m[1]);
  });
  return { found, named, next };
}

// ---------- showing: every string and every value-like token masked, the code around them kept ----------

// A token that is plainly code: a dotted name without digits (client.messages.create), or a file path.
const codeLike = (t) => /^[A-Za-z_$]+(\.[A-Za-z_$]+)*\(?$/.test(t) || /^(\.{0,2}\/)?[\w@.-]+(\/[\w@.-]+)+\.[a-z]{1,5}$/.test(t);

// Returns the line masked and the name whose value is on the next line.
function strong(text, pending) {
  const r = analyze(text, pending);
  const all = pending && (pending.op || /^\s*(\?\?|\|\||or\b|,)/.test(text));   // the line holds a value named on the line above
  const spans = r.found.filter((f) => f.tag !== 'reference').map((f) => [f.start, f.start + f.length]), kept = [];
  for (const q of text.matchAll(QUOTED)) {
    const start = q.index + 1, end = start + q[2].length;
    const specifier = /(\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)$/.test(text.slice(0, q.index));
    if ((specifier || ONLY_NAME.test(q[2])) && !/sk-/.test(q[2])) kept.push([start, end]);   // an import specifier or a variable's name
    else if (q[2].length > 4) spans.push([start, end]);
  }
  for (const k of text.matchAll(KEY)) spans.push([k.index, k.index + k[0].length]);
  let rest = text;                                                       // the text outside the strings, same positions
  for (const [a, b] of [...spans, ...kept]) rest = rest.slice(0, a) + ' '.repeat(b - a) + rest.slice(b);
  for (const t of rest.matchAll(all ? /[^\s"'`,;()[\]{}]{5,}/g : /[A-Za-z0-9_\-+/.$]{12,}/g))
    if (all || !codeLike(t[0])) spans.push([t.index, t.index + t[0].length]);
  for (const t of rest.matchAll(/(?<![=!<>:])(?:=|:)\s*([A-Za-z0-9_\-+/=.$]{8,})/g)) {   // a bare value after = or :
    const v = t[1], start = t.index + t[0].length - v.length;
    if (!REFERENCE.test(v) && !codeLike(v)) spans.push([start, start + v.length]);
  }
  const merged = [];
  for (const sp of spans.sort((x, y) => x[0] - y[0])) {
    const last = merged[merged.length - 1];
    if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]); else merged.push([...sp]);
  }
  let out = text;
  for (const [a, b] of merged.reverse()) out = out.slice(0, a) + mask(text.slice(a, b)) + out.slice(b);
  return { text: out, next: r.next };
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
    // piped search output: a path:line: (or path-line-) prefix is kept only when the path is a real file
    const p = file ? null : l.match(/^([^\s:]+?)([:-])(\d+)\2/);
    const keep = p && existsSync(p[1]) && !/sk-/.test(p[1]) ? p[0].length : 0;
    const r = strong(l.slice(keep), pending);
    console.log(file ? `${String(i + 1).padStart(6)}\t${r.text}` : l.slice(0, keep) + r.text);
    pending = r.next;
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
      if (!r.found.length && r.named.length && l.slice(m[1].length + m[2].length + 1)[0] === ':')
        say(`${here}  ${r.named[0]} named, no value here`);
      pending = r.next; prev = { path: m[1], n: Number(m[2]) };
      continue;
    }
    if (l.startsWith('commit ')) { commit = l.slice(7).trim(); pending = null; continue; }
    if (l.startsWith('diff --git ')) { file = l.replace(/^diff --git a\/.* b\//, ''); pending = null; continue; }
    if (l.startsWith('+++ ') || l.startsWith('--- ')) continue;
    if (l[0] !== '+' && l[0] !== '-') { pending = null; continue; }
    const r = analyze(l.slice(1), pending);
    for (const k of r.found) say(line(`${commit || 'diff'} ${file} ${l[0] === '+' ? 'added' : 'removed'}`, k));
    pending = r.next;
  }
} else {
  console.error('usage: mask-keys.mjs code|history|show  (stdin)   or   mask-keys.mjs show <file>');
  process.exit(2);
}
