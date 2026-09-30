# Scan Family (part 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the hidden `scan-common` skill, move `improve-architecture` onto it as `scan-architecture`, and add `scan-what-is-it`.

**Architecture:** Three skill folders under `skills/workflow/`. `scan-common` holds the shared rules and the page style; each `scan-*` loads it with the Skill tool as its first step and adds only its own part. Registered in `plugin.json`, both READMEs, and linked into `~/.claude/skills/`.

**Tech Stack:** Markdown skill files (Claude Code skill frontmatter), JSON plugin manifest, shell for checks.

Spec: `docs/superpowers/specs/2026-09-30-scan-family-design.md`.

## Global Constraints

- All three skills live in `skills/workflow/`.
- `scan-common` frontmatter has `user-invocable: false`.
- `scan-what-is-it` and `scan-architecture` have `disable-model-invocation: true`.
- The page path is `${TMPDIR:-/tmp}/<scan-name>-<timestamp>.html`.
- No scan creates, changes or deletes a file in the scanned project.
- No file outside `docs/superpowers/` names `improve-architecture` when done.
- Commit messages have no Claude attribution.

---

### Task 1: scan-common and scan-architecture

**Files:**
- Create: `skills/workflow/scan-common/SKILL.md`
- Create: `skills/workflow/scan-common/PAGE.md`
- Create: `skills/workflow/scan-architecture/SKILL.md`
- Delete: `skills/workflow/improve-architecture/` (SKILL.md, REPORT.md)
- Modify: `.claude-plugin/plugin.json`, `README.md`, `skills/workflow/README.md`
- Links: `~/.claude/skills/scan-common`, `~/.claude/skills/scan-architecture`; remove `~/.claude/skills/improve-architecture`

**Interfaces:**
- Produces: skill `scan-common`, loaded by name with the Skill tool. It expects the calling scan to name (a) where to look, (b) what to look for, (c) its page sections or cards, (d) the closing question and the skill that takes the chosen item.

- [ ] **Step 1: Write the check and run it to see it fail**

Save as `/tmp/scan-check.sh` (not in the repo):

```bash
#!/usr/bin/env bash
cd ~/dev/skills || exit 1
fail=0
for s in "$@"; do
  f=skills/workflow/$s/SKILL.md
  [ -f "$f" ] || { echo "missing $f"; fail=1; continue; }
  sed -n 2p "$f" | grep -q "^name: $s$" || { echo "bad name in $f"; fail=1; }
  grep -q "\"./skills/workflow/$s\"" .claude-plugin/plugin.json || { echo "$s not in plugin.json"; fail=1; }
  grep -q -- "--skill $s " README.md || { echo "$s not in install line"; fail=1; }
  grep -q "$s/SKILL.md)" skills/workflow/README.md || { echo "$s not in workflow README"; fail=1; }
  [ -f ~/.claude/skills/$s/SKILL.md ] || { echo "link ~/.claude/skills/$s missing"; fail=1; }
done
python3 -m json.tool .claude-plugin/plugin.json >/dev/null || { echo "plugin.json invalid"; fail=1; }
grep -rln improve-architecture --exclude-dir=.git --exclude-dir=superpowers . && { echo "improve-architecture still named"; fail=1; }
[ -e ~/.claude/skills/improve-architecture ] && { echo "old link still there"; fail=1; }
grep -q '^user-invocable: false$' skills/workflow/scan-common/SKILL.md 2>/dev/null || { echo "scan-common not hidden"; fail=1; }
[ $fail = 0 ] && echo OK
```

Run: `bash /tmp/scan-check.sh scan-common scan-architecture`
Expected: several `missing ...` lines, no `OK`.

- [ ] **Step 2: Create `skills/workflow/scan-common/SKILL.md`**

