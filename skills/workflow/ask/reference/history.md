# ask history

The story of how a feature was built, from git and its pull requests, as a timeline. With `since` ("since August", "last two weeks"), only that stretch: what changed lately and why.

## Find the history

- Find the feature's files from the words, as `feature` does. Then: `git log --follow --format='%h %as %an %s' -- <files>`, `git log -S '<key name>'` for when a name appeared or went, the PR numbers from the messages and `gh pr view <n> --json title,body,mergedAt,author`, and ticket keys from messages and branch names.
- Not a git repo, or `gh` not signed in: say what could not be seen, and tell the story from what there is.

## Chapters

Group the commits into chapters with one purpose each: born, grew, rewritten, fixed, moved, partly removed. A chapter is a run of commits, not one commit each. Reasons follow `why`'s marks: found (cited), converging, guess. No story the sources do not carry.

## The page

JSON as the `scan` skill's `reference/page.md` says, `"family": "ask"`, `"command": "history"`, file `ask-history-<timestamp>.json`.

1. `text`: the feature and the stretch looked at.
2. `timeline`: one finding per chapter, oldest first: `date` (the range), `title`, `seen` (what changed, one or two sentences, with PRs, tickets and who), `places` (the main files), `kind` `born`, `grew`, `rewritten`, `fixed`, `moved` or `removed`.
3. `table`: now, the files today and their size in lines.

## The ending

Chat: one line per chapter. Then: "Which chapter should we dig into?" Next command: `/ask why <chapter>`. Offer once to save the page to a git-ignored study folder if the project has one; only on a yes.
