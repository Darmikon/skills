---
name: ask
description: 'Understand code without changing it. Sub-commands: what-is-it (first look at a whole project, on a page), how (how one part works; how to <task>: where a new thing goes), why (what led to the code''s shape, from history, PRs and tickets), zoom-out (the parts around one place). With no argument it suggests which fits.'
argument-hint: '[what-is-it · how · how to · why · zoom-out · pin <command> · unpin <command>] [part, area or question]'
disable-model-invocation: true
---

# ask

Questions about the code: what it is, how it works, why it is so, what is around it. `ask` explains; `scan` finds problems; `fix` fixes them. This file holds the rules every `ask` command shares; each command's own part is a file under `reference/`.

## Commands

| Command | What it answers | Where | Reference |
|---|---|---|---|
| `what-is-it [folder]` | First look at a whole project you do not know: what it is, its parts, main paths, where things are, how to run it, surprises | a page | [reference/what-is-it.md](reference/what-is-it.md) |
| `how <part>` | How one part works: what it is, who uses it, the flow, where things live, gotchas | the chat | [reference/how.md](reference/how.md) |
| `how to <task>` | The same for the code around a task, then where and how the new thing should go | the chat | [reference/how.md](reference/how.md) |
| `why <code or question>` | What led to the code's shape: commits, PRs, tickets, docs, each claim marked found, converging, guessed or unknown | the chat | [reference/why.md](reference/why.md) |
| `zoom-out [area]` | One level up from where we are stuck: a map of the parts around it and who calls it | the chat | [reference/zoom-out.md](reference/zoom-out.md) |

Shortcuts that run these: `/how`, `/how-to`, `/why`, `/zoom-out`.

Routing:

- **No argument:** look at the conversation. Stuck in one place → `zoom-out`. Asking about one part → `how`. Asking about a reason → `why`. A project not yet looked at → `what-is-it`. Suggest one or two with the exact command, list the rest, and stop. Never start one on your own.
- **A command name first:** read its reference and follow it with the rules in this file. The rest of the argument is its target.
- **A plain question** ("how does billing work", "why is the timeout 30s"): if one command clearly fits, run it, saying which in one line.
- **`pin` / `unpin`:** see "Shortcuts".

## Change nothing

- Read files, search, read `git log` and `git blame`, list the scripts, and read the connected trackers and docs when a reference says so. Nothing else.
- Do not create, change or delete a file in the project. No commit, no install, no branch switch.
- Do not start a skill that writes code or files. Name it as the next step instead.

## The project's words

Call things by the project's own names: from `CLAUDE.md`, `AGENTS.md`, `docs/`, a glossary, then from the code in backticks. One name for one thing from start to end.

## A guess stays a guess

- Say as a fact only what you saw in the code, in a command's output, or in a source you cite.
- Mark everything else in the same sentence: "I think", "I did not check".
- If something could not be traced, say so.

## Drawing in the chat

Use only `+` `-` `|` for boxes and `-->` `<--` `^` `v` for arrows. No Unicode box or arrow symbols: terminals show them at different widths and the picture falls apart.

## The page (`what-is-it` only)

`what-is-it` answers on one page, drawn by the `scan` skill's program: write the JSON as the `scan` skill's `reference/page.md` says (with `"family": "ask"`), and run its `scripts/render-page.mjs`; both are in the `scan` folder of the same skills folder as this skill. Follow the `scan` skill's "Proof" rule too. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/ask` → `/…/skills`); do not write `../scan`, since the base directory may be a link and `..` follows it elsewhere. The files are named `ask-what-is-it-<timestamp>.html` and `.json`. If the `scan` skill is not installed, answer in the chat with the same six sections, and say that the page needs it (`npx skills add Darmikon/skills --skill scan`).

## Shortcuts

`/ask pin <command>` makes a separate `/<command>` command (for `how to`: `/how-to`); `/ask unpin <command>` removes it. Do it exactly as the `scan` skill's "Shortcuts" section says, with `ask` in place of `scan` and the name without a prefix: the same marker comment, and never touching a folder that does not carry it. `/how`, `/how-to`, `/why` and `/zoom-out` already ship as shortcuts.

## Language

Answer in the user's language. File paths, commands and names from the code stay as they are.
