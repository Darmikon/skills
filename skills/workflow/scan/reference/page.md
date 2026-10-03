# The page

You do not write HTML. You write the findings file (JSON), and a program draws the page from it: path tiles that open in Cursor, code chips, badges, light and dark themes, copy buttons with ready prompts. This file says what to put in the JSON.

## Draw it

```bash
node "<skills folder>/scan/scripts/render-page.mjs" "<tmp>/<name>-<timestamp>.json" --open
```

`<skills folder>` is the base directory of the skill you are running with its last name cut off as text (`/…/skills/scan` → `/…/skills`). The program writes the `.html` next to the JSON, prints its path, and opens it. If it stops with an error ("unknown finding", "unknown block"), fix the JSON and run it again.

## The JSON

The findings file (see "The findings file" in the `scan` skill) plus a `page` object:

```json
{
  "command": "unused",
  "family": "scan",
  "project": "/abs/project/root",
  "findings": [ { "id": "f1", "title": "…", "rank": "High", "group": "safe to remove", "action": "delete",
                  "places": [{ "path": "src/a.ts", "line": 12 }], "seen": "…", "direction": "…" } ],
  "page": {
    "lang": "ru",
    "title": "…",
    "subtitle": "…",
    "facts": [["Project", "…"], ["knip", "6.39.0"], ["Not run", "… and why"]],
    "summary": [{ "label": "safe to remove", "value": 6 }],
    "sections": [ { "title": "…", "block": "lines", "findings": ["f1", "f2"] } ],
    "top_pick": { "finding": "f1", "why": "…" }
  }
}
```

- `family` is `scan` or `ask` (it goes into the copied prompt: "Found by: /scan unused").
- `lang` is the conversation's language. Russian and English get their own prompt endings; other languages get English.
- `facts` are the header lines: what was looked at, tool versions, what did not run and why.
- `summary` is the row of counts. A kind with nothing found is left out of `sections` and shows here with its count `0`.
- `top_pick` is optional.

## The six blocks

Each section is `{ "title": …, "block": …, … }`, with optional `"note"` (one line under the title) and `"folded": true` (hidden until clicked).

| `block` | Fields | For |
|---|---|---|
| `cards` | `findings: [ids]` | big findings: title, badges, places, seen, direction, action |
| `lines` | `findings: [ids]` | short findings, one line each |
| `timeline` | `findings: [ids]`, each finding with `date` | a story in time |
| `table` | `columns: [...]`, `rows: [[...]]` | a guide, a comparison |
| `text` | `text` (paragraphs split by a blank line) | a short explanation |
| `diagram` | `mermaid`, optional `caption` | how parts connect, a sequence of calls, a before/after |

The command references speak of "a card", "a line", "a path tile", "a folded section" and colours: a card is a finding in a `cards` section, a line is one in a `lines` section, a path tile is an entry in `places`, a folded section is `"folded": true`, and colours come from the `rank` and `group` words.

Every finding in `cards`, `lines` and `timeline` gets its own copy button; a section with two or more findings gets one more, for the whole group. The prompts are built from the finding's fields, so write `title`, `places`, `seen` and `direction` so that they stand alone.

## Writing the fields

- Plain text only. A name from the code goes in backticks (`` `getRequestDb` ``) and becomes a code chip. No HTML, no Markdown.
- `places` are paths relative to the project root, with `line` (a number or a range like `"39-49"`) when there is one. A folder ends with `/`. A path outside the project goes in the text in backticks, not in `places`.
- `rank` and `group` are the words the command's reference names; known words get colours (red for `High`, `Critical`, `confirmed`, `lie`; amber for `Medium`, `Likely`, `check first`; green for `safe to remove`, `done`; blue for `Low`, `open`, `not reached`).
- Short: a title is a line, `seen` and `direction` are a sentence or two. A diagram should fit a screen; a wide one scrolls in its own box.
- No secret in any field.
