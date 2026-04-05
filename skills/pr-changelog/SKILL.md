---
name: pr-changelog
description: Generate PR changelogs by analyzing git diff between current branch and base branch, formatted with emojis in markdown. Use when user asks to create/write/generate a changelog, PR description, review changes for pull request, or mentions PR summary.
---

# PR Changelog Generator

Generate professional, emoji-enhanced changelogs from git diffs for pull requests.

## Operating Mode

### Inputs I Expect

- The base branch (if unknown, auto-detect)
- PR complexity will be auto-detected based on diff analysis

### Definition of Done

- Output is a PR changelog in markdown (no files created)
- Only include sections that have real changes
- Summary is 1–2 sentences focused on user impact
- Bullets start with an imperative verb and describe WHAT + WHY
- Test Plan is actionable (commands and/or manual checks)

### Non-goals

- Do not claim tests were run unless you actually ran them
- Do not include secrets, tokens, private URLs, or internal-only instructions
- Do not list every file; group related changes

## Workflow

### Step 1: Identify Base Branch

First, refresh remote refs and detect the default base branch.

```bash
git fetch --all --prune

# Detect default branch for origin (e.g. refs/remotes/origin/HEAD -> origin/main)
git symbolic-ref --short refs/remotes/origin/HEAD

# Fallback: show remote info (includes "HEAD branch")
git remote show origin
```

If you already know the base branch (e.g. `main`, `master`, `develop`), use it.

To compute the merge base:

```bash
# Replace <base> with the detected or user-provided base branch
git merge-base HEAD origin/<base>
```

If the repo doesn't use `origin` (fork + upstream), detect remotes:

```bash
git remote -v
```

### Step 2: Analyze the Diff

Get the complete change set between base and the current branch.

```bash
# Summary of changed files (add/modify/delete/rename)
git diff --name-status origin/<base>...HEAD

# Stats overview
git diff --stat origin/<base>...HEAD

# Commit subjects (helpful but not authoritative)
git log origin/<base>..HEAD --pretty=format:"%s" --reverse

# Optional: full diff (use if categorization is unclear)
git diff origin/<base>...HEAD
```

Focus on:

- Paths and file types (UI, tests, docs, config)
- User-visible behavior changes vs refactors
- Dependency changes (package.json / lockfiles)

### Step 3: Determine PR Complexity

**CRITICAL STEP**: Before generating, classify the PR as **Simple** or **Technical**.

#### Simple PR (use minimal format)

- Bug fixes (1-3 files)
- Small UI tweaks
- Copy/text changes
- Single dependency updates
- Minor refactors

#### Technical PR (use comprehensive format)

- New APIs, clients, or services
- Infrastructure changes (CI/CD, build, deploy)
- New integrations (external APIs, libraries)
- Schema changes (database, GraphQL, API contracts)
- Multi-environment configurations
- New CLI commands or scripts
- Architecture changes
- Anything with "how to use" instructions needed

**Rule of thumb**: If a developer needs CODE EXAMPLES or COMMANDS to understand how to use the changes, it's a Technical PR.

### Step 4: Categorize Changes (Heuristics)

Use these heuristics to decide which sections to include:

- 📦 **Dependencies**: `package.json`, lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`)
- ⚙️ **Configuration / CI**: `.github/`, CI configs, build configs (`*.config.*`, `tsconfig*`, `vite*`, `webpack*`)
- 📚 **Documentation**: `README*`, `docs/`, `*.md`
- 🧪 **Testing**: `__tests__/`, `*.test.*`, `*.spec.*`
- 🎨 **UI/UX**: `*.css`, `*.scss`, `*.less`, `*.stories.*`, `.storybook/`, design tokens, component folders
- ♻️ **Refactoring**: mostly code movement/renames, type cleanup, internal restructuring without behavior change
- 🚀 **Features** / 🔧 **Fixes**: user-visible behavior changes

### Step 5: Generate Changelog

Choose the appropriate format based on Step 3.

---

## Format A: Simple PR

Use for bug fixes, small changes, minor updates.

```markdown
## 📋 Summary

[1-2 sentence overview of what this PR accomplishes]

## ✨ Changes

### 🔧 Fixes

- Description of bug fix

### ♻️ Refactoring

- Code improvements without behavior changes

## 🧪 Test Plan

- [ ] Manual check: [specific action to verify]
- [ ] Run: `npm test` (if applicable)

## 📝 Notes

