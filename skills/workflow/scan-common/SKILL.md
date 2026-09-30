---
name: scan-common
description: 'Shared rules of the scan-* skills: change nothing in the project, one HTML page in the temp directory, proof for every finding, the same ending. Loaded by scan-what-is-it, scan-architecture and the other scan-* skills as their first step; does nothing on its own.'
user-invocable: false
---

# scan-common

The rules every `scan-*` skill shares. The scan that loaded this file adds its own part: where to look, what to look for, what its page holds, the closing question, and which skill takes the item the user picks. Where the scan says something more specific, the scan wins.

## Change nothing in the project

- Do not create, change or delete any file in the project.
- No commit, no push, no branch switch, no install into the project.
- Run only commands that look: read files, search, `git log`, list the scripts. A tool run through `npx` that leaves the project as it was is allowed. If you are not sure that a command only looks, do not run it: ask.
- The one file you write is the page, and it goes outside the project.

## Proof

- Every finding or statement names a file, a line when there is one, and what you saw there.
- What you worked out but did not see is a guess. Say "guess" in the same sentence.
- Three to six good items beat twelve thin ones.
- If nothing is worth showing, say so in the chat and stop. No page.

## The page

Write one self-contained HTML file to `${TMPDIR:-/tmp}/<scan-name>-<timestamp>.html`, with the timestamp from `date +%Y%m%d-%H%M%S`. Open it with `open <path>` on macOS or `xdg-open <path>` on Linux, and give it in the chat as a `file://` link.

Read [PAGE.md](PAGE.md) next to this file for the layout and style. The scan says what goes in the body.

## The ending

1. In the chat, one line per item, in the form the scan names. Then the top pick, when the scan has one.
2. Ask the closing question that the scan names. One question.
3. When the user picks an item, give them the ready command for the next skill, one line to copy, with the item as the topic: `/<skill> <what it is, the files, the evidence>`. The next skill is one the user starts: you cannot call it yourself.

Nothing starts before the user picks. No code.

## Language

The chat and the page follow the language of the conversation. File paths, commands and names from the code stay as they are.
