# Failures, cost and orchestration (TypeScript)

Adapt names/paths to the repo. All snippets assume `@anthropic-ai/sdk`. Model IDs are examples — confirm current IDs at platform.claude.com.

## Contents
1. Errors & classification
2. Retry with backoff
3. Refusal & tool results
4. Batch loop isolation
5. Streaming with tools
6. Prompt caching
7. Batches API
8. Model config & router
9. Multi-agent orchestration
10. NestJS module wiring

---

## 1. Errors & classification

```ts
// llm/errors.ts
import { APIError, APIConnectionError } from '@anthropic-ai/sdk';

// What @anthropic-ai/sdk itself retries: 408, 409, 429 and every 5xx (529 = overloaded); it also obeys an `x-should-retry` header from the API, which wins over the status.
export const RETRIABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);
export const TERMINAL = new Set([400, 401, 403, 404]);

export class ModelRefused extends Error { name = 'ModelRefused'; }
export class RetryBudgetExhausted extends Error {
  name = 'RetryBudgetExhausted';
  constructor(public lastError: unknown) { super('Retry budget exhausted'); }
}
export class StreamBroken extends Error {             // a stream that died mid-response (§5): retried as a whole
  name = 'StreamBroken';
  constructor(public streamError: unknown) { super('Stream broke mid-response'); }
}

export function isRetriable(e: unknown): boolean {
  if (e instanceof StreamBroken) return true;
  if (e instanceof APIConnectionError) return true;   // check BEFORE APIError (it extends it, status undefined)
  // A mid-stream `event: error` is an APIError with no HTTP status; its type says whether a retry can help.
  // (APIUserAbortError also has no status and type null, so a user's cancel is not retried.)
  if (e instanceof APIError && e.status === undefined) return e.type === 'overloaded_error' || e.type === 'api_error' || e.type === 'timeout_error';
  if (e instanceof APIError) return !!e.status && (RETRIABLE.has(e.status) || e.status >= 500);
  return false;                                        // unknown ⇒ treat as terminal, fail loud
}

export function retryAfterMs(e: unknown): number | null {
  if (!(e instanceof APIError)) return null;
  const h = e.headers as any;
  const raw = typeof h?.get === 'function' ? h.get('retry-after') : h?.['retry-after'];
  const sec = Number(raw);
  return raw && !Number.isNaN(sec) ? sec * 1000 : null;
}
```

Rule: unsure ⇒ terminal. A wrongly-terminal error fails loudly and gets fixed; a wrongly-retriable one hammers the API and hides the bug.

## 2. Retry with backoff

```ts
// llm/retry.ts
import { isRetriable, retryAfterMs, RetryBudgetExhausted } from './errors';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt: number, baseMs = 1000, capMs = 30_000) =>
  Math.min(capMs, 2 ** attempt * baseMs) + Math.random() * baseMs;   // exp + jitter

export async function callWithRetry<T>(
  makeCall: () => Promise<T>,
  {
    maxAttempts = 5,
    maxWaitMs = 60_000,
    onRetry,
  }: { maxAttempts?: number; maxWaitMs?: number; onRetry?: (e: unknown, attempt: number, delay: number) => void } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await makeCall();
    } catch (e) {
      if (!isRetriable(e)) throw e;           // 400/401/403/404/refusal/bugs — straight up
      lastError = e;
      if (attempt === maxAttempts - 1) break;
      const delay = retryAfterMs(e) ?? backoff(attempt);
      if (delay > maxWaitMs) break;           // a retry-after longer than we will wait: stop now, throw RetryBudgetExhausted
      onRetry?.(e, attempt, delay);           // log/metric each retry
      await sleep(delay);
    }
  }
  throw new RetryBudgetExhausted(lastError);
}
```

Client must not retry on top of this:
```ts
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
```
Keep the SDK's timeout (10 minutes by default; for a call that is not streamed it also refuses a `max_tokens` too large to finish in that time). A timeout shorter than the answer turns every long call into retries; stream long answers instead.
Alternative: keep SDK retries (`maxRetries: 2`) and write NO own loop — only app-level fallbacks. Never both.

Anti-patterns to flag: `catch (e) { /* retry */ }` without classification · `sleep(0)` / no delay · nested retry loops · `let resp = null` used after loop.

## 3. Refusal & tool results

```ts
// llm/call.ts
import Anthropic from '@anthropic-ai/sdk';
import { ModelRefused } from './errors';

export function assertNotRefused(resp: Anthropic.Message) {
  if (resp.stop_reason === 'refusal') throw new ModelRefused('Model refused');  // 200 at HTTP level — not retriable
  return resp;
}

export function firstText(resp: Anthropic.Message): string {
  const block = resp.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text block in response');
  return block.text;
}
```

