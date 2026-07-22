# git

Commit messages, PR changelogs, and everyday branch utilities.

## Model-invoked

Rich trigger phrasing so the agent reaches for them (also user-reachable). Safe to auto-trigger — they generate text or read state, they don't mutate the repo.

- **[commit](./commit/SKILL.md)** — Conventional (Angular) commit messages generated from the real diff.
- **[changelog](./changelog/SKILL.md)** — Emoji-enhanced PR changelogs from the diff between your branch and its base.
- **[git-show-my-branches](./git-show-my-branches/SKILL.md)** — The branches you've been working on: your unique commits from the last month, newest first.

## User-invoked

Reachable only when you type them (`disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false`). These change git state, so you invoke them deliberately — each previews and confirms before acting.

- **[git-rebase](./git-rebase/SKILL.md)** — Rebase the current branch onto its inferred parent (fork point) or a branch you name.
- **[git-merge](./git-merge/SKILL.md)** — Merge the parent or a named branch *into* the current branch to bring it up to date.
- **[git-cleanup](./git-cleanup/SKILL.md)** — Delete stale local branches (gone-from-remote, squash-merged, merged) and prune remote-tracking refs.
