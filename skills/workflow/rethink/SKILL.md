---
name: rethink
description: Use when any task has persisted through 3 or more attempts without resolution — bugs, feature implementations, questions, or any request the user keeps asking you to redo. Triggers on repeated failures, "still broken", "tried that already", "this is the same bug", "that's not what I asked", "no do it again", "I already told you", or when the user is visibly frustrated with repeated unsuccessful attempts at the same task.
---

# Rethink

Take a breath. Step back. You're not stuck because the task is hard — your mental model has a crack in it. This skill stops all action and walks you through finding that crack, patching it, and making sure the next person (including future-you) doesn't fall in the same hole.

**Core principle:** You are not stuck because the solution is hard. You are stuck because at least one belief about the problem, the requirements, or the system is wrong. Stop doing. Start disproving.

## When to Use

Use when **any** of these are true:

- **Bugs:** Three or more fix attempts have failed for the same bug, each fix creates new symptoms, or a fix "worked" temporarily then broke again
- **Feature implementation:** The user has asked you to redo or rework the same feature 3+ times because the output doesn't match what they want
- **Questions/requests:** The user keeps rephrasing or re-asking the same question because your answers aren't addressing what they actually need
- **Any task:** You've attempted the same thing multiple times with different approaches and none have satisfied the user
- The diagnosis, approach, or interpretation has changed between attempts
- You're explaining or justifying the same work differently on each attempt

Do **not** use this for first attempts. This is for when you've been going in circles — regardless of whether the task is a bug, a feature, a refactor, or a question.

---

## Phase 1: Set Up the Investigation

### 1.0 Declare a Moratorium

**No more code changes, answers, or output until Phase 2 is complete.**

State it explicitly:

> "We've made [N] attempts without resolution. Stepping back to audit assumptions before taking any more action."

### 1.1 Create a Problem Memory File

Create `documentation/<feature-or-area>/problem-memory.md` if one doesn't already exist. This is the **single source of truth** for this investigation. It persists across sessions, branches, and conversations.

Structure:

```markdown
# [Feature/Area] — Problem Memory

> [One-line description of the problem]
> Last updated: [date]

---

## Problem: [Short name]

### Type: [Bug / Feature / Question / Refactor / Other]

### Status: [Investigating / Attempt N / RESOLVED]

### What the user actually wants

[In their words, not your interpretation — quote them if possible]

### Reproduction / Success criteria

[For bugs: exact steps to reproduce]
[For features: what "done" looks like from the user's perspective]
[For questions: what the user is actually trying to understand or accomplish]

### Root cause of repeated failure

[Fill in as understanding evolves — mark confidence level]

### What's been tried

#### Attempt 1: [Short description]

- **What was done**: [code changed, answer given, approach taken]
- **Hypothesis**: [what you believed the user wanted or what you believed would work]
- **Result**: [what actually happened / user's reaction]
- **What we learned**: [signal extracted from the failure]

### Key files

[List of files relevant to this problem — keeps context hot across sessions]

### Key constraints

[Things that must NOT be touched, and why]
[User preferences or requirements that were missed in earlier attempts]
```

**Important patterns for the problem memory:**

- Update it after EVERY attempt, not just failures
- Record what each failed attempt _did_ prove, not just that it failed
- Keep the "Key files" list current — this is what future sessions need to read first
- Mark constraints clearly — "DO NOT touch X" with the reason
- For repeated user rejections, record **exactly what the user said was wrong** — their words, not your interpretation

### 1.2 Gather Evidence

Before any more attempts, collect evidence about what's actually happening vs. what you assumed.

**For bugs — instrument with diagnostic logging:**

- Add logs that trace the pipeline end-to-end
- Use a consistent prefix so logs are greppable
- Log at every layer boundary the bug might cross
- Log both the value AND the context
- Key question: "At which exact point does the correct value become the wrong value?"

**For features / repeated user rejections — re-read what the user actually asked:**

- Go back to the user's **original request** and every correction they made since
- List the **exact words** the user used to reject each attempt
- Compare what you delivered vs. what they described — where's the gap?
- Key question: "What is the user asking for that I keep not delivering?"

**For questions / repeated re-asks:**

- What did the user originally ask?
- What did you answer each time?
- What did the user say was wrong or insufficient about each answer?
- Key question: "What does the user actually need to know, and why aren't my answers landing?"

The goal is **observability** — you can't solve what you don't understand.

---

## Phase 2: Audit Assumptions

### 2.1 Map the Attempt History

If not already in problem-memory.md, list every attempt:

| #   | What was done | What was expected | What actually happened / User reaction | Signal |
| --- | ------------- | ----------------- | -------------------------------------- | ------ |
| 1   | ...           | ...               | ...                                    | ...    |

The **Signal** column is critical — what did this failed attempt teach you? Every failure narrows the search space.

> **Stop here.** Is there a consistent gap between "expected" and "actual"? If every attempt produced an unexpected result or user rejection, the mental model is wrong.

### 2.2 Surface and Test Assumptions

Write out every belief held about the problem:

```markdown
## Assumption Audit

| Assumption                                  | Evidence FOR    | Evidence AGAINST     | Verdict                             |
| ------------------------------------------- | --------------- | -------------------- | ----------------------------------- |
| "The problem lives in [layer/area]"         | [Observed data] | [Contradicting data] | Confirmed / Unconfirmed / DISPROVED |
| "The user wants [X]"                        | ...             | ...                  | ...                                 |
| "The solution belongs in [file/approach]"   | ...             | ...                  | ...                                 |
| "[API/framework] behaves as documented"     | ...             | ...                  | ...                                 |
```

