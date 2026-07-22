---
name: git-show-my-branches
description: Show the git branches the current user has been working on — branches carrying their own unique commits (matched by git email) from the last month, not yet merged into the default branch, newest first, as a table. Use whenever the user asks to "show my branches", "list my branches", "what branches did I work on", "my recent branches", "what was I working on", "where did I leave off", or "which branches are mine" — in any repository.
---

# Show My Branches

List the branches where the current user has **unique commits** (commits not already on the default branch) within the last month. This answers "what have I been working on lately?" without the user having to remember branch names.

Why unique commits and not just "branches I touched": a branch that's fully merged into main is finished business. What the user usually wants is their *in-flight* work — branches that still carry commits of their own.

## Workflow

### Step 1: Get the current user's email

Match by email rather than display name — names vary between machines and configs, emails are stable.

```bash
GIT_EMAIL=$(git config user.email)
echo "Author: $GIT_EMAIL"
```

If this is empty, tell the user their `git config user.email` isn't set and stop — nothing will match.

### Step 2: Detect the default branch

Don't assume `main` — older repos use `master`, some use `develop`.

```bash
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
[ -z "$DEFAULT" ] && DEFAULT=$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')
[ -z "$DEFAULT" ] && DEFAULT=main
echo "Default branch: $DEFAULT"
```

### Step 3: Refresh remotes

So the list reflects reality, not a stale local view.

```bash
git fetch --all --prune
```

### Step 4: Find the user's branches with unique commits

`--source` (`%S`) reports which branch ref each commit is reachable from, so a single log walk covers every branch — no per-branch looping. `--branches --remotes` includes your **local unpushed** branches too, not just remote-tracking ones, so in-flight work you haven't pushed still shows up. The base exclusion drops anything already on the default branch; if the repo has no `origin` (local-only), it's skipped rather than erroring.

```bash
# Resolve a base to exclude — prefer the fresh remote default, tolerate a local-only repo.
git rev-parse --verify --quiet "origin/$DEFAULT" >/dev/null && BASE="origin/$DEFAULT" \
  || { git rev-parse --verify --quiet "$DEFAULT" >/dev/null && BASE="$DEFAULT" || BASE=""; }

# Keep the two forms separate: an optional "--not <base>" stuffed into a var would ride in as a
# single un-split word under zsh (which doesn't word-split $variables) and break git.
if [ -n "$BASE" ]; then
  git log --branches --remotes --source --not "$BASE" \
    --since="1 month ago" --author="$GIT_EMAIL" --format="%as %S" \
    | awk '!seen[$2]++ {print}' | sort -r -k1
else
  git log --branches --remotes --source \
    --since="1 month ago" --author="$GIT_EMAIL" --format="%as %S" \
    | awk '!seen[$2]++ {print}' | sort -r -k1
fi
```

Each line is `YYYY-MM-DD <ref>` — `origin/<branch>` for pushed work, a plain `<branch>` for local-only — one row per branch, dated by its most recent commit, newest first.

### Step 5: Present a clean table

Strip the `origin/` prefix. Example:

```
| Branch                       | Last commit |
|------------------------------|-------------|
| feature/checkout-redesign    | 2026-07-19  |
| bugfix/null-price-crash       | 2026-07-11  |
| spike/offline-cache           | 2026-06-30  |
```

### Step 6: Summarize

State the total count. If nothing came back, say no unique contributions were found in the last month and suggest checking `git config user.email` — a mismatched email is the usual cause.

## Notes

- Read-only — this skill never modifies anything, so it's safe to run any time.
- Adjust the window if the user asks (e.g. `--since="3 months ago"`).
- This is the generic version. A repo with its own deploy-branch conventions (e.g. `env*`/`staging*` branches full of merge commits) may want those filtered out — add a `grep -vE` on the branch name for that repo only.
