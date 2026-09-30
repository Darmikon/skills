---
name: scan
description: 'Look at a whole project without changing it, and show what was found on one HTML page. Sub-commands: what-is-it (first look at an unfamiliar project), architecture (where the existing code is harder to understand and test than it needs to be), unused (files, code and packages nothing uses, found with knip). With no argument it suggests which scan fits.'
argument-hint: '[what-is-it · architecture · unused · pin <command> · unpin <command>] [folder or area]'
disable-model-invocation: true
---

# scan

Each scan looks at a project, changes nothing in it, and shows what it found on one page. This file holds the rules every scan shares; each scan's own part is a file under `reference/`.

## Commands

| Command | What it shows | Reference |
|---|---|---|
| `what-is-it [folder]` | First look at an unfamiliar project: what it is, its parts, main paths, where things are, how to run it, surprises | [reference/what-is-it.md](reference/what-is-it.md) |
| `architecture [area]` | Where the existing code is harder to understand and test than it needs to be, with before/after pictures | [reference/architecture.md](reference/architecture.md) |
| `unused [folder]` | Files, code, types and packages nothing uses, and packages used but not listed, found with knip and checked once more; JavaScript and TypeScript projects with installed packages | [reference/unused.md](reference/unused.md) |

Routing:

- **No argument:** show the menu (below). Never start a scan on your own.
- **A command name first:** read its reference and follow it together with the rules in this file. The rest of the argument is the folder or area.
- **Something else** ("is this secure?", "what is this project"): if one command clearly fits, name it and ask once before running it. If none fits, say so and show the menu.
- **`pin` / `unpin`:** see "Shortcuts" below.

## The menu

When `/scan` comes with no argument, look quickly, then suggest. Look only at what is cheap: `git log --oneline -30 --name-only`, whether a `README*` or `CLAUDE.md` exists, the root manifest (`package.json`, `pyproject.toml`, …).

- The conversation shows the user does not know this project yet, or it has no notes of its own → `what-is-it`.
- Recent history keeps coming back to the same files → `architecture`, scoped to that area, naming it.
- A `package.json` and a `node_modules/` at the root → `unused` is on offer too.
- Otherwise → `what-is-it` for the whole project, or `architecture` without a scope.

Lead with one or two picks, each with a one-line reason and the exact command to type (`/scan architecture src/app/modules/billing`). Then the full list from the table. Stop there.

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

Write one self-contained HTML file to `${TMPDIR:-/tmp}/scan-<command>-<timestamp>.html`, with the timestamp from `date +%Y%m%d-%H%M%S`. Open it with `open <path>` on macOS or `xdg-open <path>` on Linux, and give it in the chat as a `file://` link.

Read [reference/page.md](reference/page.md) for the layout and style. The command's reference says what goes in the body.

## The ending

1. In the chat, one line per item, in the form the command's reference names. Then the top pick, when the command has one.
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
