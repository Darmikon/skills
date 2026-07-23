---
name: pr
description: Open a pull request for the current branch, or update the existing one — a single command that commits pending work, pushes, and generates the PR body from the diff, then runs the GitHub CLI. Use when the user asks to open/create a PR, "make a pull request", "pr this", "raise a PR", "update my PR", or "push and update the pull request". Invoke with /pr.
disable-model-invocation: true
---

# PR (open or update a pull request)

One command for the whole PR lifecycle on the current branch. It composes three sibling skills — **commit**, **push**, and **changelog** — and wires them to the GitHub CLI, choosing **create** or **update** automatically based on whether a PR already exists.

> **No AI attribution — ever.** Never put "Generated with Claude", a `Co-Authored-By` trailer, or any assistant signature in the PR title or body. The PR is the user's.

## Step 1: Preconditions and mode

```bash
git symbolic-ref -q HEAD >/dev/null || echo "STOP: detached HEAD — check out a branch first."
CURRENT=$(git rev-parse --abbrev-ref HEAD)
gh auth status >/dev/null 2>&1 || echo "STOP: GitHub CLI not authenticated — run 'gh auth login'."

# Default/base branch — same local-probe idiom as the other git skills (no network stall).
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
if [ -z "$DEFAULT" ]; then
  for c in main master; do
    git rev-parse --verify --quiet "origin/$c" >/dev/null && { DEFAULT=$c; break; }
    git rev-parse --verify --quiet "$c"        >/dev/null && { DEFAULT=$c; break; }
  done
fi
[ -z "$DEFAULT" ] && DEFAULT=main
[ "$CURRENT" = "$DEFAULT" ] && echo "STOP: you're on the default branch ($DEFAULT) — check out a feature branch to PR."

# Does an OPEN PR already exist for this branch?
EXISTING=$(gh pr view --json number,state,title,body 2>/dev/null)
```

- `EXISTING` empty, or its state isn't `OPEN` → **create** mode (Steps 2 → 3 → 4 → 5a).
- An open PR exists → **update** mode (Steps 2 → 3 → 5b).

## Step 2: Commit pending work (only if the tree is dirty)

```bash
git status --porcelain
```

If there are changes, craft the commit with the **commit** skill's process — analyze the diff, write a conventional message, show it, and commit on the user's approval. If the tree is clean, skip.

Then guard against an empty PR:

```bash
[ "$(git rev-list --count "origin/$DEFAULT"..HEAD 2>/dev/null)" = "0" ] && echo "STOP: no commits beyond $DEFAULT — nothing to PR."
```

## Step 3: Push

Push with the **push** skill: it sets the upstream on a first push and, if the remote moved on, rebases onto it and retries. The branch must be on the remote before a PR can point at it.

## Step 4: Generate the body from the diff

Produce the PR description with the **changelog** skill, run against `origin/$DEFAULT...HEAD` (branch vs base) — the emoji-sectioned summary. Derive a concise, imperative PR **title** from the changelog's title line (Technical format) or its one-line summary (Simple); fall back to the latest commit subject. Keep it short.

## Step 5a: Create the PR

```bash
gh pr create --base "$DEFAULT" --head "$CURRENT" --title "<title>" --body "<changelog body>"
```

Report the resulting PR URL.

## Step 5b: Update the existing PR

Always refresh the description — **but don't discard human value.** Regenerate the changelog body from the current diff (Step 4), then **carry over anything a person added** to the old body that isn't the mechanical change list: background/motivation, linked issues (`Closes #123`), migration notes, screenshots or demo links, reviewer checklists. Merge those into the new body; drop only the stale auto-generated change list.

```bash
NUM=$(gh pr view --json number -q .number)
gh pr edit "$NUM" --body "<regenerated body, with the useful old parts merged back in>"
# also --title "<new title>" only if the change set's headline actually shifted
```

Overwrite directly — the user does **not** want an old-vs-new diff prompt. Report the PR URL.

## Notes

- Create vs update is decided by `gh pr view` — no flags to remember.
- The destructive steps keep their own safety: **commit** shows the message before committing; **push** never force-pushes. `pr` only adds the `gh` calls and the create/update routing.
- Base is auto-detected; pass a different base explicitly if the user names one.

## Example

```
User: /pr
Assistant: No open PR for feature/checkout yet. Committing 2 pending files
           (feat(checkout): add promo-code field)… pushed.
           Built the description from the diff vs main. Opening PR…
           → https://github.com/you/repo/pull/42
```
