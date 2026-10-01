# fix unused

Remove what `scan unused` found nothing uses, and add the packages that are used but not listed.

This file adds the unused part to the rules in [../SKILL.md](../SKILL.md).

## What goes in the plan

From the findings, by `group` and `action`:

- **"safe to remove", action "delete":** a plan line that deletes the file, or the declaration (the export, the type, the enum member) with its comment above it.
- **"safe to remove", action "drop export":** a plan line that removes only the `export` keyword (or the name from an `export { … }` list). The code stays.
- **A package installed but not used, "safe to remove":** a plan line that removes it from that `package.json`. These lines go last, under their own heading, because they change the lock file (step "Packages" below).
- **"check first":** not in the plan by default. List them after the plan with the places the scan found, and say: "Name the numbers you want removed anyway."
- **A package used but not listed** (action "add to …"): a plan line that adds it to that `package.json`, at the version the lock file already resolves for it, in `dependencies` or `devDependencies` by where it is used (only in tests, configs or scripts → `devDependencies`).

## Doing it

- Delete files with `git rm` only when git tracks them; otherwise follow the rule in SKILL.md.
- After deleting a declaration, remove imports that are now unused in the same file.
- A barrel file (`index.ts` that only re-exports) that ends up empty is deleted too: say so in the report, it was not its own plan line.

## Packages

Package lines change `package.json` and then need the lock file updated. Edit the `package.json` files first, then run the project's install once, with the package manager from `packageManager` or the lock file (`yarn install`, `pnpm install`, `npm install`, `bun install`). This is the one install this command does, and only when the user approved a package line. If it fails, put the `package.json` lines back and report them as rolled back.

## Checks

After the changes, run `npx -y knip --no-progress` once more, read-only, and say whether the removed findings are gone and whether new ones appeared (a file that was only used by a removed file is now unused: offer it as a next round, do not remove it now). Then the project's checks, as in SKILL.md.
