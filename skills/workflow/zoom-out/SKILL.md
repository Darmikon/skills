---
name: zoom-out
description: 'Shortcut for /ask zoom-out: step back one level and map the parts around a place and who calls it, in the project''s own words.'
argument-hint: '[area]'
disable-model-invocation: true
---

<!-- zoom-out is now /ask zoom-out. Kept as a shortcut so the short name still works. -->

Read the `ask` skill's `SKILL.md` in the same skills folder as this skill, and follow it as if the user had typed `/ask zoom-out $ARGUMENTS`. The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/zoom-out` → `/…/skills`); do not write `../ask`, since the base directory may be a link and `..` follows it elsewhere.

If the `ask` skill is not installed next to this one, say so and give the install command: `npx skills add Darmikon/skills --skill ask`.
