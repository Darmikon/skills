---
name: git-merge
description: Merge the parent branch, or a branch you name, INTO the current branch to bring it up to date — with a preview and a confirmation step. Use when the user asks to merge main/parent into their branch, "bring in upstream changes", "catch my branch up", "merge origin/main", or update a feature branch via a merge commit (rather than a rebase). With no branch argument it infers the parent via the fork point. Invoke with /git-merge [branch].
disable-model-invocation: true
---

# Git Merge (parent or a named branch, into the current branch)

Bring another branch's changes **into** the current branch with a merge. This is the merge-commit alternative to `git-rebase`: same goal (get my branch current with its parent), different mechanic — history is preserved, not rewritten, so there's no force-push afterward.

Direction is fixed and deliberate: the target is merged **into** the current branch. This updates *your* branch. It never merges your branch into main — that's what pull requests are for.

Target selection:
- **Argument given** (`/git-merge main`) → merge that branch in.
- **No argument** → infer the *parent*: the branch this one most recently diverged from.

## Workflow

### Step 1: Confirm a clean working tree

A merge into a dirty tree can fail halfway or mix uncommitted work into conflict resolution.

```bash
git status --porcelain
```

If there's output, stop and ask the user to commit or stash first.

### Step 2: Identify current and default branch

```bash
CURRENT=$(git rev-parse --abbrev-ref HEAD)
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
[ -z "$DEFAULT" ] && DEFAULT=$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')
[ -z "$DEFAULT" ] && DEFAULT=main
```

### Step 3: Determine the target

If the user named a branch, use it. Otherwise infer the parent via the **fork point** — the branch whose divergence from `HEAD` is most recent (fewest commits between the common ancestor and `HEAD`):

```bash
best=""; best_ahead=2147483647
for ref in $(git for-each-ref --format='%(refname:short)' refs/heads refs/remotes \
             | grep -vxE "$CURRENT|origin/$CURRENT|origin/HEAD"); do
  mb=$(git merge-base "$ref" HEAD 2>/dev/null) || continue
  ahead=$(git rev-list --count "$mb"..HEAD)
  [ "$ahead" -eq 0 ] && continue                      # ref contains HEAD → child, not parent
  if [ "$ahead" -lt "$best_ahead" ]; then best_ahead=$ahead; best=$ref; fi
done
echo "Inferred parent: ${best:-<none found>}"
```

The smallest "ahead" count is the branch you left most recently — anything further upstream shares an older ancestor and a larger count. If nothing is found, fall back to `origin/$DEFAULT` and say so.

### Step 4: Fetch, then preview

```bash
git fetch --quiet --all --prune
TARGET=<the branch from Step 3>
git rev-parse --verify --quiet "origin/$TARGET" >/dev/null && TARGET_REF="origin/$TARGET" || TARGET_REF="$TARGET"

echo "About to merge '$TARGET_REF' INTO '$CURRENT'."
echo "Commits it will bring in:"
git log --oneline HEAD.."$TARGET_REF"
# Fast-forward or a real merge commit?
if git merge-base --is-ancestor HEAD "$TARGET_REF"; then
  echo "This will fast-forward (no merge commit)."
else
  echo "This will create a merge commit."
fi
```

If "Commits it will bring in" is empty, the branch is already up to date — say so and stop.

**Show this and get explicit confirmation before Step 5.**

### Step 5: Execute

```bash
git merge "$TARGET_REF"
```

### Step 6: Handle the outcome

- **Success**: report what came in (fast-forward or merge commit). No force-push needed — merging only adds history.
- **Conflict**: the merge stops with conflicts. Do **not** `git merge --abort`. Hand off to the **resolving-merge-conflicts** skill to resolve hunk by hunk, then finish with `git commit` to complete the merge.

## Example

```
User: /git-merge main
Assistant: Working tree clean. Merging origin/main INTO feature/checkout-redesign.
           Brings in 12 commits; creates a merge commit. Proceed?
User: go
Assistant: [runs git merge origin/main] Merged — 12 commits, one merge commit added. Branch is current with main.
```
