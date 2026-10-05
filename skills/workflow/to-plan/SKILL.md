---
name: to-plan
description: 'Shortcut for superpowers writing-plans: turn a spec (or a clear task) into a step-by-step implementation plan in docs/superpowers/plans/.'
argument-hint: '[spec file or task]'
disable-model-invocation: true
---

<!-- A short name for superpowers' writing-plans, to sit next to to-questionnaire. -->

Start the `writing-plans` skill from superpowers (`superpowers:writing-plans` when it comes as a plugin) with the Skill tool, passing `$ARGUMENTS`, and follow it.

Without an argument, take the newest spec in `docs/superpowers/specs/` that has no plan of the same name in `docs/superpowers/plans/`, say which one in one line, and go on. If there is none, ask what to plan, and stop.

If `writing-plans` is not installed, say so and give the install command: `npx skills add obra/superpowers --skill writing-plans`.
