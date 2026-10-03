#!/usr/bin/env bash
# Runs the skills in this repo as real claude sessions against a throwaway copy of tests/fixture,
# and checks what they did. Usage: bash tests/run.sh [filter]   (filter matches case names)
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
FILTER=${1:-}
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$HERE/results/$STAMP"
CACHE="$HERE/.cache"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/skill-tests-XXXX")
mkdir -p "$OUT" "$CACHE"

# node_modules for the fixture, installed once
if [ ! -d "$CACHE/node_modules" ]; then
  cp "$HERE/fixture/package.json" "$CACHE/" && (cd "$CACHE" && npm install --silent >/dev/null 2>&1)
fi

g() { git -c user.name="Test User" -c user.email="test@example.com" "$@"; }

# A fresh project with its own git repo and a bare "remote". Sets P and R.
fresh() {
  local name=$1
  P="$WORK/$name/shop"; R="$WORK/$name/remote.git"
  mkdir -p "$WORK/$name"
  cp -R "$HERE/fixture" "$P"
  ln -s "$CACHE/node_modules" "$P/node_modules"
  git init -q --bare "$R"
  (cd "$P" && git init -q -b main && git config user.name "Test User" && git config user.email "test@example.com" \
    && git add -A && g commit -qm "chore: start the shop" && git remote add origin "$R" && git push -q -u origin main)
}

# Runs one prompt in the project; -c continues the last session there. Output appends to $LOG.
ask() {
  local t0=$SECONDS
  echo ">>> $*" >> "$LOG"
  (cd "$P" && perl -e 'alarm shift; exec @ARGV' 600 claude -p --permission-mode auto --output-format text "$@") >> "$LOG" 2>&1
  echo "<<< exit $? in $((SECONDS - t0))s" >> "$LOG"
}

# Checks. Each adds a line to $CHECKS; a case passes when none failed.
ok()   { echo "  ok   $1" >> "$CHECKS"; }
bad()  { echo "  FAIL $1" >> "$CHECKS"; FAILED=1; }
check() { local what=$1; shift; if "$@" >/dev/null 2>&1; then ok "$what"; else bad "$what"; fi; }
says()  { grep -qiE "$1" "$LOG"; }
clean() { [ -z "$(cd "$P" && git status --porcelain)" ]; }
head_is() { [ "$(cd "$P" && git rev-parse HEAD)" = "$1" ]; }

REPORT="$OUT/report.md"
printf '| case | result | seconds |\n|---|---|---|\n' > "$REPORT"

run_case() {
  local name=$1
  [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]] && return
  LOG="$OUT/$name.log"; CHECKS="$OUT/$name.checks"; FAILED=0; : > "$LOG"; : > "$CHECKS"
  local t0=$SECONDS
  echo "=== $name"
  "case_$name"
  local result=pass; [ $FAILED = 1 ] && result=FAIL
  cat "$CHECKS"
  printf '| %s | %s | %s |\n' "$name" "$result" "$((SECONDS - t0))" >> "$REPORT"
}

# ---------- cases ----------

case_scan_comments() {
  fresh scan_comments
  ask "/scan comments"
  check "finds the port lie (8080 vs 3000)" says "8080"
  check "finds the euros/cents lie" says "(euro|евро)"
  check "finds the commented-out code" says "oldTotal"
  check "draws a page" says "scan-comments-[0-9-]+\\.html"
  check "changes nothing" clean
}

case_scan_unused() {
  fresh scan_unused
  ask "/scan unused"
  check "finds the unused file" says "csv-export"
  check "finds the unused function" says "refundOrder"
  check "changes nothing" clean
}

case_fix_comments() {
  fresh fix_comments
  local head; head=$(cd "$P" && git rev-parse HEAD)
  ask "/fix comments"
  check "shows a plan and waits (nothing changed yet)" clean
  ask -c "да"
  check "fixes the port comment" grep -q "3000 by default" "$P/src/server.ts"
  check "asks about euros instead of changing it" grep -q "in euros" "$P/src/services/orders.ts"
  check "removes the dead code" bash -c "! grep -q oldTotal '$P/src/services/orders.ts'"
  check "does not commit" head_is "$head"
}

case_ask_what_is_it() {
  fresh ask_what_is_it
  ask "/ask what-is-it"
  check "names the server file" says "server\\.ts"
  check "notices the README is wrong" says "(npm run dev|8080)"
  check "changes nothing" clean
}

case_how() {
  fresh how
  ask "/how orders"
  check "explains orderTotal" says "orderTotal"
  check "changes nothing" clean
}

case_why() {
  fresh why
  ask "/why why does orderTotal return cents and not euros"
  check "talks about orderTotal" says "orderTotal"
  check "changes nothing" clean
}

case_zoom_out() {
  fresh zoom_out
  ask "/zoom-out src/routes/orders.ts"
  check "shows who calls it (server.ts)" says "server\\.ts"
  check "changes nothing" clean
}

case_pin() {
  fresh pin
  rm -rf ~/.claude/skills/scan-unused
  ask "/scan pin unused"
  check "makes the shortcut" test -f ~/.claude/skills/scan-unused/SKILL.md
  ask "/scan unpin unused"
  check "removes the shortcut" bash -c "! test -e ~/.claude/skills/scan-unused"
}

