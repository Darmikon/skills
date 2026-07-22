# Skills

Agent skills for Claude Code, Cursor, Windsurf, and other AI coding agents.

## Install

**skills.sh** — copies editable skills into your project so you can hack on them:

```bash
npx skills add Darmikon/skills
```

Install all at once:

```bash
npx skills add Darmikon/skills --skill better-docs --skill changelog --skill commit --skill focus --skill git-cleanup --skill git-merge --skill git-rebase --skill git-show-my-branches --skill rethink
```

**Claude Code plugin** — a managed, auto-updating bundle you don't edit by hand:

```
/plugin marketplace add Darmikon/skills
/plugin install skills@darmikon
```

## Skills

🧍 user-invoked (type it) · 🤖 model-invoked (the agent reaches for it)

### git — commits, changelogs & branch utilities

| Skill | | Description | Install |
|-------|---|-------------|---------|
| commit | 🤖 | Angular conventional commit format | `npx skills add Darmikon/skills --skill commit` |
| changelog | 🤖 | PR changelogs from git diffs | `npx skills add Darmikon/skills --skill changelog` |
| git-show-my-branches | 🤖 | Your recent branches with unique commits | `npx skills add Darmikon/skills --skill git-show-my-branches` |
| git-rebase | 🧍 | Rebase onto parent/named branch, with confirm | `npx skills add Darmikon/skills --skill git-rebase` |
| git-merge | 🧍 | Merge parent/named branch into current | `npx skills add Darmikon/skills --skill git-merge` |
| git-cleanup | 🧍 | Prune stale / merged / gone local branches | `npx skills add Darmikon/skills --skill git-cleanup` |

### authoring — documentation

| Skill | | Description | Install |
|-------|---|-------------|---------|
| better-docs | 🧍 | Optimize repo docs, lean AGENTS.md | `npx skills add Darmikon/skills --skill better-docs` |

### workflow — how the agent responds & recovers

| Skill | | Description | Install |
|-------|---|-------------|---------|
| focus | 🧍 | Action-first, skimmable output | `npx skills add Darmikon/skills --skill focus` |
| rethink | 🤖 | Step back after 3+ failed attempts | `npx skills add Darmikon/skills --skill rethink` |
