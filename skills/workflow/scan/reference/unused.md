# scan unused

Find files, code, types and packages nothing uses, and packages used but not listed. [knip](https://knip.dev) finds them; this scan checks each finding once more.

## 1. Check that knip can give a true answer

Stop, with no page, and say why, when:

- **Not a JavaScript or TypeScript project:** no `package.json` at the project root.
- **The packages are not installed:** no `node_modules/` at the root, or, in a workspace project, a workspace whose `package.json` declares dependencies has no `node_modules/` while the root does (pnpm keeps one per workspace; a workspace with no dependencies has none, and that is fine). Name the install command from the `packageManager` field of the root `package.json`, or else from the lock file: `yarn.lock` → `yarn install`, `pnpm-lock.yaml` → `pnpm install`, `bun.lock` or `bun.lockb` → `bun install`, `package-lock.json` → `npm install`. Do not run it: installing is the user's call.

## 2. Run knip

First `npx -y knip --version` once, for the header. Then, from the project root:

```bash
npx -y knip --reporter json --no-progress > "<tmp>/knip-<timestamp>.json" 2> "<tmp>/knip-<timestamp>.err"
```

- Never add `--fix`, `--allow-remove-files` or `--cache`: they write into the project.
- Exit code 0 or 1 is normal. Exit code 2: knip had errors; read the `.err` file. Other `.err` lines go on the page as a note.
- `Error loading <config>` or `Cannot find module` in the `.err` file: a package knip needs is missing even though `node_modules/` exists. Stop as in step 1 and name the missing packages.
- Say on the page when the project has its own knip config (`knip.json`, `knip.jsonc`, `.knip.json`, `knip.config.ts`, or a `knip` key in `package.json`).
- With a folder after `/scan unused`, still run knip on the whole project, then keep only the findings under that folder.

The JSON has `issues`: one entry per file, with lists by kind: `files`, `dependencies`, `devDependencies`, `optionalPeerDependencies`, `unlisted`, `binaries`, `unresolved`, `exports`, `types`, `enumMembers`, `namespaceMembers`, `duplicates`, `catalog`, `catalogReferences`. Entries without a `line` (`unlisted`, `dependencies`, …): find it with `grep -n` in the entry's file.

## 3. Check each finding once more

Knip misses uses from configs, strings, frameworks that find files themselves, and `package.json` scripts. Search each finding with `git grep`, code and config only: `git grep -n -w <name> -- . ':!*.md' ':!docs/'`.

- **An export or a type** (`exports`, `types`, `enumMembers`, `namespaceMembers`): search outside its own file. The same name in an unrelated module (not imported from this file) does not count; say so when you drop one.
  - Nothing outside, not used in its own file → **safe to remove**, action "delete".
  - Nothing outside, used in its own file → **safe to remove**, action "drop `export`".
  - A real use outside → **check first**, with the place.
- **A file** (`files`): search its path and its name, both without the extension. Nothing → **safe to remove**. A mention (a config, a glob, a string) → **check first**, with the place.
- **A package installed but not used**: search its name in all code and config and in the `scripts` of every `package.json`. Only its line in `package.json` → **safe to remove**. Anything else → **check first**, with the place.
- **A package used but not listed**: no split. Action "add to `<package.json>`": the nearest `package.json` above the file that uses it. Say whether it arrives today only through another package (look in the lock file).
- **An import that does not resolve** (`unresolved`): no split; show where it is.

Do not open every file to judge it: the search decides the group, the user the rest.

## 4. The page

Header: the project, the date, the knip version, whether the project's own knip config was used, and the folder if any.

One `lines` section per kind, in this order, leaving out a kind with no findings:

1. **Files nothing uses**
2. **Packages installed but not used** (`dependencies`, `devDependencies`, `optionalPeerDependencies`)
3. **Packages used but not listed in `package.json`** (`unlisted`, `binaries`): say which `package.json` they belong in.
4. **Code nothing calls** (`exports`, `enumMembers`, `namespaceMembers`, `duplicates`)
5. **Types nothing uses** (`types`)
6. **Imports that do not resolve** (`unresolved`)

The summary row counts every kind, split into "safe to remove" and "check first" where it applies.

In each section "safe to remove" comes first, then "check first". One line per finding: the path tile with its line, the name in backticks, the action ("delete", "drop `export`", "add to …"), and for "check first" the tiles of the places the search found. A section shows at most 30 findings and says how many more there are; the rest go in a folded `lines` section "More".

No pictures and no top pick.

## 5. The ending

Chat line per kind with findings: "N safe to remove, M check first" (or "N to add" for packages not listed). Closing question: "What do we remove?"
