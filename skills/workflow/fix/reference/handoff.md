# fix security · fix performance · fix architecture

These three change how the code works: login checks, indexes, paging, modules. A plan line per finding is not enough for that, so they do not change code here. They hand the findings to a design step.

Steps 1 (the findings) in [../SKILL.md](../SKILL.md) apply. Steps 2 to 5 do not: there is no plan list, no change and no check here.

## 1. Choose what to hand over

Show the findings from the scan as a short numbered list (title and rank), the scan's top pick first. Ask: "Which ones do we design a fix for? A number, several, or all." Wait.

For `performance`, a finding the scan measured as "not confirmed" is left out unless the user names it.

## 2. Hand over

Write the chosen findings to `<tmp>/fix-<command>-<timestamp>.json`, in the same shape as the scan's findings file, with only the chosen ones.

Then:

- **If the `brainstorming` skill is available** (superpowers): call it with the Skill tool. Pass as its topic: the command, the project, the path of that file and of the scan's page, and one line per chosen finding (title, rank, places). Say that the findings come from `/scan <command>` and must be checked against the code first. From there `brainstorming` runs the talk with its own rules: design, approval, spec, plan.
- **If it is not:** do the planning here. Read the chosen findings and the code they point at, propose two or three ways to fix them with their cost, recommend one, and when the user agrees, write the plan as a numbered list of steps in the chat. Do not change code before the user approves that plan.

## 3. The ending

Say which findings went to the design step, and where their file is.
