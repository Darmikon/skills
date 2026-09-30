# how, how-to and zoom-out

## Goal

Our own skills for understanding code, to replace the `how` skill that came from Cursor's `cursor/plugins` (`pstack`). That one is written for Cursor: its subagent type, model names and the `pstack-models.mdc` rule do not exist in Claude Code. `scan what-is-it` already hands over to `/how`, so the next step after a scan must be a skill that ships with this repo.

## The three skills

All three live in `skills/workflow/`, answer in the chat, and change nothing in the project.

| Skill | Input | What it does |
|---|---|---|
| `how` | `<part>` | How one named part works inside: what it is, who uses it, the flow, where things live, gotchas |
| `how` | `to <task>` | The same for the code around a task, plus where and how the new thing should go |
| `how-to` | `<task>` | A shortcut: follows `how` as `/how to <task>`; holds no rules of its own |
| `zoom-out` | nothing, or an area | One level up from where the conversation is stuck: the parts around it and who calls it, as a short map |

`how` goes deep into a part; `zoom-out` steps back from it. Questions like "where should this live" belong to `how to`; open design thinking stays in `explore`.

## how

- **Size.** A small part: read it yourself. A large one (several folders or apps, or many files): 2 to 4 `Explore` subagents in one message, one angle each, reporting facts with file paths; the main agent writes the answer. No separate writer agent.
- **Words.** The project's own names, from `CLAUDE.md`, `AGENTS.md`, `docs/`, a glossary if one exists, then the code.
- **Answer.** What it is, who uses it (callers in and what it calls out), how it works (with a plain-character diagram when parts talk to each other), where things live, gotchas. Sections with nothing in them are dropped.
- **`to` mode** adds: where the new thing goes, the existing code that already does it the same way, the files to touch in order (no code), one alternative with its cost.
- **Ending.** One question: dig deeper, or take it to `/explore`. In `to` mode: the next step (`brainstorming` for a new design, or just do it when it is small), started only after a yes.

## zoom-out

Adapted from Matt Pocock's `zoom-out` (MIT), which he removed from his repo. A short instruction, no subagents, no page: the area in one line, a plain-character map with the callers above and what it calls below, one line per part, the project's words. Then it stops and offers `/how <part>`.

## Also

- The three skills go into `plugin.json`, both READMEs and the install-all command.
- They are linked into `~/.claude/skills/` like the other skills. The Cursor `how` is deleted after ours is in place, and its entry is removed from `~/.agents/.skill-lock.json`.
- The Cursor `why` stays for now; it is decided separately.
