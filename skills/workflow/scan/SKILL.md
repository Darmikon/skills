---
name: scan
description: 'Look for problems in a whole project without changing it, and show them on one page. Commands: architecture, unused, security, performance, docs, comments, todo, tests. Quick by default (the 5 main findings), offers the full scan at the end. With no argument it suggests which fits.'
argument-hint: '[architecture · unused · security · performance · docs · comments · todo · tests · pin <command> · unpin <command>] [folder or area]'
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
- **`deep`**, "full", "полный" anywhere in the argument: a full scan.

## Quick and full

- **Quick** (the default): no subagents. Look first where the code changes most (`git log --oneline -60 --name-only`, or the folder named) and stop at the **5 most important findings** by the reference's ranking. Tools (`knip`, `gitleaks`, `semgrep`, the audit, the test runner) still run in full; only the reading is cut. The page's `facts` say it was a quick scan and what was not looked at.
- **Full**: everything the reference describes, subagents included.

## Observe, never change

- Never write code, never create, change or delete a file in the project, never change its database rows, settings or branches, never commit, push or install into it.
- Running things to observe is fine when a reference says how (read-only tools, the doubtful tests, timings). The project must be as it was afterwards: no flag that rewrites files, temp files in `<tmp>`, every process stopped, `git status` the same before and after (caches in ignored folders like `node_modules/.cache` are fine).
- When observing would need a change, do not do it: say what it would take and leave it to `/fix`.
- Not sure a command leaves everything as it was? Ask.

## Proof

Every finding names a file, a line when there is one, and what you saw there. What you worked out but did not see is marked "guess" in the same sentence. If nothing is worth showing, say so and stop: no page.

## The page

`<tmp>` is `${TMPDIR:-/tmp}` without its trailing slash. Write the findings to `<tmp>/scan-<command>-<date +%Y%m%d-%H%M%S>.json` as [page.md](reference/page.md) says, then draw it: `node "<skills folder>/scan/scripts/render-page.mjs" "<json>" --open` (the skills folder is this skill's base directory with its last name cut off as text). Never write HTML. Give the page as a `file://` link and the JSON path under it.

## The ending

1. The chat lines and the closing question the reference names. Then the top pick, if any.
2. After a quick scan, before the question: what was left out, and "Run the full scan? It takes about <estimate> minutes." A yes runs the same command in full.
3. When the user picks an item, give the ready command for the next skill (usually `/fix <command>`), one line to copy. You cannot start it yourself.

Nothing starts before the user picks. Answer in the user's language; paths, commands and code names stay as they are.
