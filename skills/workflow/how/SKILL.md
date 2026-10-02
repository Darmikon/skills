---
name: how
description: 'Shortcut for /ask how: how one part of the code works (what it is, who uses it, the flow, where things live, gotchas), in the chat. /how to <task> also says where and how the new thing should go.'
argument-hint: '<part> · to <task>'
disable-model-invocation: true
---

<!-- how is now /ask how. Kept as a shortcut so the short name still works. -->

Read the `ask` skill's `SKILL.md` in the same skills folder as this skill, and follow it as if the user had typed `/ask how $ARGUMENTS`. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/how` → `/…/skills`); do not write `../ask`, since the base directory may be a link and `..` follows it elsewhere.

If the `ask` skill is not installed next to this one, say so and give the install command: `npx skills add Darmikon/skills --skill ask`.
