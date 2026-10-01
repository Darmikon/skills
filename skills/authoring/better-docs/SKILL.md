---
name: better-docs
description: 'Shortcut for /fix docs: correct the false claims in the documents, harvest finished plans, remove stale and repeated documents, sort them into docs/, and make AGENTS.md a lean routing file, after a numbered plan the user approves. Kept so the old name still works.'
argument-hint: '[folder]'
disable-model-invocation: true
---

<!-- better-docs is now /fix docs. Kept as a shortcut so the old name still works. -->

Read the `fix` skill's `SKILL.md` in the same skills folder as this skill, and follow it as if the user had typed `/fix docs $ARGUMENTS`.

The skills folder is this skill's base directory with its last name cut off as text (`/…/skills/better-docs` → `/…/skills`), so the file is `/…/skills/fix/SKILL.md`. Do not write `../fix`: the base directory may be a link, and `..` follows it into another folder.

If the `fix` skill is not installed next to this one, say so and give the install command: `npx skills add Darmikon/skills --skill fix --skill scan`.
