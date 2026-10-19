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

# node_modules for the fixture and the AI library for the scan ai cases, installed once into a shared cache.
# Only this step runs npm there, one run at a time (a lock), and a package counts as installed only when its
# package.json is there: an interrupted npm install can leave a folder moved aside (.sdk-XXXX) or half there.
has_pkg() { [ -f "$CACHE/node_modules/$1/package.json" ]; }
LOCK="$CACHE/.install-lock"
for _ in $(seq 1 300); do mkdir "$LOCK" 2>/dev/null && break; sleep 1; done
if ! has_pkg typescript || ! has_pkg @types/node; then
  cp "$HERE/fixture/package.json" "$CACHE/" && (cd "$CACHE" && npm install --silent >/dev/null 2>&1)
fi
find "$CACHE/node_modules/@anthropic-ai" -maxdepth 1 -name '.sdk-*' -exec rm -rf {} + 2>/dev/null   # leftovers of a cut install
if ! has_pkg @anthropic-ai/sdk; then
  (cd "$CACHE" && npm install --silent --no-save @anthropic-ai/sdk@0.135.0 >/dev/null 2>&1)
fi
rmdir "$LOCK" 2>/dev/null
has_pkg @anthropic-ai/sdk && has_pkg typescript || echo "warning: the node_modules cache is incomplete; type checks will fail" >&2

g() { git -c user.name="Test User" -c user.email="test@example.com" "$@"; }

# A fresh project with its own git repo and a bare "remote". Sets P and R.
fresh() {
  local name=$1
  P="$WORK/$name/shop"; R="$WORK/$name/remote.git"
  mkdir -p "$WORK/$name"
  cp -R "$HERE/fixture" "$P"
  ln -s "$CACHE/node_modules" "$P/node_modules"
  git init -q --bare -b main "$R"
  (cd "$P" && git init -q -b main && git config user.name "Test User" && git config user.email "test@example.com" \
    && git add -A && g commit -qm "chore: start the shop" && git remote add origin "$R" && git push -q -u origin main)
}

# Runs one prompt in the project; -c continues the last session there. The answer appends to $LOG.
# With $TRANSCRIPT set, the whole session (every tool call and its output) also appends there, as stream-json.
ask() {
  local t0=$SECONDS code
  echo ">>> $*" >> "$LOG"
  if [ -n "${TRANSCRIPT:-}" ]; then
    (cd "$P" && perl -e 'alarm shift; exec @ARGV' 600 claude -p --permission-mode auto --output-format stream-json --verbose "$@") 2>> "$LOG" \
      | tee -a "$TRANSCRIPT" | answer_of >> "$LOG"
    code=${PIPESTATUS[0]}
  else
    (cd "$P" && perl -e 'alarm shift; exec @ARGV' 600 claude -p --permission-mode auto --output-format text "$@") >> "$LOG" 2>&1
    code=$?
  fi
  echo "<<< exit $code in $((SECONDS - t0))s" >> "$LOG"
}
# The final answer of a stream-json session, as --output-format text prints it.
answer_of() {
  node -e '
    let buf = "";
    process.stdin.on("data", (d) => (buf += d)).on("end", () => {
      for (const l of buf.split("\n")) { try { const j = JSON.parse(l); if (j.type === "result") console.log(j.result ?? ""); } catch {} }
    });'
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
  LOG="$OUT/$name.log"; CHECKS="$OUT/$name.checks"; FAILED=0; : > "$LOG"; : > "$CHECKS"; TRANSCRIPT=""
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
  ask "/scan comments src"
  check "finds the port lie (8080 vs 3000)" says "8080"
  check "finds the euros/cents lie" says "(euro|евро)"
  check "finds the commented-out code" says "(oldTotal|18-22|commented|switched off|закоммент|выключен)"
  check "draws a page" says "scan-comments-[0-9-]+\\.html"
  check "changes nothing" clean
}

case_scan_unused() {
  fresh scan_unused
  ask "/scan unused src"
  check "finds the unused file" says "csv-export"
  check "finds the unused function" says "refundOrder"
  check "changes nothing" clean
}

case_fix_comments() {
  fresh fix_comments
  local head; head=$(cd "$P" && git rev-parse HEAD)
  ask "/fix comments src"
  check "shows a plan and waits (nothing changed yet)" clean
  ask -c "да"
  check "fixes the port comment" grep -q "3000 by default" "$P/src/server.ts"
  check "asks about euros instead of changing it" grep -q "in euros" "$P/src/services/orders.ts"
  check "removes the dead code" bash -c "! grep -q oldTotal '$P/src/services/orders.ts'"
  check "does not commit" head_is "$head"
}

