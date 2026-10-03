# fix unused

Remove what `scan unused` found nothing uses, and add the packages that are used but not listed.

## What goes in the plan

By the finding's `group` and `action`:

- **"safe to remove", action "delete":** delete the file, or the declaration (the export, the type, the enum member) with its comment above it.
- **"safe to remove", action "drop export":** remove only the `export` keyword (or the name from an `export { … }` list). The code stays.
- **A package installed but not used, "safe to remove":** remove it from that `package.json`. These lines go last, under their own heading, because they change the lock file (see "Packages").
- **"check first":** not in the plan by default. List them after the plan with the places the scan found, and say: "Name the numbers you want removed anyway."
- **A package used but not listed** (action "add to …"): add it to that `package.json` at the version the lock file already resolves, in `dependencies`, or in `devDependencies` when only tests, configs or scripts use it.

## Doing it

- Delete tracked files with `git rm`.
- After deleting a declaration, remove imports in the same file that are now unused.
- A barrel file (`index.ts` that only re-exports) left empty is deleted too; say so in the report, as it was not its own plan line.

## Packages

Edit the `package.json` files first, then run the project's install once, with the package manager from `packageManager` or the lock file (`yarn install`, `pnpm install`, `npm install`, `bun install`). This is the one install this command does, and only when the user approved a package line. If it fails, put the `package.json` lines back and report them as rolled back.

## Checks

After the changes, run `npx -y knip --no-progress` once more, read-only. Say whether the removed findings are gone and whether new ones appeared (a file only a removed file used is now unused: offer it as a next round, do not remove it now). Then the project's checks.
