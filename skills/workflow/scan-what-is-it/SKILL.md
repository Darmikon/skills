---
name: scan-what-is-it
description: 'First look at an unfamiliar project: what it is, its parts, its main paths, where things are, how to run it, and the surprises, on one page. Changes nothing in the project.'
argument-hint: '[a folder to look at]'
disable-model-invocation: true
---

# scan-what-is-it

Someone opens a project they do not know. Give them the picture they would otherwise spend a day putting together, on one page.

**First:** call the Skill tool with `scan-common` and follow its rules: change nothing, the page, proof, the ending, language. This file adds only the first-look part.

## Where to look

- If the user named a folder after `/scan-what-is-it`, look only there, and say on the page that the rest was not looked at.
- Otherwise the whole project. Start with what the project says about itself: `README*`, `CLAUDE.md`, `AGENTS.md`, `docs/`, the root `package.json` (or `pyproject.toml`, `go.mod`, `Cargo.toml`), workspace files, `docker-compose*`, `Makefile`, CI files under `.github/workflows/`.
- Then the code: the entry points (the files that start a server, an app, a worker, a CLI) and the folders they pull in. For a large project, start an `Explore` subagent per part with the questions below, and put its answers together yourself.

## The page

The body is six sections, in this order. Each statement follows the proof rule of `scan-common`.

1. **What is it.** Two or three sentences: what the project does and for whom, from the README and the code. If the two disagree, say so.
2. **The parts.** A Mermaid picture of the pieces and how they connect: apps, packages, services, databases, queues, outside services. Under it, one line per part: its name, its folder, its job.
3. **The main paths.** One or two typical paths from start to end: a request, a message, a job. A Mermaid sequence or flow picture, then the files along the way in order.
4. **Where things are.** A short table of the folders: what lives there, and what a newcomer can skip (generated code, vendored code, build output, fixtures).
5. **Run and test.** The exact commands to install, start, test and build, taken from the project's files, each with the file it came from. List them; do not run them. What they need (a database, env variables, keys) goes here too, from `.env.example` or the docs, never from a real `.env`.
6. **Surprises.** Odd spots worth knowing before starting: generated code not to edit by hand, two places doing one job, a config that changes behaviour quietly, a folder whose name says one thing and holds another. Only what you saw.

The header legend names the shapes used in the pictures. There is no top pick: this scan has no findings to rank.

## The ending

In the chat, one line per part from section 2. Closing question: "Which part should we dig into?" The chosen part goes to `how`.
