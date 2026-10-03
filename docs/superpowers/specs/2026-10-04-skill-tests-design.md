# Skill tests

`tests/run.sh [filter]` runs the skills in this repo as real `claude -p` sessions (`--permission-mode auto`) against a throwaway copy of `tests/fixture/` (a tiny order service with planted problems), each case in a fresh copy with its own git repo and a bare "remote". Each case is one or more prompts (follow-ups with `-c`) and plain checks on the output, `git` and files. Results go to `tests/results/<timestamp>/` (git-ignored): one log per case and `report.md`, a table of case, pass/fail, seconds. `node_modules` for the fixture is installed once into `tests/.cache/` and linked into each copy.

Covered: scan comments, scan unused, fix comments (+yes), ask what-is-it, how, why, zoom-out, scan pin/unpin, commit (+yes), push after a rebase, push with a teammate's commit, merge (+yes), rebase (+yes), cleanup (+yes), show-my-branches, explore, verify, update-plans, handoff.

Not covered: pr and changelog (need GitHub), output-style (changes the user's settings), handoff-lpm (opens app tabs), baby, focus, wtf (tone only).

A case is stopped after 10 minutes. Real projects are never touched; the only thing outside the temp folder is the `scan-unused` shortcut that the pin case makes and removes.
