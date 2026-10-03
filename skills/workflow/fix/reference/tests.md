# fix tests

Write the tests `scan tests` found missing, make weak ones check something, steady the ones that pass by chance, and decide the switched-off ones. Only test files and test helpers change, never the code under test.

## Before the plan

Read two or three tests next to the code you will cover: the runner, where test files go and their names, how they build test data, what they mock, how they reach a database or server. New tests follow that style. A new test library, helper package or coverage provider is a separate plan line the user approves, installed in that step only.

## What goes in the plan

One line per test file to create or change, grouped by kind, `High` first:

- **No tests:** a new test file (or new cases) for the part. Name what each case checks in plain words ("rejects a request with no session"): behaviour through the public interface, no private details.
- **Checks nothing:** what result the test will now look at; if it mocks the thing it tests, what to stop mocking.
- **By chance:** the cause and the cure: a fixed clock (`vi.useFakeTimers()` / `vi.setSystemTime()`, `jest.useFakeTimers()`), a fixed seed, state reset in `beforeEach`, a free port per test, a fake for the network call.
- **Switched off:** listed after the plan with its age and what it tests, asking: switch it back on (if it passes) or delete it? Each one the user decides becomes a plan line under the same yes. A `.only` left in is always a plan line: remove it.

## Doing it

- Making the code easier to test is a design change: ask the user.
- Run each new test alone, then its whole file.
- **A new test fails:** never change the test just to pass, never change the code. If the test is wrong, fix it and say why. If the code has a bug, stop that line, report "found a bug" with the failing case, and leave the test out. The user decides.
- **A steadied by-chance test** is done only when it passes five times alone and once in its file.
- Never update snapshots to make a test pass.
- Tests needing a database or server run the project's way (its scripts, its test database). If that is not available, write the test, say why it did not run, and mark the line "written, not run".

## Checks

Also run the whole file of every changed test. When `scan tests` measured coverage, measure again the same way (report in the temp dir) and give before and after for the files you covered.
