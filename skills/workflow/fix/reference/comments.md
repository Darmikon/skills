# fix comments

Correct what `scan comments` found: comments that lie, TODOs that are done or whose subject is gone, code left commented out, and comments that only repeat the code.

This file adds the comments part to the rules in [../SKILL.md](../SKILL.md).

`/fix todo` runs this file with the TODOs only, from a `scan todo` or `scan comments` findings file (a fresh `scan comments` result covers it).

## What goes in the plan

By kind:

- **A lie:** check it against the code once more (the code may have changed the other way since the scan), then a plan line that either corrects the comment to say what the code does, or deletes it when it adds nothing once corrected. Show the old and the new text in the line, short. Who wins when they disagree:
  - **A technical fact** (a port, a path, a file or function name, a default value, a count of things in the code): the code wins. Correct the comment.
  - **A business fact** (money: a currency, a unit such as cents or euros, an amount, a price; a limit, a time window, a number of retries, a rule users feel), or code that looks wrong: do not "fix" either. List it after the plan as a question: "the comment says X, the code says Y; which is right?" A wrong comment about money may mean wrong prices, and only the user knows which side is the mistake.
- **A TODO marked done or gone:** a plan line that deletes it.
- **A TODO marked old or open:** not in the plan. List them after the plan: "These are still open; say which ones to delete anyway."
- **Code left commented out:** a plan line that deletes the block. Git keeps it in history; say the commit where it was last live, or that it was never live (it arrived commented out), so it can be found.
- **A comment that only repeats the code:** a plan line that deletes it, only for the clear cases the scan listed.

Plan lines are grouped under these four headings, lies first.

## Doing it

- Change only the comment lines. Never the code around them, not even the formatting.
- Keep the comment style the file uses (`//`, `/** */`, `#`) and its language.
- When deleting a comment leaves an empty doc block (`/** */`) or a blank line pair, tidy only that spot.
