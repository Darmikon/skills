# More ask commands: feature, compare, history, error, who, config, test, package

## Goal

Eight new sub-commands for the `ask` skill (`skills/workflow/ask/`). Like the rest of `ask`, they answer questions about code and change nothing. Each is one file under `ask/reference/` plus a row in the Commands table of `ask/SKILL.md`.

Merged on the way: `life` (the life of one entity) goes into `feature`; `what-changed` (recent changes) goes into `history` as its `since` form.

## Commands

| Command | Answers | Where |
|---|---|---|
| `feature <feature>` | The path of one user action through every layer, from the click to the screen, with a sequence diagram; and which entities it creates and changes, and how | page |
| `compare <topic or A> <B>` | How two places solve the same task: the same, different, missing in one, deliberately simplified; works across projects | page |
| `history <feature> [since <date>]` | The story of a feature from git and PRs: when it appeared, how it grew, where it was rewritten, who did it; with `since`, only that stretch | page (a timeline) |
| `error <text>` | Where an error message is born and the paths that lead to it | chat |
| `who <area>` | Who knows the area: authors, recent changers, reviewers | chat |
| `config <setting>` | Where a setting comes from: its default, its value per environment, who reads it | chat |
| `test <part>` | Which tests cover a part, how to run only them, what they need | chat |
| `package <name>` | Why a package is in the project: who uses it, what for, when and why it was added | chat |

## Shared rules (already in ask/SKILL.md, extended)

- Change nothing; the project's words; a guess stays a guess; plain-character drawings in the chat.
- **Plain words as arguments.** Every command takes ordinary words, not a strict syntax: `/ask feature document upload`, `/ask history billing since August`, `/ask compare auth in myai and use-api`. The command says in one line how it read the request, then goes on; the user can correct it.
- **Pages.** `feature`, `compare` and `history` answer on a page, made like `what-is-it` (the scan page style, path tiles to Cursor, copy buttons). The "The page" section of `ask/SKILL.md` covers all four page commands, not only `what-is-it`. File names: `ask-<command>-<timestamp>.html` / `.json`.

## feature

- **Find the feature.** From the words: the route, the page, the button text, the job name. Say in one line where the trace starts.
- **Trace** from the user's action to what they see at the end: the UI, the request, each server step (auth, validation, business rules), the database writes, the events and queues, the background jobs, other services, and the way the result comes back (a response, a poll, a push). Read the code at each step; no guessing from names.
- **Entities** (what `life` would have done): for each entity the feature creates or changes, its states along the way (`pending` → `processing` → `ready`), where each change happens, and where else in the code the entity is changed or deleted (outside this feature), one line each.
- **Page:** what the feature is (two sentences); a Mermaid sequence diagram of the whole path; one card per step with its path tiles, what happens, and what can go wrong there; the entities section with a state picture; gaps (steps it could not trace). Copy buttons per card.
- For a large feature, one `general-purpose` subagent per layer, each returning steps with path and line; checked by the main agent where they meet.
- Ending: which step to dig into → `/ask how <part>`; why a step is so → `/ask why`.

## compare

