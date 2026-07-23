# git

Commit messages, PR changelogs, and everyday branch utilities.

## Model-invoked

Rich trigger phrasing so the agent reaches for them (also user-reachable). Safe to auto-trigger — they generate text or read state, they don't mutate the repo.

- **[commit](./commit/SKILL.md)** — Conventional (Angular) commit messages generated from the real diff.
- **[changelog](./changelog/SKILL.md)** — Emoji-enhanced PR changelogs from the diff between your branch and its base.
- **[show-my-branches](./show-my-branches/SKILL.md)** — The branches you've been working on: your unique commits from the last month, newest first.

## User-invoked

Reachable only when you type them (`disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false`). These change git state, so you invoke them deliberately.

- **[rebase](./rebase/SKILL.md)** — Rebase the current branch onto its inferred parent (fork point) or a branch you name. Previews and confirms first.
- **[merge](./merge/SKILL.md)** — Merge the parent or a named branch *into* the current branch to bring it up to date. Previews and confirms first.
- **[cleanup](./cleanup/SKILL.md)** — Delete stale local branches (gone-from-remote, squash-merged, merged) and prune remote-tracking refs. Previews and confirms first.
- **[push](./push/SKILL.md)** — Push the current branch; if rejected because the remote moved on, rebase onto it, resolve conflicts, and retry until it lands.
