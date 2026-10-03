# scan performance

Find code that looks slow. When reading cannot settle a strong suspicion, add a measurement plan and measure after the user approves it. Measuring adds no data; a measurement that needs test data belongs to `/fix performance`.

## Step 1: find the suspects (always)

### Where to look

The folder or area after `/scan performance`, or else the hot paths: the busiest routes (list endpoints, search, chat or feed, anything per request or message), jobs over many rows, the web app's pages, and where `git log --oneline -60 --name-only` shows work now.

In a full scan of a large project, start an `Explore` subagent per area with the list below, and check each of its claims in the code yourself (a "useful" index may be partial, an "unbounded" loop may have a cap).

### What looks slow

- A database call or outgoing request inside a `for`, `map` or `forEach` over rows (N+1).
- A query or list endpoint with no `limit` or paging.
- A `where` or `order by` column with no index in the schema or migrations.
- `await` after `await` on independent calls.
- A whole file, table or response in memory where a stream or page would do.
- Parsing, hashing, images or big sorts on the request path that could go to a job or cache.
- The same request or query repeated with no cache, where the answer rarely changes.
- An outgoing call with no timeout.
- Web app: a heavy library imported whole (an icon set, a date or chart library), chained fetches, large lists with no virtual scrolling.

Say how each suspect grows: "one query per document in the list".

### How strong

- **Likely:** the problem shows on a path that runs often or over many rows.
- **Possible:** whether it hurts depends on data size or frequency the code does not show.

A **hot path** runs on every request or message on a common route, or is a job over a growing table, however often it runs.

### Does anything need measuring?

A suspect goes into the plan only if all three hold:

1. It is `Likely`, or `Possible` on a hot path.
2. Its cost depends on data size, the database's own plan, or timing.
3. The fix is real work (an index and migration, paging on an API callers use, a new job or cache). A small safe fix (`Promise.all`, a `limit`, counting in the query) is fixed first, unmeasured, even if the cost grows with data.

Only the part that needs numbers goes in the plan; the plain part is the direction. No suspect passes: no plan, and step 1 is the whole scan.

### Check the machine for the plan

Only look: is Docker running (`docker info`), is a local database reachable, which command starts the project. Read that script in `package.json`: if it writes tracked files, writes secrets into `.env`, or reaches a shared server, do not use it; measure without starting the project (for example, only the plan with `psql`) and say why.

### The page after step 1

Header: the project, the date, the area, and "Not measured: every finding comes from reading the code."

1. **Summary:** counts of `Likely` and `Possible`, and one to three sentences on the main risk.
2. **A card per suspect**, `Likely` first: a plain title; badges `Likely` (orange) or `Possible` (amber), "not measured", "in the plan" with the item number; path tiles; why it looks slow and how it grows; one sentence of direction, no code.
3. **The measurement plan**, if any. Per item: what to measure ("`GET /v1/knowledge-bases/:id/documents` with 10, 100, 1000 documents"); the tool and command; what it needs (the project running, a local database, test data, keys); what it leaves while running and how that is cleaned up. An item needing test data, or more data than is there, is marked "needs test data: `/fix performance`" and is not run in step 2.

Top pick: a `Likely` suspect on the hottest path that grows fastest with data.

### The ending of step 1

Chat line per suspect: title and strength, then the top pick.

- **With a plan:** "Do you approve the measurement plan? You can strike items by number." Wait for the yes.
- **Without a plan:** "What do we fix first?" The scan ends here.

## Step 2: measure (only after the user approves the plan)

Only approved items. Say in one line what you start.

- **Only on this machine.** Never a production or shared server or production keys. A database that is not local: stop and ask.
- Scripts go in `${TMPDIR:-/tmp}/scan-performance/`, deleted at the end. An ignored folder (`.next/`, `dist/`, a database's data folder) may appear only if the plan named it.
- **No test data.** Too little data to show anything: the item goes to `/fix performance`.
- An item that cannot run: say so and go on.

### Ways to measure

- **A route:** the project's own dev command (or the running app), then `npx -y autocannon -c 10 -d 10 <url>`, or a timed `curl` loop for a slow route. p50 and p95, at several data sizes when it grows with data.
- **A query:** `EXPLAIN ANALYZE` in Postgres for a read query only; plain `EXPLAIN` for one that writes. Time, rows read, index used.
- **A function:** a script in `${TMPDIR:-/tmp}/scan-performance/` that imports it (`npx -y tsx script.ts`) and times it with `performance.now()` at growing sizes; `node --cpu-prof --cpu-prof-dir "${TMPDIR:-/tmp}/scan-performance"` for where time goes.
- **The web app:** page load size, from the build report if the plan named a build.

### The page after step 2

A new page at a new path. Measured cards get their numbers and a badge: `Confirmed` (red), `Not confirmed` (green), or `Could not measure` (slate) with the reason; the rest keep "not measured". The header lists what was started and that it was cleaned up.

### The ending of step 2

Chat line per measured item: title, badge, main number; one line naming the items that need test data. Closing question: "What do we fix first?" Next: `/fix performance`.
