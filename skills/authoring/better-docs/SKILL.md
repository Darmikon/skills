---
name: better-docs
description: >
  Optimize repository documentation and make AGENTS.md a lean routing file. Use this skill whenever:
  the user wants to clean up project docs, reorganize documentation, audit AGENTS.md, reduce AGENTS.md bloat,
  move detailed content into docs/, create a docs/ structure, harvest decisions from old plans,
  write ADRs from implemented features, deduplicate documentation, remove stale docs,
  or any request involving "clean up docs", "optimize AGENTS.md", "docs audit", "documentation maintenance",
  "organize my docs", "lean AGENTS.md", "better docs", "doc inventory", "docs restructure".
  Also trigger when the user says things like "my AGENTS.md is too long", "docs are a mess",
  "where should this doc go", or "make AGENTS.md smaller".
---

# Better Docs

Post-scaffold maintenance pass for repository documentation. Takes an existing `AGENTS.md` and docs, makes `AGENTS.md` a lean routing file, and organizes detailed content into `docs/`.

The core idea: `AGENTS.md` is read by agents on every task. It should be a fast-to-parse routing table, not a dump of everything. Detailed docs live in `docs/` and are referenced via `@path/to/file.md` pointers.

## How This Skill Works

This is a 6-phase process. Execute phases in order. Each phase builds on the previous one.

Before starting, confirm with the user:
1. Which repo to work on (get the path)
2. Whether they want a full pass (all 6 phases) or a targeted cleanup

---

## Phase 1: Inventory

Scan the full repo. Read every documentation file — don't just list them.

For each doc file (`.md`, `.txt`, `.rst`), record:

| Field | How to determine |
|---|---|
| **Path** | File location in the repo |
| **Purpose** | Read the file — summarize in one line what it covers |
| **Last touched** | Check git history for the last meaningful commit (not just formatting) |
| **Stale?** | Compare content against current code — does it reference removed features, old dates, completed migrations, or contradict what's actually in the repo? |
| **Duplicated?** | Does another file cover the same topic? Note the overlap |

Skip `node_modules/`, `.git/`, `vendor/`, `dist/`, `build/`, and other dependency/output directories.

Present the inventory to the user as a table before proceeding.

---

## Phase 2: Clean Up

### Harvest implemented plans before removing them

Plans that have been fully implemented still contain valuable context. Before deleting:

1. **Extract decisions** — If the plan explains why an approach was chosen or trade-offs that were made, capture that as an ADR in `docs/decisions/`. Keep it brief: what was decided, why, and what alternatives were rejected.
2. **Extract architecture** — If the plan describes system design, data models, or component relationships that are now part of the codebase, merge that content into the relevant file in `docs/architecture/`. Update it to reflect how things actually landed, not how they were planned.
3. **Then delete the plan** — Once the durable knowledge is captured elsewhere, remove the plan file.

Quick test: "If a new developer joined tomorrow, would anything in here help them understand the system?" If yes, that piece belongs in `docs/architecture/` or `docs/decisions/`. Everything else (status updates, task lists, rollout steps) gets dropped.

### Delete

- Implemented plans — after harvesting per above
- Duplicates — merge the better one, delete the other
- Empty or placeholder files with no real content

### Rewrite, don't append

For any doc that's partially stale:
- Remove completed items, old status updates, struck-through text
- Rewrite to reflect current state only
- Update `Last updated:` to today's date

**Rule:** If you're unsure whether something is stale, flag it for human review — don't delete it.

---

## Phase 3: Organize into `docs/`

Move files into this structure. Create directories only as needed — don't scaffold empty folders.

```
docs/
├── plans/          # Active feature plans, roadmaps, migration strategies
├── architecture/   # System design, data flow, component diagrams
├── decisions/      # ADRs (architecture decision records)
├── guides/         # How-tos, onboarding, workflow docs
└── reference/      # API docs, config reference, glossary
```

### Sorting rules

