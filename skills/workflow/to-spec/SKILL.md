---
name: to-spec
description: 'Turn what we already discussed into a spec in docs/superpowers/specs/, without asking anything: the problem, the solution, user stories, decisions, testing, out of scope, and the open questions the talk left. Then /to-plan.'
argument-hint: '[topic]'
disable-model-invocation: true
---

# to-spec

The user has talked a feature through (in `explore`, in `grill-me`, or just in the chat, in any order) and wants it written down as a spec that `/to-plan` can turn into a plan. Do not interview them: gather what was said and put it in order.

**The topic** is what came after `/to-spec`. Without it, the feature the conversation is about; if the conversation holds more than one, ask which, and stop.

## Steps

1. **Gather.** Read the conversation for what was decided, what was turned down and what was left open. Read the code it touches, enough to name things right and to see what exists. Read the project's glossary and decisions (`docs/glossary-map.md`, or `docs/glossary.md` and `docs/decisions/`) and use their words; do not go against a written decision without saying so.
2. **Do not fill holes.** What the conversation did not settle goes under "Open questions", not into the spec as a guess. A choice you made yourself to complete the picture is an open question too, with your recommendation.
3. **Write** the spec in the template below to `docs/superpowers/specs/<date +%Y-%m-%d>-<topic-slug>-design.md`. Write it in the language of the other specs there; with none, in the user's language. Do not commit it.
4. **Hand it over.** The path, the number of user stories and open questions, and the next step:
   - no open question changes the design → `/to-plan <path>`;
   - some do → answer them first: `/grill-me <path>`, then `/to-plan`.

## The template

```md
# <Feature>

## Problem

What hurts, from the user's side.

## Solution

What changes, from the user's side.

## User stories

1. As a <who>, I want <what>, so that <why>.
2. …

## Decisions

- The parts that are built or changed, and their interfaces.
- Data and schema changes, API contracts.
- How the parts work together.
- What was turned down, and why, when someone would suggest it again.

## Testing

- What a good test checks here: outside behaviour, not the insides.
- Which parts get tests, at the highest level that can see the behaviour.
- Tests in the project to follow as examples.

## Out of scope

What this spec does not do.

## Open questions

1. <The question.> Recommended: <answer>, because <why>.

## Notes

Anything else worth knowing.
```

Rules:

- **User stories** cover every behaviour the conversation named, the edge cases included. As many as that takes.
- **No file paths and no code** in the decisions: they go stale. Name the parts with the project's words. One exception: a snippet from a `mockup` that pins a decision more exactly than words (a state machine, a type), trimmed to that, with a note that it came from the mockup.
- **Drop a section** that has nothing in it, except "Open questions": write "None." there, so the reader knows it was checked.

Answer in the user's language.

Adapted from `to-spec` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), writing to `docs/superpowers/specs/` instead of an issue tracker.
