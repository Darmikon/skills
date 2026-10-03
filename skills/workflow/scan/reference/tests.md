# scan tests

Find important parts with no tests, tests that check nothing, switched-off tests, and tests that pass or fail by chance. Read first, then run only the doubtful tests.

## 1. Learn how the project tests

Read, do not run yet:

- the runner and its config (`vitest.config.*`, `jest.config.*`, `playwright.config.*`, `pytest.ini`, `pyproject.toml`, …) and the test scripts in `package.json`;
- where tests live and their names (`*.test.ts`, `*.spec.ts`, `tests/`, `__tests__/`); unit, integration or end-to-end;
- what they need (a database, env variables, a server, Docker): the config, setup files, `.env.example`, `.github/workflows/`.

A folder after `/scan tests` limits everything below to it.

In a monorepo the runner config often lives in each package: run a test from the folder of the package that owns it. When tests import a sibling package's build (`dist/`), do not build it: run against the build that is there, and say on the page how old it is next to its sources.

## 2. Read for the four kinds

### No tests

For each main part (routes and handlers, services with business rules, background jobs, data access, helpers many files use), look for a test that imports it or calls its route. Name the important ones with none.

### Tests that check nothing

No `expect`, `assert` or equivalent; only checks that nothing threw or a mock was called, never the result; mocks the very thing it tests; a snapshot of a huge object; a constant checked against itself.

### Switched off

`it.skip`, `describe.skip`, `test.todo`, `xit`, `@pytest.mark.skip`, `it.only` left in (it switches off the rest of the file), and tests commented out; each with its `git blame` age and written reason.

### Pass or fail by chance

Depends on the clock (`Date.now()`, `new Date()` unfixed), an unseeded random, the network, test order (shared state), real `setTimeout` waits, or a port or file two tests share.

Words for the findings file: `kind` is `no tests`, `checks nothing`, `switched off` or `by chance`; `rank` is `High` (money, access rights, data loss), `Medium` (a main feature would stop working) or `Low`, for every kind, by what the test guards; `by chance` adds `group`: `confirmed` when a run failed, `suspected` when all passed. A finding whose test ran gets `runs` ("3 of 5 passed"); the file gets a top-level `coverage` (the total, or null).

## 3. Run the doubtful ones

Never the whole suite by default:

- **Checks nothing:** once; note whether it passes and what it would miss.
- **By chance:** alone five times, then once in its whole file; note how many passed.
- **Switched off:** never switch it on; note what it would test.

One test or file at a time, with the project's runner (`npx vitest run <file> -t "<name>"`, `npx jest <file> -t "<name>"`, `pytest <file>::<name>`):

- Never a flag that writes files: no snapshot update (`-u`, `--update-snapshots`), no `--fix`.
- A test that needs a missing database, server or keys, or would write to a database that is not a throwaway test database: do not run it; say what it needs. Never start a database for it, never point it at a shared or production one.
- A test that leaves a file behind (`git status` before and after) is itself a finding.

## 4. Coverage, when the project can measure it

Only if the provider is already installed (vitest: `@vitest/coverage-v8` or `-istanbul` in `node_modules`; jest: built in; pytest: `pytest-cov`). Run the unit tests that need nothing outside once, with the report in `<tmp>`:

- vitest: `npx vitest run --coverage --coverage.reporter=json-summary --coverage.reportsDirectory=<tmp>/coverage-<timestamp>`
- jest: `npx jest --coverage --coverageReporters=json-summary --coverageDirectory=<tmp>/coverage-<timestamp>`
- pytest: `pytest --cov --cov-report=json:<tmp>/coverage-<timestamp>.json`

No provider: install none; say coverage was not measured. A file at 0 % that matters goes up the "no tests" list.

## 5. The page

Header: the project, the date, the runner and version, what ran (how many tests, which files), what did not and why, the coverage total if measured.

1. **Summary:** counts of parts with no tests, checks nothing, switched off, by chance (confirmed / suspected).
2. **No tests** (`cards`): one card per important part, riskiest first: path tiles, what it does, why a bug there would hurt, its coverage if measured, and what a first test should check (no code).
3. **Checks nothing** (`lines`): the test's path tile and name, what it checks, what it misses.
4. **By chance** (`lines`): the test, the cause (clock, order, network, …), the runs ("3 of 5 passed", or "5 of 5, suspected only").
5. **Switched off** (`lines`): the test, its age, the reason if written.
6. **Coverage**, if measured: a folded `table` of files under 50 %, lowest first.

Top pick: the riskiest part with no tests, or a by-chance failure on a path that matters, whichever would hurt more.

## 6. The ending

Chat lines: the counts by kind, then the top pick. Closing question: "What do we fix first?" Next: `/fix tests`.