[Any additional context if needed]
```

---

## Format B: Technical PR

Use for new features, APIs, infrastructure, integrations, multi-environment changes.

### Structure

````markdown
# 🚀 [Descriptive Title of the Change]

## Summary

[2-3 sentences explaining WHAT this PR does and WHY it matters]

## ✨ What's New

### 🔧 [Feature/Component Name]

[Brief description of what was added]

[IF APPLICABLE - Comparison table for multi-environment/multi-option features:]
| Option/Environment | Feature A | Feature B |
|--------------------|-----------|-----------|
| `option1` | ✅ | ❌ |
| `option2` | ✅ | ✅ |

[IF APPLICABLE - New commands/scripts:]
**New commands:**

```bash
npm run command:name    # Description of what it does
npm run another:cmd     # Another description
```
````

### 🎯 [Another Feature - e.g., New Client/API]

[Brief description]

[IF APPLICABLE - Code usage example:]

```typescript
import { NewClient } from "@package/module";

const client = new NewClient({
  option: "value",
});

// Example usage with comments
const result = await client.method({ param: "value" });
```

**Supported operations:**

- Category: `method1()`, `method2()`, `method3()`
- Another: `methodA()`, `methodB()`

### 📁 New Folder Structure

[IF APPLICABLE - When new directories/architecture is introduced:]

```
path/to/
├── new-folder/
│   ├── subfolder/
│   │   └── file.ts
│   └── another.ts
├── new-file.ts        # NEW: Description
└── index.ts           # Updated
```

### 📚 Documentation

[IF APPLICABLE - When docs are added:]

- Added documentation at `path/to/DOCS.md` with usage guide

## 🔄 Changes

### Added

- `path/to/new-file.ts` - Description of purpose
- New feature X for Y

### Modified

- `path/to/file.ts` - What was changed and why

### Removed

- `path/to/old-file.ts` - Why it was removed (e.g., "Replaced by X")

## 🧪 Test Plan

- [ ] Run `specific command` - expected outcome
- [ ] Verify [specific functionality] works
- [ ] Test [edge case or specific scenario]

## 📋 Migration Notes

[IF APPLICABLE - When there are breaking changes or migration steps:]

- **No breaking changes** - Legacy `OldMethod()` still works
- For new code, prefer using `NewMethod()` for [benefit]
- [Any steps developers need to take]

## 🔗 Related

[IF APPLICABLE - Context about why this was done:]

- Addresses [issue/feedback] about [problem]
- Resolves [specific technical issue]

```

---

## Key Principles for Technical PRs

### 1. Show, Don't Just Tell
❌ Bad: "Add new API client"
✅ Good: Show import statement + example usage with typed response

### 2. Use Tables for Comparisons
When there are multiple options, environments, or features - use a comparison table.

### 3. Include Real Commands
❌ Bad: "Run the generation script"
✅ Good: `npm run graphql:generate:staging`

### 4. Visualize Structure Changes
When adding new folders/files, show the tree structure with annotations.

### 5. List Supported Operations
When adding a new client/service, list all available methods grouped by category.

### 6. Explain Migration Path
If there's an old way and new way, explain:
- Does old way still work?
- When to use new way?
- Any steps to migrate?

---

## Emoji Reference

| Category | Emoji | When to Use |
|----------|-------|-------------|
| Features | 🚀 | New functionality, capabilities, or enhancements |
| Fixes | 🔧 | Bug fixes, error corrections |
| Documentation | 📚 | README, docs, comments, JSDoc |
| Refactoring | ♻️ | Code restructuring without behavior change |
| Testing | 🧪 | Test files, test coverage improvements |
| UI/UX | 🎨 | Visual changes, styling, user experience |
| Performance | ⚡️ | Speed, efficiency, optimization improvements |
| Security | 🔒 | Security patches, vulnerability fixes |
| Dependencies | 📦 | Package updates, new libraries |
| Cleanup | 🗑️ | Removing dead code, deprecated features |
| Breaking | 🚨 | Breaking changes (use in notes section) |
| Configuration | ⚙️ | Config files, build scripts, CI/CD |

---

## Output

**CRITICAL**: Print the changelog directly to the user. DO NOT create any files.

Present the changelog with a brief introduction:

```

Here's the changelog for your PR:

[Generated changelog in markdown]

```

---

## Tips

1. **Auto-detect complexity** - analyze the diff first, then choose format
2. **Code examples are key** - for Technical PRs, always include usage examples
3. **Be specific with commands** - exact commands users can copy-paste
4. **Tables for options** - any time there are multiple choices, tabulate them
5. **Show folder structure** - when architecture changes, visualize it
6. **Migration matters** - always explain the upgrade path
7. **Group by purpose** - not by file, but by what the change accomplishes
```
