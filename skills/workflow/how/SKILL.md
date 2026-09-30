---
name: how
description: 'How does this part of the code work: what it is, who uses it, the flow, where things live, gotchas, in the chat. `/how to <task>` also says where and how the new thing should go.'
argument-hint: '<part> · to <task>'
disable-model-invocation: true
---

# how

The user wants to understand one part of the code well enough to work in it. Explain it the way a senior engineer onboards a colleague onto a subsystem: enough for a working picture in their head, not a tour of every line.

The answer goes in the chat. Nothing in the project changes.

## Two modes

- **`/how <part>`**: how that part works.
- **`/how to <task>`**: how the code around the task works, and then where and how the new thing should go (see "The `to` mode").
- **No argument:** ask which part, and stop there.

If the part is ambiguous, say how you read it in one line and go on. The user can redirect.

## Change nothing

- Read files, search, read `git log`, list the scripts. Nothing else.
- Do not create, change or delete a file. No commit, no install, no branch switch.
- Do not start another skill that writes code or files.

## Look

**Small part** (one module, one flow, a handful of files): read it yourself.

**Large part** (it spans several folders or apps, or you would read more than about fifteen files): split it into 2 to 4 angles, each a distinct slice, and start one `Explore` subagent per angle, all in one message. Give each one:

- the user's question and its angle;
- to trace from the entry point (what starts this: a request, a message, a job, a user action) through the calls, and to read the code, not guess from names;
- to report, with a file path and a line for each item: the key pieces and their job, the flow step by step, what calls into this part and what it calls out to, anything surprising, and what it could not trace.

Write the answer yourself from their reports. Check in the code where two reports disagree.

## Words

Call things by the project's own names. Take them from `CLAUDE.md`, `AGENTS.md`, `docs/`, a glossary if the project has one, then from the code. One name for one thing, from start to end. Where a name comes from the code, put it in backticks.

## The answer

Drop a section that has nothing in it.

1. **What it is.** Two or three sentences: what the part does and why it exists.
2. **Who uses it.** One level up: what calls into it, and what it calls out to, each with its file.
3. **How it works.** The longest section. The flow step by step: what starts it, what happens, where the data goes, where it decides. Name the file and function at each step. Prose, not pseudocode, and no big code blocks. When parts talk to each other, add a diagram (see below).
4. **Where things live.** A short list of the files and folders someone needs to start working here.
5. **Gotchas.** Only what you saw: a surprise, a trap, a place that looks like it works one way and works another.

## The `to` mode

After the five sections, add:

6. **Where it goes.**
   - The place: the module or files the new thing belongs in, and why it fits there.
   - The example: code in this project that already does something the same way, with its path. Follow the project's pattern, not a textbook one.
   - The steps: the files to touch, in order, one line each. No code.
   - The other way: one alternative and what it costs in this code. Leave it out if there is no real one.
   - If the choice depends on something only the user knows, ask it here as one question.

## Draw with plain characters only

Use `+` `-` `|` for boxes, `-->` `<--` `^` `v` for arrows. No box-drawing or arrow symbols from Unicode: terminals show them at different widths and the picture falls apart.

```
+---------+      +-----------+      +----------+
|  route  | ---> |  service  | ---> |  client  |
+---------+      +-----------+      +----------+
```

## A guess stays a guess

- Say as a fact only what you saw in the code or in a command's output.
- Mark everything else in the same sentence: "I think", "I did not check".
- If a part could not be traced, say so. "I could not find what starts this job" beats a made-up answer.

## Ending

Ask one question.

- **`/how <part>`:** which piece to dig into next, or take it to `/explore` to think about a change.
- **`/how to <task>`:** start building? Name the next step: `brainstorming` for a new design, or just do it when the change is small and clear. Do not start it before the yes.

Answer in the user's language.
