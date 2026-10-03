# ask who

Who knows an area of the code best. Answer in the chat.

## Look

For the area's paths:

- `git shortlog -sne -- <paths>` overall, and with `--since='6 months ago'`;
- the authors of the most-changed files (`git log --format='%an' -- <file> | sort | uniq -c | sort -rn`);
- reviewers of the pull requests that touched the area, when `gh` is signed in (`gh pr list --state merged --search '<path>' --json number,author,reviews`);
- a `CODEOWNERS` entry, if any.

Not a git repo, or `gh` not signed in: say what could not be seen.

## The answer

Up to five people, each with why (wrote most of it, changed it lately, reviews it, owns it) and when they last touched it. Names and emails as git and GitHub show them; nothing more personal. Then: "Want to see what they changed?" Next command: `/ask history <area>`.
