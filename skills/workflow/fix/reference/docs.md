# fix docs

Make the documents true and easy to route. `/better-docs` is a shortcut to this command.

## Scope first

Before looking for a scan, ask: "The whole pass (correct, clean up, sort into `docs/`, slim `AGENTS.md`), or only correct the false claims?" Wait. A folder after `/fix docs` limits every part to it.

## The plan, part by part

One heading per part, in this order; leave out a part with no lines.

### 1. Correct false claims

Per claim, after checking it against the code once more: the document and line, old and new text, the code fact it now matches. A claim the scan could not check is listed after the plan, not corrected.

### 2. Harvest finished plans

For each "plan done" document, before deleting it:

- **Decisions** (why an approach was chosen, what was rejected) → a short record in `docs/decisions/`.
- **Architecture** now in the code → merged into the matching `docs/architecture/` file, written as the code is now.
- **Then** one line that deletes the plan. Status updates, task lists and rollout steps are dropped.

### 3. Clean up

- **Repeats:** merge the better one into place, delete the other.
- **Stale:** rewrite to the current state, no "update:" notes; update a `Last updated:` line if there is one.
- **Empty or placeholder:** delete.

Unsure whether something is stale: list it after the plan for the user; do not plan its deletion.

### 4. Sort into `docs/`

Create only the folders that get a file:

```
docs/
├── plans/          # Active feature plans, roadmaps, migration strategies
├── architecture/   # System design, data flow, how parts connect
├── decisions/      # Decision records: why X over Y
├── guides/         # How-tos, onboarding, workflow (setup, deploy, debug)
└── reference/      # API, config options, environment variables, glossary
```

One line per move: old path → new path, with `git mv`. A project with its own documents layout keeps it: sort into that, and say so. One line, with the count, for updating every link and `@` pointer to a moved file.

### 5. Make `AGENTS.md` lean

Moves out: detailed architecture → `docs/architecture/`; feature plans → `docs/plans/`; setup guides over ten lines → `docs/guides/`; API details → `docs/reference/`; decision reasons → `docs/decisions/`. What stays follows the target shape:

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

In a monorepo, a package's own `AGENTS.md` starts with `@../../AGENTS.md` and holds only what differs.

Instructions kept in `CLAUDE.md` get all this there; do not rename it or make one file point at the other unless the user asks.

One plan line per section that moves out, with where it goes. Show the target length.

## Checks

Instead of the code checks, after the changes (only the last two for "only correct the false claims"):

- `AGENTS.md` (or `CLAUDE.md`) is under about 150 lines, not counting template comments.
- Every file in `docs/` is reachable from the routing table or another document.
- Nothing is repeated between `AGENTS.md` and `docs/`.
- Every `@` pointer and relative link (resolved from the document's own folder) points at a file that exists.
- Every corrected claim now matches the code.

A failed check that is a loose end of an approved change (a link the move broke) is fixed in that change; otherwise it is reported.

## The report

Also: plans harvested and where their content went; files deleted, with the reason; files moved, old → new; files rewritten and what changed; what left `AGENTS.md` and what stayed; anything flagged for the user; the final routing table.
