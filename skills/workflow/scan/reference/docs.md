# scan docs

Check whether the project's documents tell the truth: what each is for, whether it is stale or repeats another, and whether its paths, commands, settings, numbers and names match the code. Code comments are not part of this scan.

## Which documents

With a folder after `/scan docs`, only the documents in it. Otherwise:

- `README*` at the root and in each package or app folder
- `CLAUDE.md`, `AGENTS.md` and `GEMINI.md`, at the root and in subfolders, and what they pull in with `@path`
- everything under `.claude/` except `settings*.json` and `skills/` (so also `wiki/`, `docs/`, `rules/`, `agents/`, `memory/`)
- everything under `docs/`
- other `.md`, `.mdx`, `.rst` and `.txt` files outside code folders, such as `CONTRIBUTING.md` or `ARCHITECTURE.md`

Skip `node_modules/`, `.git/`, `vendor/`, `dist/`, `build/`, generated API docs (`openapi.json` and the like), tool-written changelogs, what git ignores, and empty files. Skim an append-only log (a long `log.md`, a journal) for claims about the present only.

In a full scan of a large project, start a `general-purpose` subagent per folder of documents (not `Explore`: it reads only excerpts) with the checks below. It returns, per false claim, the quote and the code fact, each with path and line, and the command that showed it. Re-check yourself every claim that goes on a card; claims that stay in the table may rest on the subagent's evidence.

## 1. The list of documents

Read every document whole. For each:

- **Purpose:** one line.
- **Last change:** `git log -1 --format=%as -- <file>`, and the commits its code has had since (`git rev-list --count --since=<date> HEAD -- <code paths>`). Untouched for months while its code moved a lot: a suspect.
- **Stale:** names removed features, finished migrations, old dates, or says "will" about something long done.
- **Repeats:** another document covers the same topic; name it and the fuller one.
- **Plan done:** a plan whose work is already in the code (`/fix docs` turns it into a decision record and removes it).

## 2. The check against the code

Check every concrete claim.

- **A path:** does it exist? If not, is there an obvious new place (`git log --follow`, the same name elsewhere)?
- **A command** (`yarn db:migrate`, `make seed`): is it in the right `package.json` `scripts`, the `Makefile`, or the docs' own setup? Is the tool it names installed?
- **A setting or env variable:** does the code read it (`git grep`), and is it in `.env.example` or the config schema? And a variable the code requires that no document mentions.
- **A number or a name:** counts, ports, versions, image tags, table names, route paths, class and function names, against the code, the config, `docker-compose*`, the lock file.
- **A link:** a relative link (resolved from the document's own folder) or an anchor that does not exist.
- **Two documents** that say different things about the same fact.

In zsh, quote a revision with a path, `git show "${rev}:path"`: unquoted, `:w…` is read as a modifier.

A claim you could not check (it needs a running system, a secret value) is marked not checked, not wrong.

## 3. What has no document

Name the main parts (apps and packages, main routes, background jobs, the database, how to run and deploy) no document describes: three to six lines.

Words for the findings file: `kind` is `false claim`, `stale`, `repeat`, `plan done` or `gap`; `action` is `correct`, `rewrite`, `merge into <path>`, `harvest and delete` or `write`.

## 4. The page

Header: the project, the date, the folder if any, how many documents were read.

1. **Summary:** counts of documents read, false claims, stale, repeats, plans done, gaps.
2. **False claims:** one card per document that has any, the worst first (a wrong command or path before a wrong count). At most 12 cards; other documents with false claims get one line each under them, with their count, and stay in the table. Each claim: what the document says (a short quote) with its path tile and line, what the code says with its path tile and line, and the fix direction in a few words. 
3. **Stale, repeats, plans done:** one line per document: path tile, reason, and what `/fix docs` would do (rewrite, merge into X, turn into a decision record).
4. **Gaps:** one line per missing topic, with the code it would describe.
5. **The list of documents:** a folded `table` of every document read: path, purpose, last change, a mark for each finding.

Top pick: the false claim that would cost a newcomer most, usually a wrong setup command or path in the first steps.

## 5. The ending

Chat lines: the counts by kind, then the top pick. Closing question: "What do we fix?" Next: `/fix docs` (it asks whether to correct only the false claims or do the whole tidy-up).
