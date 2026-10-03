---
name: scan
description: 'Look at a whole project without changing it, and show what was found on one HTML page. Sub-commands: architecture (where the existing code is harder to understand and test than it needs to be), unused (files, code and packages nothing uses, found with knip), security (secrets, dangerous code, packages with holes, logic mistakes; gitleaks, semgrep and the package audit, installed on first run), performance (code that looks slow, with a measurement plan run only after the user approves it), docs (whether the documents tell the truth: stale, repeated, and claims that do not match the code), comments (comments that lie about the code, stale TODOs, commented-out code, comments that repeat the code), todo (only the TODO part of comments), tests (parts with no tests, tests that check nothing, switched off, or pass by chance; runs only the doubtful ones). With no argument it suggests which scan fits.'
argument-hint: '[architecture · unused · security · performance · docs · comments · todo · tests · pin <command> · unpin <command>] [folder or area]'
disable-model-invocation: true
---

# scan

Each scan looks at a project, changes nothing in it, and shows what it found on one page. This file holds the rules every scan shares; each scan's own part is a file under `reference/`.

## Commands

| Command | What it shows | Reference |
|---|---|---|
| `architecture [area]` | Where the existing code is harder to understand and test than it needs to be, with before/after pictures | [reference/architecture.md](reference/architecture.md) |
| `unused [folder]` | Files, code, types and packages nothing uses, and packages used but not listed, found with knip and checked once more; JavaScript and TypeScript projects with installed packages | [reference/unused.md](reference/unused.md) |
| `security [folder]` | Secrets in the code and its history, dangerous code, packages with known holes, and logic mistakes, sorted by how serious; gitleaks and semgrep are installed on the machine on first run | [reference/security.md](reference/security.md) |
| `performance [area]` | Code that looks slow (queries in loops, no limit, no index, waiting in turn, heavy work on the request path), with a first summary; when a suspicion needs numbers, a measurement plan, measured on this machine only after the user approves it | [reference/performance.md](reference/performance.md) |
| `docs [folder]` | Whether the documents tell the truth: what each is for, stale, repeated, finished plans, and paths, commands, settings, numbers and names that do not match the code; plus the main parts no document describes. Fixing is for `/fix docs` | [reference/docs.md](reference/docs.md) |
| `comments [folder]` | Comments that lie about the code, stale TODOs (done, gone, old), code left commented out, and comments that only repeat the code | [reference/comments.md](reference/comments.md) |
| `todo [folder]` | Only the TODO part of `comments`: every `TODO`, `FIXME`, `HACK`, `XXX` and `@deprecated` with its age and author, marked done, gone, old or open | [reference/comments.md](reference/comments.md), the "Stale TODOs" kind only |
| `tests [folder]` | Important parts with no tests, tests that check nothing, tests switched off, tests that pass or fail by chance; runs only the doubtful tests, and coverage when the project can measure it, with reports in the temp dir | [reference/tests.md](reference/tests.md) |

Routing:

- **No argument:** show the menu (below). Never start a scan on your own.
- **A command name first** (`doc` for `docs` and `comment` for `comments` work too): read its reference and follow it together with the rules in this file. The rest of the argument is the folder or area.
- **Something else** ("is this secure?", "what is this project"): if one command clearly fits, name it and ask once before running it. If none fits, say so and show the menu.
- **`pin` / `unpin`:** see "Shortcuts" below.

## The menu

When `/scan` comes with no argument, look quickly, then suggest. Look only at what is cheap: `git log --oneline -30 --name-only`, whether a `README*` or `CLAUDE.md` exists, the root manifest (`package.json`, `pyproject.toml`, …).

- The conversation shows the user does not know this project yet, or it has no notes of its own → say that `/ask what-is-it` gives the first look (it is not a scan), then go on with the picks.
- Recent history keeps coming back to the same files → `architecture`, scoped to that area, naming it.
- A `package.json` and a `node_modules/` at the root → `unused` is on offer too.
- The project takes logins, payments, uploads or webhooks → `security` is on offer too.
- The project has a database or list endpoints → `performance` is on offer too.
- The project has a `docs/` folder, or a `README`, `CLAUDE.md` or `AGENTS.md` longer than a page → `docs` is on offer too.
- A test runner in the project → `tests` is on offer too.
- Many `TODO` or `FIXME` notes (`git grep -c -E 'TODO|FIXME'`) → `comments` is on offer too.
- Otherwise → `architecture` without a scope.

Lead with one or two picks, each with a one-line reason and the exact command to type (`/scan architecture src/app/modules/billing`). Then the full list from the table. Stop there.

## Observe, never change

A scan observes and recommends. `fix` does the work.

