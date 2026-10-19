# Observability: tracing, metrics, cost

Goal: every LLM call answers "which step, which feature, how many tokens, how long, did it fail" — so a cost or latency spike becomes a sortable row, not an invoice mystery.

## Tool choice
| Situation | Use |
|---|---|
| Default for LLM apps | **Langfuse** (OSS, self-host or cloud; accepts OpenTelemetry) |
| Company already on Datadog/Grafana/Honeycomb | **OpenTelemetry** spans → existing backend |
| Zero-code quick start | **Helicone** proxy (change `baseURL`; all traffic goes via a third party — check data policy) |
| Errors/crashes | **Sentry** (backend + RN), tag with trace id |

Write instrumentation against OpenTelemetry API so the backend is swappable.

## Per-call wrapper (OTel)

```ts
// llm/telemetry.ts
import type Anthropic from '@anthropic-ai/sdk';
import { trace, SpanStatusCode, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('llm');
const meter = metrics.getMeter('llm');
const tokens = meter.createCounter('llm.tokens', { unit: 'token' });
const latency = meter.createHistogram('llm.latency', { unit: 'ms' });
const errors = meter.createCounter('llm.errors');
const retries = meter.createCounter('llm.retries');

export async function traced<T extends Anthropic.Message>(step: string, model: string, call: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`llm.${step}`, async (span) => {
    span.setAttributes({ 'llm.step': step, 'llm.model': model });
    const start = performance.now();
    try {
      const resp = await call();
      const u = resp.usage;
      span.setAttributes({
        'llm.tokens.input': u.input_tokens,
        'llm.tokens.output': u.output_tokens,
        'llm.tokens.cache_read': u.cache_read_input_tokens ?? 0,
        'llm.tokens.cache_write': u.cache_creation_input_tokens ?? 0,
        'llm.stop_reason': resp.stop_reason ?? 'unknown',
        'llm.cost_usd': estimateCost(model, u),
      });
      tokens.add(u.input_tokens, { step, model, kind: 'input' });
      tokens.add(u.output_tokens, { step, model, kind: 'output' });
      return resp;
    } catch (e: any) {
      errors.add(1, { step, model, status: String(e?.status ?? 'unknown') });
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw e;
    } finally {
      latency.record(performance.now() - start, { step, model });
      span.end();
    }
  });
}

export const recordRetry = (step: string, e: any) => retries.add(1, { step, status: String(e?.status ?? 'conn') });
```

Order matters: `traced(() => callWithRetry(...))` measures user-felt latency including waits; wrap the other way to measure each attempt. Pick one deliberately; also count retries separately.

Also span each tool execution (`tool.<name>`) under the same parent so the trace shows LLM → tool → LLM.

## Cost estimate

```ts
// $ per 1M tokens, per model, kept in config. Confirm every number on the pricing page
// (platform.claude.com/docs/en/about-claude/pricing): the cache-read share differs by model, 5-minute and
// 1-hour cache writes cost differently, and some models price a long prompt higher.
type Price = { in: number; out: number; cacheRead: number; cacheWrite5m: number; cacheWrite1h: number };
const PRICE: Record<string, Price> = {
  'claude-opus-5-5':   { in: 4,   out: 20,  cacheRead: 0.20, cacheWrite5m: 5,     cacheWrite1h: 8 },     // confirm on the pricing page
  'claude-sonnet-5-5': { in: 2,   out: 10,  cacheRead: 0.10, cacheWrite5m: 2.50,  cacheWrite1h: 4 },     // confirm on the pricing page
  'claude-haiku-5-5':  { in: 0.10, out: 0.50, cacheRead: 0.01, cacheWrite5m: 0.125, cacheWrite1h: 0.20 }, // prompts up to 100,000 tokens
};
// A model priced by prompt length: above `over` input tokens (cache reads and writes included) the whole request costs more.
const LONG_PROMPT: Record<string, { over: number; price: Price }> = {
  'claude-haiku-5-5': { over: 100_000, price: { in: 0.50, out: 2.50, cacheRead: 0.05, cacheWrite5m: 0.625, cacheWrite1h: 1 } },   // confirm on the pricing page
};

export function estimateCost(model: string, u: Anthropic.Usage) {
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const write5m = u.cache_creation?.ephemeral_5m_input_tokens ?? u.cache_creation_input_tokens ?? 0;   // no split given: count all as 5-minute
  const write1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const prompt = u.input_tokens + cacheRead + write5m + write1h;
  const long = LONG_PROMPT[model];
  const p = long && prompt > long.over ? long.price : PRICE[model];
  if (!p) return 0;                                    // an unknown model: add it to PRICE rather than guess
  return (
    (u.input_tokens * p.in + cacheRead * p.cacheRead + write5m * p.cacheWrite5m + write1h * p.cacheWrite1h + u.output_tokens * p.out) / 1e6
  );
}
```

