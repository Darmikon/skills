# scan security

Find security holes in the project: secrets in the code and its history, dangerous code patterns, packages with known holes, and mistakes in the logic that tools cannot see. Three tools find, the model reads and checks, one page shows the result.

This file adds the security part to the rules in [../SKILL.md](../SKILL.md).

## Never show a secret

A found password, key or token never goes on the page or in the chat in full. Show only its first 4 characters, then `…`, and its kind ("AWS key", "JWT secret"). The page must not become the leak. The same holds for the temp files you read: do not copy a secret out of them.

## 1. The tools

Needed on the machine (not in the project): `gitleaks` and `semgrep`. For each one missing:

- macOS with Homebrew: say in one line that you are installing it (Homebrew may also update what it needs, such as Python for semgrep), then `brew install gitleaks` / `brew install semgrep`. This is the one install this skill does, and it goes to the machine, never into the project.
- No Homebrew: `semgrep` through `pipx install semgrep` (or `python3 -m pip install --user semgrep`); for `gitleaks`, stop and give the link to its releases: https://github.com/gitleaks/gitleaks/releases.
- If an install fails or is refused, go on with the tools you have, and say on the page which part did not run.

## 2. Secrets: gitleaks

From the project root:

```bash
gitleaks git . --redact --no-banner --report-format json --report-path "${TMPDIR:-/tmp}/scan-security-gitleaks.json"
```

This reads the whole git history. `--redact` keeps the secrets out of the report. Exit code 1 means it found something; that is a normal run.

Files that git ignores (`.env` and the like) are left alone on purpose: they are meant to hold local secrets, and they never reach the history. Say so on the page.

Each finding has the file, the line, the rule, and the commit. Say whether the secret is still in the current code or only in the history: a secret that ever reached git history counts as leaked even after it was deleted, and the fix is to rotate it, not only to delete it.

## 3. Code patterns: semgrep

```bash
semgrep scan --config p/default --metrics=off --json --quiet --output "${TMPDIR:-/tmp}/scan-security-semgrep.json" .
```

It downloads the rules from `semgrep.dev` on every run; that needs the network. It writes nothing into the project. With a folder after `/scan security`, pass that folder instead of `.`.

If the exit code is 2 or higher, or the output file is missing, this part did not run. The usual cause is no network: Claude Code's sandbox may block `semgrep.dev`. Do not retry around the sandbox. Say on the page and in the chat that semgrep did not run and why, and that allowing `semgrep.dev` in the sandbox network settings fixes it. Go on with the other parts.

Each result has `path`, `start.line`, `check_id`, `extra.message` and `extra.severity` (`ERROR`, `WARNING`, `INFO`).

## 4. Packages: audit

Only for a JavaScript or TypeScript project with a lock file. The command follows the lock file (or the `packageManager` field of `package.json`):

- `yarn.lock` with Yarn 1: `yarn audit --json`
- `yarn.lock` with Yarn 2 or later: `yarn npm audit --json --recursive`
- `pnpm-lock.yaml`: `pnpm audit --json`
- `package-lock.json`: `npm audit --json`
- `bun.lock`: `bun audit --json`

These read the lock file and ask the registry; they change nothing. Never add `fix` or `--fix`. Exit code 1 usually means holes were found: read the JSON before you call it a failure. If the command really fails (no network, an old package manager), say so on the page and go on.

`pnpm audit --json` and `npm audit --json` give an object of advisories: the package (`module_name` or the key), `severity`, `vulnerable_versions`, `patched_versions`, and the paths that pull it in (`findings[].paths` in pnpm, `via`/`effects` in npm). The first name in a path is the top-level package. `yarn audit --json` prints one JSON object per line; the advisories are the lines with `"type":"auditAdvisory"`.

For each hole: the package, the installed version, the fixed version, the severity, and which top-level package pulls it in.

## 5. Reading the code

Tools see patterns, not intent. Read the places where a mistake in the logic is a hole. Start from the entry points (routes, handlers, queue consumers, webhooks) and follow the data in:

- **Who may do this:** is there a check of login and of rights on every route that needs it? Is one route missing the check that its neighbours have? Is the check done with data the caller controls (a user id from the body)?
- **What comes in:** is the input from the user checked before it reaches the database, a file path, a shell command, an outgoing URL, or HTML?
- **The database:** any query built by joining strings.
- **Outgoing requests:** a URL the user controls reaching the server's own network.
- **Files:** uploads with no limit on size or type; paths built from user input.
- **Webhooks:** is the signature checked, and checked before the body is used?
- **Sessions and tokens:** where they are kept, when they expire, how they are compared.
- **Settings:** CORS open to everything with credentials, debug on in production, secrets written to the logs.

Keep only what you saw in the code. A worry you could not confirm is at most `Low`, marked as a guess.

## 6. Check each tool finding

Look at each finding from steps 2–4 and mark it:

- **Real:** the code does what the rule warns about, in code that runs.
- **Real, not reached:** the hole is real but this code does not reach it today. Typical case: a package with a hole in a part of it that nothing here imports. It keeps its severity and stays in the counts, with "not reached: <why>" on the card, because one new import makes it real. It is a good top pick when the fix is a small version bump.
- **Likely false alarm:** the rule does not fit: a test fixture, an example value, a dead path, a rule that does not fit this framework. Say why in a few words. Keep it on the page, at the bottom, so the user can overrule you.

## 7. The page

Header: the project, the date, the tool versions (`gitleaks version`, `semgrep --version`, the audit command used), which parts did not run and why, and the folder when there is one.

At the top of the body: one row of counts by severity (`Critical`, `High`, `Medium`, `Low`), real findings (reached or not), then the count of likely false alarms.

The body: one card per finding, sorted by severity, the most serious first. Severity colours: `Critical` red, `High` orange, `Medium` amber, `Low` slate. Each card:

- **Title**: what the hole is, in plain words: "Webhook body used before the signature check".
- **Badges**: severity, source (`gitleaks`, `semgrep`, `audit`, `reading`), and "not reached" when so.
- **Where**: the path tile with the line; for a secret, also whether it is in the current code or only in history, and the commit.
- **Why it is dangerous**: one sentence on what an attacker could get. No steps of an attack.
- **Direction**: one sentence on the fix. No code.

The likely false alarms go in one folded `<details>` section at the end, one line each with the reason.

The top pick is the finding to fix first: the most serious real one, and among equals the one easiest to reach from outside.

## 8. The ending

Chat line per real finding at `Critical` and `High`: its title and its severity. Then one line with the counts of `Medium`, `Low`, and likely false alarms, then the top pick. Closing question: "What do we fix first?"

This scan does not hand over to another skill. The user's answer starts ordinary work in a separate step, after their yes.
