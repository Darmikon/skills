# scan ai

Find what a project that calls an AI model (Claude, OpenAI, the Vercel AI SDK, LangChain) is missing before real users hit it: failures, watching, tests, answer quality, cost, several agents, security. `llm` is another name for this command.

The fixes and their example code live in the `fix` skill's `reference/ai/` folder; this scan only names what is missing.

## 1. The project type

Read the manifests (`package.json` of the root and every workspace, the lock files, `pyproject.toml`, `requirements.txt`) and the top-level config:

| Signal | Type |
|---|---|
| `react-native`, `expo`, `ios/`, `android/`, `app.json` | Mobile (RN/Expo) |
| `@nestjs/core`, `express`, `fastify`, `hono`, `koa`, a server entry | Backend (Node/TS) |
| `next`, `vite`, `react-dom`, `@remix-run/*`, `nuxt` | Web frontend; Next.js is also a backend when it has `app/api`, `pages/api` or server actions |
| `nx.json`, `turbo.json`, `pnpm-workspace.yaml`, `workspaces` | Monorepo: each package gets its own type |
| a `bin` field, queue workers (`bullmq`, `@nestjs/bull`), cron | CLI / worker |
| `pyproject.toml`, `requirements.txt` | Python: the same list |

A folder with its own manifest (an app next to a server) gets its own type even without a workspace file. The types go in `facts`.

## 2. The AI surface

The scan covers every place that calls a model or runs a tool for one.

