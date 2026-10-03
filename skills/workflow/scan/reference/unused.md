# scan unused

Find what lies in the project without a use: files nothing imports, code and types nothing calls, packages installed but not used, packages used but not listed. The finder is [knip](https://knip.dev); this scan checks each of its findings once more and shows them on one page.

This file adds the unused part to the rules in [../SKILL.md](../SKILL.md).

## 1. Check that knip can give a true answer

Stop, with no page, when one of these is true, and say why in one or two sentences:

- **Not a JavaScript or TypeScript project:** there is no `package.json` at the project root.
- **The packages are not installed:** there is no `node_modules/` at the project root, or, in a workspace project, a workspace folder whose `package.json` declares dependencies has no `node_modules/` while the root does (pnpm keeps one per workspace; a workspace with no dependencies has none, and that is fine). Without them knip cannot read the project's settings and calls almost everything unused. Name the command that installs them, from the `packageManager` field of the root `package.json`, or else from the lock file: `yarn.lock` → `yarn install`, `pnpm-lock.yaml` → `pnpm install`, `bun.lock` or `bun.lockb` → `bun install`, `package-lock.json` → `npm install`. Do not run it: installing is the user's call.

## 2. Run knip

From the project root:

```bash
npx -y knip --reporter json --no-progress > "<tmp>/knip-<timestamp>.json" 2> "<tmp>/knip-<timestamp>.err"
```

- Never add `--fix`, `--allow-remove-files` or `--cache`: they write into the project.
- Exit code 0 or 1 is a normal run (1 means it found something). Exit code 2 means knip had errors: read the `.err` file. Any other lines in the `.err` file go on the page as a note.
- If the `.err` file has `Error loading <config>` or `Cannot find module` lines, a package knip needs is missing even though `node_modules/` exists. Stop as in step 1, and name the missing packages.
- If the project has its own knip config (`knip.json`, `knip.jsonc`, `.knip.json`, `knip.config.ts`, or a `knip` key in `package.json`), knip uses it. Say on the page that it did.
- With a folder after `/scan unused`, still run knip on the whole project (a file is only unused if nothing anywhere imports it), then keep only the findings under that folder.

The JSON has `issues`: one entry per file, with lists by kind: `files`, `dependencies`, `devDependencies`, `optionalPeerDependencies`, `unlisted`, `binaries`, `unresolved`, `exports`, `types`, `enumMembers`, `namespaceMembers`, `duplicates`, `catalog`, `catalogReferences`. Entries with a `line` give the line; for the others (`unlisted`, `dependencies`, …) find the line yourself with `grep -n` in the file the entry belongs to.

## 3. Check each finding once more

Knip is sometimes wrong: a name can be used from a config file, by a string, by a framework that finds files on its own, or by a script in `package.json`. Search the project for each finding with `git grep` (it skips what git ignores). Search only code and config, not prose: leave out `*.md` files and `docs/` (`git grep -n -w <name> -- . ':!*.md' ':!docs/'`).

What knip means, and what the search looks for, depends on the kind:

- **An export or a type** (`exports`, `types`, `enumMembers`, `namespaceMembers`): knip means that no other file imports it. It may still be used inside its own file. Search for the name outside its own file. A match that is only the same name in an unrelated module (not imported from this file) does not count; say so when you drop one.
  - Nothing outside, and not used in its own file either → **safe to remove**, action "delete".
  - Nothing outside, but used in its own file → **safe to remove**, action "drop `export`".
  - A real use outside → **check first**, with the place.
- **A file** (`files`): search for its path without the extension, and its name without the extension. Nothing → **safe to remove**. A mention (a config, a glob, a string) → **check first**, with the place.
- **A package installed but not used** (`dependencies`, `devDependencies`, `optionalPeerDependencies`): search its name in all code and config, and in the `scripts` of every `package.json`. Nothing but its line in `package.json` → **safe to remove**. Anything else → **check first**, with the place.
- **A package used but not listed** (`unlisted`, `binaries`): nothing to remove, so no split. The action is "add to `<package.json>`": the nearest `package.json` above the file that uses it. Say whether it arrives today only through another package (look in the lock file).
- **An import that does not resolve** (`unresolved`): no split; show where it is.

Do not open every file to judge it. The search decides the group; the user decides the rest.

## 4. The page

Header: the project, the date, the knip version (run `npx -y knip --version` once, before the scan), whether the project's own knip config was used, and the folder when there is one.

The body has one section per kind, in this order, and leaves out a kind with no findings:

1. **Files nothing uses**
2. **Packages installed but not used** (`dependencies`, `devDependencies`, `optionalPeerDependencies`)
3. **Packages used but not listed in `package.json`** (`unlisted`, `binaries`): these are not dead weight but a hole; say which `package.json` they belong in.
4. **Code nothing calls** (`exports`, `enumMembers`, `namespaceMembers`, `duplicates`)
5. **Types nothing uses** (`types`)
6. **Imports that do not resolve** (`unresolved`)

The summary row has a count for every kind, with `0` for a kind with nothing found, split into "safe to remove" and "check first" where the kind has that split.

In each section, "safe to remove" comes first, then "check first". One line per finding: the path tile with its line, the name in backticks, the action ("delete", "drop `export`", "add to …"), and for "check first" the tiles of the places the search found. A section with more than 30 findings shows the first 30 and says how many more there are.

Each kind is a `lines` section; the program gives every finding its own copy button and the section one for the whole group. Every finding goes in the JSON, not only the 30 shown: put the rest in a folded `lines` section "More".

No pictures and no top pick.

## 5. The ending

Chat line per kind that has findings: the kind, then "N safe to remove, M check first" (or "N to add" for packages not listed). Closing question: "What do we remove?"

This scan does not hand over to another skill. The user's answer starts ordinary work in a separate step, after their yes.
