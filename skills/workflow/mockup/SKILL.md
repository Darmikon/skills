---
name: mockup
description: 'Build a throwaway mockup to answer a design question by trying it: a clickable HTML file for logic and states, or several screen variants switchable in the app. Lives in the OS temp folder or is removed after the choice.'
argument-hint: '[the question to answer]'
disable-model-invocation: true
---

# mockup

A mockup is throwaway code that answers one question by letting people try it, when talking about it does not settle it. The question decides the shape.

## Pick the shape

- **"Does this logic or state model hold up?"** (an order's states, a retry policy, how a limit counts) → [logic.md](reference/logic.md): one HTML file with buttons and guided scenarios, in the OS temp folder. Someone who does not code can open and click it.
- **"What should this look like?"** → [ui.md](reference/ui.md): 3 to 5 really different variants of a screen, inside the running app, switched with a bar at the bottom. Removed after the choice.

If the question is unclear, ask once. If the user is not around, take the shape that fits the code near the question (a backend module → logic, a page or component → screen) and say so at the top of the mockup.

## Rules for both

1. **Throwaway and marked as such.** Every name says `mockup`. Nothing of it is committed.
2. **One step to run.** The logic file opens with a double-click; the screen variants open at one URL of the dev server.
3. **No real data writes.** State lives in memory. If the question is about storage, use a scratch file named `MOCKUP-delete-me`.
4. **No polish.** No tests, no error handling beyond what keeps it running, no abstractions.
5. **Show the state.** After every click (logic) or variant switch (screen), the full relevant state is on screen.
6. **The project's words.** Labels use the domain words (from the glossary if there is one), not code names, and the user's language.

## When it has answered

1. **Say the answer** in the chat: the question, what was tried, what was decided.
2. **The decision.** If it is worth a record (hard to undo, odd without its reason, a real choice), offer to record it through the `domain-model` skill.
3. **The code that proved itself** (the logic module, the winning variant) goes into the real code only after a yes, rewritten to the project's standards: with tests and error handling. Name the next step: just do it when small, `brainstorming` when it opens a design.
4. **Clean up** as the shape's reference says. Nothing goes to a branch, nothing is committed.

Answer in the user's language.

Adapted from `prototype` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), with the mockups in the OS temp folder instead of a throwaway branch.
