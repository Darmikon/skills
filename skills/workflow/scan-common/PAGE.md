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

Leave out the Mermaid script when the page has no Mermaid picture. No other scripts, no app code, no interactivity.

## Header

The scan's name, the project's name, the date, what was looked at (the folder the user named, or how the scan chose). When the scan draws pictures, a small legend of what the shapes mean. No introduction paragraph.

## Body

Whatever the scan says: sections or cards. A card is one `<article class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">`. File paths are in `font-mono text-sm`. A guess is in a muted colour with the word "guess".

## Top pick

Only when the scan has findings: one larger card at the end, with the item's title, one sentence on why it goes first, and a link to its card.

## Pictures

- **Mermaid** for things shaped like a graph: what calls what, how parts connect, a sequence of calls.
- **Hand-built** `<div>`s and inline SVG when the weight matters: one thick box against many thin ones, layers stacked as bands.
- About 320px tall. Side by side on a wide screen, stacked on a phone.
- Colour sparingly: one accent (emerald or indigo), red for a problem, amber for a warning.

## Tone

Short and plain. No introduction, no "it's worth noting that", no paragraph a picture could replace. If a sentence could be a bullet, make it a bullet.
