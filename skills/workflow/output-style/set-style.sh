#!/usr/bin/env bash
#
# Switch the Claude Code output style in one shot.
#
#   set-style.sh <name>     switch to it (case-insensitive; "Default" clears the style)
#   set-style.sh --list     print every available style, tab-separated
#   set-style.sh --active   print the active style and where it comes from
#
# Writes "outputStyle" into ~/.claude/settings.json (user level: every project, and
# every Claude account whose settings.json symlinks that path).

set -uo pipefail

SETTINGS="${CLAUDE_SETTINGS:-$HOME/.claude/settings.json}"

# name<TAB>level<TAB>description, built-ins first so a custom style of the same name wins.
list_styles() {
  printf 'Default\tbuilt-in\tThe normal system prompt — no custom style\n'
  printf 'Proactive\tbuilt-in\tActs immediately, assumes instead of asking on routine decisions\n'
  printf 'Explanatory\tbuilt-in\tAdds educational "Insights" between engineering steps\n'
  printf 'Learning\tbuilt-in\tInsights plus TODO(human) markers for you to fill in\n'
  scan user "$HOME/.claude/output-styles"
  root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  d="$PWD"
  while :; do
    scan project "$d/.claude/output-styles"
    { [ "$d" = "$root" ] || [ "$d" = "/" ]; } && break
    d=$(dirname "$d")
  done
  find -L "$HOME/.claude/plugins" -maxdepth 4 -type d -name output-styles 2>/dev/null |
    while IFS= read -r p; do scan plugin "$p"; done
}

# find, not a glob: under zsh an unmatched *.md aborts the script. -L to follow symlinks.
scan() {
  [ -d "$2" ] || return 0
  find -L "$2" -maxdepth 1 -type f -name '*.md' 2>/dev/null | while IFS= read -r f; do
    awk -v lvl="$1" -v path="$f" '
      NR==1 { if ($0 != "---") { bad=1; exit } ; next }
      !done && $0 == "---" { done=1 ; next }
      !done && /^name:[[:space:]]/        { sub(/^name:[[:space:]]*/, "");        gsub(/^["'"'"']|["'"'"']$/, ""); n = $0 }
      !done && /^description:[[:space:]]/ { sub(/^description:[[:space:]]*/, ""); gsub(/^["'"'"']|["'"'"']$/, ""); d = $0 }
      END {
        if (bad) exit
        if (n == "") { n = path; sub(/.*\//, "", n); sub(/\.md$/, "", n) }
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
  if command -v jq >/dev/null 2>&1; then
    jq -r '.outputStyle // empty' "$1" 2>/dev/null
  else
    python3 -c 'import json,sys
try: print(json.load(open(sys.argv[1])).get("outputStyle") or "")
except Exception: pass' "$1"
  fi
}

write_key() {  # $1 = style name, or empty to delete the key
  [ -f "$SETTINGS" ] || printf '{}\n' > "$SETTINGS"
  tmp=$(mktemp)
  if command -v jq >/dev/null 2>&1; then
    if [ -n "$1" ]; then jq --arg s "$1" '.outputStyle = $s' "$SETTINGS" > "$tmp"
    else                jq 'del(.outputStyle)'                "$SETTINGS" > "$tmp"; fi
  else
    STYLE="$1" python3 -c 'import json,os,sys
p=sys.argv[1]; d=json.load(open(p)); s=os.environ["STYLE"]
d.update({"outputStyle": s}) if s else d.pop("outputStyle", None)
json.dump(d, open(sys.argv[2], "w"), indent=2)' "$SETTINGS" "$tmp"
  fi
  [ -s "$tmp" ] || { rm -f "$tmp"; echo "refusing to write an empty settings file" >&2; return 1; }
  # cat, not mv: mv would replace the file and break symlinks pointing at this path
  # (multi-account setups symlink settings.json), and would drop its permissions.
  cat "$tmp" > "$SETTINGS" && rm -f "$tmp"
}

case "${1:-}" in
  --list)   list_styles; exit 0 ;;
  --active) active_style | awk -F'\t' '{printf "%s\t%s\n", $1, $2}'; exit 0 ;;
  -h|--help|"") sed -n '3,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac

WANT="$1"
MATCH=$(list_styles | awk -F'\t' -v w="$WANT" 'tolower($1) == tolower(w) { print $1; exit }')
if [ -z "$MATCH" ]; then
  echo "unknown output style: $WANT" >&2
  echo "available:" >&2
  list_styles | awk -F'\t' '{printf "  %-14s %s\n", $1, $3}' >&2
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
