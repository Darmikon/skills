#!/usr/bin/env node
// Draws a scan or ask page from its findings file. Plain Node, no packages.
// Usage: node render-page.mjs <findings.json> [--open]

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ASK = {
  en: {
    finding: "Check this against the code first. If it holds, propose a fix and wait for my yes before you change anything.",
    section: "Check each of these against the code first. Propose the fixes as one numbered list and wait for my yes before you change anything.",
    context: "Use this as context. Explain this part in more depth.",
    where: "Where", seen: "Seen", direction: "Direction", action: "Action", project: "Project", foundBy: "Found by",
    copy: "Copy", topPick: "Start here", none: "none",
  },
  ru: {
    finding: "Сначала проверь это по коду. Если подтвердится, предложи исправление и дождись моего «да», прежде чем что-то менять.",
    section: "Сначала проверь каждое из этого по коду. Предложи исправления одним нумерованным списком и дождись моего «да», прежде чем что-то менять.",
    context: "Используй это как контекст. Объясни эту часть подробнее.",
    where: "Где", seen: "Увидено", direction: "Направление", action: "Действие", project: "Проект", foundBy: "Нашел",
    copy: "Копировать", topPick: "Начать отсюда", none: "нет",
  },
};
const words = (data) => ASK[data.page?.lang] || ASK.en;

const BADGE = {
  red: ["critical", "high", "confirmed", "lie", "false claim", "real", "no tests"],
  amber: ["medium", "likely", "check first", "possible", "old", "suspected", "stale", "worth exploring"],
  green: ["safe to remove", "done", "gone", "not confirmed", "strong"],
  blue: ["low", "open", "not reached", "plan done", "repeat", "gap", "speculative"],
};
function badgeColour(word) {
  const w = String(word).toLowerCase();
  for (const [colour, list] of Object.entries(BADGE)) if (list.includes(w)) return colour;
  return "grey";
}

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Plain text with `backticks` as code chips; nothing else is markup.
export const text = (s) => String(s ?? "").split("`").map((part, i) => (i % 2 ? `<code class="sym">${esc(part)}</code>` : esc(part))).join("");

function tile(place, root) {
  const path = String(place.path);
  const isDir = path.endsWith("/");
  const parts = path.replace(/\/$/, "").split("/");
  const name = parts.pop() + (isDir ? "/" : "");
  const dir = parts.map((p) => `${esc(p)}/<wbr>`).join("");
  const line = place.line != null ? String(place.line) : "";
  const first = line.split(/[–-]/)[0];
  const href = `cursor://file${root}/${path.replace(/\/$/, "")}${first ? `:${first}` : ""}`;
  const ln = line ? `<span class="ln">L${esc(line)}</span>` : "";
  return `<a class="path" href="${esc(href)}"><span class="dir">${dir}</span><span class="file">${esc(name)}</span>${ln}</a>`;
}

const where = (f, data) => (f.places || []).map((p) => tile(p, data.project)).join(" ");
const badges = (f) => [f.rank, f.group].filter(Boolean).map((b) => `<span class="badge b-${badgeColour(b)}">${esc(b)}</span>`).join("");

export function buildPrompt(f, data) {
  const w = words(data);
  const family = data.family || "scan";
  const lines = [`${w.project}: ${data.project}`, `${w.foundBy}: /${family} ${data.command}`, "", f.title];
  if (f.places?.length) {
    lines.push("", `${w.where}:`);
    for (const p of f.places) lines.push(p.line != null ? `${p.path}:${p.line}` : p.path);
  }
  const marks = [f.rank, f.group, f.action].filter(Boolean).join(", ");
  if (f.seen || marks) lines.push("", `${w.seen}: ${[marks, f.seen].filter(Boolean).join(". ")}`);
  if (f.direction) lines.push(`${w.direction}: ${f.direction}`);
  lines.push("", family === "ask" ? w.context : w.finding);
  return lines.join("\n");
}

function sectionPrompt(sec, list, data) {
  const w = words(data);
  const family = data.family || "scan";
  const lines = [`${w.project}: ${data.project}`, `${w.foundBy}: /${family} ${data.command}`, "", sec.title, ""];
  for (const f of list) {
    const at = (f.places || []).map((p) => (p.line != null ? `${p.path}:${p.line}` : p.path)).join(", ");
    lines.push(`- ${f.title}${at ? ` (${at})` : ""}${f.action ? ` — ${f.action}` : ""}`);
  }
  lines.push("", family === "ask" ? w.context : w.section);
  return lines.join("\n");
}

