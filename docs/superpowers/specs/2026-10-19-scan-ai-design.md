# scan ai and fix ai

## Goal

Port the `agentic-sentinel` skill (found in `~/Downloads/agentic-sentinel`) into the scan family as a new command pair:

- `/scan ai` finds what a project that calls an AI model (Claude, OpenAI, Vercel AI SDK, LangChain) is missing for production, changes nothing, and shows it on the scan page.
- `/fix ai` fixes the small, local findings itself after a yes, and hands the big ones to `brainstorming`.

Every best practice in the source skill is kept. The source mixes looking and changing, triggers on its own, writes its report as chat text, and has contradictions and bugs in its examples; the port fixes all of that (see "What changes from the source").

The command is `ai`. `llm` is accepted as another name (`/scan llm`, `/fix llm`), the way `doc` works for `docs`.

## Where the files live

```
skills/workflow/scan/reference/ai.md       how to find the AI surface, the numbered checklist, the page
skills/workflow/scan/scripts/mask-keys.mjs the one mask for key-shaped text (code, history, show), with its test
skills/workflow/fix/reference/ai.md        the direct/discuss rule, the plan, the hand-over
skills/workflow/fix/reference/ai/
  failures.md       errors, retry, refusal, tool results, batch isolation, streaming, caching,
                    batches API, model config and router, multi-agent, NestJS module   (from backend-ts.md)
  observability.md  wrappers, cost, default stacks, setup playbook, dashboards, alerts  (from observability.md)
  testing.md        unit, failure-path, integration, E2E, evals, judge calibration      (from testing.md)
  security.md       injection model, tool guard, least privilege, secrets, Claude Code settings, regulated review
  mobile.md         React Native / Expo specifics
```

The content of the five source reference files is carried over in full, with the bugs fixed. `failures.md` is the renamed `backend-ts.md`: its content is not only backend.

Also changed:

- `scan/SKILL.md` and `fix/SKILL.md`: an `ai` row in the commands table, `ai` in `description` and `argument-hint`.
- `scan/reference/menu.md`: suggest `ai` when the root manifest or a workspace manifest lists an AI library (`@anthropic-ai/sdk`, `openai`, `ai`, `langchain`, `@langchain/*`; Python: `anthropic`, `openai`, `langchain`).
- `README.md` (the scan and fix rows) and `skills/workflow/README.md` (the scan and fix paragraphs, with a line "`ai` is ported from `agentic-sentinel`").
- `tests/run.sh`, `tests/fixture-ai/` (see "Tests").

`plugin.json`, the install-all line and the links in `~/.claude/skills/` need no change: `scan` and `fix` are already there. The folder in `~/Downloads` is not touched.

## scan ai

It follows `scan/SKILL.md` like every scan: manual only, the branch by default, `deep` for the whole project, the quick/deep question when the branch has no changes, observe and never change, the project's words, proof, the page, the ending.

### 1. The project type

From the manifests (`package.json` of every workspace, lock files, `pyproject.toml`, `requirements.txt`) and the top-level config:

| Signal | Type |
|---|---|
| `react-native`, `expo`, `ios/`, `android/`, `app.json` | Mobile (RN/Expo) |
| `@nestjs/core`, `express`, `fastify`, `hono`, `koa`, a server entry | Backend (Node/TS) |
| `next`, `vite`, `react-dom`, `@remix-run/*`, `nuxt` | Web frontend; Next.js is also backend when it has `app/api`, `pages/api` or server actions |
| `nx.json`, `turbo.json`, `pnpm-workspace.yaml`, `workspaces` | Monorepo: each package classified on its own |
| a `bin` field, queue workers (`bullmq`, `@nestjs/bull`), cron | CLI / worker |
| `pyproject.toml`, `requirements.txt` | Python: the same checklist |

The type goes in the page's `facts`.

### 2. The AI surface

Every place that calls a model or runs a tool. Libraries are matched by exact package name in the manifests, never by a word search over the code (the package `ai` must not match every file). Then search the code, every search piped through section 5's mask, for: `@anthropic-ai/sdk`, `@langchain/`, `langchain`, `ChatAnthropic`, `ChatOpenAI`, `messages.create`, `messages.stream`, `batches.create`, `toolRunner`, `chat.completions.create`, `responses.create`, `generateText`, `streamText`, `generateObject`, `streamObject`, `tool_use`, `tool_result`, `api.anthropic.com`, `api.openai.com`, and the Python forms (`import anthropic`, `from anthropic`, `import openai`, `from openai`). The imports of `openai` and `ai` are matched without the quote character (`from` or `require(`, any one character, then the package), so either quote style matches. Where keys and `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` sit is section 5's code pipeline, never a search of its own.