| If the doc is about... | It goes in... |
|---|---|
| What we're building next, migration steps, rollout plan | `docs/plans/` |
| How the system works, component relationships, data model | `docs/architecture/` |
| Why we chose X over Y, trade-off analysis | `docs/decisions/` |
| How to do something (setup, deploy, debug) | `docs/guides/` |
| API surface, config options, environment variables | `docs/reference/` |

After moving, update all cross-references and links in other docs.

---

## Phase 4: Make AGENTS.md Lean

`AGENTS.md` should be a routing table with context, not a copy of every doc.

### What stays in AGENTS.md

- Project overview (2-3 sentences max)
- Quick start commands (bare minimum to get running)
- Architecture summary (5-10 lines max)
- Universal conventions (rules that apply to EVERY file)
- The routing table (the key piece)
- Project policies

### What moves OUT of AGENTS.md

- Detailed architecture → `docs/architecture/`
- Feature plans → `docs/plans/`
- Setup guides longer than 10 lines → `docs/guides/`
- API documentation → `docs/reference/`
- Decision rationale → `docs/decisions/`

### Target structure

```markdown
# Project Name

> One-line description.

Last updated: YYYY-MM-DD

## Project Overview
<!-- 2-3 sentences max. What it is, who it's for, primary tech stack. -->

## Quick Start
<!-- Bare minimum to get running. No explanations — just the commands. -->

## Architecture (Summary)
<!-- 5-10 lines max. Key components and how they connect. -->
<!-- For details: @docs/architecture/<relevant-file>.md -->

## Conventions
<!-- Only the rules that apply to EVERY file in the repo. -->
<!-- Language/domain-specific conventions go in subdirectory AGENTS.md files. -->

## Key Context Files

| When working on... | Read first |
|---|---|
| Database schema or migrations | `@docs/architecture/data-model.md` |
| API endpoints | `@docs/reference/api.md` |
| Auth or permissions | `@docs/architecture/auth.md` |
| Deployment or CI/CD | `@docs/guides/deploy.md` |
| A new feature | `@docs/plans/<active-plan>.md` |
| Trade-off or tech choice | `@docs/decisions/` |

<!-- Add rows as docs are created. Remove rows when docs are deleted. -->

## Project Policies
<!-- Team-specific rules: PR process, review requirements, release cadence. -->

## Documentation Maintenance

When making significant changes:
1. Update the relevant doc in `docs/`, not `AGENTS.md`
2. If a new doc is created, add a row to Key Context Files
3. If a doc is deleted, remove its row
4. Rewrite content to reflect current state — don't append updates
```

### The `@` reference pattern

Use `@path/to/file.md` syntax so agents know to pull in that file when relevant. Every path in the routing table should use this prefix.

For monorepo subdirectories, each package can have its own `AGENTS.md`:

```markdown
<!-- packages/api/AGENTS.md -->
@../../AGENTS.md

## API-Specific Conventions
<!-- Only what differs from or extends the root conventions. -->
```

---

## Phase 5: Validate

After reorganizing, verify all of these:

- [ ] `AGENTS.md` is under ~150 lines (not counting template comments)
- [ ] Every file in `docs/` is referenced from the routing table or another doc
- [ ] No orphaned docs — nothing in `docs/` that isn't reachable
- [ ] No duplicated content between `AGENTS.md` and files in `docs/`
- [ ] All `@` references point to files that exist
- [ ] `CLAUDE.md` contains only `@AGENTS.md` (if it exists)
- [ ] `Last updated` dates are current on all modified files

---

## Phase 6: Report

Provide the user with:

1. **Plans harvested** — which plans were processed, what decisions/architecture were extracted, and where that content now lives
2. **Files deleted** — with reason (implemented plan, stale, duplicate, empty)
3. **Files moved** — old path → new path
4. **Files rewritten** — what changed and why
5. **AGENTS.md diff summary** — what was removed vs. kept
6. **Flagged for review** — anything you weren't sure about
7. **Routing table** — the final Key Context Files table