```markdown
---
name: scan-common
description: 'Shared rules of the scan-* skills: change nothing in the project, one HTML page in the temp directory, proof for every finding, the same ending. Loaded by scan-what-is-it, scan-architecture and the other scan-* skills as their first step; does nothing on its own.'
user-invocable: false
---

# scan-common

The rules every `scan-*` skill shares. The scan that loaded this file adds its own part: where to look, what to look for, what its page holds, the closing question, and which skill takes the item the user picks. Where the scan says something more specific, the scan wins.

## Change nothing in the project

- Do not create, change or delete any file in the project.
- No commit, no push, no branch switch, no install into the project.
- Run only commands that look: read files, search, `git log`, list the scripts. A tool run through `npx` that leaves the project as it was is allowed. If you are not sure that a command only looks, do not run it: ask.
- The one file you write is the page, and it goes outside the project.

## Proof

- Every finding or statement names a file, a line when there is one, and what you saw there.
- What you worked out but did not see is a guess. Say "guess" in the same sentence.
- Three to six good items beat twelve thin ones.
- If nothing is worth showing, say so in the chat and stop. No page.

## The page

Write one self-contained HTML file to `${TMPDIR:-/tmp}/<scan-name>-<timestamp>.html`, with the timestamp from `date +%Y%m%d-%H%M%S`. Open it with `open <path>` on macOS or `xdg-open <path>` on Linux, and give the full path in the chat.

Layout and style: [PAGE.md](PAGE.md). The scan says what goes in the body.

## The ending

1. In the chat, one line per item: its title, and its strength when the scan has one. Then the top pick, when the scan has one.
2. Ask the closing question that the scan names. One question.
3. When the user picks an item, call the skill the scan names, with the item as the topic: what it is, the files, the evidence.

Nothing starts before the user picks. No code.

## Language

The chat and the page follow the language of the conversation. File paths, commands and names from the code stay as they are.
```

- [ ] **Step 3: Create `skills/workflow/scan-common/PAGE.md`**

````markdown
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
````

- [ ] **Step 4: Create `skills/workflow/scan-architecture/SKILL.md`**

```markdown
---
name: scan-architecture
description: 'Look through the code that exists for places that are harder to understand and test than they need to be, and show them on one page with before/after pictures. Changes nothing in the project.'
argument-hint: '[an area, a module or a pain point]'
disable-model-invocation: true
---

# scan-architecture

Find the places in the existing code where the design costs more than it gives, and show them as candidates on one page. The one the user picks is thought through in `explore`.

This scan criticises code that is already written. It does not judge a plan that is not yet code: for that, use `explore`.

**First:** call the Skill tool with `scan-common` and follow its rules: change nothing, the page, proof, the ending, language. This file adds only the architecture part.

## Words to use

Use these words exactly, in the page and in the chat, so that every candidate is judged the same way.

- **Module**: anything with an interface and an implementation: a function, a class, a file, a package, a slice across layers.
- **Interface**: everything a caller must know to use the module: the types, but also the order of calls, the errors, the config it needs.
- **Implementation**: the code inside the module.
- **Deep**: a lot of behaviour behind a small interface. **Shallow**: the interface is nearly as big as the implementation, so the module only passes things through.
- **Seam**: the place where the module's interface lives, where behaviour can change without editing the callers.
- **Adapter**: a concrete thing that fills a seam: the real HTTP client, the in-memory fake.
- **Leverage**: what callers get from a deep module: much behaviour for little to learn.
- **Locality**: what maintainers get: a change, a bug, a test stays in one place.

Do not swap them for "component", "service", "layer", "wrapper", "API" or "boundary".

## The checks

- **The deletion test.** Imagine deleting the module. If the complexity goes away, it was a pass-through: a candidate. If the complexity comes back in every caller, it earns its place: leave it.
- **The interface is the test surface.** If a test has to reach past the interface to check something, the module has the wrong shape.
- **One adapter is a guess, two adapters is a seam.** A seam with one real adapter and no test adapter is only indirection.
- **Scattered knowledge.** To understand one idea, do you have to jump between many small modules? That is missing locality.
- **Leaks.** Does one module know about the inside of another?
- **Hard to test.** Which parts have no tests, or cannot be tested through their interface?

## Steps

### 1. Choose where to look

- If the user named an area after `/scan-architecture`, look there and skip the rest of this step.
- Otherwise read the recent history: `git log --oneline -60 --name-only`. The files that change most often are where a better design pays back first. If the changes are spread out with no clear hot spot, look wider.

Then read what the project already decided: `CLAUDE.md`, `AGENTS.md`, and the design notes under `docs/` in the area. Take the project's own names for things from there. Do not suggest what a written decision already rejected, unless the pain is real enough to reopen it, and then say so on the card.

### 2. Walk the code

Start an `Explore` subagent (or read yourself if the area is small) with the area and the checks above. Ask it to report places where it felt friction, with file paths and one line of evidence each, and not to follow a fixed recipe. Keep what the code shows; drop what is only a taste.

### 3. The page

The body is one card per candidate:

- **Title**: names the change, e.g. "Merge the three token helpers into one module".
- **Strength**: `Strong` (emerald), `Worth exploring` (amber) or `Speculative` (slate). A candidate you believe in but did not confirm is `Speculative`, and the card says what was not checked.
- **Files**: the files involved.
- **Before / after picture**: side by side. This is the centre of the card.
- **Problem**: one sentence, what hurts, with the evidence you saw.
- **Direction**: one sentence, what would change. Not a new interface, no code.
- **Wins**: short bullets in the words above: "locality: token bugs live in one module", "leverage: one interface, four callers". Not "cleaner" or "easier to maintain".
- **Decision warning**, only if the candidate goes against a written project decision: one line in an amber box.

The header legend: solid box = module, dashed line = seam, red arrow = leak, thick dark box = deep module.

Pick the picture that fits each candidate, and do not make every card look the same:

- **Mermaid flowchart**: "X calls Y calls Z, and look at the mess". Colour leaks red with `classDef`. A sequence diagram works for "before: six round trips, after: one".
- **Hand-built boxes**: the "after" as one thick deep module with its old parts faded inside.
- **Cross-section**: stacked bands for the layers a call passes through. Before: six thin bands. After: one thick band.
- **Mass picture**: two rectangles per module, interface and implementation. Shallow: almost the same height. Deep: a short interface over a tall implementation.
- **Call-tree collapse**: before, a tree of nested boxes; after, the same tree folded into one box.

The top pick is the candidate to start with.

### 4. The ending

Closing question: "Which one should we think through?" The chosen candidate goes to `explore`.

Adapted from `improve-codebase-architecture` and `codebase-design` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), without the glossary and ADR writing and without the grilling step.
```

