#!/usr/bin/env bash
#
# Switch the Claude Code output style in one shot.
#
# Writes "outputStyle" into ~/.claude/settings.json (user level: every project, and
# every Claude account whose settings.json symlinks that path).

set -uo pipefail

SETTINGS="${CLAUDE_SETTINGS:-$HOME/.claude/settings.json}"
# Probe that jq actually runs — a broken or shadowed jq should fall back to python3.
if jq --version >/dev/null 2>&1; then HAVE_JQ=1; else HAVE_JQ=0; fi

usage() {
  cat <<'USAGE'
set-style.sh <name>     switch to that style (case-insensitive; "Default" clears it)
set-style.sh --list     every available style, as name<TAB>level<TAB>description
set-style.sh --active   the active style, as name<TAB>source file

A name may contain spaces, quoted or not: set-style.sh Diagrams first

Environment:
  CLAUDE_SETTINGS   settings file to write (default ~/.claude/settings.json)
USAGE
}

# Custom styles first, then built-ins: a file named like a built-in is a real file
# Claude Code will load, so it should win the name. Duplicates collapse to the first.
list_styles() {
  {
    scan user "$HOME/.claude/output-styles"
    root=$(cd "$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$PWD")" 2>/dev/null && pwd -P)
    d=$(pwd -P)
    while :; do
      scan project "$d/.claude/output-styles"
      { [ "$d" = "$root" ] || [ "$d" = "/" ]; } && break
      d=$(dirname "$d")
    done
    # Plugins install several levels deep (cache/<mkt>/<plugin>/<version>/output-styles).
    find -L "$HOME/.claude/plugins" -maxdepth 6 -type d -name output-styles 2>/dev/null |
      while IFS= read -r p; do scan plugin "$p"; done
    printf 'Default\tbuilt-in\tThe normal system prompt — no custom style\n'
    printf 'Proactive\tbuilt-in\tActs immediately, assumes instead of asking on routine decisions\n'
    printf 'Explanatory\tbuilt-in\tAdds educational "Insights" between engineering steps\n'
    printf 'Learning\tbuilt-in\tInsights plus TODO(human) markers for you to fill in\n'
  } | awk -F'\t' '{ k = tolower($1) } !seen[k]++'
}

# find, not a glob: under zsh an unmatched *.md aborts the script. -L follows symlinks.
# A file with no frontmatter is still a style — Claude Code names it after the file.
scan() {
  [ -d "$2" ] || return 0
  find -L "$2" -maxdepth 1 -type f -name '*.md' 2>/dev/null | while IFS= read -r f; do
    awk -v lvl="$1" -v path="$f" '
      { sub(/\r$/, "") }
      NR == 1 && $0 != "---" { nofm = 1; exit }
      NR == 1 { next }
      !done && $0 == "---" { done = 1; exit }
      !done && /^name:[[:space:]]/        { sub(/^name:[[:space:]]*/, "");        gsub(/^["'"'"']|["'"'"']$/, ""); n = $0 }
      !done && /^description:[[:space:]]/ { sub(/^description:[[:space:]]*/, ""); gsub(/^["'"'"']|["'"'"']$/, ""); d = $0 }
      END {
        if (n == "" || nofm) { n = path; sub(/.*\//, "", n); sub(/\.md$/, "", n) }
        if (nofm) d = ""
        printf "%s\t%s\t%s\n", n, lvl, d
      }
    ' "$f"
  done
}

active_style() {
  for f in .claude/settings.local.json .claude/settings.json "$SETTINGS"; do
    v=$(read_key "$f") || v=""
    if [ -n "$v" ]; then printf '%s\t%s\n' "$v" "$f"; return 0; fi
  done
  printf 'Default\t(unset)\n'
}

read_key() {
  [ -f "$1" ] || return 1
  if [ "$HAVE_JQ" = 1 ]; then
    jq -r '.outputStyle // empty' "$1" 2>/dev/null
  else
    python3 -c 'import json,sys
try: print(json.load(open(sys.argv[1])).get("outputStyle") or "")
except Exception: pass' "$1" 2>/dev/null
  fi
}

write_key() {  # $1 = style name, or empty to delete the key
  mkdir -p "$(dirname "$SETTINGS")" 2>/dev/null
  [ -f "$SETTINGS" ] || printf '{}\n' > "$SETTINGS"
  tmp=$(mktemp)
  if [ "$HAVE_JQ" = 1 ]; then
    if [ -n "$1" ]; then jq --arg s "$1" '.outputStyle = $s' "$SETTINGS" > "$tmp" 2>/dev/null
    else                jq 'del(.outputStyle)'                "$SETTINGS" > "$tmp" 2>/dev/null; fi
  else
    STYLE="$1" python3 -c 'import json,os,sys
p, out = sys.argv[1], sys.argv[2]
d = json.load(open(p)); s = os.environ["STYLE"]
d.update({"outputStyle": s}) if s else d.pop("outputStyle", None)
with open(out, "w") as fh:
    json.dump(d, fh, indent=2, ensure_ascii=False); fh.write("\n")' "$SETTINGS" "$tmp" 2>/dev/null
  fi
  [ -s "$tmp" ] || { rm -f "$tmp"; echo "refusing to write an empty settings file — is $SETTINGS valid JSON?" >&2; return 1; }
  # cat, not mv: mv would replace the file, breaking symlinks that point at this path
  # (multi-account setups symlink settings.json) and dropping its permissions.
  cat "$tmp" > "$SETTINGS" && rm -f "$tmp"
}

case "${1:-}" in
  --list)   list_styles; exit 0 ;;
  --active) active_style; exit 0 ;;
  -h|--help|"") usage; exit 0 ;;
esac

WANT="$*"   # a style name may contain spaces, quoted or not
MATCH=$(list_styles | awk -F'\t' -v w="$WANT" 'tolower($1) == tolower(w) { print $1; exit }')
if [ -z "$MATCH" ]; then
  echo "unknown output style: $WANT" >&2
  echo "available:" >&2
  list_styles | awk -F'\t' '{ printf "  %-14s %s\n", $1, $3 }' >&2
  exit 2
fi

if [ "$(printf '%s' "$MATCH" | tr 'A-Z' 'a-z')" = "default" ]; then
  write_key "" || exit 1
  echo "output style: Default (custom style cleared in $SETTINGS)"
else
  write_key "$MATCH" || exit 1
  echo "output style: $MATCH  →  $SETTINGS"
fi

for f in .claude/settings.local.json .claude/settings.json; do
  v=$(read_key "$f") || v=""
  [ -n "$v" ] && echo "WARNING: $f sets outputStyle=$v — project settings outrank the user file." >&2
done
exit 0
