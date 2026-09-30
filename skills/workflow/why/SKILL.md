---
name: why
description: 'Why is this code the way it is: the history, pull requests, tickets and, when needed, docs and chat, with every claim marked as found, converging, guessed or unknown. In the chat. Use how for what the code does.'
argument-hint: '<code, file or question>'
disable-model-invocation: true
---

# why

The user wants to know what led to the shape of some code: a decision, a trade-off, an odd threshold, a defensive check, a regression. `how` says what the code does; `why` says what forces made it so.

Code does not carry its own motive. The reason lives in commits, pull requests, tickets, docs and conversations, and all of them have holes. The job is to find what people wrote down, and to be honest about what nobody did.

The answer goes in the chat. Nothing changes: not the project, not a ticket, not a chat.

## The target

- The code or the question after `/why`.
- **No argument:** take the code the conversation is on. If that is not clear, ask one question and stop.
- If the question comes with a guess ("I assume it's for speed?"), the guess is one candidate. Check it like any other; do not confirm it to be nice.

## Look, from cheap to expensive

Stop climbing as soon as the question is answered. Say in "Sources checked" where you stopped and why.

**1. The code and its history. Always.**

- Pin the target: files, lines, symbols.
- `git blame -L <start>,<end> <file>` for who last touched the lines, `git log --follow -- <file>` for the whole history through renames. Go back past the latest commit: the shape is often older than the last change.
- Read the commit messages. Take the PR numbers (`(#1234)`) and ticket keys (`HQT-123`) from them and from branch names.
- `gh pr view <number> --json title,body,comments,reviews,closingIssuesReferences` for each PR that changed the target in a meaningful way. Review comments often hold the real reason.
- Comments next to the code, tests added in the same change, and the project's written decisions (`CLAUDE.md`, `AGENTS.md`, `docs/`, ADRs).

**2. The ticket.** When step 1 found ticket keys, or left the question open: read the tickets in the tracker that is connected (Jira, Linear, GitHub Issues). The ticket often holds the business reason that engineering never wrote down.

**3. Docs and chat.** Only when 1 and 2 left the question open: the connected docs (Notion, Confluence, Google Drive) and team chat (Slack). Search by ticket key, PR number, the symbol names and the dates from step 1.

**4. Errors and monitoring.** Only for defensive code (a retry, a timeout, a guard, a limit, a feature flag) and only when such a tool is connected: the error or incident that the code answers.

Use only what is connected in this session. A source that is not connected is a gap: name it, do not pretend it was searched.

When steps 2 to 4 need several sources at once, start one `general-purpose` subagent per source, all in one message. Give each one the target, the question, what step 1 found (files, commits, PRs, ticket keys, dates), and the rules: read only, report findings with a link or ID for each, report what it searched when it found nothing. Write the answer yourself from their reports.

## How sure

Every claim gets one mark. The mark decides where it goes and how it is worded.

- **Found**: someone wrote the reason down: a PR body, a review comment, a ticket, a code comment, a doc, a message. State it plainly and cite it right there.
- **Converging**: nobody wrote it, but several separate signs point the same way. List the signs.
- **Guess**: a reasonable reading with nothing behind it. Word it as a guess ("it looks like", "probably") and show the chain: "given A and B, probably C".
- **Unknown**: you looked and did not find it. Say where you looked and what you searched for.

Rules:

- "because", "was designed to", "the team decided" only next to a citation.
- The code is not evidence of its own motive. "It retries three times, so they wanted three retries" says nothing.
- Do not tidy messy history into a clean story. Copy-paste can look like a pattern; a missing mention of a concern does not mean there was none.
- When two sources disagree, show both with their citations. Do not pick the one that makes a neater story.
- An answer with no "What we don't know" is suspect. Check it before sending.

## The answer

Drop a section that has nothing in it.

1. **The question.** One line.
2. **The code.** Files, lines, symbols. Two lines.
3. **What we found.** One bullet per claim, with its mark (Found or Converging) and its source: PR link, ticket key, `file:line`, commit, doc or message link.
4. **What we can infer.** Guesses, each with its chain.
5. **Other explanations.** When the evidence fits more than one story: each story, what speaks for it, what is missing.
6. **What we don't know.** The open parts, and who could answer them: the author from `git blame`, the ticket's owner.
7. **Sources checked.** One line per source: what was searched and what came back, including the ones that found nothing, were not connected, or were skipped because the question was already answered.

If the user asks because they want to change this code, add:

8. **Before you change it.** Keep: what the reason still requires. Free to change: what no longer applies. Avoid: what the history shows went wrong. Risk: what could break if the unknown reason still holds.

## Ending

Ask one question: dig into a source not yet checked, ask the author, or move on to the change (`/how to <task>` or `brainstorming`). Start nothing before the answer.

Answer in the user's language.