case_scan_asks() {
  fresh scan_asks
  ask "/scan comments"
  check "asks before scanning the whole project" says "(весь проект|whole project)"
  check "offers quick" says "(quick|быстр)"
  check "offers deep" says "(deep|полн)"
  check "draws no page before the answer" bash -c "! grep -qE 'scan-comments-[0-9-]+\\.html' '$LOG'"
  check "changes nothing" clean
}

case_scan_branch() {
  fresh scan_branch
  (cd "$P" && git checkout -q -b feat/health && printf '\n// Returns the uptime in minutes.\nexport const uptime = () => process.uptime();\n' >> src/server.ts && g commit -qam "feat: add uptime")
  ask "/scan comments"
  check "reviews the branch" says "(feat/health|ветк|branch)"
  check "finds the new lie (seconds, not minutes)" says "(minute|минут)"
  check "leaves out the untouched file" bash -c "! grep -qiE '(euro|евро)' '$LOG'"
  check "changes nothing" clean
}

# Lines of `git status --porcelain` that are outside the given folders (none = only those changed).
only_in() { (cd "$P" && git status --porcelain --untracked-files=all | awk '{print $2}' | grep -vE "$1" | grep -q .) && return 1 || return 0; }
# The first existing file in the log whose name matches the pattern.
file_from_log() { grep -oE "/[^][() \`<>\"']*$1" "$LOG" | while read -r f; do [ -f "$f" ] && { echo "$f"; break; }; done; }

# Lays tests/fixture-ai over the project and commits it on main.
plant_ai() {
  cp -R "$HERE/fixture-ai/." "$P/"
  (cd "$P" && g add -A && g commit -qm "feat: support answers, review labels and the app's chat" && git push -q origin main)
}

# The 63 checklist ids of scan ai.
AI_IDS=$(for p in A:9 B:11 C:5 D:5 E:8 F:3 G:12 M:10; do for i in $(seq 1 "${p#*:}"); do printf '%s%s ' "${p%:*}" "$i"; done; done)