const COPY_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

function copyButton(id, prompt, data) {
  return `<button class="copy" data-copy="${esc(id)}" title="${esc(words(data).copy)}">${COPY_ICON}</button><template id="${esc(id)}">${esc(prompt)}</template>`;
}

function card(f, data) {
  const parts = [
    copyButton(`p-${f.id}`, buildPrompt(f, data), data),
    `<div class="head"><h3>${text(f.title)}</h3><span class="badges">${badges(f)}</span></div>`,
  ];
  if (f.places?.length) parts.push(`<div class="where">${where(f, data)}</div>`);
  if (f.seen) parts.push(`<p>${text(f.seen)}</p>`);
  if (f.direction) parts.push(`<p class="direction">${text(f.direction)}</p>`);
  if (f.action) parts.push(`<p class="action">${esc(words(data).action)}: ${text(f.action)}</p>`);
  return `<article class="card" id="${esc(f.id)}">${parts.join("")}</article>`;
}

function line(f, data) {
  const bits = [where(f, data), `<span>${text(f.title)}</span>`, badges(f)];
  if (f.action) bits.push(`<span class="muted">${text(f.action)}</span>`);
  if (f.seen) bits.push(`<span class="muted">${text(f.seen)}</span>`);
  return `<li id="${esc(f.id)}">${copyButton(`p-${f.id}`, buildPrompt(f, data), data)}${bits.filter(Boolean).join(" ")}</li>`;
}

function event(f, data) {
  return `<li class="event" id="${esc(f.id)}">${copyButton(`p-${f.id}`, buildPrompt(f, data), data)}<div class="date">${esc(f.date || "")}</div><div><h3>${text(f.title)}</h3>${f.seen ? `<p>${text(f.seen)}</p>` : ""}${f.places?.length ? `<div class="where">${where(f, data)}</div>` : ""}</div></li>`;
}