Tool execution — surface errors, never return empty:
```ts
import { dispatchTool, type Ctx } from './tools';   // the dispatcher and its guard: security.md §2

export async function runTool(toolUse: Anthropic.ToolUseBlock, ctx: Ctx): Promise<Anthropic.ToolResultBlockParam> {
  try {
    const result = await dispatchTool(toolUse.name, toolUse.input, ctx);
    return { type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) };
  } catch (e) {
    return {
      type: 'tool_result',
      tool_use_id: toolUse.id,
      is_error: true,
      content: `Tool failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
```
An empty result is read by the model as valid data ⇒ confident wrong answer.

## 4. Batch loop isolation

```ts
// `anthropic` is the client from §2; callWithRetry: llm/retry.ts; assertNotRefused, firstText: llm/call.ts; ModelRefused, RetryBudgetExhausted: llm/errors.ts
type Result<I> =
  | { item: I; status: 'ok'; text: string }
  | { item: I; status: 'refused' | 'failed'; error?: string };

export async function processBatch<I>(items: I[], build: (i: I) => Anthropic.MessageCreateParamsNonStreaming) {
  const out: Result<I>[] = [];
  for (const item of items) {
    try {
      const resp = assertNotRefused(await callWithRetry(() => anthropic.messages.create(build(item))));
      out.push({ item, status: 'ok', text: firstText(resp) });
    } catch (e) {
      if (e instanceof ModelRefused) out.push({ item, status: 'refused' });
      else if (e instanceof RetryBudgetExhausted) out.push({ item, status: 'failed', error: String(e.lastError) });
      else throw e;   // terminal 4xx = our bug, fail loud
    }
  }
  return out;
}
```
For concurrency use `p-limit` (e.g. 5) — unbounded `Promise.all` over 1000 items is a self-inflicted 429.

## 5. Streaming with tools

Text can go to the UI immediately; tool calls only after the stream closes.
```ts
// `anthropic` is the client from §2; callWithRetry: llm/retry.ts; assertNotRefused: llm/call.ts
// usage: streamAnswer(params, (t) => appendPartialText(t), { onRetry: () => resetPartialText() })
import Anthropic, { AnthropicError, APIError } from '@anthropic-ai/sdk';
import { StreamBroken } from './errors';

export async function streamAnswer(
  params: Anthropic.MessageStreamParams,
  onText: (t: string) => void,
  { onRetry }: { onRetry?: (e: unknown, attempt: number, delay: number) => void } = {},   // clear partial text here
) {
  return callWithRetry(async () => {
    let ui: { error: unknown } | undefined;
    const stream = anthropic.messages.stream(params);
    stream.on('text', (t) => { try { onText(t); } catch (e) { ui ??= { error: e }; } });   // a bug in our UI code is not a broken stream
    try {
      const final = await stream.finalMessage();          // SDK accumulates input_json deltas
      if (ui) throw ui.error;
      const toolCalls = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      return { final: assertNotRefused(final), toolCalls };
    } catch (e) {
      if (ui) throw ui.error;                             // a UI error wins, even when the stream also broke
      // A socket/body failure mid-stream comes out of MessageStream as a plain AnthropicError, not an APIError.
      if (e instanceof AnthropicError && !(e instanceof APIError)) throw new StreamBroken(e);
      throw e;
    }
  }, { onRetry });
}
```
Broken mid-stream ⇒ the whole request is retried; never pass partial output or partial tool input downstream. If the UI already showed partial text, reset it on retry.

## 6. Prompt caching

```ts
// `anthropic` is the client from §2, MODELS is llm/models.ts; TOOLS, SYSTEM_PROMPT and userMessage are the project's own
const resp = await anthropic.messages.create({
  model: MODELS.default,
  max_tokens: 1024,                                      // sized to the answer this call gives (E7)
  tools: TOOLS,                                          // stable → cached (tools come before system)
  system: [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },   // breakpoint
  ],
  messages: [
    { role: 'user', content: `Today: ${new Date().toISOString()}\n\n${userMessage}` },  // dynamic AFTER breakpoint
  ],
});
// verify: resp.usage.cache_read_input_tokens > 0 on 2nd+ call
```
Economics: write 1.25x (5-min TTL) / 2x (1-hour), read 0.1x. Pays off only when the same prefix recurs within TTL and exceeds the model's minimum cacheable length.
Flag: timestamps, user ids, A/B text, or shuffled tool order *before* the breakpoint — cache never hits.

## 7. Batches API (non-urgent volume)

```ts
// `anthropic` is the client from §2, MODELS is llm/models.ts; reviews, CACHED_SYSTEM, save and markFailed are the project's own
const batch = await anthropic.messages.batches.create({
  requests: reviews.map((r) => ({
    custom_id: r.id,
    params: { model: MODELS.cheap, max_tokens: 64, system: CACHED_SYSTEM, messages: [{ role: 'user', content: r.text }] },
  })),                                                   // a label needs few tokens: max_tokens set for what the call returns (E7)
});

