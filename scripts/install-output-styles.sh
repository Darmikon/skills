#!/usr/bin/env bash
#
# Install this repo's output styles into ~/.claude/output-styles.
#
# Claude Code has no install-time hook and `npx skills add` copies only skill
# directories, so styles need this one step. Plugin installs
# (/plugin install skills@darmikon) pick up output-styles/ automatically and do
# not need it.
#
#   ./scripts/install-output-styles.sh              symlink every style (live edits)
#   ./scripts/install-output-styles.sh --copy       copy instead of symlink
#   ./scripts/install-output-styles.sh --dry-run    show what would happen
#   ./scripts/install-output-styles.sh --force      replace conflicting files
#   ./scripts/install-output-styles.sh --dest DIR   install somewhere else
#
# Idempotent: re-running reports "up to date" and changes nothing.

set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SRC="$REPO_ROOT/output-styles"
DEST="${CLAUDE_OUTPUT_STYLES_DIR:-$HOME/.claude/output-styles}"
MODE=link
DRY=0
FORCE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --copy)    MODE=copy ;;
    --dry-run) DRY=1 ;;
    --force)   FORCE=1 ;;
    --dest)    DEST="${2:?--dest needs a directory}"; shift ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

[ -d "$SRC" ] || { echo "no output-styles/ directory in $REPO_ROOT" >&2; exit 1; }

installed=0 skipped=0 conflicts=0
[ "$DRY" = 1 ] || mkdir -p "$DEST"

for f in "$SRC"/*.md; do
  [ -e "$f" ] || continue
  base=$(basename "$f")
  target="$DEST/$base"

  if [ -L "$target" ]; then
    if [ "$(readlink "$target")" = "$f" ]; then
      echo "up to date  $base"; skipped=$((skipped + 1)); continue
    fi
    if [ "$FORCE" != 1 ]; then
      echo "CONFLICT    $base — symlink to $(readlink "$target") (use --force)" >&2
      conflicts=$((conflicts + 1)); continue
    fi
  elif [ -e "$target" ]; then
    if cmp -s "$f" "$target"; then
      echo "up to date  $base"; skipped=$((skipped + 1)); continue
    fi
    if [ "$FORCE" != 1 ]; then
      echo "CONFLICT    $base — a different file already exists (use --force)" >&2
      conflicts=$((conflicts + 1)); continue
    fi
    [ "$DRY" = 1 ] || cp "$target" "$target.bak"
    echo "backed up   $base -> $base.bak"
  fi

  if [ "$DRY" = 1 ]; then
    echo "would $MODE  $base"
  elif [ "$MODE" = copy ]; then
    cp "$f" "$target"; echo "copied      $base"
  else
    ln -sfn "$f" "$target"; echo "linked      $base -> $f"
  fi
  installed=$((installed + 1))
done

echo
if [ "$DRY" = 1 ]; then
  echo "$installed would be installed, $skipped already current, $conflicts conflicts  →  $DEST"
  exit 0
fi
echo "$installed installed, $skipped already current, $conflicts conflicts  →  $DEST"
[ "$conflicts" = 0 ] || exit 1
echo "Switch to one with /output-style. A style applies after /clear or in a new session."
