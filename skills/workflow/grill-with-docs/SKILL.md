---
name: grill-with-docs
description: 'Grill me on a plan or design like grill-me, and keep the project''s glossary and decision records in docs/ up to date along the way.'
argument-hint: '[plan, design, decision or file]'
disable-model-invocation: true
---

Read the `grill-me` and `domain-model` skills' `SKILL.md` files in the same skills folder as this skill, and follow `grill-me` for `$ARGUMENTS` with these changes. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/grill-with-docs` → `/…/skills`); do not write `../grill-me`, since the base directory may be a link and `..` follows it elsewhere.

- **Read the glossary and decisions first**, as `domain-model` says where to find them. Hold the plan against them: a word used in another meaning, or a step that goes against a written decision, becomes a question in the round.
- **Record along the way**, not at the end. When an answer settles a word, write it into the glossary at once and add the one line `domain-model` asks for. When an answer is a decision worth a record, add one question to the next round: "Record as a decision: <one line>?" On yes, write it.
- **The only files you may change** are the glossary, the glossary map and the `decisions/` folders. Everything else in `grill-me`'s "Change nothing" still holds.
- In the ending, replace step 3 with: what was written, one line per file.

If `grill-me` or `domain-model` is not installed next to this one, say so and give the install command: `npx skills add Darmikon/skills --skill grill-me --skill domain-model`.

Adapted from `grill-with-docs` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).
