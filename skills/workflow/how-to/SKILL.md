---
name: how-to
description: 'Shortcut for /how to <task>: how the code around a task works, and where and how the new thing should go. Needs the how skill next to it.'
argument-hint: '<what to add or change>'
disable-model-invocation: true
---

Read `SKILL.md` in the `how` skill folder next to this skill's folder, and follow it as if the user had typed `/how to $ARGUMENTS`.

If there is no `how` folder next to this one, say that `how-to` needs the `how` skill installed with it (`npx skills add Darmikon/skills --skill how`), and stop.
