---
name: handoff-lpm
description: 'Hand this conversation over to a fresh Claude session in a new lpm tab.'
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

# handoff-lpm

The user is stopping here and carrying the work on in a new session. Do the whole move in one go: write the handoff document, then open a new Claude session in a new lpm tab and give it that document.

Run this only when the user asks for it. Never start it by yourself, and never as a step inside other work.

## The document

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

The next agent will trust this document and cannot ask you anything. Say as a fact only what was checked in this session. Mark everything else as not verified.

## Open the new session

Check the file first: it must exist and hold the document. If it does not, stop here and tell the user. A new session that points at a file that is not there is worse than no new session.

```bash
lpm run --command claude --prompt "<the one-line message>" -p "$LPM_PROJECT_NAME"
```

This opens a new tab in the lpm app, starts Claude in it, types the message and sends it.

The message is the first thing that the new session reads. Build it from the absolute path of the document and what the next session is for:

```
Read /full/path/to/handoff-....md and continue from it: <what the user typed after the command>
```

Four things decide whether this works:

- **One line.** The message is typed into Claude and then Enter is pressed. A line break inside it sends the message early, and the rest of the text is lost.
- **The absolute path.** The new session starts in the project directory, and the document is in the temporary directory of the OS. A relative path finds nothing.
- **The same project.** `LPM_PROJECT_NAME` is the project of this session, so the new tab opens on the same code. If that variable is empty, leave out `-p`, because an empty name matches every project and the command fails.
- **Safe quoting.** The path and the message go through the shell. Keep the message in double quotes, and keep apostrophes and backticks out of it.

## When lpm cannot do it

`lpm run` fails with exit code 2 when the lpm app is not running, or when it cannot tell which project this is. It fails with 127 when lpm is not installed.

Do not retry, and do not look for another way to open a tab. Tell the user in one line what failed, then give them the message from the step above in a code block. They can open a session themselves and paste it. The document is already written, so nothing is lost.

## The reply

Three short lines: the path of the document, that a new tab is open with the work in it, and the one-line message in a code block, in case the tab has to be started again by hand.

Stay in this session afterwards. Do not keep working on the task here: the new session has it now.

## Related

`handoff` writes the same document and stops there, for when the next session is not an lpm tab. The "The document" section above is copied verbatim from `handoff`. Edit one, copy to the other; `scripts/test-output-styles.sh` fails when they drift.
