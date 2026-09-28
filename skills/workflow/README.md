# workflow

How the agent responds and recovers: output styles, response shape, and stepping back when stuck.

## User-invoked

- **[explore](./explore/SKILL.md)** — `/explore [topic]` turns the agent into a thinking partner: it reads the code, runs only what looks, draws plain-character diagrams and weighs options, but writes no code and no file (a file only on a separate yes for that one file). It stays on until you say "хватит" / "stop", then gives a three-to-five-line summary — decided, open, next step — and asks before starting that step. Borrowed from OpenSpec's explore, without the `openspec` CLI.
- **[focus](./focus/SKILL.md)** — Shape output to be action-first and skimmable (ADHD-friendly). Toggle on with `/focus`, off with "stop focus mode".
- **[output-style](./output-style/SKILL.md)** — `/output-style ELI5` switches in one command, no picker; bare `/output-style` lists every style reachable from here (built-in, user, project, plugin) and asks. Brings back the standalone command Claude Code removed in v2.1.91.
- **[baby](./baby/SKILL.md)** — Say the last answer again in plain, non-technical words, then keep every reply that way. Works in the session you are already in, unlike the `Baby` output style.
- **[output-style-add](./output-style-add/SKILL.md)** — Turn a description into a real output style: brainstorm the role, tone and format, write `~/.claude/output-styles/<name>.md`, offer to switch to it.
- **[handoff](./handoff/SKILL.md)** — `/handoff <what the next session is for>` compacts the conversation into a handoff document for a fresh agent. It goes to the OS temp directory, not the workspace. It points at plans, commits and issues instead of copying them, redacts secrets and personal data, names the skills to call next, and marks what was not verified. The reply ends with the file path and one line to paste into the next session. `handoff-lpm` calls it, and the agent may reach for it on its own.
- **[handoff-lpm](./handoff-lpm/SKILL.md)** — `/handoff-lpm <what the next session is for>` does the whole move: it calls the `handoff` skill for the document, then opens a new tab in the lpm app with `lpm run --command claude --prompt ...`, which starts a fresh Claude session and sends it the one-line message that points at the document. Needs the lpm app running.
- **[wtf](./wtf/SKILL.md)** — "That last message did not land: re-pitch it." The agent says it once more — goal, where we are, the point, what it needs from you — in ASD-STE100 Simplified Technical English and in your own names for things, then stops. One shot, and it keeps the technical words; `/baby` is the one that drops them and stays on.

## Model-invoked

- **[rethink](./rethink/SKILL.md)** — Step back and rethink systematically after 3+ failed attempts at any task.