# Every id is the first cell of a row in the "Every check" table of the findings file.
has_all_ids() {
  node -e '
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const rows = (j.page.sections || []).filter((s) => s.block === "table" && /^every check$/i.test(String(s.title).trim())).flatMap((s) => s.rows || []);
    const seen = new Set(rows.map((r) => String(r[0]).replace(/`/g, "").trim()));
    const missing = process.argv.slice(2).filter((id) => !seen.has(id));
    if (missing.length) { console.error("missing ids: " + missing.join(" ")); process.exit(1); }
  ' "$1" $AI_IDS
}

# A finding in the findings file whose kind is the id or its area letter, with a place on the path,
# and, when a rank is given, that rank. Usage: has_finding <json> <id> <path> [rank]
has_finding() {
  node -e '
    const [file, id, path, rank] = process.argv.slice(1);
    const j = JSON.parse(require("fs").readFileSync(file, "utf8"));
    const hit = (j.findings || []).find((x) =>
      [id, id[0]].includes(String(x.kind).trim()) &&
      (x.places || []).some((p) => String(p.path || "").replace(/^\.\//, "").endsWith(path)) &&
      (!rank || x.rank === rank));
    if (!hit) { console.error("no " + id + (rank ? " " + rank : "") + " finding on " + path); process.exit(1); }
  ' "$@"
}

# Nothing of the fixture's key beyond its first 4 characters (sk-a…) in the log or the given files:
# not its prefix (sk-an…), not its body (FAKEFAKE…).
no_key() { ! grep -qE 'sk-an|FAKEFAKE' "$LOG" "$@"; }
# The same for a whole transcript, which also holds the skills' own text: there the prefix alone may
# appear (the skills name it); the key itself (sk-ant- and a letter or digit) or its body may not.
no_key_read() { ! grep -qE 'sk-ant-[A-Za-z0-9]|FAKEFAKE' "$@"; }
# The plan /fix ai showed (its answer, before the next prompt) has both groups, in English or Russian.
plan_has_groups() {
  awk '/^>>> -c \/fix ai/{f=1; next} /^>>> /{f=0} f' "$LOG" > "$LOG.plan"
  grep -qiE "I fix these|(Я )?(исправлю|исправляю)( сам)?( это| эти)?" "$LOG.plan" && grep -qiE "We discuss these|(Обсуждаем|Обсудим|обсуждаем|обсудим)" "$LOG.plan"
}
# The findings file and its page exist, and they and the log are clean.
no_key_in_page() { test -s "$1" && test -s "${1%.json}.html" && no_key "$1" "${1%.json}.html"; }

# The lead picks of the /scan menu name the pattern: the lines before the full list of commands
# (the first run of 5 or more list items; indented lines inside a run do not break it).
lead_says() {
  node -e '
    const lines = require("fs").readFileSync(process.argv[1], "utf8").split("\n").filter((l) => !/^(>>>|<<<) /.test(l));
    const item = (l) => /^ {0,3}([-*•]|\d+[.)])\s/.test(l), inside = (l) => item(l) || /^ {2,}\S/.test(l);
    let start = -1;
    for (let i = 0; i < lines.length && start < 0; i++) {
      if (!item(lines[i])) continue;
      let j = i, n = 0;
      for (; j < lines.length && inside(lines[j]); j++) if (item(lines[j])) n++;
      if (n >= 5) start = i; else i = j;
    }
    if (start < 0) { console.error("no full list of commands"); process.exit(1); }
    process.exit(new RegExp(process.argv[2], "m").test(lines.slice(0, start).join("\n")) ? 0 : 1);
  ' "$LOG" "$1"
}

case_domain_model() {
  fresh domain_model
  ask "In this shop an order that is paid but not shipped yet is a 'pending order'. Not 'open order', not 'unshipped order'. Let's stick to that word."
  check "writes the word into docs/glossary.md" grep -qi "pending order" "$P/docs/glossary.md"
  check "nothing at the project root" bash -c "! ls '$P' | grep -qi glossary"
  check "changes only docs/glossary.md" only_in "^docs/glossary\\.md$"
  check "says it wrote the glossary" says "(glossary|словар)"
}

case_domain_model_decision() {
  fresh domain_model_decision
  ask "Let's settle it: we keep money in cents everywhere in the code, because the payment provider works in cents and we had rounding bugs with euros before. Euros only on screen. We looked at storing euros and said no."
  check "asks before recording the decision" bash -c "! ls '$P/docs/decisions' 2>/dev/null | grep -q ."
  ask -c "да, запиши это решение. Больше ничего не меняй."
  check "records it in docs/decisions/0001-*.md" bash -c "ls '$P'/docs/decisions/0001-*.md"
  check "changes only docs/" only_in "^docs/"
}

case_grill_me() {
  fresh grill_me
  ask "/grill-me docs/superpowers/specs/2026-10-01-paging-design.md"
  check "numbers its questions" says "(Q1|В1|Вопрос 1)"
  check "gives a recommended answer" says "(recommend|совет|рекоменд)"
  check "writes no file" clean
}

case_grill_with_docs() {
  fresh grill_with_docs
  (cd "$P" && mkdir -p docs && printf '# Shop\n\nA tiny order service.\n\n## Words\n\n**Order total**:\nThe sum of an order in cents.\n_Not_: price, amount\n' > docs/glossary.md && g add -A && g commit -qm "docs: start the glossary")
  ask "/grill-with-docs docs/superpowers/specs/2026-10-01-paging-design.md"
  check "numbers its questions" says "(Q1|В1|Вопрос 1)"
  ask -c "всё как ты советуешь"
  check "changes only the glossary and decisions" only_in "^docs/(glossary|glossary-map)\\.md$|^docs/decisions/"
}

case_to_questionnaire() {
  fresh to_questionnaire
  ask "/to-questionnaire whether the orders list needs paging now. It goes to our product owner, who knows the traffic numbers; I am the developer. I need back: how many orders a user has at most, and whether the list must be sortable."
  ask -c "это всё, пиши анкету"
  local f; f=$(file_from_log "questionnaire-[^][() \`<>\"']*\\.md")
  check "writes the questionnaire to the temp folder" test -n "$f"
  check "has questions with answer lines" bash -c "grep -q '^### ' '$f' && grep -q '^>' '$f'"
  check "changes nothing in the project" clean
}

case_mockup() {
  fresh mockup
  ask "/mockup does this order state model hold up: placed, paid, shipped; cancel is allowed only before shipping; refund only after paying"
  local f; f=$(file_from_log "mockup-[^][() \`<>\"']*\\.html")
  check "writes one HTML file to the temp folder" test -n "$f"
  check "needs nothing from the internet" bash -c "! grep -qiE '<script[^>]+src=|<link[^>]+href=\"http' '$f'"
  check "has buttons" grep -qiE "<button|createElement\(.button" "$f"
  check "changes nothing in the project" clean
}

case_to_plan() {
  fresh to_plan
  rm "$P/docs/superpowers/plans/2026-10-01-paging.md"; (cd "$P" && g commit -qam "chore: drop the paging plan")
  ask "/to-plan"
  check "picks the paging spec" says "paging"
  check "writes a plan" bash -c "ls '$P'/docs/superpowers/plans/*.md"
}

case_to_spec() {
  fresh to_spec
  ask "Let's talk about filtering the orders list by status. The list gets ?status=paid or ?status=shipped. Without the parameter it shows everything, as now. An unknown status gives a 400 with a short message. We said no to filtering on the client, the list will grow."
  ask -c "/to-spec"
  check "writes a spec" bash -c "ls '$P'/docs/superpowers/specs/ | grep -v paging-design | grep -q ."
  check "the spec covers the status filter" bash -c "grep -qi status '$P'/docs/superpowers/specs/*.md"
  check "has open questions" bash -c "grep -qiE '^## (Open questions|Открытые вопросы)' \$(ls '$P'/docs/superpowers/specs/*.md | grep -v paging-design)"
  check "changes only the specs folder" only_in "^docs/superpowers/specs/"
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
  ask -c "да"
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

case_feature() {
  fresh feature
  ask "/ask feature list the orders"
  check "follows the route into the service" says "(orderTotal|services/orders)"
  check "starts at the server" says "server\\.ts"
  check "draws a page" says "ask-feature-[0-9-]+\\.html"
  check "changes nothing" clean
}

case_compare() {
  fresh compare
  local other="$WORK/compare/shop-paged"
  cp -R "$HERE/fixture" "$other"
  cat > "$other/src/services/orders.ts" <<'TS'
export interface IOrder { id: string; items: { priceCents: number; qty: number }[] }
const ORDERS: IOrder[] = [{ id: "a1", items: [{ priceCents: 1200, qty: 2 }] }];
export const PAGE_SIZE = 20;
export function listOrders(page = 1): IOrder[] {
  return ORDERS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}
export function orderTotal(items: IOrder["items"]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}
TS
  ask "/ask compare listing orders in this project and $other"
  check "notices the paging difference" says "(paging|page|PAGE_SIZE|страниц)"
  check "draws a page" says "ask-compare-[0-9-]+\\.html"
  check "changes nothing" clean
}

case_history() {
  fresh history
  (cd "$P" && sed -i '' 's/Returns the total in euros./Returns the total in cents./' src/services/orders.ts && g commit -qam "fix: say totals are in cents" \
    && printf '\nexport const CURRENCY = "EUR";\n' >> src/services/orders.ts && g commit -qam "feat: name the currency")
  ask "/ask history orderTotal"
  check "tells the chapters" says "(cents|currency|CURRENCY)"
  check "draws a page" says "ask-history-[0-9-]+\\.html"
  check "changes nothing" clean
}

case_error() {
  fresh error
  (cd "$P" && printf '\nexport function refundOrThrow(id: string) {\n  if (!refundOrder(id)) throw new Error(`order ${id} not found`);\n}\n' >> src/services/orders.ts && g commit -qam "feat: refund or throw")
  ask "/ask error Error: order b7 not found"
  check "finds where it is thrown" says "refundOrThrow"
  check "changes nothing" clean
}

case_who() {
  fresh who
  (cd "$P" && echo "// tweak" >> src/routes/orders.ts && git -c user.name="Ann Example" -c user.email="ann@example.com" commit -qam "fix: tweak the route")
  ask "/ask who src/routes"
  check "names both people" bash -c "grep -q 'Ann Example' '$LOG' && grep -q 'Test User' '$LOG'"
  check "changes nothing" clean
}

case_scan_ai() {
  check "the key mask passes its own tests" node --test "$HERE/../skills/workflow/scan/scripts/mask-keys.test.mjs"
  fresh scan_ai; plant_ai
  TRANSCRIPT="$OUT/scan_ai.jsonl"
  ask "/scan ai deep"
  local f; f=$(file_from_log "scan-ai-[0-9-]+\\.json")
  check "writes the findings file" test -n "$f"
  check "the table has all 63 ids" has_all_ids "$f"
  check "finds the catch-all retry (A3 on support.ts)" has_finding "$f" A3 src/llm/support.ts
  check "finds the empty tool result (A7 on tools.ts)" has_finding "$f" A7 src/llm/tools.ts
  check "finds the Promise.all fan-out (A8 on batch.ts)" has_finding "$f" A8 src/llm/batch.ts
  check "finds the key in the app" says "mobile/src/api/claude\\.ts"
  check "the app's key is a Critical G1" has_finding "$f" G1 mobile/src/api/claude.ts Critical
  check "never shows the key beyond its first characters (log, findings file, page)" no_key_in_page "$f"
  check "never reads the key either (whole transcript)" no_key_read "$TRANSCRIPT"
  check "draws a page" says "scan-ai-[0-9-]+\\.html"
  check "changes nothing" clean
}

case_scan_ai_none() {
  fresh scan_ai_none
  ask "/scan llm deep"
  check "says there are no AI calls" says "\\bno\\b.{0,30}\\b(calls?|usage)\\b.{0,30}\\b(AI|LLM|models?)\\b|\\bno\\b.{0,30}\\b(AI|LLM|model)\\b.{0,20}\\b(calls?|usage|found)\\b|\\b(AI|LLM) calls?\\b.{0,30}\\b(none|not found)\\b|(вызов|обращени|использован)[а-я]*.{0,60}(ИИ|LLM|модел).{0,60}(^|[^[:alpha:]])(нет|не найден)|(^|[^[:alpha:]])(нет|не найден[а-я]*)([^[:alpha:]]|$).{0,40}(вызов|обращени)[а-я]*.{0,40}(ИИ|LLM|модел)"
  check "draws no page" bash -c "! grep -qE 'scan-(ai|llm)-[0-9-]+\\.html' '$LOG'"
  check "changes nothing" clean
}

case_fix_ai() {
  fresh fix_ai; plant_ai
  check "type-checks before the fix (the environment works)" bash -c "cd '$P' && npx tsc --noEmit"
  local head; head=$(cd "$P" && git rev-parse HEAD)
  local mods; mods=$(ls -a "$CACHE/node_modules" | shasum)               # the shared node_modules (P links to it)
  local start="$WORK/fix_ai/start"; touch "$start"
  TRANSCRIPT="$OUT/fix_ai.jsonl"
  ask "/scan ai deep"
  ask -c "/fix ai deep"
  check "shows a plan and waits (nothing changed yet)" clean
  check "the plan has both groups (I fix these, we discuss these)" plan_has_groups
  ask -c "да, первую группу делай. Из второй обсуждаем первую находку."
  check "model ids in one place" bash -c "[ \$(grep -rl 'claude-sonnet-5-5' '$P/src' | wc -l) -le 1 ]"
  check "tool errors go back as is_error" grep -q "is_error" "$P/src/llm/tools.ts"
  check "still type-checks" bash -c "cd '$P' && npx tsc --noEmit"
  local handed; handed=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'fix-ai-*.json' -newer "$start" 2>/dev/null)
  check "hands the big ones to brainstorming (names it, writes the hand-over file)" bash -c "[ -n '$handed' ] && grep -qi brainstorming '$LOG'"
  check "leaves the discuss items alone (the sleep(0) retry, the app's key)" bash -c "grep -q 'sleep(0)' '$P/src/llm/support.ts' && grep -q 'EXPO_PUBLIC_ANTHROPIC_KEY' '$P/mobile/src/api/claude.ts'"
  check "installs nothing" bash -c "cd '$P' && git diff --quiet -- package.json mobile/package.json && ! git status --porcelain --untracked-files=all | grep -qE '(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)\$' && [ \"\$(ls -a '$CACHE/node_modules' | shasum)\" = '$mods' ]"
  check "does not commit" head_is "$head"
  # shellcheck disable=SC2086
  check "never shows the key (log, hand-over file)" no_key $handed
  check "never reads the key (whole transcript)" no_key_read "$TRANSCRIPT"
}

case_scan_menu_ai() {
  fresh scan_menu_ai; plant_ai
  ask "/scan"
  check "suggests scan ai in its lead picks" lead_says "/scan ai([^a-z]|$)"
  check "changes nothing" clean
}

CASES="scan_comments scan_unused scan_asks scan_branch fix_comments ask_what_is_it how why zoom_out pin commit push_after_rebase push_teammate merge rebase cleanup show_my_branches explore verify update_plans handoff feature compare history error who domain_model domain_model_decision grill_me grill_with_docs to_questionnaire mockup to_plan to_spec scan_ai scan_ai_none fix_ai scan_menu_ai"
for c in $CASES; do run_case "$c"; done

echo
cat "$REPORT"
echo
echo "logs: $OUT"
rm -rf "$WORK"
