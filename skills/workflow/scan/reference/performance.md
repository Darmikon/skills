# scan performance

Find the places in the code that look slow, and show them with a first summary. Only when a suspicion is strong enough that reading cannot settle it, add a plan of measurements, and measure after the user approves the plan.

This file adds the performance part to the rules in [../SKILL.md](../SKILL.md). Step 1 only reads. Step 2 observes, after the user's yes: it times and reads query plans, but adds no data and changes nothing. A measurement that needs test data belongs to `/fix performance`.

## Step 1: find the suspects (always)

### Where to look

- With a folder or area after `/scan performance`, look there.
- Otherwise start from the hot paths: the routes and handlers that run most (list endpoints, search, the chat or feed, anything called per request or per message), the background jobs that go over many rows, and the pages of the web app. `git log --oneline -60 --name-only` shows where work goes on now.

In a full scan of a large project, start an `Explore` subagent per area with the list below. Check each claim a subagent makes against the code yourself before it goes on the page (an index it calls useful may be partial, a loop it calls unbounded may have a cap).

### What looks slow

- **Queries in a loop:** a database call or an outgoing request inside a `for`, `map` or `forEach` over rows (N+1).
- **No limit:** a query or a list endpoint that returns all rows, with no `limit` or paging.
- **No index:** a filter or sort on a column that the schema or migrations give no index. Compare the query's `where` and `order by` with the indexes.
- **Waiting in turn:** `await` after `await` on calls that do not depend on each other, where they could run together.
- **Everything in memory:** a whole file, table or response read into memory where a stream or a page would do.
- **Heavy work on the request path:** parsing, hashing, image work or a big sort done while the caller waits, where it could move to a job or a cache.
- **The same call again:** the same outgoing request or query repeated per request with no cache, where the answer rarely changes.
- **No timeout:** an outgoing call that can hang and hold the request.
- **The web app:** a heavy library imported whole on a page (a full icon set, a date or chart library), data fetched in a chain of requests, lists with no virtual scrolling at large sizes.

Keep only what you saw in the code. For each suspect, say how it grows: "one query per document in the list", "reads the whole table".

### How strong each suspect is

- **Likely:** the code shows the problem on a path that runs often or over many rows. Example: a query per item in a list endpoint.
- **Possible:** the pattern is there, but whether it hurts depends on things the code does not show: the data size, how often it runs.

A **hot path** is code that runs on every user request or message on a common route, or a job that goes over a table that keeps growing (every row of users, documents, events), however often it runs.

### Does anything need measuring?

A suspect goes into the measurement plan only if all three are true:

1. It is `Likely`, or `Possible` on a hot path.
2. Reading cannot settle it: its cost depends on data size, on the database's own plan, or on timing.
3. The fix is real work (a new index and a migration, paging added to an API that callers use, a new job or cache). When the fix is small and safe (move calls into `Promise.all`, add a `limit`, count in the query instead of fetching rows), fix first and skip the measuring, even if the cost grows with data.

When one suspect has a plain part and a part that needs numbers, give the plain part as its direction and put only the other part in the plan.

If no suspect passes, there is no plan: step 1 is the whole scan.

### Check the machine for the plan

When there is a plan, look (only look) at what it would need, so that "What it needs" is a fact, not a guess: is Docker running (`docker info`), is there a local database and can it be reached, which command starts the project. Read that command's script in `package.json` before you put it in the plan: if it writes files that git tracks, writes secrets into `.env`, or reaches a shared server, do not use it; measure without starting the project (for example, only the database's plan with `psql`), and say why.

### The page after step 1

Header: the project, the date, the area, and "Not measured: every finding comes from reading the code."

Body:

1. **Summary:** one row of counts (`Likely`, `Possible`), then one to three sentences on the main risk.
2. **One card per suspect**, `Likely` first. Each card:
   - **Title:** what is slow, in plain words: "One query per document when listing a knowledge base".
   - **Badges:** `Likely` (orange) or `Possible` (amber), "not measured", and "in the plan" when the plan has an item for it (with the item's number).
   - **Where:** the path tiles with lines.
   - **Why it looks slow:** one sentence, with how it grows.
   - **Direction:** one sentence on the fix. No code.
3. **The measurement plan**, only when some suspect passed. One numbered item per suspect in the plan:
   - **What to measure:** "the time of `GET /v1/knowledge-bases/:id/documents` with 10, 100, 1000 documents", "the database's plan for the query at `documents.repo.ts` L40".
   - **How:** the tool and the command (see "Ways to measure").
   - **What it needs:** the project running locally, a local database, test data, keys.
   - **What it leaves on the machine while it runs:** processes started and temp files, and how each is cleaned up.
   - **Can it run without a change?** A measurement that needs test data in the database, or more data than is there, is marked "needs test data: `/fix performance`" and is not part of this scan's step 2.

Top pick: the suspect to look at first: a `Likely` one on the hottest path, and among those the one that grows fastest with data.

### The ending of step 1

Chat line per suspect: its title and strength. Then the top pick.

- **With a plan:** "Do you approve the measurement plan? You can strike items by number." Wait. Do nothing more before the yes.
- **Without a plan:** "What do we fix first?" The scan ends here.

## Step 2: measure (only after the user approves the plan)

Measure only the items the user approved. Before the first command, say in one line what you start.

### Rules for measuring

- **Only on this machine.** Never against a production or shared server, never with production keys. If the plan needs a database that is not local, stop and ask.
- **No change to the project's files.** Measuring scripts go in `${TMPDIR:-/tmp}/scan-performance/`, not in the project. A folder that git ignores (build output such as `.next/` or `dist/`, a local database's data folder) may appear only if the plan named it.
- **No test data.** Measure on the data that is already in the local database. If there is too little to show anything, say so: that item goes to `/fix performance`.
- **Clean up:** stop every process you started, delete the temp folder. Check that `git status` in the project is the same as before step 2.
- If a measurement cannot run (the project does not start, no database), say so for that item and go on with the others.

### Ways to measure

- **A route:** start the project with its own dev command (or use it if already running), then `npx -y autocannon -c 10 -d 10 <url>`, or a timed `curl` loop for a slow route. Note p50 and p95, at more than one data size when the suspect grows with data.
- **A query:** the database's own plan on the local database: `EXPLAIN ANALYZE` in Postgres for a read query only; for a query that writes, plain `EXPLAIN` (it does not run the query). Note the time, the rows read, and whether an index is used.
- **A function:** a temp script in `${TMPDIR:-/tmp}/scan-performance/` that imports it (`npx -y tsx script.ts`) and times it with `performance.now()` at growing sizes. For where the time goes: `node --cpu-prof --cpu-prof-dir "${TMPDIR:-/tmp}/scan-performance"`.
- **The web app:** the size of what a page loads, from the project's own build report if the plan named a build.

### The page after step 2

Write the page again, at a new path. Each measured card gets its numbers (p50/p95, the time, the rows read, the sizes tried) and one badge: `Confirmed` (red), `Not confirmed` (green), or `Could not measure` (slate) with the reason. Cards that were not in the plan keep "not measured". The header lists what was started and that it was cleaned up.

### The ending of step 2

Chat line per measured item: its title, its badge and its main number, and one line naming the items that need test data. Closing question: "What do we fix first?" The next skill is `fix`: `/fix performance`.
