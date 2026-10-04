# scan and fix: the branch by default, deep for the project

## Goal

`/scan <command>` becomes a review of the current branch; `/scan <command> deep` scans the whole project. `fix` follows the same split.

## Decided

- **Three scopes.** Branch: the default when no folder is named and the branch has changes against its base (`git merge-base HEAD origin/<default>`, the default branch from `git-common/default-branch.sh`); the files are the branch's commits, uncommitted changes and new untracked files. Quick project: when a folder is named or there are no branch changes; the old quick scan (top 5, no subagents). Deep: the old full scan.
- **Asking was dropped** for "no branch changes": the scan falls back to the quick project scan and says so in the page header. A question there would stop the automatic skill tests and adds a step for nothing.
- **What belongs to the branch:** a finding with a place in a branch file, or one about a branch file (a doc describing changed code, a missing test for it). Problems in the untouched parts of a branch file only when `High`. No limit of five.
- **Tools that need the whole project** (knip, type check, test runner) still run over it; their findings are filtered. History-based checks (gitleaks) read only `<base>..HEAD`.
- The findings file gets `scope` and `base`; `fix` takes a branch or deep scan for a branch fix (deep findings filtered to the branch), only a deep scan for `/fix <command> deep`.
- `ask` is unchanged: it explains, it does not review.
