---
name: conventional-commit
description: Create git commits following Angular conventional commit format by analyzing real diffs and generating messages with ≤100-char subject and ≤100-char body/footer lines. Use when the user asks to create a commit, commit changes, analyze git diff, or needs help writing commit messages.
---

# Conventional Commit Helper

Helps create well-formatted conventional commits following Angular's specification.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Header Rules
- **Max length**: 100 characters
- **Format**: `type(scope): subject`
- **Subject**: Imperative mood, lowercase, no period at end

### Body Rules
- **Max line length**: 100 characters per line
- Explain the **why** not the **what**
- Wrap at 100 characters

### Footer Rules
- Reference issues: `Fixes #123`, `Closes #456`
- Breaking changes: `BREAKING CHANGE: description`

## Commit Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature or capability | `feat(auth): add password reset` |
| `fix` | Bug fix | `fix(api): handle null response` |
| `docs` | Documentation only | `docs(readme): update setup steps` |
| `style` | Formatting only (no logic change) | `style(ui): align button spacing` |
| `refactor` | Code restructuring (no feature/fix) | `refactor(core): simplify config parsing` |
| `perf` | Performance improvement | `perf(images): lazy-load thumbnails` |
| `test` | Add/update tests | `test(auth): cover refresh token flow` |
| `build` | Build system/dependencies | `build(deps): bump react to 19` |
| `ci` | CI/CD changes | `ci(github): add lint job` |
| `chore` | Maintenance tasks | `chore: remove unused imports` |
| `revert` | Revert previous commit | `revert: feat(auth): add password reset` |

## Workflow

When helping with commits, follow this process:

### Step 1: Analyze Changes

Run these commands in parallel to understand the current state:
```bash
git status --porcelain

# Prefer staged diff if anything is staged
git diff --staged

# Also inspect unstaged changes (if needed)
git diff

git log -5 --oneline
```

Review:
- What files changed
- What the changes accomplish
- The nature of modifications (new feature, bug fix, etc.)

### Step 2: Compose the Message

Based on analysis:

1. **Determine type**: Choose from the types table above  
2. **Pick scope (optional)**: Use the broadest, obvious scope. Prefer package name or top-level domain folder. If unclear or the change spans many areas, omit scope.  
   - Good scopes: `ui`, `auth`, `api`, `core`, `docs`, `ci`, `deps`, `build`, `tests`  
   - Avoid over-specific scopes like individual component names unless it’s the only thing that changed  
3. **Write subject**: Clear, imperative mood, under 100 chars total  
4. **Write body** (optional): Explain motivation, wrap at 100 chars per line  
5. **Add footer** (if needed): Issue references or breaking changes

### Step 3: Present for Review

Show the composed commit message and ask the user to confirm before committing.

**IMPORTANT**: Never execute `git commit` without explicit user approval.

## Examples

### Example 1: New Feature
```
feat(auth): add password reset flow

Add reset request + token verification endpoints.
Improves account recovery and reduces support tickets.

Closes #45
```

### Example 2: Bug Fix
```
fix(api): handle empty pagination cursor

Some clients sent an empty cursor string which caused
the server to return duplicate pages.
```

### Example 3: Refactoring
```
refactor(core): extract shared validation helpers

Centralize common validators to reduce duplication
and make error messages consistent.
```

### Example 4: Breaking Change
```
feat(config): rename env vars for clarity

Replace LEGACY_TOKEN with API_TOKEN across configs.

BREAKING CHANGE: Update your env files to use API_TOKEN.
```

### Example 5: Split Unrelated Changes
If changes include unrelated concerns (e.g., feature + CI), suggest separate commits:

```bash
# Stage feature changes only
git add src/features/auth/

# Commit feature
git commit -m "feat(auth): add social login providers"

# Stage CI changes
git add .github/workflows/

# Commit CI
git commit -m "ci(github): add automated test workflow"
```

## Scope Heuristics

Scope is optional. When you use it, keep it boring and obvious.

Use scope when:
- Most changes are contained in a single package or domain area

Choose scope as:
- Monorepo: `packages/<name>` → scope `<name>` (e.g. `ui`, `core`, `api`)
- Otherwise: top-level domain folder (e.g. `auth`, `api`, `docs`, `ci`, `tests`)

Omit scope when:
- Changes span multiple areas
- You’d be guessing

Examples:
- `feat(ui): add toast variant props`
- `fix(api): handle undefined price field`
- `docs: update installation steps`
- `chore(deps): bump react to 19`

## Validation Checklist

Before committing, verify:

- [ ] Type is appropriate for the change
- [ ] Scope accurately reflects the area changed
- [ ] Subject line is ≤100 characters (including type and scope)
- [ ] Subject uses imperative mood ("add" not "added")
- [ ] Subject is lowercase (except proper nouns)
- [ ] Subject has no period at the end
- [ ] Body lines are ≤100 characters each
- [ ] Every body/footer line is ≤100 characters (wrap long lines)
- [ ] Body explains WHY, not WHAT
- [ ] Footer includes issue references if applicable
- [ ] Breaking changes are documented in footer

## Common Mistakes to Avoid

❌ **Too vague**: `fix: bug fix`
✅ **Specific**: `fix(api): handle undefined price field`

❌ **Past tense**: `feat: added login button`
✅ **Imperative**: `feat: add login button`

❌ **Too long**: `feat(auth): add comprehensive user authentication system with JWT tokens and refresh token rotation`
✅ **Concise**: `feat(auth): implement JWT authentication`

❌ **What instead of why**: `refactor: moved files to new folder`
✅ **Why**: `refactor(structure): organize components by feature for better maintainability`