## What to check in an audit
- Every `messages.create` / `stream` / batch result passes through the wrapper (grep for raw calls outside `llm/`).
- `step` names are meaningful (feature-level), not `"call1"`.
- Request id / trace id propagated from HTTP layer (NestJS: interceptor or OTel auto-instrumentation `@opentelemetry/instrumentation-nestjs-core`, `-http`).
- Dashboards/queries exist for: tokens by step, p95 latency by step, error rate by status, cache hit ratio, cost per feature per day.
- Prompts/outputs logged only if data policy allows; otherwise log sizes and hashes.
- Alerts: error rate spike, p95 over the reliability floor, daily cost over budget.

## Reliability floor (define before cutting cost)
Write down per feature: latency ceiling (e.g. p95 < 4s), retry budget (≤3), min eval score. Every cost change (cheaper model, fewer retries, shorter prompt) must keep all three — verified by metrics + eval, not by feel.

---

# Setup playbook

When observability is missing, don't stop at "add tracing" — give the user these steps adapted to their stack, then offer to apply them. Package APIs evolve: before writing code, check current docs (Context7 / vendor docs) for the exact version in the repo.

## Default stacks — use these, don't re-research
Detect team context from the repo (CODEOWNERS, contributors count, existing vendor SDKs/config) or ask once. Then recommend the matching row as-is; only deviate if the repo already uses something else.

| Situation | Errors | LLM traces | Logs | Uptime / crons | Infra traces & metrics |
|---|---|---|---|---|---|
| **Solo / small team (default)** | Sentry | Langfuse Cloud | **Better Stack** (pino transport) | **Better Stack** uptime monitors + heartbeats | Sentry performance is enough |
| Growing team, many services | Sentry | Langfuse | Grafana Cloud Loki or Better Stack | Better Stack | Grafana Cloud (Tempo + Prometheus) via OTel |
| Company already on an APM | keep theirs + Sentry if absent | Langfuse | their APM | their APM | their APM via OTel |
| Regulated / data must stay in-house | Sentry self-hosted | Langfuse self-hosted | self-hosted (Loki) | self-hosted | OTel → in-house collector |

Why the solo default: modern readable UIs, generous free tiers, minutes to set up, and everything is OTel/pino-based so moving later is a config change. Free-tier limits change — mention checking them, don't quote numbers.

