# Skills

Agent skills for Claude Code, Cursor, Windsurf, and other AI coding agents.

## Install

**skills.sh** — copies editable skills into your project so you can hack on them:

```bash
npx skills add Darmikon/skills
```

Install all at once:

```bash
npx skills add Darmikon/skills --skill better-docs --skill changelog --skill cleanup --skill commit --skill focus --skill merge --skill pr --skill push --skill rebase --skill rethink --skill show-my-branches
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
| show-my-branches | 🤖 | Your recent branches with unique commits | `npx skills add Darmikon/skills --skill show-my-branches` |
| rebase | 🧍 | Rebase onto parent/named branch, with confirm | `npx skills add Darmikon/skills --skill rebase` |
| merge | 🧍 | Merge parent/named branch into current | `npx skills add Darmikon/skills --skill merge` |
| cleanup | 🧍 | Prune stale / merged / gone local branches | `npx skills add Darmikon/skills --skill cleanup` |
| push | 🧍 | Push; on reject, rebase onto remote and retry | `npx skills add Darmikon/skills --skill push` |
| pr | 🧍 | Open/update a PR: commit + push + generated body | `npx skills add Darmikon/skills --skill pr` |

### authoring — documentation

| Skill | | Description | Install |
|-------|---|-------------|---------|
| better-docs | 🧍 | Optimize repo docs, lean AGENTS.md | `npx skills add Darmikon/skills --skill better-docs` |

### workflow — how the agent responds & recovers

| Skill | | Description | Install |
|-------|---|-------------|---------|
| focus | 🧍 | Action-first, skimmable output | `npx skills add Darmikon/skills --skill focus` |
| rethink | 🤖 | Step back after 3+ failed attempts | `npx skills add Darmikon/skills --skill rethink` |