Include assumptions about:

- **What the user actually wants** — quote their words, not your interpretation
- **Where** the problem lives — which layer, file, or concept
- **When** it manifests — on what event, input, or condition
- **What scope** the solution needs — is the approach itself wrong, or just the execution?
- **What you delivered** vs what the user described — are they the same thing?

Be ruthless: _"I thought this was the case"_ is not evidence. _"The user said X"_ or _"The log output showed X"_ is evidence.

### 2.3 Find the Earliest Wrong Turn

From the disproved assumptions, identify the one furthest upstream:

> "The assumption I can no longer defend is: [assumption]. If this is wrong, it explains why attempts [1], [2], and [3] all failed."

---

## Phase 3: Escalate the Approach

After finding the wrong assumption, assess whether the **entire category of approach** is viable, not just the specific implementation.

### Approach Categories

| Task type | Category example | When to abandon |
| --------- | ---------------- | --------------- |
| Bug fix | Fixing at the symptom layer | When logs show the root cause is in a different layer entirely |
| Bug fix | Working around the framework | When the framework explicitly manages the behavior you're patching |
| Feature | Interpreting the request literally | When the user keeps rejecting output that matches your literal interpretation |
| Feature | Building from scratch | When the user wanted a modification of something existing |
| Question | Answering the surface question | When the user keeps re-asking — they need a different depth or angle |
| Any | Iterating within the same approach | When 3 attempts in the same category all fail differently |

**The key question:** "Have I proven that NO solution in this category can work, or just that THIS attempt didn't work?"

- If the category is dead, document it in problem-memory.md and move to the next category. Don't iterate within a dead category.
- If only the specific attempt failed, design a new experiment within the same category.

### Design One Experiment

```markdown
## Experiment

**Hypothesis:** [Testable claim about the upstream assumption]
**Test:** [Smallest change — log, assertion, isolated test — that generates evidence]
**If true, I'll observe:** [Expected output]
**If false, I'll observe:** [What would appear instead]
```

> **Stop here.** Get approval before running. Then run, observe, and update problem-memory.md with findings.

---

## Phase 4: Fix and Verify

Once the correct mental model is established:

1. Write a new solution plan from scratch, independent of all previous attempts
2. For bugs: keep all diagnostic logging in place during the fix
3. For features: explicitly state what you're about to deliver and confirm it matches the user's words before writing code
4. For questions: restate what you now understand the user needs before answering
5. Verify the result against the user's original words, not your interpretation
6. Update problem-memory.md with the result (SUCCESS or what went wrong)

---

## Phase 5: Capture Learnings (Post-Resolution)

**This phase runs after the fix is confirmed working.** Don't skip it — this is what makes the pain worth it.

### 5.1 Update Problem Memory

Mark the problem as RESOLVED in `problem-memory.md`. Add:

- The final solution and why it works (conceptual, not just "what files changed")
- A cleanup TODO list: diagnostic logs to remove, dead code to delete, tests to run

### 5.2 Write the Conceptual Explanation

Write a brief explanation of:

1. **What the actual problem was** — not the symptom, but the root cause of repeated failure in plain language
2. **What mental model was wrong** — the key false belief that led to failed attempts (this could be a misunderstanding of the user's intent, not just a technical misunderstanding)
3. **Why the solution works** — what approach succeeded and why previous categories couldn't

Add it to problem-memory.md under a "Why the solution works" section.

### 5.3 Suggest CLAUDE.md / Project Doc Additions

Propose brief, specific additions to the project's `CLAUDE.md` that would help avoid this class of bug in the future. These should be:

- **Actionable** — not "be careful with layout" but "Under Fabric/New Architecture, UIKit `setNeedsLayout()` has no effect on RNSScreen frames. Use JS-level workarounds instead."
- **Scoped** — tied to the specific technology, pattern, or component
- **Brief** — 1-3 lines each

Present these as suggestions for the user to approve, not automatic edits.

### 5.4 Clean Up

After the user confirms learnings are captured:

- Remove all diagnostic `console.log` lines (check the prefixed tag you used)
- Remove any dead code from failed attempts
- Run the test suite
- Keep problem-memory.md — it's documentation, not temporary

---

## Guidelines

- **The moratorium is real.** No "just one more quick try" until assumptions are audited. That impulse is what got you here.
- **Separate observation from interpretation.** "The user said X" is observation. "Therefore the user wants Y" is interpretation — and may be the next wrong assumption.
- **Every failed attempt is signal.** It means the outcome didn't match the expectation. The gap between prediction and reality is where the truth lives.
- **Understand before you act.** If you can't articulate exactly what went wrong in previous attempts, you're guessing. Guessing is what got you here.
- **Know when to abandon a category, not just an attempt.** Three failures in the same category is a pattern. Ask: "Have I proven this category can't work?"
- **Re-read the user's actual words.** When features or questions keep getting rejected, the answer is almost always in what the user already told you. Go back and read their exact words instead of relying on your interpretation.
- **Capture the learnings.** The pain of repeated failure is an investment. The CLAUDE.md addition is the return on that investment.
