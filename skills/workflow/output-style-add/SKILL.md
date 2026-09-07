---
name: output-style-add
description: 'Create a new custom output style from a plain-language description — brainstorm the role, tone, format and whether Claude keeps its coding instructions, write the .md with valid frontmatter — into the repo output-styles/ directory when you are in a styles repo, otherwise ~/.claude/output-styles/ — install it, register it in the LPM style button when lpm is present, then offer to switch to it. Use when the user asks to add, create or make an output style, "создай output style", "добавь стиль", "хочу чтобы Клод всегда отвечал так", or describes a voice, persona or answer format they want in every reply. Invoke with /output-style-add [description].'
disable-model-invocation: true
---

# Output style — create a new one

Turn a description into a working output style file, then offer to switch to it.

An output style is appended to Claude Code's **system prompt** and applies to every turn of the main conversation. That is a big hammer. Before writing one, make sure it is the right one:

| The user wants | Right tool |
|---|---|
| A different role, tone or answer format, every turn | **Output style** — continue |
| Claude to know project conventions or codebase facts | `CLAUDE.md` |
| A reusable workflow they invoke by name | A skill |
| A one-off tweak for a single run | `claude --append-system-prompt` |
| A separately scoped helper for one task | A subagent |

If the request is really one of the bottom four, say so in one sentence and offer that instead. The user can still say "no, make it a style" — then make it.

## Step 1 — Brainstorm the style

Do not write the file from a one-line description. Invoke the **brainstorming** skill and work through intent and design first.

If that skill is not installed, ask these inline instead — one question at a time, not as a wall:

1. **Role and audience.** Who is Claude in this mode, and who is reading? "Reviewer talking to the author", "tutor talking to a beginner", "analyst writing for a PM".
2. **What changes versus default.** Tone, opening line, structure, length, use of code blocks, tables, diagrams.
3. **Still doing software engineering?** This decides `keep-coding-instructions` — see Step 2.
4. **Two or three concrete pairs.** A reply that annoys the user, and the same reply done right. These become the rules; without them the style is vibes and Claude will drift back to default.
5. **When the style should step aside.** Destructive actions, "explain this properly", real ambiguity — most good styles carve out exceptions.
6. **Name and one-line description.** The description is what shows up in the `/config` picker and in `/output-style`.

Come back with a short plan — name, one-line description, `keep-coding-instructions`, and the rule list — and get a yes before writing anything.

## Step 2 — Decide `keep-coding-instructions`

Default is `false`, and false is destructive: without it Claude Code's built-in software-engineering instructions are **dropped** — how to scope changes, write comments, verify work, use tools carefully.

- `true` → the style changes *how Claude talks* while it keeps coding the same way. Nearly every style built for a developer wants this.
- omitted / `false` → Claude is not doing software engineering here at all (writing assistant, data analyst, tutor). The style body must then carry any behaviour it still needs.

When in doubt, `true`, and say why in one line.

## Step 3 — Pick where the file lives

Two destinations, and the working directory decides:

**A styles repo** — the git root holds an `output-styles/` directory. Author the style there. The repo file becomes the single source of truth and Step 6 links it into `~/.claude/output-styles/`, so later edits to the repo file change the live style with no reinstall. A style committed there also ships automatically to anyone who installs the repo as a Claude Code plugin, which auto-discovers `output-styles/` at the plugin root.

**Anywhere else** — write straight to `~/.claude/output-styles/`. User level: every project, and every Claude account whose config directory symlinks that folder (LPM multi-account setups do exactly that).

```bash
ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ROOT" ] && [ -d "$ROOT/output-styles" ]; then
  F="$ROOT/output-styles/<kebab-name>.md"      # styles repo — install in Step 6
else
  mkdir -p "$HOME/.claude/output-styles"
  F="$HOME/.claude/output-styles/<kebab-name>.md"
fi
[ -e "$F" ] && echo "EXISTS — do not overwrite without asking: $F"
```

File name: kebab-case of the style name (`Diagrams first` → `diagrams-first.md`). The file name is only a fallback identity — the frontmatter `name` wins, so they may differ without breaking anything.

Project-scoped instead (`.claude/output-styles/` in the working repo) only when the user asks for it: a style that belongs to one codebase and should travel to teammates in git.

If the file already exists, stop and offer three options: overwrite, pick a different name, or edit the existing one.

## Step 4 — Write the file

