---
name: ask
description: 'Understand code without changing it: what-is-it (a whole project), how (one part; how to: where a new thing goes), why (the reasons), zoom-out (the parts around), feature (one user action through every layer), compare (two places side by side), history (how a feature grew), error (where an error comes from), who (who knows an area). With no argument it suggests which fits.'
argument-hint: '[what-is-it · how · how to · why · zoom-out · feature · compare · history · error · who · pin <command> · unpin <command>] [part, area or question]'
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
| `feature <action>` | One thing a user does, traced from the click to the screen through every layer, with the entities it changes | a page | [reference/feature.md](reference/feature.md) |
| `compare <topic> in <A> and <B>` | How two places or projects solve the same task: same, different, missing, simplified | a page | [reference/compare.md](reference/compare.md) |
| `history <feature> [since <when>]` | How a feature was built, chapter by chapter, from git and PRs; with `since`, only lately | a page | [reference/history.md](reference/history.md) |
| `error <message or stack trace>` | Where an error is born and which paths lead to it | the chat | [reference/error.md](reference/error.md) |
| `who <area>` | Who knows an area best: authors, recent changers, reviewers | the chat | [reference/who.md](reference/who.md) |

Shortcuts that run these: `/how`, `/how-to`, `/why`, `/zoom-out`.

Routing:

- **No argument:** look at the conversation. Stuck in one place → `zoom-out`. Asking about one part → `how`. Asking about a reason → `why`. A project not yet looked at → `what-is-it`. A user action named → `feature`. Two projects or places → `compare`. "How did this come to be" → `history`. An error text → `error`. "Who wrote this" → `who`. Suggest one or two with the exact command, list the rest, and stop. Never start one on your own.
- **A command name first:** read its reference and follow it with the rules in this file. The rest of the argument is its target.
- **A plain question** ("how does billing work", "why is the timeout 30s"): if one command clearly fits, run it, saying which in one line.
- **`pin` / `unpin`:** read `pin.md` in the `scan` skill's `reference/` folder, in the same skills folder as this skill.

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

## The page (`what-is-it`, `feature`, `compare`, `history`)

These answer on one page, drawn by the `scan` skill's program: write the JSON as the `scan` skill's `reference/page.md` says (with `"family": "ask"`), and run its `scripts/render-page.mjs`; both are in the `scan` folder of the same skills folder as this skill. Follow the `scan` skill's "Proof" rule too. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/ask` → `/…/skills`); do not write `../scan`, since the base directory may be a link and `..` follows it elsewhere. The files are named `ask-<command>-<timestamp>.json` and `.html`. If the `scan` skill is not installed, answer in the chat with the same sections, and say that the page needs it.

## Shortcuts

`/how`, `/how-to`, `/why` and `/zoom-out` ship as shortcuts. `/ask pin <command>` makes more (see above).

## Language

Answer in the user's language. File paths, commands and names from the code stay as they are.
