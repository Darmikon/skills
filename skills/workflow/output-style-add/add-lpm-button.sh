#!/usr/bin/env bash
#
# Add one output style to the LPM footer "style" button.
#
#   add-lpm-button.sh "Diagrams first" [emoji]
#
# Silently no-ops (exit 0) when lpm is not installed, the app is not reachable, the
# button group is missing, or the entry already exists — this is a convenience, never
# a reason to fail creating a style. Goes through `lpm config get` / `lpm config apply`
# with the revision it read; it never edits global.yml directly.

set -uo pipefail

NAME="${1:-}"; EMOJI="${2:-🎨}"
[ -n "$NAME" ] || { echo "usage: add-lpm-button.sh <style name> [emoji]" >&2; exit 2; }

command -v lpm >/dev/null 2>&1 || { echo "lpm not installed — no button to update"; exit 0; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

if ! lpm config get --layer global --json > "$TMP/g.json" 2>"$TMP/err"; then
  echo "lpm config unavailable ($(head -1 "$TMP/err")) — skipping the button"; exit 0
fi
REV=$(jq -r '.revision' "$TMP/g.json")
jq -r '.content' "$TMP/g.json" > "$TMP/g.yml"

grep -q '^  output-style:' "$TMP/g.yml" || {
  echo "no 'output-style' action group in the lpm global config — skipping the button"; exit 0; }
grep -qF "cmd: /output-style $NAME" "$TMP/g.yml" && {
  echo "lpm button already lists $NAME"; exit 0; }

# Positions inside the group: the last style entry before "pick", and "pick" itself.
POS=$(awk '
  /^  output-style:/ { ing = 1; next }
  ing && /^  [a-zA-Z]/ { ing = 0 }
  ing && /^      [A-Za-z0-9_-]+:/ { key = $1 }
  ing && /^        position:/ {
    if (key == "pick:") { pick = $2 } else if (pick == "") { last = $2 }
  }
  END { if (pick == "") print ""; else printf "%.4g\n", (last + pick) / 2 }
' "$TMP/g.yml")
[ -n "$POS" ] || { echo "group has no 'pick' entry to anchor against — skipping the button"; exit 0; }

KEY=$(printf '%s' "$NAME" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//')
# Via a file, not awk -v: BSD awk rejects a literal newline in a -v value.
cat > "$TMP/entry.yml" <<ENTRY
      $KEY:
        label: $EMOJI $NAME
        cmd: /output-style $NAME
        position: $POS
ENTRY

awk -v ef="$TMP/entry.yml" '
  /^  output-style:/ { ing = 1; print; next }
  ing && /^  [a-zA-Z]/ { ing = 0 }
  ing && /^      pick:/ && !done {
    while ((getline line < ef) > 0) print line
    close(ef); done = 1
  }
  { print }
' "$TMP/g.yml" > "$TMP/cand.yml"

cmp -s "$TMP/g.yml" "$TMP/cand.yml" && { echo "nothing to insert — skipping the button"; exit 0; }

OUT=$(lpm config apply --layer global --if-revision "$REV" --file "$TMP/cand.yml" --json 2>&1)
if printf '%s' "$OUT" | jq -e '.applied == true' >/dev/null 2>&1; then
  echo "lpm button: added \"$EMOJI $NAME\" at position $POS"
  exit 0
fi
echo "lpm button NOT added — $(printf '%s' "$OUT" | jq -r '.errors // . | tostring' 2>/dev/null || printf '%s' "$OUT")" >&2
exit 1