function section(sec, index, data, byId) {
  const list = (sec.findings || []).map((id) => {
    if (!byId.has(id)) throw new Error(`section "${sec.title}" lists unknown finding "${id}"`);
    return byId.get(id);
  });
  if (sec.findings && list.length === 0) return "";
  let body = "";
  switch (sec.block) {
    case "cards": body = `<div class="cards">${list.map((f) => card(f, data)).join("")}</div>`; break;
    case "lines": body = `<ul class="lines">${list.map((f) => line(f, data)).join("")}</ul>`; break;
    case "timeline": body = `<ol class="timeline">${list.map((f) => event(f, data)).join("")}</ol>`; break;
    case "table": body = `<div class="scroll"><table><thead><tr>${(sec.columns || []).map((c) => `<th>${text(c)}</th>`).join("")}</tr></thead><tbody>${(sec.rows || []).map((r) => `<tr>${r.map((c) => `<td>${text(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; break;
    case "text": body = String(sec.text || "").split(/\n{2,}/).map((p) => `<p>${text(p)}</p>`).join(""); break;
    case "diagram": body = `<div class="scroll"><pre class="mermaid">${esc(sec.mermaid)}</pre></div>${sec.caption ? `<p class="muted">${text(sec.caption)}</p>` : ""}`; break;
    default: throw new Error(`section "${sec.title}" has unknown block "${sec.block}"`);
  }
  const sectionCopy = list.length >= 2 ? copyButton(`s-${index}`, sectionPrompt(sec, list, data), data) : "";
  const head = `<h2>${text(sec.title)}</h2>${sec.note ? `<p class="muted">${text(sec.note)}</p>` : ""}`;
  if (sec.folded) return `<section class="sec">${sectionCopy}<details><summary>${text(sec.title)}</summary>${sec.note ? `<p class="muted">${text(sec.note)}</p>` : ""}${body}</details></section>`;
  return `<section class="sec">${sectionCopy}${head}${body}</section>`;
}

const CSS = `
:root { --bg:#f7f7f5; --surface:#fff; --fg:#1c2023; --muted:#5f676d; --line:#e1e3e0; --accent:#4b4fc4; --tile:#eef0ff; --tile-line:#c9cdfa; --file:#2f33a0;
  --code:#6d36c9; --code-bg:#f4efff; --red:#b4382c; --red-bg:#fbe7e4; --amber:#94620c; --amber-bg:#f8efd9; --green:#2a7445; --green-bg:#e1f2e6; --blue:#2c5c9a; --blue-bg:#e3edf9; --grey:#55606a; --grey-bg:#eceeef;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; --mono: ui-monospace, SFMono-Regular, Menlo, monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111416; --surface:#181c1f; --fg:#e4e7ea; --muted:#9aa3aa; --line:#2a3035; --accent:#9da1ff; --tile:#1d1f45; --tile-line:#363a8a; --file:#c9ccff;
  --code:#cbb2ff; --code-bg:#2a1d4a; --red:#f1968a; --red-bg:#3b1f1b; --amber:#e9c06c; --amber-bg:#372a12; --green:#86d29c; --green-bg:#1a3222; --blue:#93bdf2; --blue-bg:#18283d; --grey:#b3bcc3; --grey-bg:#262c31; color-scheme: dark; } }
:root[data-theme="dark"] { --bg:#111416; --surface:#181c1f; --fg:#e4e7ea; --muted:#9aa3aa; --line:#2a3035; --accent:#9da1ff; --tile:#1d1f45; --tile-line:#363a8a; --file:#c9ccff;
  --code:#cbb2ff; --code-bg:#2a1d4a; --red:#f1968a; --red-bg:#3b1f1b; --amber:#e9c06c; --amber-bg:#372a12; --green:#86d29c; --green-bg:#1a3222; --blue:#93bdf2; --blue-bg:#18283d; --grey:#b3bcc3; --grey-bg:#262c31; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.6 var(--sans); }
main { max-width: 980px; margin: 0 auto; padding-inline: 16px; padding-block: 36px 64px; display: grid; gap: 28px; }
h1 { font-size: 1.7rem; margin: 0; text-wrap: balance; } h2 { font-size: 1.2rem; margin: 0 0 10px; } h3 { font-size: 1rem; margin: 0; }
p { margin: 6px 0 0; } .muted { color: var(--muted); }
header { display: grid; gap: 8px; } .facts { display: grid; grid-template-columns: max-content 1fr; gap: 2px 14px; font-size: .9rem; } .facts dt { color: var(--muted); } .facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.summary { display: flex; flex-wrap: wrap; gap: 10px; } .stat { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; } .stat b { display: block; font-size: 1.4rem; font-variant-numeric: tabular-nums; } .stat span { color: var(--muted); font-size: .85rem; }
.sec { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 18px; min-width: 0; }
.cards { display: grid; gap: 12px; } .card { border: 1px solid var(--line); border-radius: 10px; padding: 14px; min-width: 0; scroll-margin-top: 16px; }
.card .head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; } .direction { font-weight: 500; } .action { color: var(--muted); font-size: .9rem; }
.where { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.lines { list-style: none; margin: 0; padding: 0; display: grid; } .lines li { padding: 8px 0; border-top: 1px solid var(--line); min-width: 0; } .lines li:first-child { border-top: 0; }
.timeline { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; } .event { display: grid; grid-template-columns: 7.5rem 1fr; gap: 12px; } .event .date { color: var(--muted); font-variant-numeric: tabular-nums; }
@media (max-width: 560px) { .event { grid-template-columns: 1fr; } }
.badge { display: inline-block; font-size: .72rem; font-weight: 600; padding: .05rem .5rem; border-radius: 999px; margin-right: 4px; white-space: nowrap; }
.b-red { color: var(--red); background: var(--red-bg); } .b-amber { color: var(--amber); background: var(--amber-bg); } .b-green { color: var(--green); background: var(--green-bg); } .b-blue { color: var(--blue); background: var(--blue-bg); } .b-grey { color: var(--grey); background: var(--grey-bg); }
.path { display: inline-flex; flex-wrap: wrap; align-items: baseline; padding: .05rem .4rem; border-radius: .375rem; font: 500 .85em var(--mono); text-decoration: none; background: var(--tile); border: 1px solid var(--tile-line); color: var(--fg); }
.path:hover { border-color: var(--accent); } .path .dir { color: var(--muted); } .path .file { color: var(--file); font-weight: 600; }
.path .ln { margin-left: .3rem; padding: 0 .3rem; border-radius: .25rem; font-size: .8em; background: var(--accent); color: var(--surface); }
code.sym { font: .88em var(--mono); padding: .05rem .3rem; border-radius: .3rem; color: var(--code); background: var(--code-bg); }
.scroll { overflow-x: auto; } table { border-collapse: collapse; width: 100%; font-size: .92rem; } th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; } th { color: var(--muted); font-weight: 600; }
details summary { cursor: pointer; font-weight: 600; }
.top { border: 2px solid var(--accent); }
:has(> .copy) { position: relative; padding-right: 2.75rem; }
.copy { position: absolute; top: .6rem; right: .6rem; width: 2rem; height: 2rem; display: grid; place-items: center; border-radius: .5rem; cursor: pointer; color: var(--muted); border: 1px solid var(--line); background: var(--surface); }
.copy:hover { border-color: var(--accent); color: var(--accent); } .copy.done { border-color: var(--green); color: var(--green); }
.copy:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
li > .copy { top: .4rem; width: 1.6rem; height: 1.6rem; } li > .copy svg { width: 14px; height: 14px; }
`;

const COPY_JS = `addEventListener("click", async (e) => {
  const b = e.target.closest(".copy"); if (!b) return;
  const t = document.getElementById(b.dataset.copy).content.textContent.trim();
  try { await navigator.clipboard.writeText(t); }
  catch { const a = document.createElement("textarea"); a.value = t; document.body.append(a); a.select(); document.execCommand("copy"); a.remove(); }
  const was = b.innerHTML; b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'; b.classList.add("done");
  setTimeout(() => { b.innerHTML = was; b.classList.remove("done"); }, 1500);
});`;

export function renderPage(data) {
  const page = data.page || {};
  const byId = new Map((data.findings || []).map((f) => [f.id, f]));
  const sections = (page.sections || []).map((s, i) => section(s, i, data, byId)).join("");
  const hasDiagram = (page.sections || []).some((s) => s.block === "diagram");
  const facts = (page.facts || []).map(([k, v]) => `<dt>${text(k)}</dt><dd>${text(v)}</dd>`).join("");
  const summary = (page.summary || []).map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${text(s.label)}</span></div>`).join("");
  let top = "";
  if (page.top_pick) {
    const f = byId.get(page.top_pick.finding);
    if (!f) throw new Error(`top_pick lists unknown finding "${page.top_pick.finding}"`);
    top = `<section class="sec top"><h2>${esc(words(data).topPick)}</h2><h3><a href="#${esc(f.id)}">${text(f.title)}</a></h3>${page.top_pick.why ? `<p>${text(page.top_pick.why)}</p>` : ""}</section>`;
  }
  const mermaid = hasDiagram
    ? `<script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"; mermaid.initialize({ startOnLoad: true, theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "neutral" });</script>`
    : "";
  return `<!doctype html>
<html lang="${esc(page.lang || "en")}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.title || `${data.command}`)}</title>
<style>${CSS}</style>
${mermaid}
</head>
<body>
<main>
<header><h1>${text(page.title || data.command)}</h1>${page.subtitle ? `<p class="muted">${text(page.subtitle)}</p>` : ""}${facts ? `<dl class="facts">${facts}</dl>` : ""}</header>
${summary ? `<div class="summary">${summary}</div>` : ""}
${top}
${sections}
</main>
<script>${COPY_JS}</script>
</body>
</html>
`;
}

function main(argv) {
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: node render-page.mjs <findings.json> [--open]");
    process.exit(2);
  }
  const data = JSON.parse(readFileSync(file, "utf8"));
  const out = file.replace(/\.json$/, "") + ".html";
  writeFileSync(out, renderPage(data));
  console.log(out);
  if (argv.includes("--open")) {
    try { execFileSync(process.platform === "darwin" ? "open" : "xdg-open", [out], { stdio: "ignore" }); } catch { /* the path is printed; opening is a convenience */ }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main(process.argv.slice(2));
