# Mobile (React Native / Expo)

## 🔴 Rule zero: no API key in the app
Anything in the bundle is public: `.env` via `react-native-config`, `EXPO_PUBLIC_*`, `app.config.js` extra, hardcoded strings. Anyone can unzip the IPA/APK and use your key.

Detect: grep for `@anthropic-ai/sdk`, `api.anthropic.com`, `sk-ant-`, `ANTHROPIC` in the app package.
Fix: app → **own backend** (auth'd) → Claude. Backend applies everything from failures.md (retry, telemetry, guards, rate limit per user). If a key shipped: rotate it.

## Client ↔ backend resilience
The app talks to your backend, not Claude. Still needed:

```ts
// api/llmClient.ts
export class TemporaryError extends Error {
  constructor(public retryAfterSec: number) { super('Temporarily unavailable'); }
}
export class RefusedError extends Error {}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  init.signal?.addEventListener('abort', () => ctrl.abort());   // the screen's own cancel still works
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(timer); }
}

export async function ask(question: string, signal?: AbortSignal) {
  const res = await fetchWithTimeout(`${API}/support/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
    body: JSON.stringify({ question }),
    signal,
  }, 30_000);

  if (res.status === 503 || res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after') ?? 2);
    throw new TemporaryError(retryAfter);          // UI: "busy, retrying…" + backoff, max 2–3
  }
  if (res.status === 422) throw new RefusedError(); // UI: friendly "can't help with that"
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```
- Timeouts + `AbortController` (cancel on screen unmount).
- Offline: check NetInfo; queue or show state — don't spin forever.
- Don't double-retry: if the backend retries Claude, the app retries only its own network hop, a little.
- Streaming: SSE/chunked via `react-native-sse` or `fetch` streaming (Expo SDK supports it on newer versions); render tokens as they arrive; on drop, reset partial text and retry the whole request.
- Rate-limit per user on the backend so one client loop can't burn the budget.

## Observability
- **Sentry** (`@sentry/react-native`): crashes + JS errors + performance; tag with backend trace id returned in a response header so app ↔ backend traces join.
- Track client-side: time to first token, total response time, error type shown to user.

## Tests
- Unit: Jest (RN default) + `@testing-library/react-native` for the chat UI states (loading, streaming, error, refused).
- Mock network: MSW (`msw/native`) — test 503→retry, 422→refusal UI, timeout.
- E2E: Maestro flows against a backend with mocked LLM (see testing.md).

## Security extras
- Store tokens in Keychain/Keystore (`expo-secure-store`, `react-native-keychain`), not AsyncStorage.
- Don't log prompts/responses to device logs in release builds.
- Content the app sends (user text, pasted docs, images) is untrusted for the backend agent — same guards apply server-side.
