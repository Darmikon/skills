#!/usr/bin/env node
// Says where AI keys are without ever printing one: every match is masked to its first 4 characters and "…".
//   code:    git grep -nIE --untracked "$KEYS" | node mask-keys.mjs code
//   history: git log --all -p -G "$KEYS" --format='commit %h %ad' --date=short | node mask-keys.mjs history
//   show:    node mask-keys.mjs show <file>     (the file, numbered, with every key masked)
//            any-search | node mask-keys.mjs show   (the lines, with every key masked)
// KEYS='sk-(ant-|proj-|[A-Za-z0-9]{20})|(ANTHROPIC|OPENAI)_API_KEY'
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const KEY = /(?<![A-Za-z0-9])(sk-ant-|sk-proj-|sk-(?=[A-Za-z0-9]{20}))[A-Za-z0-9_-]*/g;
const ENV = /\b((?:ANTHROPIC|OPENAI)_API_KEY)\b["']?[ \t]*(?::|=(?!=))[ \t]*["'`]?([^\s"'`,;)}\]]*)/g;
const NAMED = /\b(ANTHROPIC|OPENAI)_API_KEY\b/;

const mask = (v) => `${v.slice(0, 4)}…`;
// The same key gets the same id in the code and in history; 8 hex characters of a hash give nothing of the key away.
const idOf = (v) => createHash('sha256').update(v).digest('hex').slice(0, 8);
const kindOf = (prefix) =>
  prefix === 'sk-ant-' ? 'Anthropic key' : prefix === 'sk-proj-' ? 'OpenAI key' : 'OpenAI key (legacy)';

// placeholder: short, a stand-in word, one repeated character, or not a key's characters at all (a ${{ }} or process.env reference)
function tag(value, prefix) {
  const body = value.slice(prefix.length).replace(/^[a-z]+\d+-/, '');   // drop a version part such as api03-
  const placeholder =
    body.length < 20 ||
    /xxx|your|example|placeholder|fake|dummy|changeme|<|>/i.test(value) ||
    /^(.)\1*$/.test(body) ||
    /[^A-Za-z0-9_-]/.test(body);
  return placeholder ? 'placeholder' : 'looks real';
}

// The keys in one line of text: [{ kind, shown, tag, length, id }]
function keysIn(text) {
  const found = [];
  for (const m of text.matchAll(KEY)) found.push({ kind: kindOf(m[1]), shown: mask(m[0]), tag: tag(m[0], m[1]), length: m[0].length, id: idOf(m[0]) });
  for (const m of text.matchAll(ENV)) {
    const v = m[2];
    if (new RegExp(KEY.source).test(v)) continue;                         // already counted as a key above
    found.push({ kind: `${m[1]} value`, shown: mask(v), tag: tag(v, ''), length: v.length, id: idOf(v) });
  }
  return found;
}

const line = (where, k) => `${where}  ${k.kind}  ${k.shown}  (${k.length} chars, id ${k.id})  ${k.tag}`;
const out = new Set();
const say = (s) => { if (!out.has(s)) { out.add(s); console.log(s); } };

const mode = process.argv[2];
if (mode === 'show') {
  const file = process.argv[3];
  const text = readFileSync(file ?? 0, 'utf8').replace(/\n$/, '');
  text.split('\n').forEach((l, i) => {
    const safe = l
      .replace(KEY, (k) => mask(k))
      .replace(ENV, (all, name, v) => (v && !/[^A-Za-z0-9_-]/.test(v) ? all.slice(0, all.length - v.length) + mask(v) : all));   // a reference stays
    console.log(file ? `${String(i + 1).padStart(6)}\t${safe}` : safe);
  });
} else if (mode === 'code' || mode === 'history') {
  const input = readFileSync(0, 'utf8').split('\n');
  let commit = '', file = '';
  for (const l of input) {
    if (mode === 'code') {
      const m = l.match(/^(.*?):(\d+):(.*)$/);
      if (!m) continue;
      const keys = keysIn(m[3]);
      keys.forEach((k) => say(line(`${m[1]}:${m[2]}`, k)));
      if (!keys.length && NAMED.test(m[3])) say(`${m[1]}:${m[2]}  ${m[3].match(NAMED)[0]} named, no value here`);
      continue;
    }
    if (l.startsWith('commit ')) { commit = l.slice(7).trim(); continue; }
    if (l.startsWith('diff --git ')) { file = l.replace(/^diff --git a\/.* b\//, ''); continue; }
    if (l.startsWith('+++ ') || l.startsWith('--- ')) continue;
    if (l[0] !== '+' && l[0] !== '-') continue;
    for (const k of keysIn(l.slice(1))) say(line(`${commit} ${file} ${l[0] === '+' ? 'added' : 'removed'}`, k));
  }
} else {
  console.error('usage: mask-keys.mjs code|history|show  (stdin)   or   mask-keys.mjs show <file>');
  process.exit(2);
}
