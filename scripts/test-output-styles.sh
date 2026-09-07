#!/usr/bin/env bash
#
# Smoke-test the output-style scripts under bash and zsh, in a sandbox.
#
# Touches nothing real: a fake HOME, a temp settings file (CLAUDE_SETTINGS) and a temp
# destination (--dest). add-lpm-button.sh runs only in --dry-run, which never writes.
#
#   ./scripts/test-output-styles.sh          run everything
#   ./scripts/test-output-styles.sh -v       show each command's output on failure

set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
INSTALL="$ROOT/scripts/install-output-styles.sh"
SET_STYLE="$ROOT/skills/workflow/output-style/set-style.sh"
ADD_BUTTON="$ROOT/skills/workflow/output-style-add/add-lpm-button.sh"
VERBOSE=0; [ "${1:-}" = "-v" ] && VERBOSE=1

SB=$(mktemp -d); trap 'rm -rf "$SB"' EXIT
pass=0; fail=0

ok()   { pass=$((pass + 1)); printf '  ok   %s\n' "$1"; }
bad()  { fail=$((fail + 1)); printf '  FAIL %s\n' "$1"; [ "$VERBOSE" = 1 ] && printf '       %s\n' "$2"; }
check() {  # check <name> <expected substring> <actual output>
  case "$3" in *"$2"*) ok "$1" ;; *) bad "$1" "wanted [$2], got [$3]" ;; esac
}

# A fake ~/.claude with the awkward cases: a plugin style five levels deep, a file with
# no frontmatter, CRLF line endings, a non-Latin name, and a name containing a space.
H="$SB/home"
mkdir -p "$H/.claude/output-styles" "$H/.claude/plugins/cache/mkt/plug/1.0.0/output-styles"
printf -- '---\nname: Pirate\ndescription: talk like a pirate\n---\nbody\n'      > "$H/.claude/output-styles/pirate.md"
printf -- '---\nname: Пират\ndescription: по-пиратски\n---\nbody\n'              > "$H/.claude/output-styles/pirate-ru.md"
printf -- '---\nname: Two Word\ndescription: name with a space\n---\nbody\n'     > "$H/.claude/output-styles/two.md"
printf -- '---\r\nname: CRLF\r\ndescription: windows endings\r\n---\r\nbody\r\n' > "$H/.claude/output-styles/crlf.md"
printf 'no frontmatter here\n'                                                  > "$H/.claude/output-styles/plainfile.md"
printf -- '---\nname: DeepPlugin\ndescription: five levels down\n---\nbody\n'    > "$H/.claude/plugins/cache/mkt/plug/1.0.0/output-styles/deep.md"

for sh in bash zsh; do
  command -v "$sh" >/dev/null 2>&1 || { echo "$sh not installed, skipping"; continue; }
  echo "== $sh =="

  D="$SB/dest-$sh"
  check "installer runs at all"        "installed"   "$($sh "$INSTALL" --dest "$D" 2>&1)"
  check "installer is idempotent"      "already current" "$($sh "$INSTALL" --dest "$D" 2>&1)"
  printf 'different\n' > "$D/eli5.md.tmp" && mv "$D/eli5.md" "$D/eli5.md.bak0" && mv "$D/eli5.md.tmp" "$D/eli5.md"
  check "installer flags a conflict"   "CONFLICT"    "$($sh "$INSTALL" --dest "$D" 2>&1)"
  $sh "$INSTALL" --dry-run --dest "$D" >/dev/null 2>&1
  [ $? -eq 1 ] && ok "dry-run exits 1 on conflict" || bad "dry-run exits 1 on conflict" "exit was 0"

  E="$SB/empty-$sh"; mkdir -p "$E/output-styles" "$E/scripts"; cp "$INSTALL" "$E/scripts/"
  out=$($sh "$E/scripts/install-output-styles.sh" --dest "$SB/dest-empty-$sh" 2>&1)
  check "empty output-styles/ is not an error" "0 installed" "$out"

  L=$(HOME="$H" $sh "$SET_STYLE" --list 2>&1)
  check "plugin style five levels deep"  "DeepPlugin" "$L"
  check "file without frontmatter"       "plainfile"  "$L"
  check "CRLF frontmatter"               "CRLF"       "$L"
  check "non-Latin name"                 "Пират"      "$L"

  S="$SB/settings-$sh.json"; printf '{"model":"opus"}\n' > "$S"
  check "switch by name"        "output style: Pirate" "$(HOME="$H" CLAUDE_SETTINGS="$S" $sh "$SET_STYLE" pirate 2>&1)"
  check "other keys survive"    '"model"'              "$(cat "$S")"
  check "two-word name unquoted" "Two Word"            "$(HOME="$H" CLAUDE_SETTINGS="$S" $sh "$SET_STYLE" Two Word 2>&1)"
  check "Default clears it"     "cleared"              "$(HOME="$H" CLAUDE_SETTINGS="$S" $sh "$SET_STYLE" Default 2>&1)"
  grep -q outputStyle "$S" && bad "Default removes the key" "key still there" || ok "Default removes the key"
  HOME="$H" CLAUDE_SETTINGS="$S" $sh "$SET_STYLE" nonsense >/dev/null 2>&1
  [ $? -eq 2 ] && ok "unknown name exits 2" || bad "unknown name exits 2" "wrong exit code"

  ln -sf "$S" "$SB/link-$sh.json"
  before=$(ls -i "$S" | awk '{print $1}')
  HOME="$H" CLAUDE_SETTINGS="$SB/link-$sh.json" $sh "$SET_STYLE" Pirate >/dev/null 2>&1
  after=$(ls -i "$S" | awk '{print $1}')
  [ -L "$SB/link-$sh.json" ] && [ "$before" = "$after" ] && ok "writing through a symlink keeps it" \
    || bad "writing through a symlink keeps it" "link or inode changed"

  # jq shadowed by a stub that always fails — the python3 path must still work.
  mkdir -p "$SB/nojq"; printf '#!/bin/sh\nexit 127\n' > "$SB/nojq/jq"; chmod +x "$SB/nojq/jq"
  printf '{"model":"opus"}\n' > "$S"
  check "python3 fallback without jq" "output style: Пират" \
    "$(PATH="$SB/nojq:$PATH" HOME="$H" CLAUDE_SETTINGS="$S" $sh "$SET_STYLE" Пират 2>&1)"
  python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$S" 2>/dev/null \
    && ok "fallback writes valid JSON" || bad "fallback writes valid JSON" "$(cat "$S")"
done

echo "== lpm button (dry-run only) =="
if command -v lpm >/dev/null 2>&1 && lpm config get --layer global --json >/dev/null 2>&1; then
  out=$("$ADD_BUTTON" "Пират" 🏴 --dry-run 2>&1)
  check "non-Latin name gets a usable key" "style-" "$out"
  case "$out" in *"
      :"*) bad "no empty YAML key emitted" "bare colon in output" ;; *) ok "no empty YAML key emitted" ;; esac
  check "name with # and : is quoted" "'/output-style Foo: #bar'" "$("$ADD_BUTTON" "Foo: #bar" 🧪 --dry-run 2>&1)"
else
  echo "  skip (lpm not available)"
fi

echo
echo "$pass passed, $fail failed"
[ "$fail" = 0 ]
