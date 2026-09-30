---
name: scan-architecture
description: 'Look through the code that exists for places that are harder to understand and test than they need to be, and show them on one page with before/after pictures. Changes nothing in the project.'
argument-hint: '[an area, a module or a pain point]'
disable-model-invocation: true
---

# scan-architecture

Find the places in the existing code where the design costs more than it gives, and show them as candidates on one page. The one the user picks is thought through in `explore`.

This scan criticises code that is already written. It does not judge a plan that is not yet code: for that, use `explore`.

**First:** call the Skill tool with `scan-common` and follow its rules: change nothing, the page, proof, the ending, language. This file adds only the architecture part.

## Words to use

Use these words exactly, in the page and in the chat, so that every candidate is judged the same way.

- **Module**: anything with an interface and an implementation: a function, a class, a file, a package, a slice across layers.
- **Interface**: everything a caller must know to use the module: the types, but also the order of calls, the errors, the config it needs.
- **Implementation**: the code inside the module.
- **Deep**: a lot of behaviour behind a small interface. **Shallow**: the interface is nearly as big as the implementation, so the module only passes things through.
- **Seam**: the place where the module's interface lives, where behaviour can change without editing the callers.
- **Adapter**: a concrete thing that fills a seam: the real HTTP client, the in-memory fake.
- **Leverage**: what callers get from a deep module: much behaviour for little to learn.
- **Locality**: what maintainers get: a change, a bug, a test stays in one place.

Do not swap them for "component", "service", "layer", "wrapper", "API" or "boundary".

## The checks

- **The deletion test.** Imagine deleting the module. If the complexity goes away, it was a pass-through: a candidate. If the complexity comes back in every caller, it earns its place: leave it.
- **The interface is the test surface.** If a test has to reach past the interface to check something, the module has the wrong shape.
- **One adapter is a guess, two adapters is a seam.** A seam with one real adapter and no test adapter is only indirection.
- **Scattered knowledge.** To understand one idea, do you have to jump between many small modules? That is missing locality.
- **Leaks.** Does one module know about the inside of another?
- **Hard to test.** Which parts have no tests, or cannot be tested through their interface?

## Steps

### 1. Choose where to look

- If the user named an area after `/scan-architecture`, look there and skip the rest of this step.
- Otherwise read the recent history: `git log --oneline -60 --name-only`. The files that change most often are where a better design pays back first. If the changes are spread out with no clear hot spot, look wider.

Then read what the project already decided: `CLAUDE.md`, `AGENTS.md`, and the design notes under `docs/` in the area. Take the project's own names for things from there. Do not suggest what a written decision already rejected, unless the pain is real enough to reopen it, and then say so on the card.

### 2. Walk the code

Start an `Explore` subagent (or read yourself if the area is small) with the area and the checks above. Ask it to report places where it felt friction, with file paths and one line of evidence each, and not to follow a fixed recipe. Keep what the code shows; drop what is only a taste.

### 3. The page

The body is one card per candidate:

- **Title**: names the change, e.g. "Merge the three token helpers into one module".
- **Strength**: `Strong` (emerald), `Worth exploring` (amber) or `Speculative` (slate). A candidate you believe in but did not confirm is `Speculative`, and the card says what was not checked.
- **Files**: the files involved.
- **Before / after picture**: side by side. This is the centre of the card.
- **Problem**: one sentence, what hurts, with the evidence you saw.
- **Direction**: one sentence, what would change. Not a new interface, no code.
- **Wins**: short bullets in the words above: "locality: token bugs live in one module", "leverage: one interface, four callers". Not "cleaner" or "easier to maintain".
- **Decision warning**, only if the candidate goes against a written project decision: one line in an amber box.

The header legend: solid box = module, dashed line = seam, red arrow = leak, thick dark box = deep module.

Pick the picture that fits each candidate, and do not make every card look the same:

- **Mermaid flowchart**: "X calls Y calls Z, and look at the mess". Colour leaks red with `classDef`. A sequence diagram works for "before: six round trips, after: one".
- **Hand-built boxes**: the "after" as one thick deep module with its old parts faded inside.
- **Cross-section**: stacked bands for the layers a call passes through. Before: six thin bands. After: one thick band.
- **Mass picture**: two rectangles per module, interface and implementation. Shallow: almost the same height. Deep: a short interface over a tall implementation.
- **Call-tree collapse**: before, a tree of nested boxes; after, the same tree folded into one box.

The top pick is the candidate to start with.

### 4. The ending

Chat line per candidate: its title and its strength. Closing question: "Which one should we think through?" The next skill is `explore`: `/explore <the candidate>`.

Adapted from `improve-codebase-architecture` and `codebase-design` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), without the glossary and ADR writing and without the grilling step.
