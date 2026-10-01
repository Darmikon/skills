# scan tests

Show how well the tests protect the code: important parts with no tests, tests that check nothing, tests that are switched off, and tests that pass or fail by chance. It reads first, then runs only the tests it has doubts about, to see what they really do. It writes no test: that is `/fix tests`.

This file adds the tests part to the rules in [../SKILL.md](../SKILL.md).

## 1. Learn how the project tests

Read, do not run yet:

- the test runner and its config (`vitest.config.*`, `jest.config.*`, `playwright.config.*`, `pytest.ini`, `pyproject.toml`, …) and the test scripts in `package.json`;
- where the tests live and how they are named (`*.test.ts`, `*.spec.ts`, `tests/`, `__tests__/`);
- what kinds there are: unit, integration (a database, a server), end-to-end (a browser);
- what the tests need to run: a database, env variables, a running server, Docker. Look at the config, the setup files, `.env.example`, the CI workflow under `.github/workflows/`.

With a folder after `/scan tests`, everything below is limited to that folder.

## 2. Read for the four kinds

### No tests

List the main parts of the code: routes and handlers, services with business rules, background jobs, data access, shared helpers that many files use. For each, look for a test that imports it or calls its route. Name the important ones with none. Rank by what breaks if they break: money, access rights, data loss first.

### Tests that check nothing

- a test with no `expect`, `assert` or equivalent;
- a test whose only check is that nothing threw, or that a mock was called, while the result is never looked at;
- a test that mocks the very thing it claims to test;
- a snapshot of a huge object, where any change is accepted by updating the snapshot;
- a test that checks a constant against itself.

### Switched off

`it.skip`, `describe.skip`, `test.todo`, `xit`, `@pytest.mark.skip`, `it.only` left in (it silently switches off the rest of the file), and tests commented out. For each: its age from `git blame` and the reason if one is written.

### Pass or fail by chance

A test that depends on: the clock (`Date.now()`, `new Date()` without a fixed time), randomness without a seed, the network or an outside service, the order tests run in (shared state, a variable set in one test and read in another), timers and `setTimeout` with real waits, a port or a file that two tests share.

## 3. Run the doubtful ones

Run only the tests you have a doubt about from step 2, never the whole suite by default:

- **A test that checks nothing:** run it once. It passing proves nothing; note whether it passes, and say what it would miss.
- **A test that may pass or fail by chance:** run it alone five times, then once in its whole file. Note how many runs passed.
- **A switched-off test:** do not switch it on (that is a change). Note what it would test.

Run with the project's own runner, one test or one file at a time (`npx vitest run <file> -t "<name>"`, `npx jest <file> -t "<name>"`, `pytest <file>::<name>`). Rules:

- Never a flag that writes files: no snapshot update (`-u`, `--update-snapshots`), no `--fix`.
- A test that needs a database, a server or keys that are not there: do not run it, and say what it needs. Do not start a database for it, and never point it at a shared or production one.
- A test whose run would write to a database that is not a throwaway test database: do not run it.
- Check `git status` before and after: a test that leaves a file behind is itself a finding.

## 4. Coverage, when the project can measure it

If the runner has coverage built in and its provider is already installed (for vitest, `@vitest/coverage-v8` or `-istanbul` in `node_modules`; for jest, built in; for pytest, `pytest-cov`), run the unit tests once with coverage, and send the report to `<tmp>`, not into the project:

- vitest: `npx vitest run --coverage --coverage.reporter=json-summary --coverage.reportsDirectory=<tmp>/coverage-<timestamp>`
- jest: `npx jest --coverage --coverageReporters=json-summary --coverageDirectory=<tmp>/coverage-<timestamp>`
- pytest: `pytest --cov --cov-report=json:<tmp>/coverage-<timestamp>.json`

Only the tests that need nothing outside (no database, no server). If the provider is not installed, do not install it: say that coverage is not measured and why. Use the numbers to back the "no tests" list: a file at 0 % that matters goes up the list.

## 5. The page

Header: the project, the date, the runner and its version, what was run (how many tests, which files), what was not run and why, and the coverage total when measured.

The body:

1. **Summary:** one row of counts: parts with no tests, tests that check nothing, switched off, by chance (confirmed / suspected).
2. **No tests:** one card per important part, the riskiest first: the files (path tiles), what it does in one sentence, why a bug there would hurt, its coverage when measured, and what a first test should check (the direction, no code).
3. **Tests that check nothing:** one line each: the test's path tile and name, what it checks today, what it misses.
4. **By chance:** one line each: the test, the cause (clock, order, network, …), and the result of the runs ("3 of 5 passed", or "5 of 5, suspected only").
5. **Switched off:** one line each: the test, its age, the reason if written.
6. **Coverage:** when measured, a folded table of files under 50 %, lowest first.

Copy buttons as [page.md](page.md) says, plus one on each line in sections 3 to 5 and one per section.

Top pick: the riskiest part with no tests, or a test that fails by chance on a path that matters, whichever would hurt more.

## 6. The ending

Chat lines: the counts by kind, then the top pick. Closing question: "What do we fix first?" The next skill is `fix`: `/fix tests`.
