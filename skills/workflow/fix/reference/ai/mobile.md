# Mobile (React Native / Expo)

## 🔴 Rule zero: no API key in the app
Anything in the bundle is public: `.env` via `react-native-config`, `EXPO_PUBLIC_*`, `app.config.js` extra, hardcoded strings. Anyone can unzip the IPA/APK and use your key.

Detect: in the app package, grep for `@anthropic-ai/sdk` and `api.anthropic.com`; find keys and key variables only through the scan's mask, which never prints one: `git grep -nIE -A1 --untracked "$KEYS" -- <app folder> | node "<skills folder>/scan/scripts/mask-keys.mjs" code`, and its git-ignored env files: `git grep -nIE -A1 --untracked --no-exclude-standard "$KEYS" -- '<app folder>/.env*' '<app folder>/**/.env*' '<app folder>/*.env' '<app folder>/**/*.env' | node "<skills folder>/scan/scripts/mask-keys.mjs" code` (`KEYS` as the scan's `ai` reference §5 gives it). Read `app.json` / `app.config.*` (their `extra`) only through `node "<skills folder>/scan/scripts/mask-keys.mjs" show <path>`.
Fix: app → **own backend** (auth'd) → Claude. Backend applies everything from failures.md (retry, telemetry, guards, rate limit per user). If a key shipped: rotate it.

## Client ↔ backend resilience
The app talks to your backend, not Claude. Still needed:

```ts
// api/llmClient.ts — API (backend base URL) and getToken are the project's own
export class TemporaryError extends Error {
  constructor(public retryAfterSec: number) { super('Temporarily unavailable'); }
}
export class RefusedError extends Error {}
export class TimeoutError extends Error {}           // our time limit ran out (a screen's cancel stays an AbortError)

// `read` gets the response inside the time limit: the limit and the screen's cancel cover the body too, not only the headers.
async function fetchWithTimeout<T>(url: string, init: RequestInit, ms: number, read: (res: Response) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, ms);
  const onAbort = () => ctrl.abort();                 // the screen's own cancel still works
  if (init.signal?.aborted) ctrl.abort(); else init.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return await read(res);                           // an abort now also stops res.json()
  } catch (e) {
    if (timedOut) throw new TimeoutError(`No response in ${ms} ms`);
    throw e;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', onAbort);
  }
}

export async function ask(question: string, signal?: AbortSignal) {
  return fetchWithTimeout(`${API}/support/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
    body: JSON.stringify({ question }),
    signal,
  }, 30_000, async (res) => {
    if (res.status === 503 || res.status === 429) {
      const n = Number(res.headers.get('retry-after') ?? 2);
      const retryAfter = Number.isNaN(n) ? 2 : n;     // an HTTP-date is NaN as a number: fall back to 2 s
      throw new TemporaryError(retryAfter);           // UI: "busy, retrying…" + backoff, max 2–3
    }
    if (res.status === 422) throw new RefusedError(); // UI: friendly "can't help with that"
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
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
- Mock network: msw 2 (`msw/native`, last in 2.15.0) or a mocked `fetch`; msw 3 has no published React Native package yet (`@msw/react-native` is in its docs, but not on npm). Test 503→retry, 422→refusal UI, timeout.
- E2E: Maestro flows against a backend with mocked LLM (see testing.md).

## Security extras
- Store tokens in Keychain/Keystore (`expo-secure-store`, `react-native-keychain`), not AsyncStorage.
- Don't log prompts/responses to device logs in release builds.
- Content the app sends (user text, pasted docs, images) is untrusted for the backend agent — same guards apply server-side.
