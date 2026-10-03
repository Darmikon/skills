# ask what-is-it

Someone opens a project they do not know. Give them the picture they would otherwise spend a day putting together, on one page.

This file adds the first-look part to the rules in [../SKILL.md](../SKILL.md). It is the one `ask` command that answers on a page: see "The page" there.

## Where to look

- If the user named a folder after `/ask what-is-it`, look only there, and say on the page that the rest was not looked at.
- Otherwise the whole project. Start with what the project says about itself: `README*`, `CLAUDE.md`, `AGENTS.md`, `.claude/` (its `CLAUDE.md` and any notes), `docs/`, the root `package.json` (or `pyproject.toml`, `go.mod`, `Cargo.toml`), workspace files, `docker-compose*`, `Makefile`, CI files under `.github/workflows/`.
- Then the code: the entry points (the files that start a server, an app, a worker, a CLI) and the folders they pull in. For a large project, start an `Explore` subagent per part with the questions below, and put its answers together yourself.

## The page

The body is six sections, in this order, as blocks (see the `scan` skill's `reference/page.md`). Each statement follows the proof rule in [../SKILL.md](../SKILL.md).

1. **What is it** (`text`). Two or three sentences: what the project does and for whom, from the README and the code. If the docs and the code disagree, say it under Surprises.
2. **The parts** (`diagram`, then a `table` with the columns part, folder, job). A Mermaid picture of the pieces and how they connect: apps, packages, services, databases, queues, outside services; the diagram's `caption` names what the shapes mean.
3. **The main paths** (one `diagram` per path, then a `table` with the columns step, file, what happens). One or two typical paths from start to end: a request, a message, a job.
4. **Where things are** (`table`). A short table of the folders: what lives there, and what a newcomer can skip (generated code, vendored code, build output, fixtures).
5. **Run and test** (`table` with the columns command, what it does, from which file). The exact commands to install, start, test and build, taken from the project's files, each with the file it came from. List them; do not run them. What they need (a database, env variables, keys) goes here too, from `.env.example` or the docs, never from a real `.env`.
6. **Surprises** (`lines`, each surprise a finding with `kind: "surprise"`, so it gets its own copy button). Odd spots worth knowing before starting: generated code not to edit by hand, two places doing one job, a config that changes behaviour quietly, a folder whose name says one thing and holds another. Only what you saw.

There is no top pick.

## The ending

Chat line per part from section 2: its name, its folder, its job. Closing question: "Which part should we dig into?" The next step is `/ask how <the part>`.
