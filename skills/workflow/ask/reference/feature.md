# ask feature

Trace one thing a user does in the app, from their action to what they see at the end, through every layer, and show it on a page. `how` explains one part; `feature` follows one action through all the parts.

## Find the start

From the words: a route, a page, a button text, a job or command name. Say in one line where the trace starts ("Starts at `POST /v1/knowledge-bases/:id/documents`, `src/app/routes/kb.routes.ts:40`"). If two starts fit, name both and ask which.

## Trace

Follow the data, reading the code at each step, never guessing from names:

- the UI or caller, the request, each server step (login and rights checks, validation, business rules), the database writes, the events and queues, the background jobs, other services, and how the result comes back (a response, polling, a push).
- **Hops that are not calls:** an event name in a string, a lookup table from event to worker, a dependency-injection container, a queue, a cron. Follow them through the string, the table or the config, and mark the step as `hop`.
- **Into a sibling project:** when the call goes to another service whose code sits next to this project (for example `~/dev/<name>`), follow it there and say so. When that code is not on the machine, the trace ends there with a note.
- Read it yourself. Start one `general-purpose` subagent per layer only when the trace runs through more than about 15 files, each returning its steps with path and line; check where their parts meet.

## The entities

For each thing the feature creates or changes (a document, an order, a session): its states along the way (`pending` → `processing` → `ready`), where each change happens, and the other places in the code that change or delete it, one line each.

## The page

JSON as the `scan` skill's `reference/page.md` says, with `"family": "ask"`, `"command": "feature"`, file `ask-feature-<timestamp>.json`. Sections:

1. `text`: what the feature is, two sentences.
2. `diagram`: a Mermaid `sequenceDiagram` of the whole path; hops as dashed arrows.
3. `cards`: one finding per step (`title` = what happens, `places`, `seen` = what the code does there, `direction` = what can go wrong there), `kind` `step` or `hop`.
4. `diagram` and `lines` for the entities: a Mermaid `stateDiagram-v2` per entity, then one line per other place that changes it.
5. `lines`: the gaps, steps that could not be traced, `kind` `gap`.

## The ending

Chat: the path as one line per step. Then: "Which step should we dig into?" Next commands: `/ask how <part>` for a step, `/ask why <step>` for why it is so. If the project has a git-ignored study folder (for example `docs/study/`), offer once to save the page there; only on a yes.
