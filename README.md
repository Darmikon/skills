# Skills

Agent skills for Claude Code, Cursor, Windsurf, and other AI coding agents.

## Install

**skills.sh** — copies editable skills into your project so you can hack on them:

```bash
npx skills add Darmikon/skills
```

Install all at once:

```bash
npx skills add Darmikon/skills --skill ask --skill baby --skill better-docs --skill changelog --skill cleanup --skill commit --skill domain-model --skill explore --skill fix --skill focus --skill grill-me --skill grill-with-docs --skill handoff --skill handoff-lpm --skill how --skill how-to --skill merge --skill output-style --skill output-style-add --skill mockup --skill pr --skill push --skill rebase --skill rethink --skill scan --skill show-my-branches --skill to-plan --skill to-questionnaire --skill update-plans --skill verify --skill why --skill wtf --skill zoom-out
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
| better-docs | 🧍 | Shortcut for `/fix docs`: correct and tidy the docs, lean AGENTS.md | `npx skills add Darmikon/skills --skill better-docs` |

### workflow — how the agent responds & recovers

| Skill | | Description | Install |
|-------|---|-------------|---------|
| ask | 🧍 | Understand code without changing it: `what-is-it` (a whole project, on a page), `how`, `how to`, `why`, `zoom-out`; `/ask` alone suggests which | `npx skills add Darmikon/skills --skill ask` |
| baby | 🧍 | Re-explain the last answer in plain words, and keep going that way | `npx skills add Darmikon/skills --skill baby` |
| domain-model | 🤖 | Keeps the project's glossary and decision records in `docs/` on its own; asks only before recording a decision | `npx skills add Darmikon/skills --skill domain-model` |
| explore | 🧍 | Think together before building: read, draw, compare — no code, no files, until you say stop | `npx skills add Darmikon/skills --skill explore` |
| fix | 🧍 | Fix what `/scan` found (the branch by default, `deep` for the whole project) after you approve a numbered plan: `docs`, `comments`, `unused` change files and leave them uncommitted; `security`, `performance`, `architecture` go to brainstorming | `npx skills add Darmikon/skills --skill fix` |
| focus | 🧍 | Action-first, skimmable output | `npx skills add Darmikon/skills --skill focus` |
| grill-me | 🧍 | Stress-test a plan: questions in numbered rounds, each with a recommended answer, until nothing is assumed | `npx skills add Darmikon/skills --skill grill-me` |
| grill-with-docs | 🧍 | `grill-me` that also keeps the glossary and decision records in `docs/` | `npx skills add Darmikon/skills --skill grill-me --skill domain-model --skill grill-with-docs` |
| handoff | 🧍🤖 | Compact the conversation into a handoff document for the next agent | `npx skills add Darmikon/skills --skill handoff` |
| handoff-lpm | 🧍 | Hand over to a fresh Claude session in a new lpm tab | `npx skills add Darmikon/skills --skill handoff-lpm` |
| how | 🧍 | Shortcut for `/ask how`: how one part works; `/how to <task>` also says where the new thing goes | `npx skills add Darmikon/skills --skill how` |
| how-to | 🧍 | Shortcut for `/ask how to <task>` | `npx skills add Darmikon/skills --skill ask --skill how --skill how-to` |
| mockup | 🧍 | Answer a design question by trying it: a clickable HTML file for logic (in the OS temp folder), or screen variants in the app, removed after the choice | `npx skills add Darmikon/skills --skill mockup` |
| output-style | 🧍 | Switch instantly by name, or pick from a list | `npx skills add Darmikon/skills --skill output-style` |
| output-style-add | 🧍 | Create an output style from your description | `npx skills add Darmikon/skills --skill output-style-add` |
| rethink | 🤖 | Step back after 3+ failed attempts | `npx skills add Darmikon/skills --skill rethink` |
| scan | 🧍 | Look for problems without changing anything, on one page; reviews the current branch by default, `deep` scans the whole project: `architecture` (where the code is harder to understand and test than it needs to be), `unused` (dead files, code and packages, via knip), `security` (secrets, dangerous code, holes in packages, via gitleaks, semgrep and audit), `performance` (slow-looking code, measured only after you approve the plan), `docs` (whether the documents tell the truth), `comments` (lying comments, stale TODOs, dead code), `todo`, `tests` (untested parts, empty and flaky tests); `/scan` alone suggests which | `npx skills add Darmikon/skills --skill scan` |
| to-plan | 🧍 | Shortcut for superpowers `writing-plans`: a spec becomes a step-by-step plan; needs superpowers | `npx skills add Darmikon/skills --skill to-plan` |
| to-questionnaire | 🧍 | A decision you cannot make alone becomes a questionnaire for the person who knows, as a Markdown file in the OS temp folder | `npx skills add Darmikon/skills --skill to-questionnaire` |
| update-plans | 🧍 | The plan changed mid-work: bring the superpowers spec and plan in line, no code touched | `npx skills add Darmikon/skills --skill update-plans` |
| verify | 🧍 | Check the code against the ticket, spec or plan item by item, each proven by a test that ran; the project is not changed | `npx skills add Darmikon/skills --skill verify` |
| why | 🧍 | Shortcut for `/ask why`: what led to the code's shape, every claim marked | `npx skills add Darmikon/skills --skill why` |
| wtf | 🧍 | Re-pitch the last message so that it lands this time | `npx skills add Darmikon/skills --skill wtf` |
| zoom-out | 🧍 | Shortcut for `/ask zoom-out`: the map of the parts around a place | `npx skills add Darmikon/skills --skill zoom-out` |
