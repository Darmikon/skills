# domain-model

## Goal

The project's words and big decisions, written down while we work, so that `ask`, `scan` and every later session use the same words and do not re-suggest what was already decided. Adapted from Matt Pocock's `domain-modeling` (MIT).

## Decided

- **The model decides when.** The skill is model-invoked; the user is not asked about trifles.
- **Words are written without asking**, with one line at the end of the reply. **A decision is recorded after one yes/no question**: only when it is hard to undo, odd without its reason and a real choice. A proposal turned down for a lasting reason counts.
- **Everything under `docs/`**, nothing at the project root: `docs/glossary.md`, `docs/decisions/NNNN-slug.md`.
- **Projects of any size from the start**: `docs/glossary-map.md` lists the parts; each part has `<part>/docs/glossary.md` and `<part>/docs/decisions/`; whole-project decisions stay in the root `docs/decisions/`. A project starts with one glossary and is split after one question, when a word means different things in two parts.
- **Read-only skills keep their promise**: while `ask`, `scan`, `explore` or `verify` run, nothing is written; the words come as one line at their end, recorded after a yes.
- No commits: the files are ordinary changes in the user's work.

## Changes elsewhere

- `ask` ("The project's words", `how`, `zoom-out`, `why`) and `scan` read the glossary and decisions first. `why` counts a decision record as a Found claim.
- `scan architecture` does not report what a decision chose on purpose, and offers to record a turned-down candidate's reason.
