---
name: git-rebase
description: Rebase the current branch onto its parent branch, or onto a branch you name, with a preview and a confirmation step before any history is rewritten. Use when the user asks to rebase, "rebase onto main", "rebase on parent", update/refresh/catch-up a feature branch, replay commits on top of another branch, or make history linear. With no branch argument it infers the parent via the fork point. Invoke with /git-rebase [branch].
disable-model-invocation: true
---

# Git Rebase (onto parent or a named branch)

Rebase the current branch onto a target and **replay** this branch's commits on top of it. Because rebasing rewrites history, this skill always shows what will happen and waits for a yes before touching anything.

Target selection:
- **Argument given** (`/git-rebase main`, `/git-rebase feature/base`) → rebase onto that branch.
- **No argument** → infer the *parent*: the branch this one most recently diverged from. This is what "rebase onto my parent" means when branches are stacked, not just branched off main.

## Workflow

### Step 1: Confirm a clean working tree

Rebase refuses to run with uncommitted changes, and half-stashed state causes confusion. Check first:

```bash
git status --porcelain
```

If there's output, stop and tell the user to commit or stash first. Offer `git stash` — but don't stash silently; losing track of a stash is its own headache.

### Step 2: Identify current branch and default branch

```bash
# Rebase needs a real branch — bail out if HEAD is detached.
git symbolic-ref -q HEAD >/dev/null || echo "STOP: detached HEAD — check out a branch first."
CURRENT=$(git rev-parse --abbrev-ref HEAD)
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
[ -z "$DEFAULT" ] && DEFAULT=$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')
[ -z "$DEFAULT" ] && DEFAULT=main
```

### Step 3: Determine the target

If the user passed a branch, use it as `TARGET` and skip to Step 4.

Otherwise infer the parent. Git has no native "parent branch", so use the **fork point**: among all other branches, the parent is the one whose divergence from `HEAD` is most recent — i.e. the fewest commits sit between their common ancestor and `HEAD`.

```bash
# 0) Base ref for the default branch (prefer the fresh remote one).
git rev-parse --verify --quiet "origin/$DEFAULT" >/dev/null && BASE="origin/$DEFAULT" || BASE="$DEFAULT"

if [ "$(git rev-list --count "$BASE"..HEAD 2>/dev/null)" = "0" ]; then
  # No commits of your own beyond the default → the default IS the base; a rebase is a no-op.
  PARENT="$BASE"; echo "Note: '$CURRENT' has no commits beyond $BASE — nothing to rebase."
else
  # 1) Strongest signal: the recorded creation point (empty on fresh clones; often "HEAD" — skip that).
  PARENT=$(git reflog show "$CURRENT" 2>/dev/null \
           | sed -n 's/.*branch: Created from \(.*\)$/\1/p' | grep -vFx HEAD | head -1)
  # 2) Fallback: smallest "ahead" by merge-base, ties broken TOWARD the default so a sibling never wins.
  if [ -z "$PARENT" ]; then
    best=""; best_ahead=2147483647
    for ref in $(git for-each-ref --format='%(refname:short)' refs/heads refs/remotes \
                 | grep -vFx -e "$CURRENT" -e "origin/$CURRENT" -e "origin/HEAD"); do
      mb=$(git merge-base "$ref" HEAD 2>/dev/null) || continue
      ahead=$(git rev-list --count "$mb"..HEAD)
      [ "$ahead" -eq 0 ] && continue                   # ref contains HEAD → a descendant
      if [ "$ahead" -lt "$best_ahead" ]; then
        best=$ref; best_ahead=$ahead
      elif [ "$ahead" -eq "$best_ahead" ] && { [ "$ref" = "$DEFAULT" ] || [ "$ref" = "origin/$DEFAULT" ]; }; then
        best=$ref                                      # tie → prefer default over a sibling
      fi
    done
    PARENT=$best
  fi
  # Still nothing → the default branch.
  [ -z "$PARENT" ] && PARENT="$BASE"
fi
echo "Inferred parent: $PARENT"
```

Reflog is checked first because it records the branch you actually forked from. When it's empty (fresh clones) or only says "HEAD", the merge-base heuristic takes over: the smallest "ahead" count is the branch you left most recently. Ties are broken toward the default branch — two feature branches cut from the same base tie *exactly*, and you almost never mean to rebase onto a **sibling**.

Even so, treat the inferred parent as a **best guess** — it is exactly why Step 4 previews it and waits for your confirmation before anything runs. When in doubt, pass the branch explicitly.

### Step 4: Prefer the fresh remote ref, then preview

Rebase onto the up-to-date target, not a stale local copy.

```bash
git fetch --quiet --all --prune
TARGET=<the branch from Step 3>
# Use the remote-tracking ref if it exists, else the local branch
git rev-parse --verify --quiet "origin/$TARGET" >/dev/null && TARGET_REF="origin/$TARGET" || TARGET_REF="$TARGET"

echo "About to rebase '$CURRENT' onto '$TARGET_REF'."
echo "Commits that will be replayed:"
git log --oneline "$(git merge-base "$TARGET_REF" HEAD)"..HEAD
echo "New commits coming from '$TARGET_REF':"
git log --oneline HEAD.."$TARGET_REF"
```

**Show this to the user and get explicit confirmation before Step 5.** Name the target and the commit count plainly ("Rebase your 4 commits onto origin/main — 12 new commits underneath. Go?").

### Step 5: Execute

```bash
git rebase "$TARGET_REF"
```

### Step 6: Handle the outcome

- **Success**: report it. If `$CURRENT` was already pushed, the remote now diverges — history was rewritten. Tell the user and print (do **not** run) the safe force-push:
  ```bash
  git push --force-with-lease
  ```
  `--force-with-lease` refuses to clobber commits you haven't seen, unlike a bare `--force`.
- **Conflict**: rebase stops mid-way. Do **not** `git rebase --abort` — that throws away the work. Hand off to the **resolving-merge-conflicts** skill to work through the hunks by intent, then finish with `git rebase --continue`.

## Example

```
User: /git-rebase
Assistant: Working tree clean. Inferred parent: origin/feature/checkout-base (3 commits ahead).
           Rebasing your 3 commits onto origin/feature/checkout-base (fetched, 5 new commits underneath). Proceed?
User: yes
Assistant: [runs git rebase origin/feature/checkout-base] Done — 3 commits replayed cleanly.
           This branch is pushed, so the remote history differs now. To update it:
             git push --force-with-lease
```
