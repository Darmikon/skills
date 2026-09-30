# The scan family: scan-common, scan-what-is-it, scan-architecture

## Goal

A family of `scan-*` skills that look at a whole project, change nothing in it, and show what they found on one HTML page. This first part builds the shared base and the first two scans:

- `scan-common`: the shared rules, hidden from the command list.
- `scan-what-is-it`: a first look at an unfamiliar project.
- `scan-architecture`: today's `improve-architecture`, renamed and moved onto the shared base.

Later scans, each a separate spec: `scan-security`, `scan-performance`, `scan-unused` (built on knip). After those, maybe `scan-deps` (`npm outdated`, `npm audit`) and `scan-tests`.

Refactoring is not part of the family: a scan only looks.

## Where the files live

All three skills go to `skills/workflow/` in this repo, next to `explore`:

```
skills/workflow/
  scan-common/
    SKILL.md      the shared rules
    PAGE.md       the page layout and style
  scan-what-is-it/
    SKILL.md
  scan-architecture/
    SKILL.md      moved from improve-architecture/SKILL.md
```

`improve-architecture/` is removed; its `REPORT.md` is split between `scan-common/PAGE.md` (layout, colours, header, dark mode) and `scan-architecture/SKILL.md` (the architecture cards and picture patterns).

Each skill is linked into `~/.claude/skills/` the same way as the others (a symlink to the repo folder), and the `improve-architecture` link is removed. Each is added to `.claude-plugin/plugin.json`, the root `README.md` (the install-all line and the workflow table) and `skills/workflow/README.md`; `improve-architecture` is removed from all three.

## scan-common

Frontmatter: `user-invocable: false`, so it does not show in the `/` menu, and a description that says it is loaded by the `scan-*` skills and does nothing on its own.

Every `scan-*` skill calls it with the Skill tool as its first step. It holds:

1. **Change nothing in the project.** No file created, changed or deleted in the project, no commit, no push, no install into the project. A tool run through `npx` that leaves the project as it was is allowed. The only file written is the page.
2. **The page.** One self-contained HTML file at `${TMPDIR:-/tmp}/<scan-name>-<timestamp>.html`, opened with `open` (macOS) or `xdg-open` (Linux); the full path is given in the chat. Layout and style are in `PAGE.md`: header (project, date, what was looked at, legend when the scan draws pictures), body (the scan's own sections or cards), footer (the top pick, when the scan has findings). Light and dark, readable at phone width, Tailwind and Mermaid from their CDNs, nothing else.
3. **Proof.** Every finding names a file and line and says what was seen there. What was not checked is marked as a guess, in the same sentence. A scan that finds nothing worth showing says so and stops.
4. **The ending.** A short list in the chat (one line per item), then one question: which item to follow. The chosen item goes to the skill the scan names: `explore` for findings, `how` for `scan-what-is-it`. Nothing starts before the user picks.
5. **Language.** The chat and the page follow the language of the conversation.

A `scan-*` skill adds only: where to look, what to look for, what its page sections or cards hold, and which skill takes the chosen item.

## scan-what-is-it

User-invoked only (`disable-model-invocation: true`). `/scan-what-is-it [folder]`: with a folder it looks only there.

The page answers six questions, one section each:

1. **What is it.** Two or three sentences on what the project does, from the README and the code.
2. **The parts.** A picture of the pieces and how they connect: apps, packages, services, databases, outside services.
3. **The main paths.** One or two typical paths from start to end (a request, a message, a job), with the files along the way.
4. **Where things are.** A short guide to the folders: what lives where, what can be skipped (generated code, vendored code, build output).
5. **Run and test.** The exact commands, taken from the project's files (`package.json` scripts, `Makefile`, docs). Commands are listed, not run.
6. **Surprises.** Odd spots worth knowing before starting: generated code not to edit by hand, two places doing one job, a config that changes behaviour quietly.

Each statement follows the proof rule: a file path for what was seen, "guess" for what was inferred.

Ending: "Which part should we dig into?" The chosen part goes to `how`.

## scan-architecture

The current `improve-architecture` skill, with these changes:

- Renamed to `scan-architecture`; the command becomes `/scan-architecture [area]`.
- First step: load `scan-common`. The rules it now carries (change nothing, the page, proof, the ending, language) are removed from this skill.
- The page's architecture part (card fields, strength badges, picture patterns, tone and words) stays in this skill.
- Ending unchanged: the chosen candidate goes to `explore`.

## Checks

- Every `SKILL.md` has valid frontmatter; `plugin.json` parses as JSON.
- The three links in `~/.claude/skills/` resolve, and the old `improve-architecture` link is gone.
- No file in the repo still names `improve-architecture`.
- `scan-what-is-it` run once on `~/dev/useai-api` (read only): the page opens, answers the six questions, and the project's `git status` is unchanged afterwards.

## Out of scope

- `scan-security`, `scan-performance`, `scan-unused`, `scan-deps`, `scan-tests`.
- Any change to `explore` or `how`.