case_commit() {
  fresh commit
  local head; head=$(cd "$P" && git rev-parse HEAD)
  sed -i '' 's/8080/3000/' "$P/README.md"
  ask "/commit"
  check "asks before committing" head_is "$head"
  ask -c "да"
  check "commits" bash -c "[ \"\$(cd '$P' && git rev-parse HEAD)\" != '$head' ]"
  check "conventional subject" bash -c "cd '$P' && git log -1 --format=%s | grep -qE '^[a-z]+(\\(.+\\))?!?: '"
  check "no AI attribution" bash -c "cd '$P' && ! git log -1 --format=%B | grep -qiE 'co-authored|claude|generated with'"
}

case_push_after_rebase() {
  fresh push_after_rebase
  (cd "$P" && git checkout -qb feat && echo x > x.txt && git add x.txt && g commit -qm "feat: x" && git push -q -u origin feat \
    && git checkout -q main && echo "// main moves" >> src/server.ts && g commit -qam "chore: main moves" && git push -q origin main \
    && git checkout -q feat && g rebase -q main)
  local remote_before; remote_before=$(git --git-dir="$R" rev-parse feat)
  local local_before; local_before=$(cd "$P" && git rev-parse HEAD)
  ask "/push"
  check "does not rebase onto the old copy" head_is "$local_before"
  check "does not force-push itself" bash -c "[ \"\$(git --git-dir='$R' rev-parse feat)\" = '$remote_before' ]"
  check "offers force-with-lease" says "force-with-lease"
}

case_push_teammate() {
  fresh push_teammate
  (cd "$WORK/push_teammate" && git clone -q remote.git mate && cd mate && echo "teammate" > mate.txt && git add mate.txt \
    && g commit -qm "docs: teammate note" && git push -q origin main)
  (cd "$P" && echo "// mine" >> src/server.ts && g commit -qam "chore: my change")
  ask "/push"
  check "brings in the teammate's commit" bash -c "cd '$P' && git log --format=%s | grep -q 'teammate note'"
  check "pushes my commit" bash -c "git --git-dir='$R' log main --format=%s | grep -q 'my change'"
}

case_merge() {
  fresh merge
  (cd "$P" && git checkout -qb feat && echo y > y.txt && git add y.txt && g commit -qm "feat: y" \
    && git checkout -q main && echo "// main moves" >> src/server.ts && g commit -qam "chore: main moves" && git push -q origin main \
    && git checkout -q feat)
  ask "/merge"
  ask -c "да"
  check "main is now in the branch" bash -c "cd '$P' && git merge-base --is-ancestor origin/main HEAD"
  check "still on feat" bash -c "[ \"\$(cd '$P' && git branch --show-current)\" = feat ]"
}

case_rebase() {
  fresh rebase
  (cd "$P" && git checkout -qb feat && echo y > y.txt && git add y.txt && g commit -qm "feat: y" && git push -q -u origin feat \
    && git checkout -q main && echo "// main moves" >> src/server.ts && g commit -qam "chore: main moves" && git push -q origin main \
    && git checkout -q feat)
  local remote_before; remote_before=$(git --git-dir="$R" rev-parse feat)
  ask "/rebase"
  ask -c "да"
  check "rebased onto main" bash -c "cd '$P' && git merge-base --is-ancestor origin/main HEAD"
  check "did not push" bash -c "[ \"\$(git --git-dir='$R' rev-parse feat)\" = '$remote_before' ]"
  check "prints a safe force-push" says "force-if-includes"
}

case_cleanup() {
  fresh cleanup
  (cd "$P" && git checkout -qb old-done && echo z > z.txt && git add z.txt && g commit -qm "feat: z" \
    && git checkout -q main && g merge -q --no-edit old-done && git push -q origin main)
  ask "/cleanup"
  ask -c "да"
  check "deletes the merged branch" bash -c "! (cd '$P' && git rev-parse --verify --quiet old-done)"
  check "keeps main" bash -c "cd '$P' && git rev-parse --verify --quiet main"
}

case_show_my_branches() {
  fresh show_my_branches
  (cd "$P" && git checkout -qb feature/paging && echo p > p.txt && git add p.txt && g commit -qm "feat: paging" && git checkout -q main)
  ask "/show-my-branches"
  check "lists my branch" says "feature/paging"
}

case_explore() {
  fresh explore
  ask "/explore should the orders list get paging now or later?"
  check "answers" bash -c "[ \$(wc -c < '$LOG') -gt 300 ]"
  check "writes no file" clean
}

case_verify() {
  fresh verify
  ask "/verify docs/superpowers/plans/2026-10-01-paging.md"
  check "reports the paging as not done" says "(not|не) (done|сделан|выполнен|proven|доказан)|broken|сломан|не реализован|not implemented"
  check "leaves the project as it was" clean
}

case_update_plans() {
  fresh update_plans
  ask "/update-plans the page size changes from 20 to 50"
  check "shows the edits and waits (nothing written yet)" clean
  check "mentions both documents" says "paging-design|spec"
}

case_handoff() {
  fresh handoff
  ask "/handoff continue the paging work"
  check "writes the document outside the project" bash -c "grep -oE '/[^ \`]*handoff[^ \`]*\\.md' '$LOG' | head -1 | xargs test -f"
  check "changes nothing in the project" clean
}

CASES="scan_comments scan_unused fix_comments ask_what_is_it how why zoom_out pin commit push_after_rebase push_teammate merge rebase cleanup show_my_branches explore verify update_plans handoff"
for c in $CASES; do run_case "$c"; done

echo
cat "$REPORT"
echo
echo "logs: $OUT"
rm -rf "$WORK"