Existing tooling, for the checklist: `vitest`, `jest`, `msw`, `nock`, `supertest`, `detox`, `maestro`, `playwright`, `promptfoo`, `@opentelemetry/*`, `langfuse`, `@langfuse/*`, `helicone`, `@sentry/*`, `pino`, `nestjs-pino`, `.claude/settings.json`, hooks.

No AI surface: say "No calls to an AI model were found here." (in the user's language, a faithful translation) and what was searched, and stop. No page.

On a branch scan the surface is the AI places in branch files plus the code they call or are called from. When the project has AI code but the branch touches none: say "This branch does not touch code that calls an AI model.", offer `/scan ai deep` with its time, and draw no page.

### 3. The checklist

Every item has a fixed id. The full list is in the appendix; the reference holds it word for word. Each item gets exactly one mark:

- `ok`: done, with the place that shows it.
- `partial`: done in some places, not others; the places of both.
- `missing`: not done; the place where it should be.
- `n/a`: does not apply, with why (the project type, or the feature is absent: no tools ⇒ the tool items are `n/a`).
- `not checked`: cannot be seen from the code (dashboards exist, data residency, judge calibrated), or outside the branch on a branch scan. Never a guess.

Which sections matter most by type (from the source): Backend all, preferring one wrapper that every call goes through (`failures.md` §10); Mobile G first, then M; Web frontend G (no key in the client bundle, `NEXT_PUBLIC_*` leaks), E6, C4 with Playwright; CLI / worker A, B, E (batches), F.

Every `partial` and `missing` item is a finding.

### 4. Ranks

`Critical`: data, money or key exposure, or an outage on the first 429. `High`, `Medium`, `Low` as the source's 🟠 🟡 ⚪. The rank of each item when missing is given in the appendix as a default; the reading may raise or lower it with a reason in `seen`.

Order: rank first; among equals, by area: security (G, M9–M10), failures (A), observability (B), tests and evals (C, D), cost (E), multi-agent (F), mobile client (M1–M8).

### 5. Keys

A key is shown only as its first 4 characters and `…`, everywhere: page, chat, findings file, temp files, and what the session reads. Only one mask, `scan/scripts/mask-keys.mjs`, looks at key-shaped text, in one pipeline for the code and one for history:

- The code: `git grep -nIE -A1 --untracked "$KEYS" | <mask> code`, with `KEYS='sk-(ant-|proj-|svcacct-|admin-|[A-Za-z0-9_-]{20})|(ANTHROPIC|OPENAI)[A-Z0-9_]*KEY'`, and the same with `--no-exclude-standard -- '.env*' '**/.env*'` for the ignored env files.
- History: `git log --all -p -G "$KEYS" --format='commit %h %ad' --date=short | <mask> history` (on a branch scan `<base>..HEAD`); only the `+` and `-` lines of each diff and the commit ids are kept.

The mask matches `sk-ant-`, `sk-proj-`, `sk-svcacct-` and `sk-admin-` keys, any other `sk-` key of 20 or more characters (legacy OpenAI), and the value given to a variable whose name holds `ANTHROPIC` or `OPENAI` and ends in `KEY`: assigned, a `??`/`||` fallback literal, or a JSON value on the next line. It tags each match `looks real`, `placeholder` (shorter than 20 characters after the prefix; contains `xxx`, `your`, `example`, `placeholder`, `fake`, `dummy` or `<`; one repeated character) or `reference` (`$…`, `${{ … }}`, `process.env…`, `os.environ…`), and prints it masked to its first 4 characters and `…`, with its length and an id (8 hex characters of a hash, the same in code and history). A file with a match, and any ignored `.env*` file, is read only through `<mask> show <path>`, which masks every key and every value of 8 or more characters and leaves references; every other search that prints code lines is piped through `<mask> show`. There is no other way to look: never Read, cat, grep without the mask, or `git show` a line that holds a key. A deep scan's subagent gets the keys section word for word and the mask's path, or does no work that touches keys.

A placeholder or a reference is not a key. A `looks real` key that ever reached history is leaked: the direction is "rotate it". An `EXPO_PUBLIC_*`, `NEXT_PUBLIC_*` or `react-native-config` variable, or the `extra` of `app.json` / `app.config.*`, that holds an AI key is G1 `Critical` whatever the literal next to it is: the build puts the value in the app. The page's `facts` say that the full secret search is `/scan security`.

### 6. The page

The findings file has `command: "ai"`, the shared fields, and per finding `kind` = the item id (`A2`) and `rank`. Sections:

1. `cards`: the findings, most serious first. A quick scan has only its 5 most important findings, in the findings file and on the page alike (as `scan/SKILL.md` and `fix/SKILL.md` say).
2. `table`: every item of the appendix, always all of them, even on a quick or branch scan: id, item (the item's text only, without the `[rank]` bracket and the file tags), mark, place or reason. On a quick scan an item that was read but left out of the top 5 keeps its mark with the reason "left out of the quick scan"; an item that was not read is `not checked`.
3. `table` "Already good": columns Id, Item, Where; one row per `ok` item.
4. `table` "Questions": columns Q, Id, Question; one row per `not checked` item that the user can answer.

Findings are only the `partial` and `missing` items. A whole absent area is one finding with `kind` the area letter and the covered ids in `seen`. `summary`: rank counts are findings; `ok`, `n/a`, `not checked` counts are items.

`facts`: project type, AI surface ("N call sites in M files"), the tooling found, what did not run.

### 7. The ending

Chat: a line per `Critical` and `High` finding (place and code name per chat line, never a key value), one line counting the rest, the questions (numbered), the top pick, then the shared ending lines. If the user answers a question, the item's mark changes in the findings file (in `<tmp>`), a new finding is added when the answer shows a gap, and the page is drawn again. Closing question: "What do we fix first?" A picked item gets `/fix ai` to copy.

## fix ai

It follows `fix/SKILL.md` step 1 (the findings) like every fix.

### The rule

A finding is **direct** when all three hold: the change touches at most two files, it needs no new package, and the code around it gets the same thing as before (same return type, same errors). Otherwise it is **discuss**. The rule wins over the lists below. One exception: E2 stays direct however many files hold the literal, as long as the other two clauses hold (no new package, callers get the same values).

Usually direct: E2 (model ids into one config, in however many files), E7 (`max_tokens` per call), A7 (tool failure as `is_error` result), A4 when the fix is one setting (`maxRetries: 0`), A9 (act on tool calls after the stream ends, in one function), E4 (move dynamic text after the cache breakpoint, add `cache_control`), G8 (a `permissions.deny` list in `.claude/settings.json`).

Usually discuss: the retry layer (A1–A3, A5), refusal handling (A6: callers get a new error), A8 (`Promise.all` → `Promise.allSettled` changes what callers get; direct only when the result never leaves the function, which already returns the same shape and errors; a concurrency limit that needs `p-limit` is always discuss), G2 (a key in history or in code: rotating and moving it is a design talk), all of B, C and D, E1, E3, E5, E6, E8, F, G1 (move the call to a backend), G3–G7, G9–G12, M.

### The plan

The shared plan, in two numbered groups, one numbering across both:

- **I fix these:** one line per change, as in `fix/SKILL.md` step 2.
- **We discuss these:** one line per finding (title, rank).

A group that is empty is left out of the plan and the question. End: "Do I go ahead with the first group? Answer yes, or yes except some numbers. Which of the second group do we design a fix for?"

### The work

The first group: `fix/SKILL.md` steps 3 to 5, using the matching file in `fix/reference/ai/` adapted to the project's names, paths and framework. Before writing code, check the library version in the project against current docs (Context7 or the vendor's docs). Python: the same fix, written in Python from the library's docs; the examples are TypeScript. One area at a time, the smallest diff first, the project's checks run after each area (from the source); the shared before and after checks still apply.

The second group: hand over as `fix/reference/handoff.md` says (`brainstorming` when it is available, otherwise the plan made in `fix`; the message with the hand-over starts with the report of the first group and names the skill; if the user declined the first group, the report says so and the hand-over still goes ahead), adding to the topic the paths (`<skills folder>/fix/reference/ai/<file>`) of the `fix/reference/ai/` files that cover each finding and the instruction to check package versions against current docs.

A leaked key: the report always says "Rotate the key; removing it from history is not enough", whatever was approved.

Keys: a key appears only as its first 4 characters and `…` in the plan, the hand-over file, the `brainstorming` topic and the report, and the topic tells `brainstorming` the same. A file that holds a key is read only through the scan's mask (`mask-keys.mjs show`), and the key's line is left as it is.

Nothing extra: a router, the batches API or multi-agent orchestration is proposed only when a finding shows the need.

## What changes from the source

1. Looking and changing are split into `scan ai` and `fix ai`.
2. It no longer starts on its own; `/scan` with no argument suggests it.
3. The report is the scan page; ranks are the scan words.
4. Contradictions: every item gets a mark and a place on the page (the table); "order by severity" is rank first, area second.
5. Items that cannot be seen from the code are `not checked` with a question, never guessed.
6. The `ai` package is matched by name, not by a word search.
7. Keys are never shown in full.
8. The full secret search is left to `/scan security`, the plain test gaps to `/scan tests`; `scan ai` checks only what is specific to AI code.
9. Example bugs fixed and examples changed:
   - `security.md`: the tool guard uses `os.homedir()` without importing `os`.
   - `backend-ts.md` §3 calls `dispatchTool(name, input)`, `security.md` defines `dispatchTool(name, input, ctx)`: one signature, the context passed through `runTool`.
   - `backend-ts.md` §10: `LlmService` reads `this.config` in a field initializer, which runs before the constructor's parameter properties are set under `useDefineForClassFields` (the default for modern targets): create the client in the constructor. The module also provides the `LlmTelemetry` it injects, and `onRetry` passes what `recordRetry` takes.
   - The retriable list: compare with what the current `@anthropic-ai/sdk` retries (408, 409, 429, 5xx at the time of writing) and match it; `isRetriable` obeys `x-should-retry` first, as the SDK does, and classifies a mid-stream `event: error` (no HTTP status) by its type.
   - `callWithRetry` gets `maxWaitMs`: a `retry-after` longer than that stops the loop instead of sleeping.
   - The client's `timeout: 60_000` is dropped: a timeout shorter than the answer turns every long call into retries; the SDK default (10 minutes) stays and long answers stream.
   - Streaming (§5): a broken stream becomes `StreamBroken` and the whole request is retried; an error in the UI callback is not a broken stream; `onRetry` lets the UI reset its partial text.
   - Multi-agent (§9): the token budget is checked before each worker starts, not after all have finished, and workers start through `pLimit(3)` so the budget can stop the rest.
   - Tool guard: `Object.hasOwn` for the allow-list and the guards (no `toString` tool); the refund guard refuses a missing, non-number, zero or negative amount before the $100 rule.
   - Claude Code settings: `MultiEdit` dropped from the hook matcher (the Claude Code docs call it a legacy tool and its tools reference no longer lists it); the sandbox wording says what it covers (`sandbox.enabled`, writes and network limited, reads open unless `denyRead`, shell only); a note that Bash calls carry no `file_path`.
   - `mobile.md`: missing helpers defined (`fetchWithTimeout` with its own `TimeoutError`, `TemporaryError`, `RefusedError`); a `retry-after` that is an HTTP-date falls back to 2 s; React Native mocking is msw 2 `msw/native` or a mocked `fetch` (msw 3 has no published RN package); keys are found through the scan's mask.
   - `testing.md`: msw 3's `onUnhandledFrame` (with the msw 2 name beside it), MSW started in a `setupFiles` module before the client exists, 408 and 409 in the retriable cases, the `llm.create(/*...*/)` stubs written out, Maestro's `extendedWaitUntil` for a wait longer than 7 s, and promptfoo's own `PROMPTFOO_PASS_RATE_THRESHOLD` instead of an undefined `scripts/check-eval.js`.
   - `observability.md`: `metricReaders` (the single `metricReader` is deprecated), `LOG_PROMPTS` defined, `Anthropic` types imported.
   - `security.md`: history scanned through the mask or `gitleaks git --redact`, never `git log -p -S` that prints the key.
   - `max_tokens` comments mark E7 in §6 and §7.
   - Package and API names (Langfuse, Better Stack, Sentry, OpenTelemetry, promptfoo, Helicone, msw, Maestro, gitleaks) checked against current docs at port time; the "check current docs" notes stay.
   - Checklist items the source's checklist did not have, taken from its reference files: what the SDK retries and unknown ⇒ terminal (A1), bounded concurrency (A8), partial UI text reset on retry (A9), the wrapper and a meaningful step name (B2), the request id from the HTTP layer (B3), refusals counted, not paged (B5), sizes and hashes instead of prompts (B6), the trace id returned to clients in `x-trace-id` (B7), one tracer provider (B11), the tool error case (C2), MSW set to error (C5), tool and temperature changes gated (D4), injection cases (D5), validated at boot and rotate when found (G2), deny over ask over allow (G4), protected agent config (G6), redacted arguments (G7), managed settings (G8), G10–G12, and the M list from `mobile.md`.
10. Python: the checklist applies; fixes are written from the library's docs.

## Tests

`tests/fixture-ai/` is laid over a fresh copy of `tests/fixture/` by a helper `plant_ai`, and committed as one commit on `main` (so the cases use `deep`). Its `package.json` adds `@anthropic-ai/sdk`; `run.sh` installs it into `tests/.cache/` when it is missing there, so the type check passes before any fix. It plants:

- `src/llm/support.ts`: a retry loop that catches everything and retries with no delay (A1–A3), SDK retries left on (A4), model id as a literal, also in a second file (E2), no `max_tokens` choice (E7).
- `src/llm/tools.ts`: a tool runner that returns empty content on error (A7).
- `src/llm/batch.ts`: a fan-out with `Promise.all` (A8).
- `mobile/src/api/claude.ts`: `EXPO_PUBLIC_ANTHROPIC_KEY` read in client code, with a fake key `sk-ant-api03-FAKE…` as its fallback literal (G1: the build bundles the variable's value, whatever the literal is). The literal stays fake (the mask tags it `placeholder`): a real-looking key would trip GitHub's secret scanning on push.

Cases in `tests/run.sh`:

1. `scan_ai`: `/scan ai deep`. The findings file has an A3 (or A) finding on `src/llm/support.ts`, an A7 (or A) finding on `src/llm/tools.ts` and a `Critical` G1 (or G) finding on `mobile/src/api/claude.ts`; the log names `Promise.all` and the app file; the findings file's table has every id of the appendix; the log, the findings file and the page never contain `sk-ant-` followed by a letter or digit; a page is drawn; the project is unchanged.
2. `scan_ai_none`: `/scan ai deep` on the plain fixture. Says there are no AI calls; no page; unchanged.
3. `fix_ai`: `/fix ai deep`. A plan with two groups; nothing changed before the answer. After "да": the model ids are in one place, the tool error is an `is_error` result, the code still type-checks, the second group went to `brainstorming` (the log names it), nothing committed, and neither the log nor a `fix-ai-*.json` hand-over file made during the case contains `sk-ant-` followed by a letter or digit.
4. `scan_menu_ai`: `/scan` on the planted fixture suggests `ai`.

## Independent verification

After the build, a fresh subagent that did not write the port compares the source with the port item by item: every checklist item, every rule, every code example, every playbook step, every table row of the five reference files. It reports anything missing, changed in meaning, or still buggy, and runs `bash tests/run.sh _ai`. Fix and run a new auditor until one reports clean.

## Appendix: the checklist

Default rank when missing in brackets. `failures.md`, `observability.md` and the others are the files in `fix/reference/ai/`.

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

**C. Tests** (`testing.md`). C covers tests of the AI code; other test gaps are `/scan tests`.
- C1 Unit tests for pure logic: parsers, router, cost, guards [Medium]
- C2 Failure-path tests with a mocked API: 429 then success, 400 no retry, refusal, timeout, budget exhausted, tool error [High]
- C3 Integration tests at the seams: LLM output → parser → DB or tool [Medium]
- C4 E2E: supertest (backend), Maestro or Detox (mobile), Playwright (web) [Low]
- C5 Tests never hit the real API by default (MSW set to error on an unhandled request: `onUnhandledFrame` on msw 3, `onUnhandledRequest` on msw 2; started before the SDK client is made: a Vitest `setupFiles` module, or a lazy client) [High]

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
- M8 Tests: UI states (loading, streaming, error, refused), mocked network (msw 2 `msw/native` or a mocked `fetch`; msw 3 has no published React Native package yet), Maestro flows on a mocked backend [Medium]
- M9 Tokens in Keychain or Keystore, not AsyncStorage [High]
- M10 No prompts or answers in device logs in release builds [Medium]
