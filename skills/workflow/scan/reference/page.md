# The scan page

One self-contained HTML file. The scan fills the body; this file sets everything around it.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{scan name}}: {{project name}}</title>
    <script>tailwind = { config: { darkMode: "media" } };</script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      mermaid.initialize({ startOnLoad: true, theme: dark ? "dark" : "neutral" });
    </script>
    <link rel="stylesheet" media="(prefers-color-scheme: light)" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" />
    <link rel="stylesheet" media="(prefers-color-scheme: dark)" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>addEventListener("DOMContentLoaded", () => hljs.highlightAll());</script>
    <style>
      /* file path tile: <a class="path" href="cursor://file/Users/me/project/src/app/server.ts:39"><span class="dir">src/app/<wbr></span><span class="file">server.ts</span><span class="ln">L39–49</span></a> */
      .path { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 0 .15rem; padding: .05rem .4rem; border-radius: .375rem;
              font: 500 .85em ui-monospace, SFMono-Regular, Menlo, monospace; text-decoration: none;
              background: #eef2ff; border: 1px solid #c7d2fe; color: #1e293b; }
      .path:hover { border-color: #6366f1; }
      .path .dir { color: #64748b; }
      .path .file { color: #3730a3; font-weight: 600; }
      .path .ln { margin-left: .3rem; padding: 0 .3rem; border-radius: .25rem; font-size: .8em; background: #6366f1; color: #fff; }
      /* inline code by kind */
      code.sym, code.const, code.cmd, code.lit { font: .88em ui-monospace, SFMono-Regular, Menlo, monospace; padding: .05rem .3rem; border-radius: .3rem; }
      code.sym { color: #7c3aed; background: #f5f3ff; }
      code.const { color: #b45309; background: #fffbeb; }
      code.lit { color: #0f766e; background: #f0fdfa; }
      code.cmd { color: #bbf7d0; background: #0f172a; }
      code.cmd::before { content: "$ "; color: #64748b; }
      @media (prefers-color-scheme: dark) {
        .path { background: #1e1b4b; border-color: #3730a3; color: #e2e8f0; }
        .path .dir { color: #94a3b8; }
        .path .file { color: #c7d2fe; }
        code.sym { color: #c4b5fd; background: #2e1065; }
        code.const { color: #fcd34d; background: #422006; }
        code.lit { color: #5eead4; background: #042f2e; }
        code.cmd { background: #020617; border: 1px solid #1e293b; }
      }
      /* copy button: <button class="copy" data-copy="ID" title="Copy">(copy icon svg)</button> next to <template id="ID">prompt text</template>, as the first child of its block */
      :has(> .copy) { position: relative; padding-right: 2.75rem; }
      .copy { position: absolute; top: .5rem; right: .5rem; width: 2rem; height: 2rem; display: grid; place-items: center;
              border-radius: .5rem; line-height: 1; cursor: pointer; color: #475569;
              border: 1px solid #cbd5e1; background: #fff; }
      .copy:hover { border-color: #6366f1; color: #4338ca; }
      .copy.done { border-color: #10b981; color: #059669; }
      @media (prefers-color-scheme: dark) {
        .copy { background: #0f172a; border-color: #334155; color: #94a3b8; }
        .copy:hover { border-color: #818cf8; color: #c7d2fe; }
        .copy.done { color: #6ee7b7; }
      }
      li > .copy { top: 0; width: 1.6rem; height: 1.6rem; }
      li > .copy svg { width: 14px; height: 14px; }
    </style>
    <script>
      addEventListener("click", async (e) => {
        const b = e.target.closest(".copy"); if (!b) return;
        const t = document.getElementById(b.dataset.copy).content.textContent.trim();
        try { await navigator.clipboard.writeText(t); }
        catch { const a = document.createElement("textarea"); a.value = t; document.body.append(a); a.select(); document.execCommand("copy"); a.remove(); }
        const was = b.innerHTML; b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'; b.classList.add("done");
        setTimeout(() => { b.innerHTML = was; b.classList.remove("done"); }, 1500);
      });
    </script>
  </head>
  <body class="bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header>...</header>
      <section id="body" class="space-y-10">...</section>
      <section id="top-pick">...</section>
    </main>
  </body>
</html>
```

Leave out the Mermaid script when the page has no Mermaid picture, the highlight.js lines when the page has no code block, and the top-pick section when the scan has no top pick. No other scripts, no app code, no interactivity beyond the copy buttons. Copy the `<style>` block and the copy `<script>` as they are.

## Header

The scan's name, the project's name, the date, what was looked at (the folder the user named, or how the scan chose). When the scan draws pictures, a small legend of what the shapes mean. No introduction paragraph.

## Body

Whatever the scan says: sections or cards. A card is one `<article class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">`. A guess is in a muted colour with the word "guess".

## Paths and code

Nothing from the code goes on the page as plain text or a bare `<code>`. Each piece gets the markup of its kind.

- **A file or folder** is a path tile that opens in Cursor at that line:
  `<a class="path" href="cursor://file<absolute path>:<line>"><span class="dir">src/app/<wbr>routes/<wbr></span><span class="file">server.routes.ts</span><span class="ln">L27–43</span></a>`
  The absolute path is the project root (`git rev-parse --show-toplevel`) plus the path; it starts with `/`, so the link reads `cursor://file/Users/…`, with one slash. For a range, the link opens the first line. `<wbr>` after every `/` lets a long path wrap only there. No line: leave out the `.ln` span and `:<line>`. A folder: the whole path goes in `.dir`, the last name in `.file`, ending with `/`.
- **A function, class, type or method**: `<code class="sym">getRequestDb</code>`.
- **A constant, env variable, binding or config key**: `<code class="const">FILE_PARSER</code>`.
- **A literal value**, such as a route, a host or an event name: `<code class="lit">/v1/auth*</code>`.
- **A command**: `<code class="cmd">yarn format</code>`. The `$ ` is added by the style.
- **A code block** of more than one line: `<pre><code class="language-ts">…</code></pre>`, coloured by highlight.js. Keep it short: the lines that prove the point, not the whole function. Escape `<`, `>` and `&`.

## Copy buttons

Every finding can go straight into an AI chat as a prompt. One block is one prompt: each card, and each section where a scan lists findings as lines (`unused`) or explains a part (`what-is-it`), gets one copy button. Lines inside a block get none, except in `unused`, where each finding line has its own too, so a finding can be handled alone (the button is the first child of the `<li>`). The button is the usual copy icon (two overlapping squares, the SVG below) in the top right corner of its block, turning into a check mark for a moment after a click, with `title` "Copy" in the page's language. It copies a prompt that stands alone: whoever reads it has not seen the page.

Markup: the button, and right after it a `<template>` with the prompt as plain text (escape `<`, `>` and `&`; no HTML inside):

```html
<button class="copy" data-copy="f3" title="Copy"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
<template id="f3">…the prompt…</template>
```

The ids are unique on the page (`f1`, `f2`, …). The button is always the first child of its block (the `<article>`, the `<section>`, or in `unused` the `<li>`): the style pins it to that block's top right corner and keeps the text clear of it.

The prompt, in the page's language, in this order:

1. `Project: <absolute project root>` and `Found by: /scan <command>`.
2. The title.
3. `Where:` each place as `<path relative to the root>:<line>`, one per line.
4. What was seen, with the badges as words ("Likely", "High, not reached", "safe to remove: drop export").
5. Why it matters, and the direction, when the card has them.
6. For a section of `what-is-it`: the section's content as plain lines instead of 3–5. For a section of `unused`: every finding in it, one per line with its place and action, the "safe to remove" ones first, then the "check first" ones with where the search found them.
7. The last line is the ask. For a finding: "Check this against the code first. If it holds, propose a fix and wait for my yes before you change anything." For an `unused` section: "Check each of these against the code. Propose removing the safe ones and say what you found for the others; wait for my yes before you change anything." For a `what-is-it` section: "Use this as context. Explain this part in more depth."

No secret goes into a prompt, the same as on the page.

## Top pick

Only when the scan has findings: one larger card at the end, with the item's title, one sentence on why it goes first, and a link to its card.

## Pictures

- **Mermaid** for things shaped like a graph: what calls what, how parts connect, a sequence of calls.
- **Hand-built** `<div>`s and inline SVG when the weight matters: one thick box against many thin ones, layers stacked as bands.
- About 320px tall. Side by side on a wide screen, stacked on a phone. A picture too wide for the screen scrolls inside its own box (`overflow-x-auto`); the page itself never scrolls sideways.
- Colour sparingly: one accent (emerald or indigo), red for a problem, amber for a warning.

## Tone

Short and plain. No introduction, no "it's worth noting that", no paragraph a picture could replace. If a sentence could be a bullet, make it a bullet.
