---
name: handoff
description: 'Compact the current conversation into a handoff document for another agent to pick up.'
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

# handoff

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

The next agent will trust this document and cannot ask you anything. Say as a fact only what was checked in this session. Mark everything else as not verified.

Finish with a short reply to the user: the full path of the file, and one line that they can paste into the next session to point the agent at it.