- **Read the request.** Two projects and a topic ("auth in myai and useai-api"), or two paths, or a topic and two names without "in"/"and". Projects are found by name in the current folder and next to it (`~/dev/<name>`), forgiving small typos (`use-api` → `useai-api`). Then the topic is found in each. One line says what is compared with what, as paths.
- **Compare** on the same questions for both sides: the parts and their jobs, the flow, the data, the edge cases handled, the tests, the outside services. Read both sides; never describe one side from memory of the other.
- **Page:** a side-by-side table per question; then four lists: the same; different (with what each choice costs); missing in A / missing in B; deliberately simplified (when a project says so in its notes, plans or commits, cite it). A two-column Mermaid or hand-built picture of the two flows. Copy buttons per row of the lists.
- When one side is a learning rebuild of the other (the project's notes say so), say for each difference whether it is a known simplification or a gap.
- Ending: which difference to look at → `/ask how` on one side, or `/explore` to think about closing a gap.

## history

- **Find the feature's files** from the words (as `feature` does), then its history: `git log --follow` on those files, `git log -S`/`-G` on its key names, the PRs from commit messages (`gh pr view`), the ticket keys. With `since <date>` (plain words allowed: "since August", "last two weeks"), only that stretch.
- **Group** the commits into chapters: born, grew, rewritten, fixed, moved, partly removed. A chapter is a run of commits with one purpose, not a commit each.
- **Page:** a timeline, oldest at the top (or the `since` stretch only): each chapter with its dates, its PRs and tickets, who did it, what changed in one or two sentences, and the commits as short links. A small "now" section at the end: the files today and their size. Copy buttons per chapter.
- Reasons follow `why`'s marks: found (cited), converging, guess. No story that the sources do not carry.
- Ending: which chapter to dig into → `/ask why` on it.

## error

- Search for the message: exact first, then its fixed parts when it has variables in it (`git grep -F`, then a pattern). Also error codes and classes.
- For each place that produces it: the path tile, the condition that throws it, and the callers one or two levels up that lead there. When it is thrown in several places, list them all and say which the text fits best.
- Chat, short. Ending: dig into one path → `/ask how`; it is a bug to fix → `systematic-debugging`.

## who

- `git shortlog -sn -- <paths>` overall and for the last six months; the authors of the most-changed files; the reviewers on the PRs that touched the area (`gh pr list --search` with the paths' commits, when `gh` is connected); a `CODEOWNERS` entry if there is one.
- Chat: up to five people, each with why (wrote most of it, changed it lately, reviews it), and when they last touched it. Names as git and GitHub show them; nothing more personal.

## config

- Find every place the setting appears: the code that reads it (and its default), `.env.example`, config schemas, `docker-compose*`, deploy configs per environment (`wrangler*.jsonc` env blocks, Helm values, CI workflows). Never read real secret values: name the place, not the value, for anything secret.
- Chat: a small table, environment → value or source; who reads it, with path tiles; what it changes in behaviour; places that disagree.

## test

- Find the tests that import the part or call its route; the runner and the command to run only them (one file, one name); what they need (database, keys, a running server), from the config and setup files.
- Chat: the tests, the exact command, the needs, and what the part has no test for (one line, pointing to `/scan tests`). Runs nothing.

## package

- Where it is declared (which `package.json`, which section, which version); who imports it (`git grep`), and through which other packages it also arrives (the lock file); when it was added and in which commit/PR (`git log -S '"<name>"' -- '**/package.json'`), and the reason when written.
- Chat: what it does in this project in one sentence, the places, the history line, and whether it looks replaceable or unused (pointing to `/scan unused`).

## Routing in ask/SKILL.md

The "No argument" suggestions gain: a user action named → `feature`; two projects or two places → `compare`; "how did this come to be" → `history`; an error text → `error`. The hint line lists all thirteen commands.

## Checks

- Every new reference file has a row in the Commands table and in the hint.
- A trial run of `feature`, `compare` (myai vs useai-api, auth) and `history` on real projects, read-only, `git status` unchanged; `error`, `who`, `config`, `test`, `package` once each.

## Out of scope

- Shortcuts for the new commands (the user can `/ask pin` them).
- Any change to `scan` or `fix`.

## Update, 2026-10-04: what is built

Built now: `feature`, `compare`, `history`, `error`, `who`. Left for later: `config`, `test`, `package`.

Changes to the design above, from the review and from what changed since:

- Pages (`feature`, `compare`, `history`) are drawn by `scan/scripts/render-page.mjs` from a JSON file with `"family": "ask"`; the model never writes HTML.
- Read yourself first; start subagents only when the trace runs through more than about 15 files.
- `feature` follows hops that are not direct calls (an event name in a string, a lookup table, a DI container, a queue) and marks them as such; it follows a call into a sibling project when that project is on the machine, and says so when it is not.
- `compare` never quotes the other project's code on the page or in a copied prompt: it describes it and cites paths. This keeps the user's rule that another project's code is never copied into files git tracks.
- `error` takes a stack trace as well as a message, and follows its frames.
- `history` and `who` say what they could not see when the folder is not a git repo or `gh` is not signed in.
- The three page commands offer once to save the page into the project's git-ignored study folder when the project has one (for example `docs/study/`), and only on a yes.
- Each new command has a case in `tests/run.sh`.
