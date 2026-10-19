#!/usr/bin/env node
// Says where AI keys are without ever printing one: every match is masked to its first 4 characters and "…".
//   KEYS='sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{0,19}([^A-Za-z0-9_-]|$)|(ANTHROPIC|OPENAI)[A-Z0-9_]*KEY'
//   code:    git grep -nIE -A1 --untracked "$KEYS" | node mask-keys.mjs code
//            (ignored files: add --no-exclude-standard -- '.env*' '**/.env*' '*.env' '**/*.env'
//             '.claude/settings.local.json' '**/.claude/settings.local.json')
//   history: git log --all -p -G "$KEYS" --format='commit %h %ad' --date=short | node mask-keys.mjs history
//            git log --all --format='commit %h %ad%n%w(0,4,4)%B' --date=short | node mask-keys.mjs history   (commit messages)
//            git diff -G "$KEYS" <base> | node mask-keys.mjs history   (uncommitted and branch changes: "diff")
//   show:    node mask-keys.mjs show <file>     (the file as it is, numbered; the lines of a key statement hidden whole)
//            any-search-diff-or-log | node mask-keys.mjs show   (the same for search output, diffs and git log)
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// What may stand right before a key: the start, a sign, or an escape that ends in a letter or digit
// (\n, %20, \x20, \u0020, \u{20}, an ANSI colour such as \x1b[32m).
const BEFORE = String.raw`^|[^A-Za-z0-9]|\\[ntr]|%[0-9A-Fa-f]{2}|\\x[0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4}|\\u\{[0-9A-Fa-f]+\}|\[[0-9;]*m`;
// sk-ant-, sk-proj-, sk-svcacct-, sk-admin- wherever they stand, and any other sk- key of 20 or more characters
// (legacy OpenAI keys; after a letter or digit that is not an escape it is part of a longer word: task-…)
const KEY = new RegExp(`sk-(ant|proj|svcacct|admin)-[A-Za-z0-9_-]*|(?<=${BEFORE})sk-[A-Za-z0-9_-]{20,}`, 'g');
// a short piece of a key: "sk-", "sk-a", "sk-an" … (the rest put together elsewhere)
const PIECE = new RegExp(`(?<=${BEFORE})sk-[A-Za-z0-9_-]{0,19}(?![A-Za-z0-9_-])`, 'g');
// The search's own sk- pattern: a line it matches that the finder cannot place is still hidden.
const RAW = /sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{0,19}([^A-Za-z0-9_-]|$)/;
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
  const add = (kind, v, start, prefix = '', t, above = false) => {
    if (!v || found.some((f) => f.start === start)) return;
    found.push({ kind, shown: mask(v), tag: t ?? tag(v, prefix), length: v.length, id: idOf(v), start, above });
  };
  // a value that goes on below (+, a \ at the end, a string left open) is split: the next lines hold the rest
  const goesOnFrom = (end, open) => (open || /^\s*(\+|\\$)/.test(text.slice(end)) ? 'split, looks real' : undefined);
  const keys = [...text.matchAll(KEY)];
  for (const p of text.matchAll(PIECE)) if (!keys.some((k) => p.index >= k.index && p.index < k.index + k[0].length)) keys.push(Object.assign(p, { piece: true }));
  const inKey = (i) => keys.some((k) => i >= k.index && i < k.index + k[0].length);
  let next = null;

  // pending.op: the line above ended in an operator (=, :, ??, …); otherwise it ended with the name, and the value
  // counts only when this line goes on with an operator (NAME⏎ ?? "value")
  if (pending && !/^\s*[A-Za-z_][\w.]*\s*[:=]/.test(text) && (pending.op || /^\s*(\?\?|\|\||or\b|,)/.test(text))) {
    const q = [...text.matchAll(QUOTED)][0], b = text.match(/^\s*([^\s,;]+)/);
    if (q) add(`${pending.name} value`, q[2], q.index + 1, '', goesOnFrom(q.index + q[0].length, q[3] === ''), true);
    else if (b && pending.op) add(`${pending.name} value`, b[1], b.index + b[0].length - b[1].length, '', goesOnFrom(b.index + b[0].length, false), true);
  }

  for (const m of keys) {
    const after = text.slice(m.index + m[0].length), open = text[m.index - 1];
    const prefix = m[1] ? `sk-${m[1]}-` : 'sk-';
    // a bare prefix: nothing after the prefix (or the prefix and a version part such as api03-); the rest is elsewhere
    const bare = m.piece || (m[1] !== undefined && /^([a-z]+\d+-)?$/.test(m[0].slice(prefix.length)));
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
      add(`${m[1]} value`, q[2], start, '', goesOnFrom(from + q.index + q[0].length, q[3] === '')); has = true;
    }
    let bare = after.match(/^\s*(:|=(?!=))\s*([^\s"'`,;)}\]{(\[<>|][^\s"'`,;)}\]]*)(.*)$/);   // NAME=value, NAME: value
    // NAME value: a Dockerfile ENV or ARG, a csh setenv, a fish set; elsewhere only a token that looks like a secret
    const spaced = !bare && after.match(/^(\s+)([^\s"'`,;)}\]{(\[<>|=:?][^\s"'`,;)}\]]*)(.*)$/);
    if (spaced && (/^\s*(ENV|ARG|setenv|set(\s+-\w+)*)\s+$/i.test(text.slice(0, m.index)) ||
        /^(?=.*\d)(?=.*[A-Za-z])[A-Za-z0-9_+\/=-]{16,}$/.test(spaced[2]))) bare = [spaced[0], ' ', spaced[2], spaced[3]];
    if (bare && !has) {
      const typed = bare[1] === ':' && /^\s*(\||=(?!=)|\[\])/.test(bare[3]);  // NAME: string = …, a type, not a value
      const start = from + bare[0].length - bare[3].length - bare[2].length;
      if (!typed && !inKey(start)) { add(`${m[1]} value`, bare[2], start, '', /\\$/.test(bare[2]) && !bare[3] ? 'split, looks real' : undefined); has = true; }
    }
    if (!has && /^[\])"'`]*(\s*(\?\?|\|\||=(?!=)|:|,|\(|\bor\b|[|>][-+]?))+\s*$/.test(after)) { next = { name: m[1], op: true }; has = true; }
    if (!has && /^[\])"'`]*\s*$/.test(after)) next = { name: m[1], op: false };   // the name ends the line
    if (!has) named.push(m[1]);
  });
  return { found, named, next, names: names.map((m) => m[1]) };
}

// ---------- showing: the text as it is, every line of a key statement hidden whole ----------

// A split key goes on below through +, a backslash, ??, ||, .concat( or a string left open at the end of a line,
// and from above through a line that starts with +, ??, || or .concat(. Commas, colons and brackets do not carry it:
// a key whole on its line hides that line only, and the object or call around it stays readable.
const CONT_END = /(\+|\\|\?\?|\|\||\.concat\()\s*$/;
const CONT_START = /^\s*(\+|\?\?|\|\||\.concat\()/;
const comment = (l) => /^\s*(\/\/|#|\*|\/\*)/.test(l);
const openAtEnd = (l) => !comment(l) && [...l.matchAll(QUOTED)].some((q) => q[3] === '' && q.index + q[0].length === l.length);
const goesOn = (l) => !comment(l) && (CONT_END.test(l) || openAtEnd(l));

// The lines to hide in a list of lines: Map(line index -> the key it holds, for the note).
function hiddenLines(lines) {
  const keyAt = new Map();
  let pending = null;
  lines.forEach((l, i) => {
    const r = analyze(l, pending);
    pending = r.next;
    const k = r.found.find((f) => f.tag !== 'reference');               // a reference points elsewhere: nothing to hide
    if (k) keyAt.set(i, { ...k, names: r.names, above: r.found.some((f) => f.above && f.tag !== 'reference'),
      splits: r.found.filter((f) => f.tag === 'split, looks real').map((f) => f.start) });
  });
  const hide = new Map(), spread = [];
  const put = (i, k) => { if (!hide.has(i)) hide.set(i, keyAt.get(i) ?? { ...k, names: [] }); };
  for (const [i, k] of keyAt) {
    put(i, k);
    if (k.above && i > 0) put(i - 1, k);                                 // NAME =⏎ "value": the name's line too
    if (!k.splits.length) continue;
    spread.push([i, k]);
    for (const col of k.splits) {                                        // a bracketed list or call of pieces: hidden whole
      const span = enclosing(lines, i, col);
      if (span) for (let j = span[0]; j <= span[1]; j++) { put(j, k); spread.push([j, k]); }
    }
  }
  for (const [i, k] of spread) {                                         // the rest of a split key, both ways
    let a = i, b = i;
    while (a > 0 && lines[a - 1].trim() && (goesOn(lines[a - 1]) || CONT_START.test(lines[a]))) put(--a, k);
    while (b < lines.length - 1 && lines[b + 1].trim() && (goesOn(lines[b]) || CONT_START.test(lines[b + 1]))) put(++b, k);
  }
  return hide;
}

// The [ or ( that encloses position `col` of line `i`, and the line of its match: [first, last], within 40 lines.
// An open { or a ; met first ends the search: the key is not in a list or call of its own statement (a block, a describe(…)).
function enclosing(lines, i, col) {
  let depth = 0, a = -1, b = -1;
  for (let j = i, c = col - 1; j >= Math.max(0, i - 40) && a < 0; j--, c = (lines[j] ?? '').length - 1) {
    for (; c >= 0; c--) {
      const ch = lines[j][c];
      if (ch === ')' || ch === ']' || ch === '}') depth++;
      else if ((ch === '{' || ch === ';') && depth === 0) return null;
      else if (ch === '{') depth--;
      else if (ch === '(' || ch === '[') { if (depth === 0) { a = j; break; } depth--; }
    }
  }
  if (a < 0) return null;
  depth = 0;
  for (let j = i, c = col; j < Math.min(lines.length, i + 40) && b < 0; j++, c = 0) {
    for (; c < lines[j].length; c++) {
      const ch = lines[j][c];
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') { if (depth === 0) { b = j; break; } depth--; }
    }
  }
  return [a, b < 0 ? Math.min(lines.length - 1, i + 40) : b];
}

// The note names the key's kind and first 4 characters, and the variables the line itself names (EXPO_PUBLIC_…): no other text.
const note = (k, n) => `<${n ? `line ${n} ` : 'line '}hidden: ` + (k.raw ? 'key-shaped text>' : `holds an AI key — ${k.kind} ${k.shown}` +
  (k.names?.length ? `; the line names ${[...new Set(k.names)].join(', ')}` : '') + '>');
// The safety net on a line that is shown: any key shape or named value still in it makes it hidden too, and so does
// any text the search's sk- pattern matches that the finder could not place (`all`: the whole line, its path included).
const net = (l, all = l) => {
  const r = analyze(l, null), k = r.found.find((f) => f.tag !== 'reference');
  return k ? { ...k, names: r.names } : RAW.test(all) ? { raw: true } : null;
};

// A search line `path:line:text` (a match) or `path-line-text` (a line around it). A path may hold -12- or :3:
// itself (db/migrations/2024-01-15-seed.sql), so the first split whose path is a real file wins.
function splitSearch(l) {
  const cands = [];
  for (let i = 0; i < l.length; i++) {
    const m = /^([:-])(\d+)\1/.exec(l.slice(i));
    if (m && i > 0) cands.push({ path: l.slice(0, i), sep: m[1], n: Number(m[2]), rest: l.slice(i + m[0].length), head: i + m[0].length });
  }
  return cands.find((c) => existsSync(c.path)) ?? (cands.length ? { ...cands[0], missing: true } : null);
}

const line = (where, k) => `${where}  ${k.kind}  ${k.shown}  (${k.length} chars, id ${k.id})  ${k.tag}`;
const out = new Set();
const say = (s) => { if (!out.has(s)) { out.add(s); console.log(s); } };

const mode = process.argv[2];
if (mode === 'show') {
  const file = process.argv[3];
  const lines = readFileSync(file ?? 0, 'utf8').replace(/\n$/, '').split('\n');
  if (file) {
    const hide = hiddenLines(lines);
    lines.forEach((l, i) => {
      const k = hide.get(i) ?? net(l);
      console.log(`${String(i + 1).padStart(6)}\t${k ? note(k, i + 1) : l}`);
    });
  } else {
    // Search output (path:line:text) is judged against its file; anything else (a diff, a log) as one text.
    const files = new Map(), body = [], where = [];
    let diff = false;
    lines.forEach((l, i) => {
      const p = splitSearch(l);
      if (p && !p.missing && !/sk-/.test(p.path)) { where[i] = p; return; }
      if (/^diff --git /.test(l)) diff = true;
      const header = diff && /^(diff --git |index |--- |\+\+\+ |@@ |new file|deleted file|similarity|rename )/.test(l);
      body[i] = header ? '' : diff && /^[-+ ]/.test(l) ? l.slice(1) : l;
    });
    const textIdx = lines.map((_, i) => i).filter((i) => !where[i]);
    const textHide = hiddenLines(textIdx.map((i) => body[i]));
    const hiddenText = new Map(textIdx.map((i, n) => [i, textHide.get(n)]));
    lines.forEach((l, i) => {
      const p = where[i];
      if (p) {
        if (!files.has(p.path)) files.set(p.path, hiddenLines(readFileSync(p.path, 'utf8').split('\n')));
        const k = files.get(p.path).get(p.n - 1) ?? net(p.rest, l);
        console.log(k ? l.slice(0, p.head) + note(k, p.n) : l);
      } else {
        const k = hiddenText.get(i) ?? net(body[i], l);
        const mark = diff && /^[-+ ]/.test(l) && body[i] !== '' && body[i] === l.slice(1) ? l[0] : '';
        console.log(k ? mark + note(k) : l);
      }
    });
  }
} else if (mode === 'code' || mode === 'history') {
  const input = readFileSync(0, 'utf8').split('\n');
  let commit = '', file = '', message = false, pending = null, prev = null;
  for (const l of input) {
    if (mode === 'code') {
      const m = splitSearch(l);
      if (!m) { pending = null; continue; }
      const here = `${m.path}:${m.n}`;
      const follows = prev && prev.path === m.path && prev.n + 1 === m.n;
      const r = analyze(m.rest, follows ? pending : null);
      r.found.forEach((k) => say(line(here, k)));
      if (r.found.length && r.names.length) say(`${here}  the line names ${[...new Set(r.names)].join(', ')}`);
      if (!r.found.length && m.sep === ':') {                 // a line grep matched: it is listed whatever the finder made of it
        if (r.named.length) say(`${here}  ${r.named[0]} named, no value here`);
        else if (r.next) say(`${here}  ${r.next.name} named, its value on the next line`);
        else say(`${here}  key-shaped text`);
      }
      pending = r.next; prev = { path: m.path, n: m.n };
      continue;
    }
    if (l.startsWith('commit ')) { commit = l.slice(7).trim(); file = ''; message = true; pending = null; continue; }
    if (l.startsWith('diff --git ')) { file = l.replace(/^diff --git a\/.* b\//, ''); message = false; pending = null; continue; }
    // the message, indented by --format='…%n%w(0,4,4)%B', between the commit line and its first diff
    const inMessage = message && commit && l.startsWith('    ');
    if (!inMessage && (l.startsWith('+++ ') || l.startsWith('--- '))) continue;
    if (!inMessage && l[0] !== '+' && l[0] !== '-') { pending = null; continue; }
    const where = inMessage ? `${commit} message` : `${commit || 'diff'} ${file} ${l[0] === '+' ? 'added' : 'removed'}`;
    const r = analyze(l.slice(inMessage ? 4 : 1), pending);
    for (const k of r.found) say(line(where, k));
    if (!r.found.length && RAW.test(l)) say(`${where}  key-shaped text`);   // the search matched it; the finder cannot place it
    pending = r.next;
  }
} else {
  console.error('usage: mask-keys.mjs code|history|show  (stdin)   or   mask-keys.mjs show <file>');
  process.exit(2);
}
