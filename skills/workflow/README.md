# workflow

How the agent responds and recovers: output styles, response shape, and stepping back when stuck.

## User-invoked

- **[focus](./focus/SKILL.md)** — Shape output to be action-first and skimmable (ADHD-friendly). Toggle on with `/focus`, off with "stop focus mode".
- **[output-style](./output-style/SKILL.md)** — `/output-style ELI5` switches in one command, no picker; bare `/output-style` lists every style reachable from here (built-in, user, project, plugin) and asks. Brings back the standalone command Claude Code removed in v2.1.91.
- **[output-style-add](./output-style-add/SKILL.md)** — Turn a description into a real output style: brainstorm the role, tone and format, write `~/.claude/output-styles/<name>.md`, offer to switch to it.

## Model-invoked

- **[rethink](./rethink/SKILL.md)** — Step back and rethink systematically after 3+ failed attempts at any task.
