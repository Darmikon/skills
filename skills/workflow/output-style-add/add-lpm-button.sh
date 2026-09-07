#!/usr/bin/env bash
#
# Add one output style to the LPM footer "style" button.
#
# Silently no-ops (exit 0) when lpm is not installed, jq is missing, the app is not
# reachable, the button group does not exist, or the entry is already there — this is a
# convenience, never a reason to fail creating a style. Goes through `lpm config get`,
# `lpm config validate` and `lpm config apply` with the revision it read; it never edits
# global.yml directly.

set -uo pipefail

usage() {
  cat <<'USAGE'
add-lpm-button.sh <style name> [emoji] [--dry-run]

  --dry-run   print the candidate config to stdout and exit; change nothing

The new entry takes the position of the group's "pick" item, and "pick" and everything
after it shift down by one, so positions stay whole numbers however often you run this.
USAGE
}

NAME=""; EMOJI="🎨"; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)     DRY=1 ;;
    -h|--help)     usage; exit 0 ;;
    *) if [ -z "$NAME" ]; then NAME="$1"; else EMOJI="$1"; fi ;;
  esac
  shift
done
[ -n "$NAME" ] || { usage >&2; exit 2; }
NL=$(printf '\nx'); NL=${NL%x}   # command substitution eats a bare trailing newline
case "$NAME" in *"$NL"*) echo "style name must not contain a newline" >&2; exit 2 ;; esac

command -v lpm >/dev/null 2>&1 || { echo "lpm not installed — no button to update"; exit 0; }
jq --version >/dev/null 2>&1 || { echo "jq unavailable — skipping the lpm button"; exit 0; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

if ! lpm config get --layer global --json > "$TMP/g.json" 2>"$TMP/err"; then
  echo "lpm config unavailable ($(head -1 "$TMP/err")) — skipping the button"; exit 0
fi
REV=$(jq -r '.revision' "$TMP/g.json")
jq -r '.content' "$TMP/g.json" > "$TMP/g.yml"

grep -q '^  output-style:' "$TMP/g.yml" || {
  echo "no 'output-style' action group in the lpm global config — skipping the button"; exit 0; }

# The key is a slug; two names can slug alike, so dedupe on the key, not the label —
# a duplicate YAML key makes lpm reject the whole config.
KEY=$(printf '%s' "$NAME" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-*//; s/-*$//')
# A non-Latin name slugs to nothing; a bare ":" line would be invalid YAML.
[ -n "$KEY" ] || KEY="style-$(printf '%s' "$NAME" | shasum | cut -c1-8)"
grep -q "^      $KEY:\$" "$TMP/g.yml" && { echo "lpm button already lists $NAME"; exit 0; }

POS=$(awk '
  /^  output-style:/ { ing = 1; next }
  ing && /^  [a-zA-Z]/ { ing = 0 }
  ing && /^      [A-Za-z0-9_-]+:/ { key = $1 }
  ing && /^        position:/ && key == "pick:" { print $2; exit }
' "$TMP/g.yml")
[ -n "$POS" ] || { echo "group has no 'pick' entry to anchor against — skipping the button"; exit 0; }

# Single-quoted YAML, apostrophes doubled: a name may hold ':', '#' or an emoji, and an
# unquoted '#' would swallow the rest of the line as a comment.
yq() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/''/g")"; }

cat > "$TMP/entry.yml" <<ENTRY
      $KEY:
        label: $(yq "$EMOJI $NAME")
        cmd: $(yq "/output-style $NAME")
        position: $POS
ENTRY

# Insert at "pick"'s position and push pick and everything after it down by one, so
# positions stay integers no matter how many styles get added.
awk -v ef="$TMP/entry.yml" -v pos="$POS" '
  /^  output-style:/ { ing = 1; print; next }
  ing && /^  [a-zA-Z]/ { ing = 0 }
  ing && /^      pick:/ && !inserted {
    while ((getline line < ef) > 0) print line
    close(ef); inserted = 1
  }
  ing && /^        position:/ && $2 + 0 >= pos + 0 {
    printf "%s%s\n", substr($0, 1, index($0, "position:") + 8), " " ($2 + 1); next
  }
  { print }
' "$TMP/g.yml" > "$TMP/cand.yml"

cmp -s "$TMP/g.yml" "$TMP/cand.yml" && { echo "nothing to insert — skipping the button"; exit 0; }

if [ "$DRY" = 1 ]; then
  echo "--- candidate (not applied) ---"
  sed -n '/^  output-style:/,/^  [a-zA-Z]/p' "$TMP/cand.yml"
  exit 0
fi

if ! VAL=$(lpm config validate "$TMP/cand.yml" 2>&1); then
  echo "lpm button NOT added — candidate config is invalid: $VAL" >&2; exit 1
fi

OUT=$(lpm config apply --layer global --if-revision "$REV" --file "$TMP/cand.yml" --json 2>&1)
if printf '%s' "$OUT" | jq -e '.applied == true' >/dev/null 2>&1; then
  echo "lpm button: added \"$EMOJI $NAME\" at position $POS"
  exit 0
fi
echo "lpm button NOT added — $(printf '%s' "$OUT" | jq -r '.errors // . | tostring' 2>/dev/null || printf '%s' "$OUT")" >&2
exit 1
