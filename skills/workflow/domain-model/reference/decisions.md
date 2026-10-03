# Decision format

A decision is one file in a `decisions/` folder: `0001-short-slug.md`, `0002-...`. The next number is the highest one in that folder plus one. Write it in the language of the project's other docs.

## The file

```md
# {The decision, as a short sentence}

{One to three sentences: the situation, what was decided, and why.}
```

That is enough. The value is that the decision and its reason are written down, not that sections are filled.

Add these only when they help:

- `Status:` at the top: `proposed`, `accepted`, `replaced by 0007`. Useful when a decision gets revisited. A replaced decision stays, with its status changed.
- **Options considered**: only when a turned-down option is likely to be suggested again.
- **Consequences**: only when an effect is not obvious from the decision.

## What is worth a record

The three tests from the skill (hard to undo, odd without the reason, a real choice) all hold. Typical cases:

- **The shape of the system**: one repo or many; which part owns which data; how parts talk (events, HTTP, a shared package).
- **A choice that locks in**: the database, the queue, the auth provider, where it is deployed. Not every library; the ones that would take weeks to swap.
- **A boundary**: what a part will not do, which part owns a thing. A "no" is worth as much as a "yes".
- **A step away from the obvious**: plain SQL instead of an ORM, no cache on purpose. These stop the next person from "fixing" it.
- **A limit not visible in the code**: a law, a contract, a partner's API, a response time promised to someone.
- **A turned-down proposal** whose reason is not obvious, so it is not suggested again in six months.

Not worth a record: anything easy to undo, anything nobody would wonder about, anything with no real alternative.
