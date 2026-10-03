# scan docs

Check whether the project's documents tell the truth: what each one is for, whether it is stale or repeats another, and whether the paths, commands, settings, numbers and names in it match the code. Show the result on one page. Fixing is for `/fix docs`.

This file adds the docs part to the rules in [../SKILL.md](../SKILL.md). Code comments are not part of this scan.

## Which documents

With a folder after `/scan docs`, only the documents in it. Otherwise:

- `README*` at the root and in each package or app folder
- `CLAUDE.md`, `AGENTS.md` and `GEMINI.md`, at the root and in subfolders, and what they pull in with `@path`
- everything under `.claude/` except `settings*.json` and `skills/` (so also `wiki/`, `docs/`, `rules/`, `agents/`, `memory/`)
- everything under `docs/`
- other `.md`, `.mdx`, `.rst` and `.txt` files outside code folders, such as `CONTRIBUTING.md` or `ARCHITECTURE.md`

Skip `node_modules/`, `.git/`, `vendor/`, `dist/`, `build/`, generated API docs (`openapi.json` and the like), and changelogs written by a tool. Skip what git ignores, and empty files. An append-only log (a long `log.md`, a journal) is skimmed for claims about the present, not read line by line.

In a full scan of a large project, start a `general-purpose` subagent per folder of documents (not `Explore`: it reads excerpts, and this scan needs whole documents) with the checks below. Ask it to return, for each false claim, the quote with its path and line, the code fact with its path and line, and the command that showed it. Re-check yourself every claim that goes on a card; claims that stay in the table may rest on the subagent's evidence.

## 1. The list of documents

Read every document, do not only list it. For each one:

- **Purpose:** one line, what it covers.
- **Last change:** the date of the last commit that changed its content (`git log -1 --format=%as -- <file>`), and how many commits the code it describes has had since then (`git rev-list --count --since=<date> HEAD -- <code paths>`). A document untouched for months while its code moved a lot is a suspect.
- **Stale:** it names removed features, finished migrations, old dates, or says "will" about something long done.
- **Repeats:** another document covers the same topic. Name it, and say which one is the fuller.
- **Plan done:** it is a plan whose work is already in the code. Say so: `/fix docs` turns it into a decision record and removes it.

## 2. The check against the code

Pull out every concrete claim and check it:

- **A path** (file or folder): does it exist? If not, is there an obvious new place (`git log --follow`, or the same name elsewhere)?
- **A command** (`yarn db:migrate`, `make seed`): is it in the `scripts` of the right `package.json`, the `Makefile`, or the docs' own setup? Is the tool it names installed in the project?
- **A setting or env variable:** does the code read it (`git grep`), and is it in `.env.example` or the config schema? And the other way: a variable the code requires that no document mentions.
- **A number or a name:** counts ("three services"), ports, versions, image tags, table names, route paths, class and function names. Compare with the code, the config, `docker-compose*`, the lock file.
- **A link:** a relative link (resolved from the document's own folder) to another document, or an anchor, that does not exist.

In zsh, quote a revision with a path, `git show "${rev}:path"`: unquoted, `:w…` is read as a modifier.
- **Two documents** that say different things about the same fact.

Say only what you checked. A claim you could not check (it needs a running system, a value from a secret) is marked as not checked, not as wrong.

## 3. What has no document

Look at the project's main parts (the apps and packages, the main routes, the background jobs, the database, how to run and deploy). Name the ones no document describes. Only the main ones: three to six lines, not a wish list.

Words for the findings file: `kind` is `false claim`, `stale`, `repeat`, `plan done` or `gap`; `action` is `correct`, `rewrite`, `merge into <path>`, `harvest and delete` or `write`.

## 4. The page

Header: the project, the date, the folder when there is one, and how many documents were read.

The body:

1. **Summary:** one row of counts: documents read, false claims, stale, repeats, plans done, gaps.
2. **False claims:** one card per document that has any, the worst first (a wrong command or path before a wrong count). At most 12 cards; the other documents with false claims go in one line each under the cards, with their count, and stay in the table. Each claim in the card: what the document says (short, as a quote) with its path tile and line, what the code says with its path tile and line (a path outside the project goes in `<code class="lit">`, not a tile), and the fix direction in a few words. Each claim line has its own copy button, and the card has one for all its claims.
3. **Stale, repeats, plans done:** one line per document with its path tile, the reason, and what `/fix docs` would do with it (rewrite, merge into X, turn into a decision record).
4. **Gaps:** one line per missing topic, with the code it would describe.
5. **The list of documents:** a folded `<details>` table with every document read: path, purpose, last change, and a mark for each finding.

Top pick: the false claim that would cost a newcomer the most, usually a wrong setup command or a wrong path in the first steps.

## 5. The ending

Chat lines: the counts by kind, then the top pick. Closing question: "What do we fix?" The next skill is `fix`: `/fix docs` (it asks whether to correct only the false claims or do the whole tidy-up).

This scan does not change any document. The user's answer starts the fixing in a separate step, after their yes.
