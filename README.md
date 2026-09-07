# Skills

Agent skills for Claude Code, Cursor, Windsurf, and other AI coding agents.

## Install

**skills.sh** — copies editable skills into your project so you can hack on them:

```bash
npx skills add Darmikon/skills
```

Install all at once:

```bash
npx skills add Darmikon/skills --skill baby --skill better-docs --skill changelog --skill cleanup --skill commit --skill focus --skill merge --skill output-style --skill output-style-add --skill pr --skill push --skill rebase --skill rethink --skill show-my-branches
```

**Claude Code plugin** — a managed, auto-updating bundle you don't edit by hand:

```
/plugin marketplace add Darmikon/skills
/plugin install skills@darmikon
```

## Output styles

Output styles replace Claude's system prompt persona — role, tone, answer format. They live in [`output-styles/`](./output-styles) and ship with the **plugin** automatically: Claude Code auto-discovers a plugin's `output-styles/` directory, nothing to declare, nothing to run.

| Style | Description |
|-------|-------------|
| ELI5 | "keep it simple pls" — short words, short sentences, for a long day |
| Focus | Action-first and skimmable: next step first, numbered work, state restated every turn (ADHD-shaped) |
| Caveman | Ultra-compressed: articles, filler and narration dropped, technical substance and code untouched |
| Baby | Plain words only, no jargon, three to five sentences — for a fried brain |

`Focus` and `Baby` each also exist as a skill ([focus](./skills/workflow/focus/SKILL.md), [baby](./skills/workflow/baby/SKILL.md)), on purpose: a style is set once and survives across sessions but only applies after `/clear`, while the skill takes effect in the conversation you are already in — and `/baby` also re-explains the answer you just read.

Installed with `npx skills add` instead? That CLI copies only skill directories, and neither it nor Claude Code has an install-time hook, so link the styles once:

```bash
git clone https://github.com/Darmikon/skills && cd skills
./scripts/install-output-styles.sh
```

Symlinks by default — edit a file in `output-styles/` and the live style changes with it. Flags: `--copy`, `--dry-run`, `--force`, `--dest DIR`; `CLAUDE_OUTPUT_STYLES_DIR` moves the default destination. `scripts/test-output-styles.sh` smoke-tests the whole thing under both bash and zsh.

Switch between styles with `/output-style`; write a new one with `/output-style-add`, which authors it back into this repo and installs it. A style takes effect after `/clear` or in a new session.

## Skills

🧍 user-invoked (type it) · 🤖 model-invoked (the agent reaches for it)

### git — commits, changelogs & branch utilities

| Skill | | Description | Install |
|-------|---|-------------|---------|
| commit | 🤖 | Angular conventional commit format | `npx skills add Darmikon/skills --skill commit` |
| changelog | 🧍 | Write the changelog into the current PR | `npx skills add Darmikon/skills --skill changelog` |
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
| baby | 🧍 | Re-explain the last answer in plain words, and keep going that way |
| focus | 🧍 | Action-first, skimmable output | `npx skills add Darmikon/skills --skill focus` |
| output-style | 🧍 | Switch instantly by name, or pick from a list | `npx skills add Darmikon/skills --skill output-style` |
| output-style-add | 🧍 | Create an output style from your description | `npx skills add Darmikon/skills --skill output-style-add` |
| rethink | 🤖 | Step back after 3+ failed attempts | `npx skills add Darmikon/skills --skill rethink` |
