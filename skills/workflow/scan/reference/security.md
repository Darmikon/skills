# scan security

Find leaked secrets, dangerous code, packages with known holes, and logic mistakes tools cannot see.

## Never show a secret

A found password, key or token never appears in full on the page, in the chat or copied out of the temp files: only its first 4 characters, then `…`, and its kind ("AWS key", "JWT secret").

## 1. The tools

`gitleaks` and `semgrep` are needed on the machine, not in the project. For each one missing:

- macOS with Homebrew: say in one line that you install it (Homebrew may update Python too), then `brew install gitleaks` / `brew install semgrep`. The only install this skill does; never into the project.
- No Homebrew: `pipx install semgrep` (or `python3 -m pip install --user semgrep`); for `gitleaks`, stop and give https://github.com/gitleaks/gitleaks/releases.
- Install failed or refused: go on; the page says which part did not run.

## 2. Secrets: gitleaks

From the project root:

```bash
gitleaks git . --redact --no-banner --report-format json --report-path "${TMPDIR:-/tmp}/scan-security-gitleaks.json"
```

Exit code 1 means it found something. Files git ignores (`.env` and the like) are left alone on purpose; say so on the page. Say whether each secret is in the current code or only in history: one that ever reached history is leaked, and the fix is to rotate it, not only delete it.

## 3. Code patterns: semgrep

```bash
semgrep scan --config p/default --metrics=off --json --quiet --output "${TMPDIR:-/tmp}/scan-security-semgrep.json" .
```

With a folder after `/scan security`, pass it instead of `.`. It downloads rules from `semgrep.dev` every run.

Exit code 2 or higher, or no output file: it did not run, usually because the sandbox blocks `semgrep.dev`. Never retry around the sandbox or change settings yourself. Say why on the page, go on, and at the end of the chat reply show the fix once:

1. The setting to add by hand to the Claude Code settings (user level usually; a project's `.claude/settings.local.json` works too), merged into what is there:

   ```json
   { "sandbox": { "network": { "allowedDomains": ["semgrep.dev"] } } }
   ```

2. Or a line to paste so Claude adds it (Claude Code asks before writing settings):

   `Add "semgrep.dev" to sandbox.network.allowedDomains in my Claude Code user settings, keeping everything that is already there.`

## 4. Packages: audit

Only for a JavaScript or TypeScript project with a lock file. By the lock file (or `packageManager` in `package.json`):

- `yarn.lock`, Yarn 1: `yarn audit --json`
- `yarn.lock`, Yarn 2+: `yarn npm audit --json --recursive`
- `pnpm-lock.yaml`: `pnpm audit --json`
- `package-lock.json`: `npm audit --json`
- `bun.lock`: `bun audit --json`

Never add `fix` or `--fix`. Exit code 1 usually means holes found: read the JSON first. A real failure (no network, an old package manager) goes on the page.

For each hole: the package, installed and fixed versions, severity, and the top-level package that pulls it in (the first name in its path: `findings[].paths` in pnpm, `via`/`effects` in npm). `yarn audit --json` prints one object per line; advisories have `"type":"auditAdvisory"`.

## 5. Reading the code

From the entry points (routes, handlers, queue consumers, webhooks), follow the data in:

- **Rights:** a login and rights check on every route that needs it, as its neighbours have, never from data the caller controls (a user id from the body).
- **Input:** checked before a query, a file path, a shell command, an outgoing URL or HTML; no queries joined from strings; no user-controlled URL reaching the server's own network; uploads limited in size and type.
- **Webhooks:** the signature checked before the body is used.
- **Sessions and tokens:** where kept, when they expire, how compared.
- **Settings:** CORS open to all with credentials, debug on in production, secrets in logs.

A worry you could not confirm is at most `Low`, marked as a guess.

## 6. Check each tool finding

- **Real:** the code does what the rule warns about, in code that runs.
- **Real, not reached:** not reached today (typically a package part nothing imports). Keeps its severity and count, with "not reached: <why>" on the card; a good top pick when the fix is a small version bump.
- **Likely false alarm:** the rule does not fit (a test fixture, an example value, a dead path, another framework). Say why; keep it on the page so the user can overrule you.

## 7. The page

Header: the project, the date, the tool versions (`gitleaks version`, `semgrep --version`, the audit command), the parts that did not run and why, the folder if any. Summary row: real findings (reached or not) by `Critical`, `High`, `Medium`, `Low`, then likely false alarms.

One card per real finding, most serious first: the hole in plain words as title ("Webhook body used before the signature check"); badges for severity, source (`gitleaks`, `semgrep`, `audit`, `reading`) and "not reached"; the path tile with the line (for a secret, current code or history only, and the commit); one sentence on what an attacker could get, no attack steps; one sentence of direction, no code.

Likely false alarms: one folded `lines` section at the end, each with its reason.

Top pick: the most serious real finding; among equals, the easiest to reach from outside.

## 8. The ending

Chat: a line per real `Critical` and `High` finding (title, severity), one line counting `Medium`, `Low` and likely false alarms, the top pick. Closing question: "What do we fix first?"
