---
name: fix
description: 'Fix what a /scan found, after the user approves a numbered plan. docs (tidy and correct the documents; what better-docs did), comments (correct lying comments, remove stale TODOs, dead code and repeats), unused (remove what nothing uses) change files and leave the changes uncommitted. security, performance, architecture hand the findings to brainstorming. Reuses a fresh scan, or runs it first.'
argument-hint: '[docs · comments · unused · security · performance · architecture · pin <command> · unpin <command>] [folder or area]'
disable-model-invocation: true
---

# fix

`scan` finds and changes nothing; `fix` fixes what it found. Each command has the same name as its scan. This file holds the rules every fix shares; each command's own part is a file under `reference/`.

## Commands

| Command | What it fixes | Reference |
|---|---|---|
| `docs [folder]` | False claims in the documents; stale documents, repeats and finished plans; `AGENTS.md` made a lean routing file and the details moved into `docs/` | [reference/docs.md](reference/docs.md) |
| `comments [folder]` | Comments that lie about the code; TODOs that are done or whose subject is gone; code left commented out; comments that only repeat the code | [reference/comments.md](reference/comments.md) |
| `unused [folder]` | Files, code, types and packages nothing uses; packages used but not listed | [reference/unused.md](reference/unused.md) |
| `security [folder]` | Hands the findings of `scan security` to `brainstorming` | [reference/handoff.md](reference/handoff.md) |
| `performance [area]` | Hands the findings of `scan performance` to `brainstorming` | [reference/handoff.md](reference/handoff.md) |
| `architecture [area]` | Hands the findings of `scan architecture` to `brainstorming` | [reference/handoff.md](reference/handoff.md) |

Routing:

- **No argument:** list the commands, and for each one whether a fresh scan result exists for this project (see below). Suggest the one with the most findings. Never start a fix on your own.
- **A command name first:** read its reference and follow it with the rules in this file. The rest of the argument is the folder or area.
- **A pasted prompt from a scan page** (it starts with `Project:` and `Found by: /scan <command>`): treat it as `/fix <command>` limited to those findings. Skip the scan step.
- **`pin` / `unpin`:** see "Shortcuts".

## 1. The findings: reuse a fresh scan, or scan first

Look for the newest `scan-<command>-*.json` in `<tmp>` (`<tmp>` is `${TMPDIR:-/tmp}` without its trailing slash). It is fresh when all of these hold:

- its `project` is this project's root (`git rev-parse --show-toplevel`);
- its `head` is the current `git rev-parse HEAD`;
- its `dirty` matches the current `git status --porcelain | shasum | cut -c1-40`; when `git status --porcelain` prints nothing the tree is clean, and a clean tree matches `dirty: null`;
- its `folder` is the same as the one asked for, or covers it.

Fresh: say in one line which scan you use (its time and page link) and go on. Not fresh or none: say so, then run the scan: read the `scan` skill's `SKILL.md` in the same skills folder as this skill and its reference for the command (the skills folder is this skill's base directory with its last name cut off as text, `/…/skills/fix` → `/…/skills`; do not write `../scan`, since the base directory may be a link and `..` follows it elsewhere), and follow them: write the page and the findings file and open the page, but skip the scan's chat summary and closing question. Then go on here. If `<skills folder>/scan/SKILL.md` does not exist, stop and say so, with the install command `npx skills add Darmikon/skills --skill scan`.

Never trust a findings file that is not fresh: the code it points at may have moved.

## 2. The plan

Show the plan in the chat as one numbered list, one line per change: the file (and line: for a `package.json` change, the line of the section it goes in), what changes, and why in a few words. Group the lines under short headings when there are many. Mark every line that deletes a file. Say which findings you leave out and why (a "check first" finding with a real use, a lie you could not confirm).

End with: "Do I go ahead? You can answer yes, or yes except some numbers." Wait. Change nothing before the yes. A "yes except 3, 7" means everything but those lines.

## 3. Doing the work

- Change only what the approved lines say. Nothing else in the project.
- Never delete a file that git does not track: it cannot be brought back. Name it and leave it.
- Never commit, push, or switch branches. The changes stay uncommitted for the user to look at.
- Never install anything, unless the command's reference says so for one approved line.

## 4. The checks

After the changes, run the project's own checks that only look: the type check, the linter, the tests, from the `scripts` of `package.json` (or the `Makefile`). Run only what exists; never a check that writes files that git tracks (a formatter in write mode, a snapshot update, code generation).

If a check fails because of a change, undo that change (`git checkout -- <file>`, or put the removed lines back), run the check again, and report the line as "rolled back" with the error. If a check was already failing before your changes, say so and do not count it against them: run it once before you start, to know.

## 5. The report

In the chat:

1. One line per approved line: done, rolled back (with why), or skipped (with why).
2. The checks that ran, and their result.
3. `git status --short` and `git diff --stat`, so the user sees what changed.
4. "The changes are not committed."

## Shortcuts

`/fix pin <command>` makes a separate `/fix-<command>` command; `/fix unpin <command>` removes it. Do it exactly as the `scan` skill's "Shortcuts" section says, with `fix` in place of `scan`: the same marker comment, and never touching a folder that does not carry it.

## Language

The chat follows the language of the conversation. File paths, commands and names from the code stay as they are. Text written into the project (a corrected comment, a document) follows the language that file already uses.