- [ ] **Step 5: Remove the old skill and fix the links**

```bash
cd ~/dev/skills
rm -r skills/workflow/improve-architecture
rm ~/.claude/skills/improve-architecture
ln -s ~/dev/skills/skills/workflow/scan-common ~/.claude/skills/scan-common
ln -s ~/dev/skills/skills/workflow/scan-architecture ~/.claude/skills/scan-architecture
```

- [ ] **Step 6: Update the three lists**

`.claude-plugin/plugin.json`: replace the line `"./skills/workflow/improve-architecture",` with

```
    "./skills/workflow/scan-common",
    "./skills/workflow/scan-architecture",
```

`README.md`, install-all line: remove `--skill improve-architecture ` and add `--skill scan-architecture --skill scan-common ` right before `--skill show-my-branches`.

`README.md`, workflow table: remove the `improve-architecture` row; after the `rethink` row add

```
| scan-architecture | 🧍 | Find where the existing code is harder to understand and test than it needs to be; one page with before/after pictures, nothing changed | `npx skills add Darmikon/skills --skill scan-architecture` |
| scan-common | 🤖 | Shared rules of the scan-* skills; hidden from the menu, loaded by each scan | `npx skills add Darmikon/skills --skill scan-common` |
```

`skills/workflow/README.md`: replace the `improve-architecture` bullet under "User-invoked" with

```
- **[scan-architecture](./scan-architecture/SKILL.md)** — `/scan-architecture [area]` criticises the code that exists. It looks where the history shows the most change (or where you point), checks for shallow modules, scattered knowledge, leaks and parts that cannot be tested through their interface, and shows one page: a card per candidate with a before/after picture, a strength badge and a top pick. Nothing in the project changes. The candidate you pick goes to `explore`. Adapted from Matt Pocock's `improve-codebase-architecture` (MIT).
```

and under "Model-invoked" add

```
- **[scan-common](./scan-common/SKILL.md)** — The rules every `scan-*` skill shares: change nothing in the project, one HTML page in the OS temp directory, proof for every finding, the same ending. Hidden from the `/` menu (`user-invocable: false`); each scan loads it first.
```

- [ ] **Step 7: Run the check**

Run: `bash /tmp/scan-check.sh scan-common scan-architecture`
Expected: `OK`

- [ ] **Step 8: Commit**

```bash
cd ~/dev/skills
git add -A skills/workflow/scan-common skills/workflow/scan-architecture .claude-plugin/plugin.json README.md skills/workflow/README.md
git commit -m "feat(workflow): add scan-common and scan-architecture — shared scan rules, architecture scan on top"
```

`improve-architecture` was never committed, so its folder leaves no trace in history.

### Task 2: scan-what-is-it

**Files:**
- Create: `skills/workflow/scan-what-is-it/SKILL.md`
- Modify: `.claude-plugin/plugin.json`, `README.md`, `skills/workflow/README.md`
- Link: `~/.claude/skills/scan-what-is-it`

**Interfaces:**
- Consumes: skill `scan-common` from Task 1.

- [ ] **Step 1: Run the check to see it fail**

Run: `bash /tmp/scan-check.sh scan-what-is-it`
Expected: `missing skills/workflow/scan-what-is-it/SKILL.md`, no `OK`.

- [ ] **Step 2: Create `skills/workflow/scan-what-is-it/SKILL.md`**

