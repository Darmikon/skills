# scan comments

Check the comments in the code: ones that lie about the code, stale TODOs, code commented out and left, and comments that only repeat the code. An AI reads comments as truth, so a lie misleads twice.

`/scan todo` runs this file with only the "Stale TODOs" kind: the page, the findings file (`scan-todo-…`) and the ending cover the TODOs alone, and the summary row splits them into done, gone, old and open. Documents (`README`, `docs/`, `CLAUDE.md`) belong to `scan docs`.

## Which code

A folder after `/scan comments`, or else every source file git tracks, except generated code (a "generated" or "do not edit" header, tool-made `*.d.ts`, migration snapshots, lock files), vendored code and minified files.

## 1. Collect the comments

Search; do not open every file. Exclude in the search itself:

```bash
git grep -n -I -E '(//|/\*|^[[:space:]]*\*)' -- <paths> ':!*.md' ':!*.lock' ':!*.json' ':!*.d.ts' ':!**/migrations/meta/**' ':!**/generated/**'
```

Add markers only for languages the project has: `^[[:space:]]*#([[:space:]]|$)` for Python, shell and YAML; `^[[:space:]]*--[[:space:]]` for `.sql` files only; `<!--` for HTML and templates. Use `[[:space:]]`, never `\s` or `\b`: the macOS system regex does not know them. Keep only real comments, not `#` in a string or `//` in a URL.

Do not check every comment line in a big project. Check every one with a checkable fact (a digit, a name in backticks or `CamelCase`/`snake_case`, a path, a URL, "returns", "throws", "always", "never", "only"), and a sample of the rest for repeats. The page says how many comment lines were found and how many checked.

TODO notes:

```bash
git grep -n -I -w -E 'TODO|FIXME|HACK|XXX|@deprecated' -- <paths> ':!*.md' ':!*.d.ts'
```

In a full scan with more than a few hundred fact-carrying comments, start a `general-purpose` subagent per area with all four kinds. It returns, per finding, the comment and the code fact, each with path and line, and the command that showed it. Re-check yourself every finding that goes on a card.

## 2. The four kinds

### Lies (the most important)

A comment stating a fact the code does not hold:

- a count ("three scripts", "retries 5 times") the code contradicts;
- a name of a function, class, file, route, table, env variable or setting that no longer exists or was renamed (`git grep -w <name>`, `git log -S <name>` for when it went);
- behaviour the code next to it does not do ("returns null if missing" above code that throws);
- a ticket, PR or doc path that does not exist.

A comment that explains why or gives an opinion is not a lie.

### Stale TODOs

Every `TODO`, `FIXME`, `HACK`, `XXX` and `@deprecated`: its age and author from `git blame -L <line>,<line> --porcelain -- <file>` (the `author-time` line), and whether it is done or no longer applies. Mark each **done**, **gone** (its subject was removed), **old** (over six months) or **open**.

### Code left commented out

Two or more comment lines that are code: ending in `;` or `{`, calling, assigning, importing. Note the block size and, from `git blame`, how long it has been dead. A short usage example inside a doc comment is not dead code.

### Comments that only repeat the code

`// increment i` above `i++`, `/** Gets the user. */` above `getUser()`. Only clear cases. Lowest priority: the count from the sample (say so) and at most ten examples.

Words for the findings file: `kind` is `lie`, `todo`, `commented-out` or `repeat`; `group` for a TODO is `done`, `gone`, `old` or `open`; `action` is `correct`, `delete` or `ask` (the code may be the one that is wrong). A lie's `rank` is `High` when it would change what a reader does (a wrong unit, error case or limit), else `Medium`; its `places` list the comment first, then the code that contradicts it, and `seen` says which is which.

## 3. The page

Header: the project, the date, the folder if any, comment lines found and checked.

1. **Summary:** counts of lies, TODOs (done, gone, old, open), commented-out blocks, repeats.
2. **Lies:** one card per lie, `High` first: the comment as a short quote with its path tile and line, what the code says with its path tile and line, and the direction (correct or delete). At most 15 cards; the rest as lines under them.
3. **TODOs:** one line each, grouped by mark, `done` and `gone` first: path tile, text, age, author.
4. **Commented-out code:** one line per block: path tile with the line range, size, how long dead.
5. **Repeats:** the count and the examples.

Top pick: the lie that would mislead a reader most.

## 4. The ending

Chat lines: the counts by kind, then the top pick. Closing question: "What do we fix?" Next: `/fix comments` (or `/fix todo` for the TODOs alone).
