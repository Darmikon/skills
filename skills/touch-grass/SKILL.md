---
name: touch-grass
description: Use when a bug has persisted through 3 or more fix attempts without resolution, when each fix creates a new symptom in a different location, when the same incorrect diagnosis has been made multiple times, or when the investigation has been running in circles. Triggers on "still broken", "tried that already", "this is the same bug", or when fixes are not holding.
---

# Touch Grass

Take a breath. Step back from the code. The bug isn't smarter than you — your mental model just has a crack in it. This skill stops all code changes and walks you through finding that crack, patching it, and making sure the next person (including future-you) doesn't fall in the same hole.

**Core principle:** You are not stuck because the fix is hard. You are stuck because at least one belief about this system is wrong. Stop fixing. Start disproving.

## When to Use

Use when **any** of these are true:

- Three or more fix attempts have failed for the same bug
- Each fix creates a new symptom in a different location
- The diagnosis has changed between attempts
- A fix "worked" temporarily, then broke again
- You're explaining the same bug differently on each attempt

Do **not** use this for first-attempt debugging. This is for when you've been going in circles.

---

## Phase 1: Set Up the Investigation

### 1.0 Declare a Moratorium

**No more code changes until Phase 2 is complete.**

State it explicitly:

> "We've made [N] fix attempts without resolution. Stepping back to audit assumptions before writing any more code."

### 1.1 Create a Bug Memory File

Create `documentation/<feature-or-area>/bug-memory.md` if one doesn't already exist. This is the **single source of truth** for this investigation. It persists across sessions, branches, and conversations.

Structure:

```markdown
# [Feature/Area] — Bug Memory

> [One-line description of the bug]
> Last updated: [date]

---

## Bug: [Short name]

### Status: [Investigating / Attempt N / FIXED]

### Reproduction

[Exact steps, both variants if applicable]

### Root cause

[Fill in as understanding evolves — mark confidence level]

### What's been tried

#### Attempt 1: [Short description]

- **Files**: [what was changed]
- **Hypothesis**: [what you believed]
- **Result**: [what actually happened]
- **What we learned**: [signal extracted from the failure]

### Key files

[List of files relevant to this bug — keeps context hot across sessions]

### Key constraints

[Things that must NOT be touched, and why]
```

**Important patterns for the bug memory:**

- Update it after EVERY attempt, not just failures
- Record what each failed attempt _did_ prove, not just that it failed
- Keep the "Key files" list current — this is what future sessions need to read first
- Mark constraints clearly — "DO NOT touch X" with the reason

### 1.2 Instrument with Diagnostic Logging

Before any more fix attempts, add diagnostic logs that trace the bug's pipeline end-to-end. The goal is **observability** — you can't fix what you can't see.

**Logging rules:**

- Use a consistent prefix: `[BugName]` or `[FeatureName]` so logs are greppable in Metro/device output
- Log at **every layer boundary** the bug might cross (JS component render -> hook state -> native callback -> provider -> UI output)
- Log **both the value AND the context**: not just `width=390` but `[Portal] ScreenContainer RENDER: 390x750 top=0`
- Number or name the log points so you can trace activation chains: step 1 fires, step 2 fires, etc.
- Use `console.log` for now — these are diagnostic and will be removed in cleanup

**Where to place logs (React Native):**

- Component render functions: current state values
- Hook effects: when they fire, with what inputs
- Callbacks from native modules: confirm they actually execute
- Provider state changes: registration, activation, deactivation
- `onLayout` handlers: actual measured dimensions vs expected

**Key question the logs should answer:** "At which exact point does the correct value become the wrong value?" That boundary is where the bug lives.

---

## Phase 2: Audit Assumptions

### 2.1 Map the Fix History

If not already in bug-memory.md, list every attempted fix:

| #   | What was changed | What was expected | What actually happened | Signal |
| --- | ---------------- | ----------------- | ---------------------- | ------ |
| 1   | ...              | ...               | ...                    | ...    |

The **Signal** column is critical — what did this failed attempt teach you? Every failure narrows the search space.

> **Stop here.** Is there a consistent gap between "expected" and "actual"? If every fix produced an unexpected result, the mental model is wrong.

### 2.2 Surface and Test Assumptions

Write out every belief held about the bug:

```markdown
## Assumption Audit

| Assumption                              | Evidence FOR    | Evidence AGAINST     | Verdict                             |
| --------------------------------------- | --------------- | -------------------- | ----------------------------------- |
| "The bug lives in [layer]"              | [Observed data] | [Contradicting data] | Confirmed / Unconfirmed / DISPROVED |
| "The fix belongs in [file]"             | ...             | ...                  | ...                                 |
| "[API/framework] behaves as documented" | ...             | ...                  | ...                                 |
```

Include assumptions about:

