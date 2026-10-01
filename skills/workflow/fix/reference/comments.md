# fix comments

Correct what `scan comments` found: comments that lie, TODOs that are done or whose subject is gone, code left commented out, and comments that only repeat the code.

This file adds the comments part to the rules in [../SKILL.md](../SKILL.md).

## What goes in the plan

By kind:

- **A lie:** check it against the code once more (the code may have changed the other way since the scan), then a plan line that either corrects the comment to say what the code does, or deletes it when it adds nothing once corrected. Show the old and the new text in the line, short. When the code looks wrong rather than the comment (the comment says "two retries" and a payment flow would be safer with two), do not "fix" either: list it after the plan as a question for the user.
- **A TODO marked done or gone:** a plan line that deletes it.
- **A TODO marked old or open:** not in the plan. List them after the plan: "These are still open; say which ones to delete anyway."
- **Code left commented out:** a plan line that deletes the block. Git keeps it in history; say the commit where it was last live, so it can be found.
- **A comment that only repeats the code:** a plan line that deletes it, only for the clear cases the scan listed.

Plan lines are grouped under these four headings, lies first.

## Doing it

- Change only the comment lines. Never the code around them, not even the formatting.
- Keep the comment style the file uses (`//`, `/** */`, `#`) and its language.
- When deleting a comment leaves an empty doc block (`/** */`) or a blank line pair, tidy only that spot.