## Logging (all paths): pino + trace ids
```bash
npm i nestjs-pino pino-http pino @logtail/pino
npm i -D pino-pretty
```
```ts
// app.module.ts
LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie', '*.apiKey', '*.password'],
    transport:
      process.env.NODE_ENV === 'production'
        ? {
            target: '@logtail/pino',                     // Better Stack
            options: {
              sourceToken: process.env.BETTERSTACK_SOURCE_TOKEN,
              options: { endpoint: `https://${process.env.BETTERSTACK_INGESTING_HOST}` },
            },
          }
        : { target: 'pino-pretty' },                     // readable local logs
  },
}),
```
```ts
// main.ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));                          // from nestjs-pino
```
- Trace correlation: with OTel `getNodeAutoInstrumentations()` running, the pino instrumentation adds `trace_id` / `span_id` to every log line automatically → search Better Stack by `trace_id` from a Langfuse/Sentry trace.
- Log LLM events as structured fields, not sentences: `logger.info({ step, model, inputTokens, outputTokens, latencyMs, status }, 'llm.call')`.
- Return the trace id to clients (`x-trace-id` response header) so a user/bug report maps straight to logs.
- Source token + ingesting host come from the Better Stack source settings; keep them in env/secret manager.

## Uptime & cron heartbeats (Better Stack)
- Uptime monitor on `GET /health` (NestJS `@nestjs/terminus`): checks DB, Redis, and optionally a cheap Anthropic reachability probe — don't burn tokens every minute; ping the API host or check recent success metrics instead.
- **Heartbeat** for every cron / batch job (nightly Batches API run, backfills): job calls the heartbeat URL on success; Better Stack alerts if it doesn't arrive on schedule. This catches "the nightly batch silently stopped a week ago."
```ts
await runNightlyBatch();
await fetch(process.env.BETTERSTACK_HEARTBEAT_URL!);   // only on success
```
- Alerts to wherever you actually look (Telegram/Slack/email/phone app).

## Step 0 — pick a path (ask if unclear)
| Question | Path |
|---|---|
| Company already has Datadog / Grafana / Honeycomb / New Relic? | **B: OTel → existing backend** |
| No APM, want LLM-specific views (prompts, generations, cost, evals) | **A: Langfuse** (cloud or self-host) |
| Need something in 5 minutes, data may go via a proxy | **C: Helicone** |
| Always, in addition | **Sentry** for errors/crashes (backend + mobile) |

A and B combine: Langfuse is an OTel span processor, so spans can go to both.

## Path A — Langfuse (NestJS / Node)

1. Install:
```bash
npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @langfuse/otel @langfuse/tracing
```
2. Env (secrets manager in prod; `LANGFUSE_BASE_URL` picks region: EU `https://cloud.langfuse.com`, US `https://us.cloud.langfuse.com`, or your self-hosted URL):
```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```
3. `src/instrumentation.ts`:
```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  environment: process.env.NODE_ENV ?? 'development',
  // exportMode: 'immediate',   // serverless / short-lived workers
});

export const otelSdk = new NodeSDK({
  spanProcessors: [langfuseSpanProcessor],
  instrumentations: [getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } })], // http, express, nestjs, pg, redis…
});
otelSdk.start();
```
4. `src/main.ts` — **first line**, before anything else:
```ts
import './instrumentation';
import { NestFactory } from '@nestjs/core';
// ...
app.enableShutdownHooks();   // so OnApplicationShutdown can flush
```
5. Flush on shutdown (NestJS):
```ts
@Injectable()
export class TelemetryShutdown implements OnApplicationShutdown {
  async onApplicationShutdown() { await otelSdk.shutdown(); }   // flushes pending spans
}
```
Serverless/cron: `await langfuseSpanProcessor.forceFlush()` before the handler returns, or spans are lost.

6. Record each Claude call as a **generation** (gives model, tokens, cost in Langfuse UI):
```ts
import { startActiveObservation } from '@langfuse/tracing';
import type Anthropic from '@anthropic-ai/sdk';

const LOG_PROMPTS = process.env.LOG_PROMPTS === 'true';   // prompts and answers only where the data policy allows

export function tracedGeneration(step: string, model: string, input: unknown, call: () => Promise<Anthropic.Message>) {
  return startActiveObservation(step, async (gen) => {
    gen.update({ model, input: LOG_PROMPTS ? input : '[redacted]' });
    const resp = await call();
    gen.update({
      output: LOG_PROMPTS ? resp.content : '[redacted]',
      usageDetails: {
        input: resp.usage.input_tokens,
        output: resp.usage.output_tokens,
        cache_read_input_tokens: resp.usage.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens: resp.usage.cache_creation_input_tokens ?? 0,
      },
      metadata: { stop_reason: resp.stop_reason },
    });
    return resp;
  }, { asType: 'generation' });
}
```
Tools: same with `{ asType: 'tool' }`; the whole agent loop: `{ asType: 'agent' }` as parent. Plug `tracedGeneration` into `LlmService.create` instead of / next to the plain OTel wrapper.

