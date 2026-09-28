---
name: update-plans
description: 'The plan changed in the middle of the work: bring the superpowers spec and plan in line with the new decision, together. Shows every edit first, writes after one yes. Never touches code.'
argument-hint: '<what changed>'
disable-model-invocation: true
---

# update-plans

The user changed their mind in the middle of the work: "do it with Y, not with X". The spec from `brainstorming` and the plan from `writing-plans` still say X. Bring both in line with the new decision, so that they agree with each other again, and so that the work can go on from the plan.

You change only these two documents. You do not touch code. You do not commit.

## What changed

The change is what the user wrote after `/update-plans`. If they wrote nothing, ask what changed, and stop. Do not guess it from the conversation, and do not run a check of the documents instead: that is not what this skill is for.

## 1. Find the documents

The superpowers skills save them here by default:

- the spec: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- the plan: `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`

Take the pair for this work. Match by topic, by the branch name, by the files that this branch changed, and by the conversation. Say in one line which files you took.

If two pairs fit, or none fits, or the folders are empty, ask where the documents are, and stop. The project may keep them somewhere else. Work with one of the two only when the user says that there is only one.

## 2. Find everything that the change touches

Read both documents to the end. Then find each place that is now wrong:

- a decision in the spec, and the reasons that led to it;
- a requirement, or an example of how the thing must behave;
- a step in the plan: its files, its code, its test, its command;
- a step that is no longer needed, and a step that is now missing.

Look in both directions. A change to a late step can make an early decision wrong, and a change to the spec can make many steps wrong. Keep the order and the style of each document.

**Steps that are already done.** A step marked `- [x]` stays as it is, with its mark. If the change makes it wrong, add a new step right after it: `- [ ] Rework: <what to change, and why>`, written with the same detail as the other steps (files, code, test, command). The work that was done stays visible, and the next run of the plan picks up the new step.

**If the change is too big.** When the whole idea changes, and not one part of it, a patched plan is worse than a new one. Do not patch. Say so, recommend starting again with the `brainstorming` skill, and ask.

## 3. Show all edits at once

One list, grouped by file. For each edit:

- where: the section or the step number;
- was --> now, short;
- why, in one line.

Then list the new `Rework:` steps and the steps that you remove. Ask one question: write these edits? The user can say yes, or name the edits to drop or change. Then show the list again only if it changed much.

A yes to this list covers only this list.

## 4. Write

Make exactly the edits that the user agreed to. Change nothing else in the documents, and no other file.

End with one line: which files changed, how many edits, how many new `Rework:` steps. Say that nothing is committed.
