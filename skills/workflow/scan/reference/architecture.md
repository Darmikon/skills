# scan architecture

Find places in existing code where the design costs more than it gives, and show them as candidates. The one the user picks is thought through in `explore`. This scan judges written code only; a plan that is not yet code goes to `explore`.

## Words to use

Use these words exactly, on the page and in the chat:

- **Module**: anything with an interface and an implementation: a function, a class, a file, a package, a slice across layers.
- **Interface**: everything a caller must know to use the module: the types, the order of calls, the errors, the config it needs.
- **Implementation**: the code inside the module.
- **Deep**: a lot of behaviour behind a small interface. **Shallow**: the interface is nearly as big as the implementation; the module only passes things through.
- **Seam**: where the module's interface lives, where behaviour can change without editing the callers.
- **Adapter**: a concrete thing that fills a seam: the real HTTP client, the in-memory fake.
- **Leverage**: what callers get from a deep module: much behaviour for little to learn.
- **Locality**: what maintainers get: a change, a bug, a test stays in one place.

Never swap them for "component", "service", "layer", "wrapper", "API" or "boundary".

## The checks

- **The deletion test.** Imagine deleting the module. If the complexity goes away, it was a pass-through: a candidate. If it comes back in every caller, the module earns its place.
- **The interface is the test surface.** A test that must reach past the interface means the module has the wrong shape.
- **One adapter is a guess, two adapters is a seam.** A seam with one real adapter and no test adapter is only indirection.
- **Scattered knowledge.** Understanding one idea means jumping between many small modules: missing locality.
- **Leaks.** One module knows the inside of another.
- **Hard to test.** Parts with no tests, or that cannot be tested through their interface.

## Steps

### 1. Choose where to look

- An area named after `/scan architecture`: look there.
- Otherwise the files that change most in `git log --oneline -60 --name-only`. With no clear hot spot, look wider.

Then read what the project already decided: its `decisions/` folders (see "The project's words" in the scan skill), `CLAUDE.md`, `AGENTS.md`, and the design notes under `docs/` in the area. Use the project's own names for things. Do not suggest what a written decision rejected, unless the pain is real enough to reopen it; then say so on the card.

### 2. Walk the code

In a full scan, start an `Explore` subagent with the area and the checks above (in a small area, read yourself). Ask it for places where it felt friction, with file paths and one line of evidence each, not a fixed recipe. Keep what the code shows; drop taste.

### 3. The page

One card per candidate:

- **Title**: names the change ("Merge the three token helpers into one module").
- **Strength**: `Strong` (emerald), `Worth exploring` (amber) or `Speculative` (slate). A candidate you believe in but did not confirm is `Speculative`, and the card says what was not checked.
- **Files**: the files involved.
- **Before / after picture**: a `diagram` section right after the card, one Mermaid source with two subgraphs, `Before` and `After`.
- **Problem**: one sentence, what hurts, with the evidence.
- **Direction**: one sentence, what would change. No new interface, no code.
- **Wins**: short bullets in the words above ("locality: token bugs live in one module", "leverage: one interface, four callers"). Never "cleaner" or "easier to maintain".
- **Decision warning**, only when the candidate goes against a written project decision: one line in an amber box.

Header legend: solid box = module, dashed line = seam, red arrow = leak, thick dark box = deep module.

Mermaid form: a `flowchart` for "X calls Y calls Z", leaks styled red through `classDef`; a `sequenceDiagram` for "before: six round trips, after: one"; nested `subgraph`s for a module that swallows its shallow parts.

The top pick is the candidate to start with.

### 4. The ending

Chat line per candidate: its title and strength. Closing question: "Which one should we think through?" The next skill is `explore`: `/explore <the candidate>`. If the user turns a candidate down for a reason that will still hold later, offer to record it as a decision (the `domain-model` skill), so the next scan does not suggest it again.

Adapted from `improve-codebase-architecture` and `codebase-design` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), without the grilling step; the glossary and decision records live in the `domain-model` skill.
