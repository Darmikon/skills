---
name: grill-me
description: 'Grill me on a plan, design or decision until nothing is left assumed: questions in numbered rounds, each with a recommended answer, facts looked up instead of asked. Changes nothing.'
argument-hint: '[plan, design, decision or file]'
disable-model-invocation: true
---

# grill-me

The user has a plan, a design or a decision and wants it stress-tested. Interview them until the two of you understand it the same way and nothing is left silently assumed.

**The subject** is what came after `/grill-me`: a description, a file (a spec, a plan), or a decision. Without it, take the plan the conversation is about. If there is none, ask what to grill, and stop.

## The decision tree

Every decision branches into the decisions that hang on it. "Store it in Postgres" opens "which table", "who owns the rows", "what happens on a migration".

**The frontier** is every open decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you have not heard. A question that depends on another one still open belongs to a later round.

## Rounds

Ask the frontier in one round, then wait for the answers. At most five questions in a round: take the ones that the most other decisions hang on; the rest come in the next round.

Each question is numbered across the whole session, says why it matters, gives the choices when there are some, and ends with your recommended answer:

```
**Q1. Where the session lives**
The agent and the web app both need it. Choices: (a) the agent owns it and the web asks for it, (b) a shared table both read.
Recommended: (a). The web already calls the agent for every message, so one more field costs nothing.

**Q2. ...**
```

The user may answer briefly: "all as recommended except Q2: b". Take that as answers to every question in the round.

After each round, the answers reshape the tree: settled decisions open new questions. Work out the new frontier and ask the next round. If an answer contradicts an earlier one, say so and ask which stands.

## Facts are yours, decisions are theirs

- Never ask the user for a fact you can find: what the code does, which library is installed, what a config says, what a ticket says. Look it up. For anything that needs real digging, start an `Explore` subagent and do not wait for it: ask the rest of the frontier now; only the questions that depend on its answer wait.
- Decisions belong to the user. Put each one to them, with your recommendation, and wait.
- Say as a fact only what you saw. A recommendation built on a guess says so: "if the queue is FIFO, which I did not check".

## Change nothing

No code, no files, no commits, no installs, no other skill that writes. Words or decisions worth recording that come up go in one line at the end (see "Ending"), recorded only after a yes. `grill-with-docs` is the variant that records them along the way.

## Ending

The grilling is done when the frontier is empty: every branch visited, nothing assumed. Then:

1. **Agreed:** the decisions, one line each, with their question numbers.
2. **Still open:** what the user chose to leave open. Leave the line out if there is nothing.
3. If any project words or decisions are worth recording: "For the glossary: *a*, *b*. Decisions: <one line each>. Record?" (the `domain-model` skill's format).
4. Ask one question: do we understand it the same way? Then name the next step: `brainstorming` for a new design, `update-plans` when a written spec or plan changed, or just do it when the change is small and clear.

Do not act on the plan before the user confirms. Start nothing before a yes.

Answer in the user's language; paths, commands and code names stay as they are.

Adapted from `grilling` and `grill-me` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).