- **Where** the bug lives — which layer of the stack
- **When** it manifests — on what event, transition, or lifecycle
- **What scope** the fix needs — can it be fixed at this layer, or must it be fixed elsewhere?
- **What the user sees** vs what has been verified with logs/evidence

Be ruthless: _"I thought this was the case"_ is not evidence. _"The log output showed X"_ is evidence.

### 2.3 Find the Earliest Wrong Turn

From the disproved assumptions, identify the one furthest upstream:

> "The assumption I can no longer defend is: [assumption]. If this is wrong, it explains why attempts [1], [2], and [3] all failed."

---

## Phase 3: Escalate the Approach

After finding the wrong assumption, assess whether the **entire category of fix** is viable, not just the specific implementation.

### Approach Categories (React Native example)

| Category                        | Example                                       | When to abandon                                                                          |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| JS styling inside the container | explicit dimensions, keys, remounts           | When logs show correct Yoga layout but wrong visual output                               |
| Native layout invalidation      | setNeedsLayout, layoutIfNeeded                | When invalidation produces zero frame changes (especially under Fabric/New Architecture) |
| Lifecycle patching              | intercepting VC callbacks, rotation observers | When the framework manages the lifecycle opaquely                                        |
| Rendering bypass                | portals, absolute overlays, modal screens     | Usually the last resort — works when the container itself is the problem                 |

**The key question:** "Have I proven that NO fix in this category can work, or just that THIS fix didn't work?"

- If the category is dead, document it in bug-memory.md and move to the next category. Don't iterate within a dead category.
- If only the specific fix failed, design a new experiment within the same category.

### Design One Experiment

```markdown
## Experiment

**Hypothesis:** [Testable claim about the upstream assumption]
**Test:** [Smallest change — log, assertion, isolated test — that generates evidence]
**If true, I'll observe:** [Expected output]
**If false, I'll observe:** [What would appear instead]
```

> **Stop here.** Get approval before running. Then run, observe, and update bug-memory.md with findings.

---

## Phase 4: Fix and Verify

Once the correct mental model is established:

1. Write a new fix plan from scratch, independent of all previous attempts
2. Keep all diagnostic logging in place during the fix
3. Test on device (not just in tests) for visual/layout bugs
4. Verify by reading the diagnostic log chain end-to-end — every step should show correct values
5. Update bug-memory.md with the result (SUCCESS or what went wrong)

---

## Phase 5: Capture Learnings (Post-Resolution)

**This phase runs after the fix is confirmed working.** Don't skip it — this is what makes the pain worth it.

### 5.1 Update Bug Memory

Mark the bug as FIXED in `bug-memory.md`. Add:

- The final solution and why it works (conceptual, not just "what files changed")
- A cleanup TODO list: diagnostic logs to remove, dead code to delete, tests to run

### 5.2 Write the Conceptual Explanation

Write a brief explanation of:

1. **What the bug actually was** — not the symptom, but the root cause in plain language
2. **What mental model was wrong** — the key false belief that led to failed attempts
3. **Why the fix works** — what layer/approach succeeded and why previous categories couldn't

Add it to bug-memory.md under a "Why the fix works" section.

### 5.3 Suggest CLAUDE.md / Project Doc Additions

Propose brief, specific additions to the project's `CLAUDE.md` that would help avoid this class of bug in the future. These should be:

- **Actionable** — not "be careful with layout" but "Under Fabric/New Architecture, UIKit `setNeedsLayout()` has no effect on RNSScreen frames. Use JS-level workarounds instead."
- **Scoped** — tied to the specific technology, pattern, or component
- **Brief** — 1-3 lines each

Present these as suggestions for the user to approve, not automatic edits.

### 5.4 Clean Up

After the user confirms learnings are captured:

- Remove all diagnostic `console.log` lines (check the prefixed tag you used)
- Remove any dead code from failed attempts (native modules, unused hooks, etc.)
- Run the test suite
- Keep bug-memory.md — it's documentation, not temporary

---

## Guidelines

- **The moratorium is real.** No "just one more quick try" until assumptions are audited. That impulse is what got you here.
- **Separate observation from interpretation.** "The log shows 390x700" is observation. "Therefore the frame is stale" is interpretation — and may be the next wrong assumption.
- **Every failed fix is signal.** It means the system behaved in a way that wasn't predicted. The gap between prediction and reality is where the truth lives.
- **Log before you fix.** If you can't see the bug's full pipeline, you're guessing. Guessing is what got you here.
- **Know when to abandon a category, not just an attempt.** Three failures in the same category is a pattern. Ask: "Have I proven this category can't work?"
- **In React Native, bugs can cross layer boundaries.** A symptom visible in JS may root in native layout, VC lifecycle, or Fabric's shadow tree. Don't assume the layer without log evidence at each boundary.
- **Capture the learnings.** The debugging pain is an investment. The CLAUDE.md addition is the return on that investment.
