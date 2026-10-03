# ask compare

How two places solve the same task, side by side, on a page.

## Read the request

Plain words: two projects and a topic ("auth in myai and use-api"), two paths, or a topic and two names. Find projects by name in the current folder and next to it (`~/dev/<name>`), forgiving small typos (`use-api` → `useai-api`), then find the topic in each. Say in one line what is compared with what, as paths. If a side cannot be found, say so and ask.

## Compare

Ask the same questions of both sides, reading both; never describe one side from memory of the other:

- the parts and their jobs; the flow; the data and where it lives; the edge cases handled; the errors; the tests; the outside services and settings.

**Never quote the other project's code** on the page or in a copied prompt: describe it in words and cite paths. Code from another project must not end up in files git tracks here.

When one side is a learning rebuild of the other (its notes, plans or epic say so), say for each difference whether it is a known, written simplification (cite where) or a gap.

## The page

JSON as the `scan` skill's `reference/page.md` says, `"family": "ask"`, `"command": "compare"`, file `ask-compare-<timestamp>.json`. Paths of the second project go in the text in backticks, since `places` are relative to `project` (the first side).

1. `text`: the two sides and the topic.
2. `diagram`: the two flows side by side, as two Mermaid subgraphs.
3. `table`: one row per question, columns: question, side A, side B.
4. `lines`: findings with `kind` `same`, `different` (with what each choice costs), `missing in A`, `missing in B`, `simplified` (with where it is written).

## The ending

Chat: the main differences, one line each. Then: "Which difference should we look at?" Next commands: `/ask how <part>` on one side, `/explore` to think about closing a gap. Offer once to save the page to a git-ignored study folder if the project has one; only on a yes.