```markdown
---
name: scan-what-is-it
description: 'First look at an unfamiliar project: what it is, its parts, its main paths, where things are, how to run it, and the surprises, on one page. Changes nothing in the project.'
argument-hint: '[a folder to look at]'
disable-model-invocation: true
---

# scan-what-is-it

Someone opens a project they do not know. Give them the picture they would otherwise spend a day putting together, on one page.

**First:** call the Skill tool with `scan-common` and follow its rules: change nothing, the page, proof, the ending, language. This file adds only the first-look part.

## Where to look

- If the user named a folder after `/scan-what-is-it`, look only there, and say on the page that the rest was not looked at.
- Otherwise the whole project. Start with what the project says about itself: `README*`, `CLAUDE.md`, `AGENTS.md`, `docs/`, the root `package.json` (or `pyproject.toml`, `go.mod`, `Cargo.toml`), workspace files, `docker-compose*`, `Makefile`, CI files under `.github/workflows/`.
- Then the code: the entry points (the files that start a server, an app, a worker, a CLI) and the folders they pull in. For a large project, start an `Explore` subagent per part with the questions below, and put its answers together yourself.

## The page

The body is six sections, in this order. Each statement follows the proof rule of `scan-common`.

1. **What is it.** Two or three sentences: what the project does and for whom, from the README and the code. If the two disagree, say so.
2. **The parts.** A Mermaid picture of the pieces and how they connect: apps, packages, services, databases, queues, outside services. Under it, one line per part: its name, its folder, its job.
3. **The main paths.** One or two typical paths from start to end: a request, a message, a job. A Mermaid sequence or flow picture, then the files along the way in order.
4. **Where things are.** A short table of the folders: what lives there, and what a newcomer can skip (generated code, vendored code, build output, fixtures).
5. **Run and test.** The exact commands to install, start, test and build, taken from the project's files, each with the file it came from. List them; do not run them. What they need (a database, env variables, keys) goes here too, from `.env.example` or the docs, never from a real `.env`.
6. **Surprises.** Odd spots worth knowing before starting: generated code not to edit by hand, two places doing one job, a config that changes behaviour quietly, a folder whose name says one thing and holds another. Only what you saw.

The header legend names the shapes used in the pictures. There is no top pick: this scan has no findings to rank.

## The ending

In the chat, one line per part from section 2. Closing question: "Which part should we dig into?" The chosen part goes to `how`.
```

- [ ] **Step 3: Link it and update the three lists**

```bash
ln -s ~/dev/skills/skills/workflow/scan-what-is-it ~/.claude/skills/scan-what-is-it
```

`.claude-plugin/plugin.json`: after `"./skills/workflow/scan-architecture",` add `    "./skills/workflow/scan-what-is-it",`

`README.md`, install-all line: add `--skill scan-what-is-it ` right before `--skill show-my-branches`.

`README.md`, workflow table: after the `scan-common` row add

```
| scan-what-is-it | 🧍 | First look at an unfamiliar project on one page: what it is, its parts, main paths, where things are, how to run it, surprises | `npx skills add Darmikon/skills --skill scan-what-is-it` |
```

`skills/workflow/README.md`: after the `scan-architecture` bullet add

```
- **[scan-what-is-it](./scan-what-is-it/SKILL.md)** — `/scan-what-is-it [folder]` is the first look at a project you do not know. One page answers six questions: what it is, what parts it has and how they connect, the main paths through the code, where things are, how to run and test it (commands listed, not run), and the surprises. Nothing in the project changes. The part you pick goes to `how`.
```

- [ ] **Step 4: Run the check**

Run: `bash /tmp/scan-check.sh scan-common scan-architecture scan-what-is-it`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd ~/dev/skills
git add skills/workflow/scan-what-is-it .claude-plugin/plugin.json README.md skills/workflow/README.md
git commit -m "feat(workflow): add scan-what-is-it — first look at an unfamiliar project on one page"
```

### Task 3: Try it on a real project

**Files:** none in either repo.

- [ ] **Step 1: Note the project's state**

Run: `git -C ~/dev/useai-api status --porcelain > /tmp/useai-before.txt; wc -l < /tmp/useai-before.txt`

- [ ] **Step 2: Run the scan**

In a new Claude Code session opened in `~/dev/useai-api` (so the new skills load), run `/scan-what-is-it`.
Expected: a page opens from `$TMPDIR`, with the six sections, file paths on every statement, and the chat ends with "Which part should we dig into?".

- [ ] **Step 3: Check the project was not touched**

Run: `git -C ~/dev/useai-api status --porcelain | diff /tmp/useai-before.txt - && echo UNCHANGED`
Expected: `UNCHANGED`