// later (cron/poller)
const status = await anthropic.messages.batches.retrieve(batch.id);
if (status.processing_status === 'ended') {
  for await (const row of await anthropic.messages.batches.results(batch.id)) {
    if (row.result.type === 'succeeded') save(row.custom_id, row.result.message);
    else markFailed(row.custom_id, row.result.type);    // errored | canceled | expired
  }
}
```
User waiting ⇒ stream. Nobody waiting (cron, backfill, nightly report) ⇒ batch. Batch + caching compound.

## 8. Model config & router

```ts
// llm/models.ts — one place to change after an eval
export const MODELS = {
  cheap: 'claude-haiku-5-5',
  default: 'claude-sonnet-5-5',
  strong: 'claude-opus-5-5',
} as const;

export type TaskType = 'classify' | 'extract' | 'chat' | 'summarize' | 'code_review';

const BY_TASK: Record<TaskType, keyof typeof MODELS> = {
  classify: 'cheap', extract: 'cheap', chat: 'default', summarize: 'default', code_review: 'strong',
};

export function pickModel(task: TaskType, input: string): string {
  if (input.length > 50_000) return MODELS.strong;   // cheap signal
  return MODELS[BY_TASK[task]];
}
```
Task type comes from the endpoint/feature calling it (a constant), an explicit client flag, or cheap heuristics. A classifier LLM call is a last resort.
Rule: start at default; move up/down only when the eval says so. Uniform traffic ⇒ pin one model, no router.

## 9. Multi-agent orchestration

Use only when subtasks are independent (multi-source research). Not for sequential chains (debugging, coding). Expect ~15x tokens vs single chat.

```ts
// `lead`, `worker` and `Subtask` are the project's own; `pLimit` comes from `p-limit`.
export async function orchestrate(task: string, { maxTokensBudget = 200_000 } = {}) {
  const plan = await lead.plan(task);                                   // strong model
  let spent = 0;
  const runWorker = async (s: Subtask) => {
    if (spent >= maxTokensBudget) throw new Error('Orchestration token budget exceeded');   // stops workers not yet started
    const resp = await callWithRetry(() => worker.run(s));             // cheap model, own retry each
    spent += resp.usage.input_tokens + resp.usage.output_tokens;
    return resp;
  };
  const limit = pLimit(3);                                              // a cap only works when workers start in turns
  const settled = await Promise.allSettled(plan.subtasks.map((s) => limit(() => runWorker(s))));
  const ok = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const failed = settled.filter((r) => r.status === 'rejected').length;
  return lead.synthesize(ok, { failedSubtasks: failed });              // lead knows what's missing
}
```
Flag: `Promise.all` (one failure kills all), no per-worker retry, no budget cap, fan-out on a single lookup · a budget checked only after every worker has finished (the money is already spent)

## 10. NestJS module wiring

```ts
// llm/llm.module.ts
@Global()
@Module({ providers: [LlmService, LlmTelemetry], exports: [LlmService] })
export class LlmModule {}

// llm/llm.telemetry.ts — the wrappers from observability.md
@Injectable()
export class LlmTelemetry {
  trace<T extends Anthropic.Message>(step: string, model: string, call: () => Promise<T>) { return traced(step, model, call); }
  retry(step: string, e: unknown) { recordRetry(step, e); }
}

// llm/llm.service.ts
@Injectable()
export class LlmService {
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService, private readonly telemetry: LlmTelemetry) {
    // In the constructor, not a field initializer: with useDefineForClassFields (the default for ES2022+ targets)
    // fields are set before parameter properties, so `this.config` would still be undefined there.
    this.client = new Anthropic({ apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY'), maxRetries: 0 });
  }

  async create(step: string, task: TaskType, params: Omit<Anthropic.MessageCreateParamsNonStreaming, 'model'>) {
    const model = pickModel(task, JSON.stringify(params.messages));
    return this.telemetry.trace(step, model, () =>
      callWithRetry(() => this.client.messages.create({ ...params, model }), {
        onRetry: (e) => this.telemetry.retry(step, e),
      }),
    ).then(assertNotRefused);
  }
}
```
Business services only call `llm.create(...)` and decide what to do with `ModelRefused` / `RetryBudgetExhausted`. Map them in an exception filter: refusal → 422, budget exhausted → 503 with `Retry-After`.
