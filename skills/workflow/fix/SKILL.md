---
name: fix
description: 'Fix what /scan found, after the user approves a numbered plan. docs, comments, todo, unused and tests change files and leave them uncommitted; security, performance and architecture hand the findings to brainstorming. By default it fixes what the current branch changed; `deep` the whole project. Reuses a fresh scan or runs one first.'
argument-hint: '[docs · comments · todo · unused · tests · security · performance · architecture · pin <command> · unpin <command>] [folder or area] [deep]'
disable-model-invocation: true
---

# fix

`scan` finds and changes nothing; `fix` fixes what it found, under the same command names. This file holds what every fix shares; each command's own part is in `reference/`.

## Commands

| Command | Fixes | Reference |
|---|---|---|
| `docs [folder]` | false claims; stale, repeated and finished documents; a lean `AGENTS.md` | [docs.md](reference/docs.md) |
| `comments [folder]` | lying comments, done TODOs, dead code, repeats | [comments.md](reference/comments.md) |
| `todo [folder]` | the done and gone TODOs alone | [comments.md](reference/comments.md) |
| `unused [folder]` | what nothing uses; packages used but not listed | [unused.md](reference/unused.md) |
| `tests [folder]` | missing, weak and flaky tests; test files only | [tests.md](reference/tests.md) |
| `security`, `performance`, `architecture` | hand the findings to `brainstorming` | [handoff.md](reference/handoff.md) |

- **No argument:** list the commands, each with whether a fresh scan exists here; suggest the one with the most findings. Start nothing.
- **A command first:** read its reference and follow it with this file.
- **A prompt pasted from a scan page** (`Project:` … `Found by: /scan <command>`): `/fix <command>` limited to those findings; skip step 1.
- **`pin` / `unpin`:** read `pin.md` in the `scan` skill's `reference/` folder.

The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/fix` → `/…/skills`); never `../scan`, since the base directory may be a link.

## 1. The findings

Look in `<tmp>` (`${TMPDIR:-/tmp}` without its trailing slash) for `scan-<command>-<digits>-<digits>.json` files whose `project` is this project's root, and take the newest. It is fresh when its `head` is the current `git rev-parse HEAD`, its `dirty` matches `git status --porcelain | shasum | cut -c1-40` (a clean tree matches `null`), its `folder` covers the one asked for, and its `scope` covers what is asked: `/fix <command>` on a branch with changes takes a `branch` or `deep` scan (from a deep one, only the findings that belong to the branch, as the `scan` skill's "What a scan looks at" says); `/fix <command> deep` takes only a `deep` one; with no branch changes, a `quick` or `deep` one.

- Fresh: say which scan you use (time, page link) and go on.
- Not fresh: run the scan with the same scope by reading `<skills folder>/scan/SKILL.md` and the command's reference: write the page and the findings file, skip the scan's chat ending. Never trust a stale file.
- A quick scan holds only its top 5, and `fix` fixes those; say so and offer the deep scan first.

## 2. The plan

One numbered list in the chat, one line per change: the file and line, what changes, why in a few words. Mark lines that delete a file. Say which findings you leave out and why. End with: "Do I go ahead? Answer yes, or yes except some numbers." Change nothing before the yes.

## 3. The work

Change only what the approved lines say. Never delete a file git does not track. Never commit, push or switch branches. Install nothing unless the reference allows it for an approved line. Text written into a file follows that file's language.

## 4. The checks

Run the project's own read-only checks (type check, linter, tests from `package.json` or the `Makefile`) once before and once after; never one that rewrites tracked files. If a change breaks a check that passed before, undo that change, run it again, and report the line as "rolled back" with the error.

## 5. The report

Each approved line: done, rolled back or skipped, with why. The checks and their result. `git status --short` and `git diff --stat`. "The changes are not committed." In the user's language.
