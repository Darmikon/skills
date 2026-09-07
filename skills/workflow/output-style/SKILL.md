---
name: output-style
description: 'Switch the Claude Code output style. With a name it switches instantly in one command — /output-style ELI5, /output-style Default — no picker, no deliberation. With no argument it lists every style reachable here (built-in, user, project, plugin), marks the active one, and shows a picker. Brings back the standalone command deprecated in v2.1.73 and removed in v2.1.91 (the picker now hides inside /config). Use when the user asks to switch, change, set, pick or see output styles, "смени стиль", "переключи output style", "какие стили есть". Invoke with /output-style [name].'
disable-model-invocation: true
---

# Output style — switch, or pick from a list

`set-style.sh`, bundled next to this file, does the real work: it resolves a style name, writes the setting, and reports. Its directory is the **base directory** printed when this skill loads — call it as `"<skill dir>/set-style.sh"`.

Three facts shape everything below:

1. An output style is appended to the **system prompt**. It applies from the next system prompt build — typically after `/clear` or in a new session. Say that; do not promise a mid-turn change.
2. The selection is one string: `"outputStyle"` in a settings JSON file. The script writes the **user** file `~/.claude/settings.json`, so the style applies in every project — and in every Claude account whose `settings.json` symlinks that path (LPM multi-account setups do).
3. Project settings outrank user settings. A stale `outputStyle` in `.claude/settings.local.json` silently wins; the script warns when it finds one.

## A name was given → one command, then stop

```bash
"<skill dir>/set-style.sh" ELI5              # case-insensitive; "Default" clears the style
"<skill dir>/set-style.sh" "Diagrams first"  # quote a name with spaces (unquoted also works)
```

That is the whole job. The script validates the name against every available style, writes the setting, and prints what happened. Do not run any other step, do not open a picker, do not "verify" by re-reading the file — the script already reported.

Answer in one line: what is set now, plus "takes effect after `/clear` or in a new session".

Unknown name → the script exits `2` and prints the available styles on stderr. Show that list and ask which one; do not guess a correction.

## No name was given → list, then pick

### Step 1 — Inventory

```bash
"<skill dir>/set-style.sh" --list      # name<TAB>level<TAB>description, custom first
"<skill dir>/set-style.sh" --active    # active name<TAB>file it came from
```

Where those come from:

| Level | Location |
|-------|----------|
| built-in | `Default`, `Proactive`, `Explanatory`, `Learning` — in the binary, no files |
| user | `~/.claude/output-styles/*.md` |
| project | every `.claude/output-styles/` between the repo root and the working directory |
| plugin | `output-styles/` inside an installed plugin |

A style's name is its frontmatter `name:`, or the file name without `.md` — a file with no frontmatter at all is still a style, named after its file.

The list is deduplicated by name, first occurrence winning, and custom styles come before the built-ins: a file named `Explanatory` is a real file Claude Code will load, so it takes the name.

### Step 2 — The picker

Ask with **AskUserQuestion**. It caps a question at 4 options, so:

- Order: custom styles first (user, then project, then plugin), then `Default`, then the remaining built-ins.
- Mark the active one in its option description so a no-op pick is obvious.
- Use each style's own description; for one without a description, say where its file lives.
- **More than 4 styles**: offer 3 plus a fourth option `Ещё стили →`, and repeat with the next 3. The auto-added "Other" choice also lets the user type a name — accept it and pass it to the script, which validates it.

No custom styles at all (`--list` returns only the four built-ins) → say so and point at `/output-style-add` before showing the built-ins.

### Step 3 — Apply the pick

```bash
"<skill dir>/set-style.sh" "ELI5"
```

Then report, three lines, no ceremony:

1. What is set now, and in which file.
2. **Takes effect after `/clear` or in a new session.** `/clear` wipes the conversation, so the user runs it, not you.
3. How to go back: `/output-style Default`.

## If a project file outranks the user setting

The script prints `WARNING: <file> sets outputStyle=<name>`. Repeat it plainly and offer to clear that key — ask first, it is someone's project config:

```bash
tmp=$(mktemp); jq 'del(.outputStyle)' .claude/settings.local.json > "$tmp" && cat "$tmp" > .claude/settings.local.json && rm -f "$tmp"
```

## If `set-style.sh` is missing

Some installers copy only `SKILL.md`. Then do the write by hand — `cat` back through the path, never `mv`, which would replace the file and break symlinks pointing at it:

```bash
S="$HOME/.claude/settings.json"; [ -f "$S" ] || echo '{}' > "$S"
tmp=$(mktemp)
jq --arg s "ELI5" '.outputStyle = $s' "$S" > "$tmp" && cat "$tmp" > "$S" && rm -f "$tmp"
# Default is the absence of a style:  jq 'del(.outputStyle)' "$S" > "$tmp" && cat "$tmp" > "$S"
```
