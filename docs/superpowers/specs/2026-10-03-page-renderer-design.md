# A program that draws the scan pages

## Why

Every `scan` run and `ask what-is-it` wrote its whole HTML page by hand, following 1,500 words of page rules. That was the most expensive and least stable part of a run (two copy buttons, double slashes, wrong `lang`, made-up badge names). The findings already go into a JSON file; a program can draw the page from it the same way every time.

## What

`skills/workflow/scan/scripts/render-page.mjs`: plain Node (built-ins only, no install). `node render-page.mjs <findings.json> [--open]` writes `<same name>.html` next to the JSON, prints its path, and with `--open` opens it (`open` on macOS, `xdg-open` on Linux).

The model writes only the JSON. It never writes HTML or CSS.

## The JSON

The findings file as it is (`command`, `project`, `folder`, `created`, `head`, `dirty`, `findings`), plus a `page` object:

- `lang`: the page language (`ru`, `en`, …); sets `<html lang>` and the words of the copy prompts.
- `title`, `subtitle`: the page heading and one line under it.
- `facts`: `[[label, value], …]` for the header (what was looked at, tool versions, what did not run).
- `summary`: `[{ "label": …, "value": … }]`: the row of counts.
- `sections`: in order, each `{ "title": …, "block": …, … }`, one of six blocks:
  - `cards`: `findings: [ids]`, one card per finding (title, rank and group badges, places as path tiles, seen, direction, action);
  - `lines`: `findings: [ids]`, one line per finding (places, title, action);
  - `table`: `columns: [...]`, `rows: [[...], …]`;
  - `text`: `text`;
  - `diagram`: `mermaid` (a Mermaid source), `caption`;
  - `timeline`: `findings: [ids]`, each finding with `date`.
  - optional on any block: `note` (one line under the title), `folded: true` (inside `<details>`).
- `top_pick`: `{ "finding": id, "why": … }`, optional.

Text fields are plain text; `` `name` `` in backticks becomes a code chip. Nothing else is markup.

## What the program does itself

- Escapes all text. Path tiles from `places` (`cursor://file<root>/<path>:<line>`, `<wbr>` after slashes, line label). Badges from `rank` and `group` with fixed colours for the known words (`High`/`Critical`/`confirmed` red, `Medium`/`Likely` amber, …; unknown words neutral).
- Light and dark themes, phone width, a picture that is too wide scrolls in its own box.
- Copy buttons: one per finding in `cards`, `lines` and `timeline`; one per section only when it has two or more findings. The prompt text is built from the finding's fields and `project`/`command`, ending with the fixed ask line in `lang` (Russian or English; other languages get English).
- Loads Mermaid only when a `diagram` block is present.

## What changes in the skills

- `scan/reference/page.md` becomes the description of the JSON `page` object and the six blocks (short).
- `scan/SKILL.md` "The page" and "The findings file": write the JSON, then run the program with `--open`; give the page link and the JSON path in the chat. "Copy buttons" and HTML rules leave the skill.
- Each scan reference keeps saying what to find and what goes in each section, in terms of blocks.
- `ask/SKILL.md` "The page": the same program, from the `scan` skill's folder.
- `fix` does not change.

## Checks

- `node --test` on `scan/scripts/render-page.test.mjs`: escaping, path tiles, the copy-button rule (one finding → no section button), language of the ask line, diagram only when present.
- A new sandbox project with planted problems; `/scan unused`, `/scan comments` and `/ask what-is-it` run through the skills there, pages drawn by the program, `git status` of the sandbox unchanged.
