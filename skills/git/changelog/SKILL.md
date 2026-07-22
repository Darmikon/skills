---
name: changelog
description: Generate PR changelogs by analyzing git diff between current branch and base branch, formatted with emojis in markdown. Use when user asks to create/write/generate a changelog, PR description, review changes for pull request, or mentions PR summary.
---

# PR Changelog Generator

Generate professional, emoji-enhanced changelogs from git diffs for pull requests.

## Operating Mode

**Inputs:** the base branch (auto-detect if unknown). Complexity is auto-detected from the diff.

**Definition of done:**

- A PR changelog in markdown, printed to the user — no files created.
- Only sections with real changes are included.
- Summary is 1–2 sentences on user impact.
- Bullets start with an imperative verb and cover WHAT + WHY.
- Test Plan is actionable (commands and/or manual checks).

**Non-goals:**

- Don't claim tests were run unless you actually ran them.
- Don't include secrets, tokens, or private URLs.
- Don't list every file — group related changes by purpose.

## Workflow

### Step 1: Identify the base branch

```bash
git fetch --all --prune
git symbolic-ref --short refs/remotes/origin/HEAD   # e.g. origin/main
```

If you already know the base (`main`, `master`, `develop`), use it. For a fork (upstream + origin), check `git remote -v`.

### Step 2: Analyze the diff

```bash
git diff --name-status origin/<base>...HEAD          # what changed
git diff --stat        origin/<base>...HEAD          # size overview
git log origin/<base>..HEAD --pretty=format:"%s" --reverse   # commit subjects
# git diff origin/<base>...HEAD                        # full diff, if unclear
```

Focus on: user-visible behavior vs refactors, file types (UI / tests / docs / config), and dependency changes.

### Step 3: Classify complexity

- **Simple** — bug fixes, small UI tweaks, copy changes, single dep bumps, minor refactors → **Format A**.
- **Technical** — new APIs/services, infra/CI, integrations, schema changes, new commands, architecture → **Format B**.

Rule of thumb: if a developer needs **code examples or commands** to use the change, it's Technical.

### Step 4: Categorize into emoji sections

Include only the sections that have real changes:

| Emoji | Section | Matches |
|---|---|---|
| 🚀 | Features | user-visible new behavior |
| 🔧 | Fixes | bug fixes |
| ♻️ | Refactoring | code movement/renames, no behavior change |
| 🎨 | UI/UX | `*.css`, `*.scss`, `*.stories.*`, components, design tokens |
| 🧪 | Testing | `*.test.*`, `*.spec.*`, `__tests__/` |
| 📚 | Documentation | `README*`, `docs/`, `*.md` |
| ⚙️ | Config / CI | `.github/`, `*.config.*`, `tsconfig*`, build configs |
| 📦 | Dependencies | `package.json`, lockfiles |
| ⚡️ | Performance | speed / efficiency improvements |
| 🔒 | Security | vulnerability fixes |
| 🚨 | Breaking | breaking changes (call out in Migration Notes) |

### Step 5: Generate using the format from Step 3.

## Format A — Simple PR

```markdown
## 📋 Summary

[1–2 sentences: what this PR does and its user impact]

## ✨ Changes

### 🔧 Fixes
- [bug fixed]

### ♻️ Refactoring
- [internal improvement]

## 🧪 Test Plan
- [ ] Manual: [action to verify]
- [ ] Run: `npm test`
```

## Format B — Technical PR

Same emoji sections as Format A, plus room for commands, usage, and migration. Template (include only what applies):

```markdown
# 🚀 [Title of the change]

## Summary
[2–3 sentences: what it does and why it matters]

## ✨ What's New
### [Feature / component]
[What it adds, with a short usage example when it helps]

## 🔄 Changes
**Added** — `path/new.ts` — purpose
**Modified** — `path/file.ts` — what changed and why
**Removed** — `path/old.ts` — why (e.g. replaced by X)

## 🧪 Test Plan
- [ ] Run `command` — expected outcome
- [ ] Verify [scenario]

## 🚨 Migration Notes
[Only if breaking: what changed, does the old way still work, migration steps]
```

For "a short usage example," show a real, typed snippet rather than prose — e.g.:

```ts
import { NewClient } from "@pkg/module";
const client = new NewClient({ option: "value" });
const result = await client.method({ param: "value" });
```

Keep it concrete: real commands over descriptions, a comparison table when there are multiple options or environments, and group by purpose rather than by file.

## Output

**Print the changelog directly to the user. Do NOT create any files.** Introduce it briefly ("Here's the changelog for your PR:") and paste the markdown.
