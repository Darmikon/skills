# fix docs

Make the documents true and easy to route: correct the false claims `scan docs` found, harvest finished plans, remove stale and repeated documents, sort the rest into `docs/`, and make `AGENTS.md` a lean routing file. This is what `better-docs` did; `/better-docs` is now a shortcut to this command.

This file adds the docs part to the rules in [../SKILL.md](../SKILL.md).

## Scope first

Before the plan, ask once: "The whole pass (correct, clean up, sort into `docs/`, slim `AGENTS.md`), or only correct the false claims?" Wait. A folder after `/fix docs` limits every part to that folder.

The core idea of the whole pass: `AGENTS.md` is read by agents on every task. It should be a short routing table, not a dump of everything. Details live in `docs/`, pulled in with `@path/to/file.md` pointers.

## The plan, part by part

The plan list has one heading per part below, in this order. Leave out a part with no lines.

### 1. Correct false claims

One line per false claim from the scan: the document and line, the old text and the new text, short, and the code fact it now matches. Check the claim against the code once more first. A claim the scan could not check is not corrected; list it after the plan.

### 2. Harvest finished plans

For each document the scan marked "plan done", before it is deleted:

- **Decisions:** if it explains why an approach was chosen, or what was rejected, one line that writes a short decision record in `docs/decisions/` (what was decided, why, what was rejected).
- **Architecture:** if it describes design, data models or how parts connect that are now in the code, one line that merges that into the matching file in `docs/architecture/`, written as the code is now, not as it was planned.
- **Then** one line that deletes the plan.

The test: "If a new developer joined tomorrow, would anything in here help them understand the system?" If yes, that part goes to `docs/architecture/` or `docs/decisions/`. Status updates, task lists and rollout steps are dropped.

### 3. Clean up

- **Repeats:** merge the better one into place, delete the other. One line each.
- **Stale:** rewrite to the current state only: remove done items, old status, struck text. Do not append "update:" notes. Update a `Last updated:` line if the document has one.
- **Empty or placeholder** documents: delete.

If you are unsure whether something is stale, do not plan its deletion: list it after the plan for the user to decide.

### 4. Sort into `docs/`

Move documents into this structure, creating only the folders that get a file:

```
docs/
├── plans/          # Active feature plans, roadmaps, migration strategies
├── architecture/   # System design, data flow, how parts connect
├── decisions/      # Decision records: why X over Y
├── guides/         # How-tos, onboarding, workflow
└── reference/      # API, config options, environment variables, glossary
```

| If the document is about… | It goes in… |
|---|---|
| What we build next, migration steps, a rollout | `docs/plans/` |
| How the system works, how parts connect, the data model | `docs/architecture/` |
| Why we chose X over Y | `docs/decisions/` |
| How to do something (setup, deploy, debug) | `docs/guides/` |
| API, config options, environment variables | `docs/reference/` |

One line per move: old path → new path. A project that already has its own documents layout keeps it: sort into that layout instead, and say so in the plan. Move with `git mv`. After the moves, every link and `@` pointer to a moved file is updated: say that as one line with the count.

### 5. Make `AGENTS.md` lean

**Stays in `AGENTS.md`:** the project in two or three sentences, the commands to get running, an architecture summary of five to ten lines, the rules that apply to every file, the routing table, and the project's policies.

**Moves out:** detailed architecture → `docs/architecture/`; feature plans → `docs/plans/`; setup guides longer than ten lines → `docs/guides/`; API details → `docs/reference/`; decision reasons → `docs/decisions/`.

The target shape:

```markdown
# Project Name

> One-line description.

Last updated: YYYY-MM-DD

## Project Overview
<!-- 2-3 sentences max. What it is, who it's for, the main stack. -->

## Quick Start
<!-- The bare minimum to get running. Just the commands. -->

## Architecture (Summary)
<!-- 5-10 lines max. Key parts and how they connect. -->
<!-- Details: @docs/architecture/<file>.md -->

## Conventions
<!-- Only the rules that apply to EVERY file. -->
<!-- Language- or area-specific rules go in that folder's AGENTS.md. -->

## Key Context Files

| When working on… | Read first |
|---|---|
| Database schema or migrations | `@docs/architecture/data-model.md` |
| API endpoints | `@docs/reference/api.md` |
| Deployment or CI | `@docs/guides/deploy.md` |
| A new feature | `@docs/plans/<active-plan>.md` |
| A trade-off or tech choice | `@docs/decisions/` |

## Project Policies
<!-- PR process, reviews, releases. -->

## Documentation Maintenance

When making significant changes:
1. Update the relevant doc in `docs/`, not `AGENTS.md`.
2. A new doc gets a row in Key Context Files; a deleted doc loses its row.
3. Rewrite to the current state; do not append updates.
```

In a monorepo, a package can have its own `AGENTS.md` that starts with `@../../AGENTS.md` and holds only what differs.

When the project keeps its instructions in `CLAUDE.md` rather than `AGENTS.md`, apply all of this to `CLAUDE.md`. Do not rename it, and do not make one point at the other unless the user asks.

One plan line per section that moves out, with where it goes. Show the target length.

## Checks

The checks in SKILL.md are for code; documents get these instead, after the changes:

- `AGENTS.md` (or `CLAUDE.md`) is under about 150 lines, not counting template comments.
- Every file in `docs/` is reachable: from the routing table or from another document.
- Nothing is repeated between `AGENTS.md` and `docs/`.
- Every `@` pointer and every relative link points at a file that exists (resolved from the document's own folder).
- Every corrected claim now matches the code: check each one again.

A failed check is fixed as part of the same approved change when it is one of its own loose ends (a link the move broke); otherwise it is reported.

## The report

Besides the report in SKILL.md: plans harvested and where their content went; files deleted, with the reason; files moved, old → new; files rewritten and what changed; what left `AGENTS.md` and what stayed; anything flagged for the user; and the final routing table.