```markdown
---
name: Diagrams first
description: Lead every explanation with a diagram
keep-coding-instructions: true
---

When explaining code, architecture, or data flow, start with a Mermaid diagram
showing the structure, then explain in prose.

## Diagram conventions

Use `flowchart TD` for control flow and `sequenceDiagram` for request paths.
Keep diagrams under 15 nodes.
```

Frontmatter fields — these four exist, nothing else:

| Field | Use |
|---|---|
| `name` | Style name; falls back to the file name |
| `description` | One line, shown in the picker |
| `keep-coding-instructions` | Step 2. Include only when `true` |
| `force-for-plugin` | Plugin-shipped styles only — irrelevant here |

Quote the `description` in single quotes if it contains a colon followed by a space, or the YAML will not parse.

Rules for the body, in order of how often they get broken:

1. **Imperative rules, not adjectives.** "Start with the command to run" beats "be concise and actionable".
2. **Show bad → good.** One pair per rule the user actually cares about. This is what makes a style stick.
3. **Say what to do, not only what to ban.** A style made of prohibitions produces stiff, hedging output.
4. **Keep it tight.** Aim under ~80 lines. It rides in the system prompt on every request and gets re-injected as reminders.
5. **No project facts.** Paths, stack, conventions belong in `CLAUDE.md` — a style is global and follows the user into unrelated repos.
6. **Carve out the exceptions.** Destructive actions, explicit "explain in depth", genuine ambiguity.
7. **Do not write rules about subagents.** Subagents run their own system prompt and never see the style. Only a fork inherits it.

## Step 5 — Verify it parses

```bash
head -20 "$F"
awk 'NR==1 && $0!="---" { bad="no opening ---"; exit 1 }
     NR>1 && $0=="---"       { ok=1; exit 0 }
     END { print ok ? "frontmatter ok" : "BROKEN: " (bad ? bad : "no closing ---"); if (!ok) exit 1 }' "$F"
```

Show the user the finished file. A style that reads fine in the abstract often reads wrong once it is concrete — this is the cheap moment to fix it.

## Step 6 — Install it (styles-repo case only)

A style authored inside the repo is invisible to Claude Code until it lands in `~/.claude/output-styles/`. There is no install-time hook to do this for you — Claude Code has none, and `npx skills add` copies only skill directories — so run the repo's installer:

```bash
"$ROOT/scripts/install-output-styles.sh"    # idempotent; --copy for copies, --dry-run to preview
```

No such script in the repo? Link the one file:

```bash
mkdir -p "$HOME/.claude/output-styles"
ln -sfn "$F" "$HOME/.claude/output-styles/$(basename "$F")"
```

Skip this step entirely when Step 3 wrote straight to `~/.claude/output-styles/` — it is already in place.

## Step 7 — Add it to the LPM button

`add-lpm-button.sh`, bundled next to this file, puts the new style into the LPM footer **style** button so it is one click away:

```bash
"<skill dir>/add-lpm-button.sh" "Diagrams first" 🎨      # name, then an optional emoji
```

It reads the global config with `lpm config get`, inserts the entry just above the group's `pick` item with a position halfway between them, and applies with the revision it read — it never edits `global.yml` directly. It exits 0 doing nothing when lpm is absent, the app is unreachable, the `output-style` group does not exist, or the style is already listed, so it can never block finishing a style.

Pass its output through as-is. If it says the button was NOT added, show the error rather than hiding it — the usual cause is that some other project's config is invalid, which blocks every write to the global layer.

## Step 8 — Offer to switch to it

Ask first; a new style should not hijack the session silently.

```bash
S="$HOME/.claude/settings.json"
[ -f "$S" ] || echo '{}' > "$S"
tmp=$(mktemp)
jq --arg s "Diagrams first" '.outputStyle = $s' "$S" > "$tmp" && cat "$tmp" > "$S" && rm -f "$tmp"
```

Write back with `cat "$tmp" > "$S"`, never `mv` — `mv` replaces the file and breaks symlinks pointing at that path, which is how multi-account setups share one settings file.

Then, exactly:

1. Where the file landed.
2. Whether it is now the selected style.
3. **It takes effect after `/clear` or in a new session** — the system prompt for this session is already built. `/clear` wipes the conversation, so the user runs it.
4. `/output-style` switches away again; `Default` turns styling off.

If a project `.claude/settings.local.json` or `.claude/settings.json` already sets `outputStyle`, it outranks the user setting — warn, and offer to clear that key.
