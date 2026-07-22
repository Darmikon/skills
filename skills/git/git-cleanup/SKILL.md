---
name: git-cleanup
description: Delete stale local git branches — ones whose remote was deleted after a merged or squashed PR (upstream "[gone]"), ones already merged into the default branch — and prune stale remote-tracking refs. Use when the user asks to clean up branches, remove old/dead/merged branches, "prune gone branches", tidy up their local repo, or says their branch list is a mess. Always previews and asks before deleting; never touches the current or default branch. Invoke with /git-cleanup.
disable-model-invocation: true
---

# Git Cleanup (prune stale local branches)

Remove local branches that have outlived their purpose. Two things pile up:

1. **Gone branches** — you opened a PR, it got merged (often *squash*-merged), the remote branch was deleted, but your local copy lingers. Git marks its upstream `[gone]`. Squash-merges are the common case and matter because they do **not** show up as "merged" to git — the squashed commit has a different hash — so `--merged` alone misses them.
2. **Merged branches** — branches whose commits are already in the default branch by normal (non-squash) merge.

Deleting branches is destructive, so this skill **previews everything and waits for confirmation**, and it will never delete the branch you're on or the default branch.

## Workflow

### Step 1: Prune remotes first

`--prune` drops remote-tracking refs (`origin/old-thing`) whose branches were deleted upstream — that's what makes local branches show as `[gone]`.

```bash
git fetch --all --prune
```

### Step 2: Identify the branches to protect

```bash
CURRENT=$(git rev-parse --abbrev-ref HEAD)
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
[ -z "$DEFAULT" ] && DEFAULT=$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')
[ -z "$DEFAULT" ] && DEFAULT=main
```

The current branch, the default branch, and `master`/`main` are never candidates — exclude them from every list below.

### Step 3: Find gone branches (upstream deleted)

```bash
git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads \
  | awk '$2=="[gone]"{print $1}' \
  | grep -vxE "$CURRENT|$DEFAULT|main|master"
```

For each, note whether git also considers it merged — this decides safe vs. force delete later:

```bash
# merged into default? (safe) — otherwise it was squash-merged and needs a force delete
git branch --merged "$DEFAULT" --format='%(refname:short)'   # list of "safe" branches
```

### Step 4: Find merged branches (not necessarily gone)

```bash
git branch --merged "$DEFAULT" --format='%(refname:short)' \
  | grep -vxE "$CURRENT|$DEFAULT|main|master"
```

### Step 5: Preview, grouped and honest about risk

Present two groups, de-duplicated. For each branch show why it's a candidate. Example:

```
Safe to delete (merged into main):
  chore/bump-deps
  docs/readme-tidy

Gone from remote — SQUASH-merged, not "merged" to git (needs force delete -D):
  feature/checkout-redesign   ⚠ verify this really landed in the PR before deleting
  bugfix/null-price-crash     ⚠
```

Anything that is **`[gone]` but not merged** is the only real risk: if the PR wasn't actually merged (closed without merging, or you're mid-work), a `-D` throws the commits away. Call these out individually and make the user confirm them explicitly — don't bundle them into a blanket "delete all".

### Step 6: Delete, after confirmation

- Merged / safe branches — `-d` refuses if git disagrees, so it's self-protecting:
  ```bash
  git branch -d <branch>
  ```
- Gone-but-squash-merged branches — require `-D` (force). Only after the user confirms *these specific branches*:
  ```bash
  git branch -D <branch>
  ```

Never pipe the whole list into `-D` blindly. Delete the safe ones freely; force-delete only what the user OK'd by name.

### Step 7: Report

List what was deleted and what was kept (and why anything was skipped — e.g. "kept feature/x: gone from remote but has unmerged commits, wasn't confirmed").

## Example

```
User: /git-cleanup
Assistant: Pruned remotes. Found:
           Safe (merged into main): chore/bump-deps, docs/readme-tidy
           Gone/squash-merged (need force delete): feature/checkout-redesign
           I'll delete the two safe ones. For feature/checkout-redesign — its PR looks squash-merged,
           but force-delete drops its 3 local commits. Confirm that one?
User: yes all
Assistant: Deleted chore/bump-deps, docs/readme-tidy (-d), feature/checkout-redesign (-D). Kept main and your current branch.
```
