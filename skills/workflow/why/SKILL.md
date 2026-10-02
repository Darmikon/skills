---
name: why
description: 'Shortcut for /ask why: what led to the shape of the code, from history, pull requests, tickets and docs, each claim marked found, converging, guessed or unknown. In the chat.'
argument-hint: '<code, file or question>'
disable-model-invocation: true
---

<!-- why is now /ask why. Kept as a shortcut so the short name still works. -->

Read the `ask` skill's `SKILL.md` in the same skills folder as this skill, and follow it as if the user had typed `/ask why $ARGUMENTS`. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/why` → `/…/skills`); do not write `../ask`, since the base directory may be a link and `..` follows it elsewhere.

If the `ask` skill is not installed next to this one, say so and give the install command: `npx skills add Darmikon/skills --skill ask`.
