---
name: how-to
description: 'Shortcut for /ask how to <task>: how the code around a task works, and where and how the new thing should go.'
argument-hint: '<what to add or change>'
disable-model-invocation: true
---

<!-- how-to is now /ask how to. Kept as a shortcut so the short name still works. -->

Read the `ask` skill's `SKILL.md` in the same skills folder as this skill, and follow it as if the user had typed `/ask how to $ARGUMENTS`. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/how-to` → `/…/skills`); do not write `../ask`, since the base directory may be a link and `..` follows it elsewhere.

If the `ask` skill is not installed next to this one, say so and give the install command: `npx skills add Darmikon/skills --skill ask`.
