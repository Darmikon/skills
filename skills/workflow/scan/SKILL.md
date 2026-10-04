---
name: scan
description: 'Look for problems in a whole project without changing it, and show them on one page. Commands: architecture, unused, security, performance, docs, comments, todo, tests. By default it reviews what the current branch changed; `deep` scans the whole project. With no argument it suggests which fits.'
argument-hint: '[architecture · unused · security · performance · docs · comments · todo · tests · pin <command> · unpin <command>] [folder or area] [deep]'
disable-model-invocation: true
---

# scan

A scan looks at a project, changes nothing in it, and shows what it found on one page. `fix` does the fixing. This file holds what every scan shares; each command's own part is in `reference/`.

## Commands

| Command | Finds | Reference |
|---|---|---|
| `architecture [area]` | code harder to understand and test than it needs to be | [architecture.md](reference/architecture.md) |
| `unused [folder]` | files, code and packages nothing uses (knip) | [unused.md](reference/unused.md) |
| `security [folder]` | secrets, dangerous code, packages with holes, logic mistakes | [security.md](reference/security.md) |
| `performance [area]` | code that looks slow; measures only after a yes | [performance.md](reference/performance.md) |
| `docs [folder]` | documents that do not match the code | [docs.md](reference/docs.md) |
| `comments [folder]` | lying comments, stale TODOs, dead code, repeats | [comments.md](reference/comments.md) |
| `todo [folder]` | the TODO part of `comments` alone | [comments.md](reference/comments.md) |
| `tests [folder]` | untested parts, weak and flaky tests | [tests.md](reference/tests.md) |

- **No argument:** read [menu.md](reference/menu.md) and suggest. Never start a scan on your own.
- **A command first** (`doc`, `comment` work too): read its reference and follow it with this file. The rest is the folder or area.
- **A plain question** ("is this secure?"): if one command fits, name it and ask once before running it.
- **`pin` / `unpin`:** read [pin.md](reference/pin.md).
- **`deep`**, "full", "полный" anywhere in the argument: the whole project, in full.

## What a scan looks at

Find the default branch with `bash "<skills folder>/git-common/default-branch.sh"` and the base with `git merge-base HEAD origin/<default>` (or `<default>` when there is no `origin`). Then pick one of three:

- **The branch** (the default): no folder named, and the branch has changes against its base. The branch files are `git diff --name-only <base>` (commits on the branch and uncommitted changes) plus `git ls-files --others --exclude-standard`. Report every finding that belongs to the branch: one of its places is a branch file, or it is about one (a document that describes changed code, a test that should cover it). Problems in the untouched parts of a branch file go in only when they are `High`. No limit of five. Tools that need the whole project to answer (`knip`, the type check, the test runner) still run over it; only their findings are filtered. History is only the branch's: `<base>..HEAD`. A subagent only when the branch touches more than about thirty files.
- **The project, quick**: a folder was named, or there are no branch changes (on the default branch, or nothing changed yet). No subagents. Look first where the code changes most (`git log --oneline -60 --name-only`, or the folder named) and stop at the **5 most important findings** by the reference's ranking. Tools still run in full; only the reading is cut.
- **Deep**: `deep` in the argument. Everything the reference describes, over the whole project (or the folder named), subagents included.

Where a reference says "a full scan", it means deep. The page's `facts` name the scope ("Branch feat/billing against main: 12 files", "No branch changes: the project, quick", "Deep: the whole project") and what was not looked at; the findings file gets `scope` and `base` (see [page.md](reference/page.md)).

## Observe, never change

- Never write code, never create, change or delete a file in the project, never change its database rows, settings or branches, never commit, push or install into it.
- Running things to observe is fine when a reference says how (read-only tools, the doubtful tests, timings). The project must be as it was afterwards: no flag that rewrites files, temp files in `<tmp>`, every process stopped, `git status` the same before and after (caches in ignored folders like `node_modules/.cache` are fine).
- When observing would need a change, do not do it: say what it would take and leave it to `/fix`.
- Not sure a command leaves everything as it was? Ask.

## The project's words

Before looking, read the glossary and decisions: `docs/glossary-map.md` points to the glossary and `decisions/` of the part you look at (plus the root `docs/decisions/`); without a map, `docs/glossary.md` and `docs/decisions/`. Name things with its words. Do not report as a problem what a written decision chose on purpose, unless the pain is real enough to reopen it; then say which decision. Words or decisions worth recording go in one line at the end, recorded only after a yes.

## Proof

Every finding names a file, a line when there is one, and what you saw there. What you worked out but did not see is marked "guess" in the same sentence. If nothing is worth showing, say so and stop: no page.

## The page

`<tmp>` is `${TMPDIR:-/tmp}` without its trailing slash. Write the findings to `<tmp>/scan-<command>-<date +%Y%m%d-%H%M%S>.json` as [page.md](reference/page.md) says, then draw it: `node "<skills folder>/scan/scripts/render-page.mjs" "<json>" --open` (the skills folder is this skill's base directory with its last name cut off as text). Never write HTML. Give the page as a `file://` link and the JSON path under it.

## The ending

1. The chat lines and the closing question the reference names. Then the top pick, if any.
2. Before the question: after a branch scan, "The rest of the project: `/scan <command> deep`, about <estimate> minutes."; after a quick scan, what was left out, and "Run the deep scan? It takes about <estimate> minutes." A yes runs the same command deep.
3. When the user picks an item, give the ready command for the next skill (usually `/fix <command>`), one line to copy. You cannot start it yourself.

Nothing starts before the user picks. Answer in the user's language; paths, commands and code names stay as they are.