- **Never write code**, and never create, change or delete a file in the project.
- **Never change anything else the project owns:** no rows added to or removed from its database, no settings, no commit, no push, no branch switch, no install into the project.
- **Running things to observe is allowed** when a reference says how: tools that only read the code (`knip`, `gitleaks`, `semgrep`, an audit), the project's tests (`tests`), timing a route or reading the database's plan for a query on the data that is already there (`performance`). Each run must leave the project as it was: no flag that rewrites files (snapshot updates, `--fix`, code generation), reports and temp files in `<tmp>`, every started process stopped. Check `git status` before and after. Caches a tool writes into folders git ignores, such as `node_modules/.vite-temp` or `node_modules/.cache`, are fine; nothing else may appear.
- **When observing would need a change** (test data in the database, a new test, a build that writes tracked files), do not do it: say what it would take, and leave it to `/fix <command>`.
- A tool installed on the machine (not in the project) is allowed when a reference says so.
- If you are not sure that a command leaves everything as it was, do not run it: ask.
- The files you write are the page and the findings file, and they go to `<tmp>`.

## Proof

- Every finding or statement names a file, a line when there is one, and what you saw there.
- What you worked out but did not see is a guess. Say "guess" in the same sentence.
- Three to six good items beat twelve thin ones.
- If nothing is worth showing, say so in the chat and stop. No page.

## The page and the findings file

A scan writes one JSON file and a program draws the page from it. You never write HTML.

1. Write `<tmp>/scan-<command>-<timestamp>.json`, where `<tmp>` is `${TMPDIR:-/tmp}` without its trailing slash (`t="${TMPDIR:-/tmp}"; t="${t%/}"`; on macOS `$TMPDIR` ends in `/`) and the timestamp comes from `date +%Y%m%d-%H%M%S`.
2. Draw it: `node "<skills folder>/scan/scripts/render-page.mjs" "<the json>" --open` (the skills folder is this skill's base directory with its last name cut off as text).
3. In the chat, give the page as a `file://` link and the JSON path under it.

The `fix` skill reads the same JSON, so that a scan just done is not done again.

```json
{
  "command": "docs",
  "family": "scan",
  "project": "/absolute/project/root",
  "folder": null,
  "created": "<date +%Y-%m-%dT%H:%M:%S%z>",
  "head": "<git rev-parse HEAD>",
  "dirty": "<git status --porcelain | shasum | cut -c1-40, or null when the output is empty>",
  "findings": [
    {
      "id": "f1",
      "kind": "lie",
      "title": "…",
      "name": "the code name or package name, when the finding is about one",
      "version": "for a package: the version the lock file resolves",
      "rank": "High",
      "places": [{ "path": "src/app/x.ts", "line": 76 }],
      "seen": "what was seen, with the evidence",
      "direction": "the fix direction",
      "action": "delete | drop export | rewrite | merge into … | add to … | …",
      "group": "safe to remove | check first | real | not reached | likely false alarm | …"
    }
  ],
  "page": { "lang": "ru", "title": "…", "facts": [], "summary": [], "sections": [], "top_pick": null }
}
```

`kind`, `rank`, `action` and `group` take the words the command's reference uses; leave out a field the command does not have. Paths are relative to the project root. Every finding goes in, not only the ones shown on the page. No secret goes in. What goes in `page` (the six blocks, the fields' style) is in [reference/page.md](reference/page.md); the command's reference says which sections to make.

## The ending

1. In the chat, one line per item, or counts by kind when the reference says so, in the form the command's reference names. Then the top pick, when the command has one.
2. Ask the closing question that the reference names. One question.
3. Unless the reference says otherwise: when the user picks an item, give them the ready command for the next skill, one line to copy, with the item as the topic: `/<skill> <what it is, the files, the evidence>`. The next skill is one the user starts: you cannot call it yourself.

Nothing starts before the user picks. No code.

## Shortcuts

`/scan pin <command>` makes a separate `/scan-<command>` command, for a scan the user runs often. `/scan unpin <command>` removes it. These are the only times this skill writes outside the temp directory.

**pin:**

1. Check that `<command>` is in the Commands table. If not, say so and list the commands.
2. Find where this skill is installed: the base directory of this skill. The shortcut goes next to it, in the same skills folder: `<skills folder>/scan-<command>/SKILL.md`. If that folder already exists and its file does not start with the shortcut marker below, stop and tell the user: it is someone else's skill.
3. Write the file:

   ```markdown
   ---
   name: scan-<command>
   description: 'Shortcut for /scan <command>: <the command's line from the Commands table>'
   argument-hint: '<the command's argument from the Commands table, e.g. [folder]>'
   disable-model-invocation: true
   ---

   <!-- scan shortcut: made by /scan pin, removed by /scan unpin -->

   Read `<absolute path of this skill's SKILL.md>` and follow it as if the user had typed `/scan <command> $ARGUMENTS`.
   ```

4. Tell the user the shortcut is made and shows up in the `/` menu in a new session.

**unpin:** delete `<skills folder>/scan-<command>/` only if its `SKILL.md` has the shortcut marker. Otherwise stop and say why. Tell the user it is gone.

## Language

The chat and the page follow the language of the conversation. File paths, commands and names from the code stay as they are.