- **Libraries**, by exact package name in the manifests: `@anthropic-ai/sdk`, `openai`, `ai` (the Vercel AI SDK), `langchain`, `@langchain/*`; Python: `anthropic`, `openai`, `langchain`. Never search the code for the bare word `ai`.
- **Call sites**, searched in the code (the key-shaped terms `sk-ant-`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` only the way section 5 says: file and line, or `-l`/`-c`, never printing the matching line): `messages.create`, `messages.stream`, `batches.create`, `chat.completions.create`, `responses.create`, `generateText`, `streamText`, `from 'openai'`, `from 'ai'`, `import anthropic`, `from openai`, `tool_use`, `tool_result`, `api.anthropic.com`, `api.openai.com`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `sk-ant-`.
- **Tooling already there**, for the list: `vitest`, `jest`, `msw`, `nock`, `supertest`, `detox`, `maestro`, `playwright`, `promptfoo`, `@opentelemetry/*`, `langfuse`, `@langfuse/*`, `helicone`, `@sentry/*`, `pino`, `nestjs-pino`, `@nestjs/terminus`, `gitleaks`, `trufflehog`, `.claude/settings.json` and its hooks.

`facts` get "AI surface: N call sites in M files" and the tooling found.

No call site and no AI library: the reply starts with the sentence "No calls to an AI model were found here." (in the user's language, a faithful translation, not rephrased), then what was searched. Stop: no page, no findings file.

On a branch scan, the surface is the call sites in branch files, plus the code they call and the code that calls them. When the project has AI code but the branch touches none of it: the reply starts with "This branch does not touch code that calls an AI model.", then offers `/scan ai deep` with its time. No page, no findings file.

## 3. The list

Mark every item with exactly one of:

- `ok`: done; the place that shows it.
- `partial`: done in some places and not in others; the places of both.
- `missing`: not done; the place where it belongs.
- `n/a`: does not apply, and why: the project type, or the feature is absent (no tools: the tool items are `n/a`; no job that sends many requests nobody waits for: E5 is `n/a`).
- `not checked`: the code cannot show it (a dashboard, an alert, data residency, a calibrated judge), or on a branch scan, outside the branch. Never a guess: say what would show it.

The rank in brackets is the default when the item is missing. `Critical` is data, money or key exposure, or an outage on the first 429; `High`, `Medium` and `Low` come below it. A finding moves up or down from the default when what you saw makes it more or less serious; say why in `seen`. `failures.md` and the other file names are in the `fix` skill's `reference/ai/`.

**A. Failures** (`failures.md` §1–5)
- A1 Errors classified: retriable (429, 529, 5xx, connection, timeout, plus what the SDK retries) vs terminal (400, 401, 403, 404); unknown ⇒ terminal [High]
- A2 Exponential backoff with jitter, capped attempts, honours `retry-after` [High]
- A3 No `catch {}` that retries everything, no `sleep(0)` or tight loop [Critical]
- A4 Exactly one retry layer: SDK `maxRetries` or an own loop, not both [Medium]
- A5 After the last retry a named error; a missing response is never used downstream [High]
- A6 `stop_reason === 'refusal'` handled on its own (it is a 200), never retried [Medium]
- A7 Tool failures returned as `tool_result` with `is_error: true`, never empty content [High]
- A8 Batch loops isolate each item's failure; `Promise.allSettled` for fan-out; bounded concurrency [High]
- A9 Streams: tool calls acted on only after the stream closes; a broken stream retries the whole request; partial UI text reset on retry [Medium]

**B. Observability** (`observability.md`; missing or partial ⇒ the setup playbook, starting from the default stacks table)
- B1 Tracing initialized before app code (first import), flushed on shutdown or at the end of a serverless call [Medium]
- B2 Every LLM call goes through the wrapper and records a meaningful step name, model, input/output tokens, cache read/write tokens, latency, status [High]
- B3 One request is one trace: a span per LLM call and per tool call; request or trace id carried from the HTTP layer [Medium]
- B4 Cost can be broken down per step or feature [Medium]
- B5 Errors reported (Sentry or the like) with the trace id; refusals counted, not paged [Medium]
- B6 No prompts or personal data logged where the data policy forbids it (sizes and hashes instead) [High]
- B7 Structured logs, secrets redacted, `trace_id` on every line, shipped to a log store, trace id returned to clients [Medium]
- B8 Uptime monitor on a health endpoint; a heartbeat on every cron or batch job [Medium]
- B9 Dashboards (cost per step, p95 per step, errors by status, retries, cache hit ratio, refusals) and alerts wired to a channel someone reads [Low]
- B10 Slow non-LLM code profiled when traces show latency outside model calls [Low]
- B11 One tracer provider when Sentry and an own OpenTelemetry setup run together [Medium]

**C. Tests** (`testing.md`)
- C1 Unit tests for pure logic: parsers, router, cost, guards [Medium]
- C2 Failure-path tests with a mocked API: 429 then success, 400 no retry, refusal, timeout, budget exhausted, tool error [High]
- C3 Integration tests at the seams: LLM output → parser → DB or tool [Medium]
- C4 E2E: supertest (backend), Maestro or Detox (mobile), Playwright (web) [Low]
- C5 Tests never hit the real API by default (`onUnhandledRequest: 'error'`) [High]

**D. Evals** (`testing.md` §Evals)
- D1 A fixed eval set per LLM feature (20–50 cases to start), seeded from real failures [Medium]
- D2 The grader fits the output: exact match, code check, LLM judge [Medium]
- D3 An LLM judge calibrated against hand-labelled cases before it is trusted [Medium]
- D4 A pinned baseline; prompt, tool, model or temperature changes gated on it in CI [Medium]
- D5 Injection cases in the eval set [Medium]

**E. Cost, latency, model choice** (`failures.md` §6–8)
- E1 Model chosen per workload by eval (start at the default tier) [Low]
- E2 Model ids in config, not scattered literals [Low]
- E3 A router only for mixed traffic, on a cheap signal [Low]
- E4 Prompt caching on long stable prefixes; nothing dynamic before the breakpoint [Medium]
- E5 Batches API for non-urgent volume (crons, backfills) [Low]
- E6 Streaming for user-facing answers [Low]
- E7 `max_tokens` set on purpose per call [Low]
- E8 A reliability floor (latency ceiling, retry budget, minimum eval score) defined before cost cuts [Low]

**F. Multi-agent** (`failures.md` §9)
- F1 Fan-out only for truly independent subtasks [Medium]
- F2 Lead on a capable model, workers on a cheaper one [Low]
- F3 Each worker has its own retry; aggregation with `allSettled`; a per-run token budget [High]

**G. Security** (`security.md`)
- G1 Mobile and web clients never hold the API key; calls go through an own backend [Critical]
- G2 Secrets only from env or a secret manager, validated at boot; none in git history (found ⇒ rotate) [Critical]
- G3 Untrusted content (pages, emails, documents, DB rows, tool output) wrapped as data, never as instructions [High]
- G4 The action boundary enforced in code: a dispatcher guard with an allow-list, resolved paths, amount limits; deny over ask over allow [High]
- G5 Destinations and arguments of side-effecting tools never taken from untrusted content [Critical]
- G6 Least-privilege identity for the agent: read-only where possible, scoped DB user, scoped cloud role, protected agent config [High]
- G7 An audit log for every privileged action: who, what, arguments (redacted), result [Medium]
- G8 Claude Code repos: `permissions.deny` for secrets, PreToolUse hooks on writes and shell, sandbox on, team rules in managed settings [Medium]
- G9 Regulated customers: data residency, access logging, managed configuration, ZDR eligibility of the chosen model confirmed [Medium]
- G10 An agent that reads untrusted content holds no dangerous tools; high-impact actions need human confirmation [High]
- G11 Multi-tenant: every tool checks that the acting user owns the resource [Critical]
- G12 A secret scanner (gitleaks, trufflehog) in pre-commit or CI [Low]

**M. Mobile client** (`mobile.md`; `n/a` for other types)
- M1 Timeouts and `AbortController`, cancelled on screen unmount [Medium]
- M2 Offline state shown or queued, never an endless spinner [Low]
- M3 No double retry: the app retries only its own hop, a little [Medium]
- M4 Streaming rendered as it arrives; partial text reset on a drop and the whole request retried [Low]
- M5 A per-user rate limit on the backend [High]
- M6 Sentry for React Native, tagged with the backend trace id from a response header [Low]
- M7 Client metrics: time to first token, total time, error shown to the user [Low]
- M8 Tests: UI states (loading, streaming, error, refused), mocked network (MSW native), Maestro flows on a mocked backend [Medium]
- M9 Tokens in Keychain or Keystore, not AsyncStorage [High]
- M10 No prompts or answers in device logs in release builds [Medium]

What matters most by type: Backend: every section; most fixes land here. Mobile: G first (a key in the app is `Critical`), then M. Web frontend: G (no key in the client bundle, `NEXT_PUBLIC_*` leaks), E6, and C4 with Playwright. CLI / worker: A, B, E (batches above all), F. Items that do not fit the type are `n/a`.

## 4. The findings

Every `partial` and `missing` item is a finding: `kind` the id (`A2`), `rank`, `group` the mark (`missing` or `partial`), `places`, `seen` (what is there, or what is absent and where it would go), `direction` (one sentence: what to add, no code).

A whole area absent (no tracing at all, no tests at all, no evals) is one finding, not one per item: `kind` the area letter (`B`), `seen` names the ids it covers (`B1–B11`), `rank` the highest among them, `direction` "start from the setup playbook" for B, or the area's first step. The table still marks each of those items `missing`, with the finding's title as the reason.

Order: rank first; among equal ranks, by area: security (G, M9, M10), failures (A), watching (B), tests and evals (C, D), cost (E), several agents (F), the mobile client (M1–M8).

Nothing extra: a router (E3), the batches API (E5) and several agents (F1) are findings only when the code shows the need (mixed traffic, a nightly job calling the model one by one, independent subtasks run in a row). Otherwise `n/a`, with why.

## 5. Keys

A key found in the code or in history is shown as its first 4 characters and `…`, with its kind ("Anthropic key"), everywhere: the page, the chat, the temp files.

- In the code: `git grep -nE 'sk-ant-|sk-proj-' | cut -d: -f1,2` gives the file and line only. Read the line yourself; never copy it out.
- In history: `git log --all -S 'sk-ant-' --format='%h %ad' --date=short --name-only`, and the same with `sk-proj-`, and for legacy OpenAI keys `git log --all -G 'sk-[A-Za-z0-9]{20}' --format='%h %ad' --date=short --name-only` (on a branch scan, `<base>..HEAD` instead of `--all`). It names commits and files without printing their content.
- Obvious placeholders (`sk-ant-xxxx`, `your-key-here`, one letter repeated) are not keys: mention them only when they sit next to a real-looking value.

A key that ever reached history is leaked: G2 is `Critical` and the direction is "rotate the key; deleting it from history is not enough". A key in client code (an `EXPO_PUBLIC_*`, `NEXT_PUBLIC_*` or `react-native-config` value, or a literal in app code) is G1.

`facts` say: "The full search for secrets is `/scan security`."

## 6. The page

The findings file has `command: "ai"` and every finding. Sections, in order:

1. `cards`: the findings, most serious first. On a quick scan, the top 5 as cards and the rest in a `lines` section after them.
2. `table`, title "Every check": `columns` `["Id", "Item", "Mark", "Where or why"]`, one row per item in list order, the id alone in the first cell, the item's text only in the second (no `[rank]` bracket, no `(file §…)` tag). All 63 rows on every scope.
3. `table`, title "Already good": `columns` `["Id", "Item", "Where"]`, one row per `ok` item.
4. `table`, title "Questions": `columns` `["Q", "Id", "Question"]`, one row per `not checked` item the user can answer, `Q1`, `Q2`, … in the first cell.

Findings are only the `partial` and `missing` items; `ok` items and questions are table rows, never findings.

`summary`: counts of `Critical`, `High`, `Medium`, `Low` (findings), then `ok`, `n/a`, `not checked` (items). `facts`: the types, the AI surface, the tooling found, what did not run, and the line about `/scan security`.

Top pick: the most serious finding; among equals, the one that fails first under real traffic (a key or a 429 before a missing dashboard).

## 7. The ending

Chat: a line per `Critical` and `High` finding (title, rank, and the place as `path` with the code name it is about in backticks, such as `Promise.all` or `sleep(0)`; never a key value), one line counting the rest, the questions (`Q1`, …), the top pick. Closing question: "What do we fix first?"

An answer to a question changes that item's mark in the findings file (it lives in `<tmp>`, not in the project); an answer that shows a gap adds a finding. Then draw the page again and give the new link. A picked item gets `/fix ai` to copy.
