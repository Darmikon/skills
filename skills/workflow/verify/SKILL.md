---
name: verify
description: 'Check that the code does what was promised, item by item, with proof: a ticket, a spec, a plan or a list. A fresh helper runs a test for each item; a missing test is written and run in a temporary copy, made only then. The project is not changed. Report only, no fixes.'
argument-hint: '[ticket link | spec or plan file | nothing]'
disable-model-invocation: true
---

# verify

The user wants to know one thing: does the code do what was promised? Not "is the code nice" (that is code review), not "do the old tests pass". Each promise, one by one, with proof.

"Done" in this report means "a test or a run showed that it works". "Looks done" is not done.

You report. You do not fix, and you do not change the project: not the code, not the tests, not one file. The user fixes later with other commands, so the report must be good enough to start from.

## 1. Find the promise

The promise is any written list of what the work must do. Take it from, in this order:

1. **The argument.** A ticket link or key, a file, or text after `/verify`.
2. **The branch name.** A ticket key such as `HQT-123` in it: read that ticket with the tool that the session has for the tracker (the Atlassian tools for Jira, `gh issue view` for GitHub). Use the description and the acceptance criteria.
3. **Spec or plan files** that this branch added or changed, for example under `docs/superpowers/specs/` or `docs/superpowers/plans/`.
4. **The conversation.** A list of requirements that the user gave or agreed to.

Say in one line what you took and how to point at something else. If two sources fit, or none fits well, ask and stop.

Find what this branch changed: the default branch (`main` or `master`, from `git symbolic-ref refs/remotes/origin/HEAD` when it exists), then `git merge-base HEAD <default>`, then the diff from that point, including uncommitted changes. Save `git status --porcelain` now. You need it in step 4.

## 2. Split it into items

Write the promise as a numbered list. One item is one thing that you can check, said as behaviour: "a second click on Pay creates no second order", not "handle double submit". Keep the user's words and the ticket's words. Do not add promises that nobody made. If one line of the ticket holds two checks, make two items.

A design decision that the plan or spec wrote down ("store the id in Redis", "no new dependency") is an item too.

Show the list and ask one question: is this the promise? Wait for the answer. If you read the promise wrong, the whole check is wasted.

## 3. The temporary copy, only when it is needed

New tests are written only in a temporary copy of the project, never in the project itself. The copy costs time, so nobody makes it up front. The helper makes it only when the first item has no test, and makes it once. If every item already has a test, there is no copy.

These are the commands for the copy. The helper runs them, so paste them into its prompt:

```bash
COPY="$(mktemp -d)/verify"
git worktree add --detach "$COPY" HEAD
git diff HEAD --binary | git -C "$COPY" apply --allow-empty      # uncommitted changes
git ls-files --others --exclude-standard -z | xargs -0 -I{} rsync -R {} "$COPY"/   # new files not yet added
# link the installed dependencies instead of installing them
find . \( -name node_modules -o -name .venv -o -name venv -o -name vendor \) -prune -type d -not -path './.git/*' |
  while read -r d; do d="${d#./}"; [ -e "$COPY/$d" ] || { mkdir -p "$COPY/$(dirname "$d")" && ln -s "$PWD/$d" "$COPY/$d"; }; done
```

Run it from the project root. Never install dependencies in the copy. If the tests need other ignored files that the project has, such as `.env`, link those the same way.

If the copy cannot be made, or the tests still do not start in it, every item that needs a new test is "not verified: the temporary copy did not work". The other items are checked as usual. Say why in the report.

## 4. A fresh helper proves each item

You saw how the code was written, so you are not the one who checks it. Start one `general-purpose` subagent. Give it the prompt below, with the items and the facts filled in. Do not give it your opinion of the code.

```
You check that code does what was promised. You did not write this code.
Trust nothing that you did not see run.

Project (read it, run existing tests and the program here, change nothing): <absolute path>
Default branch: <name>. The branch changes are: git diff <merge-base>  (plus uncommitted changes)
Test command(s) that this project uses: <what you found, or "find them">

Items to prove:
1. <item>
2. <item>
...

For each item:
1. Find the code that does it. Give file:line.
2. Find a test that checks exactly this behaviour. Run it in the project. A test that exists but did not run proves nothing.
3. If no test checks it, write one in the temporary copy (see below): next to the tests of that code, in the same style and with the same tools. Name it after the item. Run it in the copy. Put its full text in your answer: the copy will be deleted.
4. If a test cannot show it (how a screen looks, the text of an email, a call to an outside service), check it by running the program, when you can do that without changing anything. Otherwise mark it "not verified" and say why.
5. Also say if the code does the item differently from what was promised, or only in part.

The temporary copy: make it only when the first item needs a new test, and only once. Run these commands from the project root:
<the commands from step 3>
Never install dependencies in the copy. If it cannot be made, or the tests do not start in it, stop trying: every item that needs a new test is "not verified: the temporary copy did not work", with the reason.

Rules:
- Do not change any file in the project. Write only in the temporary copy, and only tests.
- A test that fails stays as it is. Do not change it until it passes, and do not "fix" the code. The failing test is the finding.
- If the whole test run is already broken before your tests (it does not start, or old tests fail), say so first. Do not work around it.
- Do not commit. Do not install anything.
- Unsure about a verdict? Say "not verified" and why. Never round a guess up to "proven".

Start your answer with one line: "copy: <path>" or "copy: none".
Then one block for each item:
item: <number>
status: proven | broken | not verified
code: <file:line, or "not found">
test: <file:line> | none
test is: existing (in the project) | new (in the copy; full text below)
test result: pass | fail | did not run  (with the command and the key output lines)
notes: <differences from the promise, partial work, why not verified>
new test text: <only for a new test: the file it belongs in, and the full test>
```

## 5. Check the helper, clean up, report

Before you trust the answers:

- Run `git status --porcelain` in the project and compare it with what you saved in step 1. They must be the same. If the helper changed a file in the project, say so at the top of the report, and list the files. Do not undo it yourself.
- For each item marked `proven`, check that the test result is `pass` with real output. With no output, it is `not verified`.

Then, if the helper made a copy, delete it: `git worktree remove --force <path>`. Check with `git worktree list` that no copy is left, even if the helper said "copy: none".

Then write the report in the user's language:

**The source:** what you checked against (ticket key, file, "list from the chat").

**The table:**

| # | Item | Status | Code | Test |
|---|------|--------|------|------|
| 1 | a second click creates no second order | proven | `order.ts:42` | `order.test.ts:88`, existing, pass |
| 2 | ... | broken | `webhook.ts:17` | new, fail (text below) |
| 3 | ... | not verified: needs the payment sandbox | `pay.ts:9` | none |

**The findings,** each with the item number, the file:line and one line on what is wrong:

- **Must fix:** an item that is not done, or that has a failing test.
- **Should fix:** an item done differently from the promise, or only in part; a design decision not kept; an item that works but has no test in the project.
- **Could fix:** small things that touch the promise. Not code style: that is code review.

**Tests to add:** for each new test that the helper wrote in the copy, the file where it belongs, whether it passed or failed, and the full test text, ready to paste. Nothing of this is in the project. A failing test here is where a fix can start.

**The verdict,** one line, honest:

- Any "must fix": "N items must be fixed."
- Nothing to fix and every item proven: "Every item is proven."
- Anything not verified: never say "done" or "ready". Say "No broken items among the ones checked. Not verified: <items and why>."

Stop there. Do not offer to fix. Do not start another skill.
