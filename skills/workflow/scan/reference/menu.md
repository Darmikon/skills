# The menu (`/scan` with no argument)

Look quickly, then suggest. Look only at what is cheap: `git log --oneline -30 --name-only`, whether a `README*` or `CLAUDE.md` exists, the root manifest (`package.json`, `pyproject.toml`, …).

- The user does not know this project yet, or it has no notes of its own → say that `/ask what-is-it` gives the first look (it is not a scan), then go on.
- Recent history keeps coming back to the same files → `architecture`, scoped to that area.
- `package.json` and `node_modules/` at the root → `unused`.
- An AI library in a manifest (`@anthropic-ai/sdk`, `openai`, `ai`, `langchain`, `@langchain/*`; Python: `anthropic`, `openai`, `langchain`), in the root manifest or a workspace manifest it lists → `ai`.
- Logins, payments, uploads or webhooks → `security`.
- A database or list endpoints → `performance`.
- A `docs/` folder, or a `README`, `CLAUDE.md` or `AGENTS.md` longer than a page → `docs`.
- A test runner → `tests`.
- Many `TODO`/`FIXME` (`git grep -c -E 'TODO|FIXME'`) → `comments`.
- Otherwise → `architecture` without a scope.

Lead with one or two picks, each with a one-line reason and the exact command (`/scan architecture src/app/modules/billing`). Then the full list of commands, one line each. Say that a scan reviews the current branch's changes by default (with none, it asks before scanning the whole project) and that `deep` scans the whole project. Stop there: never start a scan on your own.
