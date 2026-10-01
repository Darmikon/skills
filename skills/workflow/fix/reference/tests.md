# fix tests

Write the tests `scan tests` found missing, make the weak ones check something, steady the ones that pass by chance, and decide the switched-off ones. Only test files change: never the code under test.

This file adds the tests part to the rules in [../SKILL.md](../SKILL.md).

## Before the plan: learn how this project writes tests

Read two or three tests next to the code you will cover: the runner, where test files go and how they are named, how they build test data, what they mock and what they do not, how they reach a database or a server. A new test follows that style. Do not bring a new test library, helper package or coverage provider: if one is truly needed, it is a separate plan line the user approves, and it is installed in that step only.

## What goes in the plan

One line per test file to create or change, grouped by kind, `High` first:

- **No tests:** a new test file (or new cases in an existing one) for the part. The line names what each case checks, in plain words: "rejects a request with no session", "charges once when the job retries". Behaviour that matters, through the part's public interface; no checks of private details.
- **Checks nothing:** the checks to add to the existing test: what result it will look at. If the test mocks the very thing it claims to test, the line says what to stop mocking.
- **By chance:** the cause and the cure: a fixed clock (`vi.useFakeTimers()` / `vi.setSystemTime()`, `jest.useFakeTimers()`), a fixed seed, state reset between tests (`beforeEach`), a free port per test, a fake for the network call.
- **Switched off:** listed after the plan, each with its age and what it tests, with the question: switch it back on (if it passes) or delete it. The user's answer to it comes with their answer to the plan, and each test they decide on becomes a plan line under the same yes. A test left with `.only` is always a plan line: remove the `.only`.

## Doing it

- Change only test files and test helpers. Never the code under test, not even to make it easier to test: that is a design change, and it goes to the user as a question.
- After writing each test, run it alone. Then run its whole file.
- **A new test fails:** do not change the test to make it pass, and do not change the code. Either the test is wrong (fix the test and say why), or the code has a bug: then stop for that line, report it as "found a bug" with the failing case, and leave the test out of the changes. The user decides.
- **A steadied "by chance" test:** run it five times alone and once in its file; it is done only when all six pass.
- Never update snapshots to make a test pass.
- Tests that need a database or a server are run the way the project runs them (its own scripts, its own test database). If that is not available, write the test, say it was not run and why, and mark the line "written, not run".

## Checks

The project's checks from SKILL.md, plus the whole test file of every changed test. When `scan tests` measured coverage, measure it again the same way (report in the temp dir) and give the before and after for the files you covered.
