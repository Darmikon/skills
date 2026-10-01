# scan comments

Check the comments in the code: the ones that lie about the code, stale TODOs, code that was commented out and left, and comments that only repeat the code. A comment that lies misleads the next reader, and an AI reads comments as truth. Show the result on one page; fixing is for `better-comments` or ordinary work.

This file adds the comments part to the rules in [../SKILL.md](../SKILL.md). Documents (`README`, `docs/`, `CLAUDE.md`) are not part of this scan: that is `scan docs`.

## Which code

With a folder after `/scan comments`, only that folder. Otherwise every source file git tracks, except generated code (files with a "generated" or "do not edit" header, `*.d.ts` made by a tool, migrations' snapshots, lock files), vendored code, and minified files.

## 1. Collect the comments

List them with a search, not by opening every file. Leave out what "Which code" excludes in the search itself:

```bash
git grep -n -I -E '(//|/\*|^\s*\*)' -- <paths> ':!*.md' ':!*.lock' ':!*.json' ':!*.d.ts' ':!**/migrations/meta/**' ':!**/generated/**'
```

Add markers only for the languages the project has: `^\s*#(\s|$)` for Python, shell and YAML; `^\s*--\s` for `.sql` files only; `<!--` for HTML and templates. Keep the hits that are real comments, not `#` in a string or a URL with `//`.

A big project has tens of thousands of comment lines: do not check them all. Check every comment that carries a checkable fact (a digit, a name in backticks or in `CamelCase`/`snake_case`, a path, a URL, "returns", "throws", "always", "never", "only"), and a sample of the rest for repeats. Say on the page how many comment lines were found and how many were checked.

The TODO notes have their own search:

```bash
git grep -n -I -E '\b(TODO|FIXME|HACK|XXX)\b|@deprecated' -- <paths> ':!*.md' ':!*.d.ts'
```

For a project with more than a few hundred fact-carrying comments, start a `general-purpose` subagent per area with all four kinds below. Ask it to return, for each finding, the comment with its path and line, the code fact with its path and line, and the command that showed it. Re-check yourself every finding that goes on a card.

## 2. The four kinds

### Lies (the most important)

A comment that states a fact the code does not hold:

- a count ("three scripts", "retries 5 times") that the code contradicts;
- a name of a function, class, file, route, table, env variable or setting that no longer exists or was renamed (`git grep -w <name>`, `git log -S <name>` to see when it went);
- a description of behaviour the code next to it does not do ("returns null if missing" above code that throws; "cached for an hour" above a cache of five minutes);
- a reference to a ticket, a PR or a doc path that does not exist.

Only comments with a checkable fact. A comment that explains why, or gives an opinion, is not a lie because you would have done it differently.

### Stale TODOs

Every `TODO`, `FIXME`, `HACK`, `XXX` and `@deprecated` note. For each one: its age from `git blame -L <line>,<line> --porcelain -- <file>` (the `author-time` line), who wrote it, and whether it is already done or no longer applies (the thing it asks for exists, the code it is about is gone). Mark each as **done**, **gone** (its subject was removed), **old** (more than six months), or **open**.

### Code left commented out

Blocks of two or more comment lines that are code: they end in `;` or `{`, call functions, assign, import. Note the size of the block and, from `git blame`, how long it has been commented out. A short commented example inside a doc comment (a usage example) is not dead code.

### Comments that only repeat the code

`// increment i` above `i++`, `// constructor` above a constructor, `/** Gets the user. */` above `getUser()`. Only the clear cases; do not list every short comment. These are the lowest priority: give the count from the comments you checked (say it is from a sample) and at most ten examples.

## 3. The page

Header: the project, the date, the folder when there is one, how many comment lines were found and how many were checked.

The body:

1. **Summary:** one row of counts: lies, TODOs (split into done, gone, old, open), commented-out blocks, repeats.
2. **Lies:** one card per lie, the worst first (a lie that changes what a reader would do, such as a wrong unit or a wrong error case, before a wrong count). Each card: the comment as a short quote with its path tile and line, what the code says with its path tile and line, and the fix direction (correct the comment, or delete it). At most 15 cards; the rest go as one line each under them, each with its own copy button.
3. **TODOs:** one line each, grouped by mark, `done` and `gone` first: the path tile, the text, the age, the author.
4. **Commented-out code:** one line per block: the path tile with the line range, the size, how long it has been dead.
5. **Repeats:** the count and the examples.

Copy buttons: every card, every line in the TODO and commented-out sections, and each section as a whole (the group as one task, every finding in it, not only the ones shown). A kind with nothing found gets no section; the summary row says "none" for it.

Top pick: the lie that would mislead a reader the most.

## 4. The ending

Chat lines: the counts by kind, then the top pick. Closing question: "What do we fix?"

The fixing is a separate step after the user's yes. When a `better-comments` skill is installed, give its ready command for the TODO, dead-code and repeat sections; otherwise the copy buttons give the prompts.