7. Verify: send one real request → in Langfuse see one trace: HTTP span → agent → generation(s) → tool(s), with tokens and cost filled. If cost is 0, add/check the model price definition in Langfuse settings.

Self-host: Langfuse ships a Docker Compose setup — use it when data must stay in-house (regulated customers).

## Path B — OTel to existing APM

```bash
npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
      @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http @opentelemetry/sdk-metrics
```
```ts
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

export const otelSdk = new NodeSDK({
  serviceName: 'support-api',
  traceExporter: new OTLPTraceExporter(),          // OTEL_EXPORTER_OTLP_ENDPOINT / _HEADERS from env
  metricReaders: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() })],   // `metricReader` (one) is deprecated
  instrumentations: [getNodeAutoInstrumentations()],
});
```
Use the `traced()` wrapper from the top of this file. Prefer OTel GenAI semantic-convention attribute names (`gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`) — APMs increasingly render them natively; keep custom `llm.*` only for extras like cost/cache.

## Path C — Helicone (fastest, least control)
```ts
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://anthropic.helicone.ai',
  defaultHeaders: { 'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}` },
});
```
All prompts transit a third party — confirm with data policy; not for regulated customers without review. Confirm current base URL/header in Helicone docs.

## Sentry (errors)
Backend (NestJS):
```bash
npm i @sentry/nestjs
```
```ts
// src/instrument.ts — imported first in main.ts
import * as Sentry from '@sentry/nestjs';
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
```
Add `SentryModule.forRoot()` to `AppModule` and the Sentry global exception filter. Capture `RetryBudgetExhausted` and unexpected 4xx; don't page on `ModelRefused` (log it, count it).
⚠️ Sentry's Node SDK sets up its own OpenTelemetry. If you also run a NodeSDK (Path A/B), follow Sentry's "custom OpenTelemetry setup" docs so there's one tracer provider — two competing setups = missing spans.

Mobile (RN/Expo): `@sentry/react-native` via its wizard (`npx @sentry/wizard -i reactNative`); upload source maps in CI; pass the backend trace id (response header) into the Sentry scope so app and backend events link.

## Profiling (when latency isn't the LLM)
Traces say *which step* is slow; profilers say *why* inside your code.
- Node: `node --cpu-prof dist/main.js` → open `.cpuprofile` in Chrome DevTools; or `npx clinic doctor -- node dist/main.js` for event-loop blocking; Sentry profiling if Sentry is in place.
- Typical findings: sync JSON parsing of huge tool results, unbounded `Promise.all`, N+1 DB calls inside tools, blocking crypto/zlib.
- RN: React Native DevTools / Hermes sampling profiler; measure time-to-first-token on device separately from backend latency.

## Dashboards & alerts (minimum)
Build these once tracing is live:
| Panel | Query by |
|---|---|
| Cost/day per feature (`step`) | sum `llm.cost_usd` |
| Tokens by step & model | sum input/output/cache tokens |
| p50/p95 latency per step | histogram `llm.latency` |
| Error rate by status (429/529/5xx/4xx) | `llm.errors` / calls |
| Retries per step | `llm.retries` |
| Cache hit ratio | cache_read / (cache_read + input) |
| Refusal count | stop_reason = refusal |

Alerts: p95 over the reliability floor · error rate > X% for 5 min · daily cost > budget · cache hit ratio drops sharply (someone put a timestamp before the breakpoint).

## Done when
- [ ] One request = one trace with nested HTTP → LLM → tool spans
- [ ] Every generation has model, tokens (incl. cache), cost
- [ ] Spans flushed on shutdown / end of serverless invocation
- [ ] Errors in Sentry carry the trace id
- [ ] Dashboards above exist; alerts wired to a channel someone reads
- [ ] Prompt/PII logging matches data policy (`LOG_PROMPTS` flag)
