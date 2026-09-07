#!/usr/bin/env bash
#
# Install this repo's output styles into ~/.claude/output-styles.
#
# Claude Code has no install-time hook and `npx skills add` copies only skill
# directories, so styles need this one step. Plugin installs
# (/plugin install skills@darmikon) pick up output-styles/ automatically and do
# not need it.
#
# Idempotent: re-running reports "up to date" and changes nothing.

set -uo pipefail

usage() {
  cat <<'USAGE'
install-output-styles.sh [options]

  (no options)   symlink every style into ~/.claude/output-styles (live edits)
  --copy         copy instead of symlink
  --dry-run      show what would happen, change nothing
  --force        replace a conflicting file (regular files are backed up to .bak;
                 a conflicting symlink is replaced without a backup)
  --dest DIR     install somewhere else
  -h, --help     this text

Environment:
  CLAUDE_OUTPUT_STYLES_DIR   default destination, overridden by --dest

Exit status is 1 when any style could not be installed because of a conflict.
USAGE
}

# "$0", not "${BASH_SOURCE[0]}": zsh has no BASH_SOURCE, and under `set -u` that
# reference aborts the script before it can report anything useful.
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
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
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

[ -d "$SRC" ] || { echo "no output-styles/ directory in $REPO_ROOT" >&2; exit 1; }

installed=0 skipped=0 conflicts=0
[ "$DRY" = 1 ] || mkdir -p "$DEST"

# find, not a glob: under zsh an unmatched *.md aborts the script ("no matches
# found") instead of yielding nothing. -L so a symlinked style counts as a file.
while IFS= read -r f; do
  [ -n "$f" ] || continue   # the here-doc yields one empty line when find matches nothing
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
done <<EOT
$(find -L "$SRC" -maxdepth 1 -type f -name '*.md' 2>/dev/null | sort)
EOT

echo
if [ "$DRY" = 1 ]; then
  echo "$installed would be installed, $skipped already current, $conflicts conflicts  →  $DEST"
else
  echo "$installed installed, $skipped already current, $conflicts conflicts  →  $DEST"
fi
[ "$conflicts" = 0 ] || exit 1
[ "$DRY" = 1 ] || echo "Switch to one with /output-style. A style applies after /clear or in a new session."
