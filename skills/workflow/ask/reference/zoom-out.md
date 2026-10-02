# ask zoom-out

This file adds the `zoom-out` part to the rules in [../SKILL.md](../SKILL.md).

> I don't know this area of the code well. Step back one level. Show me a map of the parts around it and who calls it, in this project's own words.

That is the user talking. They are lost in the details of the place we are working on. They do not want a deeper look inside it: they want to see what is around it.

**The area** is what the user named after `/ask zoom-out`. Without a name, it is the file, function or part the conversation is on right now. If that is not clear, ask one question and stop.

## The answer

In the chat, short:

1. **The area.** One line: what it is.
2. **The map.** A plain-character picture: the area in the middle, what calls it above, what it calls below, close neighbours beside it. Only the parts that matter for understanding it.
3. **One line per part** on the map: its name, its file, its job, how it connects to the area.

```
      +-------------+     +---------+
      |  chat page  |     |  cron   |
      +-------------+     +---------+
             |                 |
             v                 v
          +---------------------+
          |   the area          |
          +---------------------+
             |                 |
             v                 v
      +-------------+     +---------+
      |  database   |     |  queue  |
      +-------------+     +---------+
```

Use only `+` `-` `|` `v` `^` `-->`: Unicode box and arrow symbols fall apart in the terminal.

## Rules

- **The project's words.** Name each part as `CLAUDE.md`, `AGENTS.md`, `docs/` or a glossary names it; only then as the code does, in backticks.
- **Read it yourself.** Search for who calls the area and read what it calls. No subagents, no page.
- **Change nothing.** No file is written, nothing is run that changes anything.
- **A guess stays a guess.** A caller you did not find in the code is marked "I think".

Then stop. Ask one question: back to what we were doing, or `/ask how <part>` for one of the parts on the map.

Answer in the user's language.

Adapted from `zoom-out` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), which has since been removed from that repo.
