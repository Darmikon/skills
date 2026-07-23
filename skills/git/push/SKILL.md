---
name: push
description: Push the current branch; if the push is rejected because the remote moved on, integrate the remote commits by REBASE (never a merge), resolve any conflicts, and retry — looping until it lands. Use when the user asks to push, "push my changes", "push and rebase", "push keeps getting rejected", or after a plain push failed as non-fast-forward. Invoke with /push.
disable-model-invocation: true
---

# Push (rebase on reject, then retry)

Push the current branch. When someone else has pushed since you last fetched, git rejects your push as non-fast-forward. Rather than leaving the user to untangle it, this skill replays their commits **on top of** the new remote work by rebasing, resolves any conflicts, and pushes again — looping until it lands.

**Always rebase, never merge, when catching up.** Your local commits are replayed onto the updated remote, then the push fast-forwards — so it stays a clean linear history and needs **no force-push**. (This is the same reason teams set `pull.rebase true`; `git pull`'s default merge would add a "Merge branch" commit on every race.)

## Workflow

### Step 1: Sanity checks

A rebase needs a branch and a clean tree.

```bash
git symbolic-ref -q HEAD >/dev/null || echo "STOP: detached HEAD — check out a branch first."
CURRENT=$(git rev-parse --abbrev-ref HEAD)
[ -n "$(git status --porcelain)" ] && echo "STOP: uncommitted changes — commit or stash before pushing."
```

If either STOP fires, stop and tell the user why.

### Step 2: Push (setting upstream on a brand-new branch)

```bash
if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  git push
else
  git push -u origin "$CURRENT"   # first push of this branch — set its upstream
fi
```

If the push **succeeds**, you're done — report it and stop.

### Step 3: If rejected, decide why before looping

A push can be rejected for different reasons — only one of them is "rebase and retry":

- **Non-fast-forward** (`! [rejected] ... (fetch first)` / `(non-fast-forward)`): the remote has commits you don't. This is the case this skill handles → go to Step 4.
- **Anything else** — permission denied, protected branch, pre-receive hook, auth failure: do **not** rebase-loop. Report the actual error to the user and stop; rebasing won't help.

### Step 4: Integrate by rebase

```bash
git fetch origin
git rebase "origin/$CURRENT"
```

- **Clean** → go to Step 5.
- **Conflicts** → resolve each conflicted hunk by the **intent of both sides** (use the `resolving-merge-conflicts` skill if it's installed). If a conflict is genuinely ambiguous — you can't tell which side should win — **stop and ask the user** rather than guessing. Never `git rebase --abort` (that discards the integration). Then:
  ```bash
  git add <resolved files>
  git rebase --continue
  ```
  Repeat until the rebase completes, then go to Step 5.

### Step 5: Retry the push

```bash
git push
```

- **Success** → report: branch is up to date, N commits replayed on top of the latest remote. Stop.
- **Rejected again** (someone pushed while you were rebasing) → return to Step 4. Cap this at ~5 rounds; if it still won't land, stop and tell the user the remote is moving faster than the push can keep up — they may need to coordinate with whoever's pushing.

## Safety

- The retry push is an ordinary **fast-forward** — never `--force`. If git ever demands a force here, something rewrote *already-pushed* history; stop and investigate rather than forcing.
- This touches only the current branch and never force-pushes, so the worst case is a **stopped rebase you can inspect** — there is no silent history loss.

## Example

```
User: /push
Assistant: Pushed feature/checkout… rejected — remote has 2 new commits.
           Rebasing your 3 commits onto origin/feature/checkout… clean.
           Pushing again… done. feature/checkout is up to date: your 3 commits sit on top of the latest remote.
```
