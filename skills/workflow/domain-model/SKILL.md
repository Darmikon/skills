---
name: domain-model
description: 'Keep the project''s glossary and decision records in docs/. Use when a project term is unclear, clashes with the glossary or gets settled in conversation; when a hard-to-reverse decision with a real trade-off is made, or a proposal is turned down for a lasting reason; and when editing docs/glossary.md, docs/glossary-map.md or docs/decisions/.'
---

# domain-model

Keep the project's language and its big decisions written down while you work: one word for one idea in a glossary, and a short record for each decision a future reader would otherwise "fix". Do it on your own, at the moment a word or a decision becomes clear. Do not make the user manage it.

Reading the glossary for its words is a habit every skill has. This skill is for changing it.

## Where the files live

**One project, one language** (start here):

```
docs/
  glossary.md
  decisions/
    0001-one-database-per-app.md
    0002-tools-run-in-the-agent.md
```

**A project with parts that speak differently** (a monorepo, separate apps, separate domains):

```
docs/
  glossary-map.md          the parts, where their glossaries are, how they connect
  decisions/               decisions for the whole project
apps/agent/docs/
  glossary.md
  decisions/               decisions for this part only
apps/web/docs/
  glossary.md
  decisions/
```

To find the right files: if `docs/glossary-map.md` exists, read it and take the part the conversation is about (by its folder); if that is not clear, ask. Otherwise use `docs/glossary.md` and `docs/decisions/`.

Create a file or folder only when there is something to write into it.

## While you work

- **A clash.** The user uses a glossary word in another meaning: say so at once. "The glossary says *session* is X; you mean Y. Which one?"
- **A fuzzy word.** One word covers two ideas: offer the exact one. "*Account*: the customer or the login?"
- **A test case.** When the talk is about how ideas relate, try one concrete case at the edge to make the line sharp.
- **The code disagrees.** When the user says how something works and the code does it differently, show the place.

Not about trifles. Skip words that do not matter for this project, and ask at most one such question in a reply, at the end, not in the middle of a task.

## Words: write them yourself

When a word is settled, add or fix it in the glossary right away, in the format of [glossary.md](reference/glossary.md). Do not ask. End that reply with one line, in the user's language, such as "Glossary: *session*, *tool call*".

The glossary holds only words of this project. Not general programming words (timeout, retry, cache), not how the code is built, not plans. Be firm: pick one word and list the others as words not to use.

## Decisions: ask once

Offer to record a decision only when all three hold:

1. **Hard to undo**: changing your mind later would cost real work.
2. **Odd without the reason**: a reader of the code would wonder why, and might "fix" it.
3. **A real choice**: there were real options and one was picked for a reason.

Turning down a proposal counts too, when the reason will still hold later and someone would otherwise suggest it again (a refactor `scan architecture` keeps finding, a library you ruled out).

Ask one yes/no question at the end of the reply: "Record as a decision: <one line>?" On yes, write it in the format of [decisions.md](reference/decisions.md): into the part's `decisions/` when it concerns one part, into the root `docs/decisions/` when it concerns the whole project.

## Splitting into parts

Stay with one glossary until it stops working: the same word means different things in two parts, or the parts have clearly separate words. Then ask once: "Split the glossary by part: <parts>?" On yes, write `docs/glossary-map.md` in the format of [glossary.md](reference/glossary.md), move each word into its part's glossary, and keep the shared ones in the map's "Between parts".

## When another skill promises to change nothing

`ask`, `scan`, `explore`, `verify`, `grill-me` and any mode that promises not to change files keep their promise. Do not write while they run. Keep the words and decisions you would record, and at their end add one line: "For the glossary: *a*, *b*. Record?" On yes, write them.

## Do not

- Commit. The files stay as ordinary changes, part of the user's work.
- Copy another project's code or text into these files.
- Put in what the code already says plainly, or what only matters for today.
