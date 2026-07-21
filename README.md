# Skills

Agent skills for Claude Code, Cursor, Windsurf, and other AI coding agents.

## Install

**skills.sh** — copies editable skills into your project so you can hack on them:

```bash
npx skills add Darmikon/skills
```

Install all at once:

```bash
npx skills add Darmikon/skills --skill better-docs --skill changelog --skill commit --skill focus --skill rethink --skill skill-publish
```

**Claude Code plugin** — a managed, auto-updating bundle you don't edit by hand:

```
/plugin marketplace add Darmikon/skills
/plugin install skills@darmikon
```

## Skills

🧍 user-invoked (type it) · 🤖 model-invoked (the agent reaches for it)

### git — commit messages & PR changelogs

| Skill | | Description | Install |
|-------|---|-------------|---------|
| commit | 🤖 | Angular conventional commit format | `npx skills add Darmikon/skills --skill commit` |
| changelog | 🤖 | PR changelogs from git diffs | `npx skills add Darmikon/skills --skill changelog` |

### authoring — docs & skill creation

| Skill | | Description | Install |
|-------|---|-------------|---------|
| better-docs | 🧍 | Optimize repo docs, lean AGENTS.md | `npx skills add Darmikon/skills --skill better-docs` |
| skill-publish | 🧍 | Create and publish skills to GitHub | `npx skills add Darmikon/skills --skill skill-publish` |

### workflow — how the agent responds & recovers

| Skill | | Description | Install |
|-------|---|-------------|---------|
| focus | 🧍 | Action-first, skimmable output | `npx skills add Darmikon/skills --skill focus` |
| rethink | 🤖 | Step back after 3+ failed attempts | `npx skills add Darmikon/skills --skill rethink` |
