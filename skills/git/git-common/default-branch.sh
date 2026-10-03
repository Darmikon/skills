#!/usr/bin/env bash
# Prints the repository's default branch (main, master, …). Shared by the git skills.
# Probes locally: `git remote show origin` would stall on an unreachable remote.
d=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
if [ -z "$d" ]; then
  for c in main master; do
    git rev-parse --verify --quiet "origin/$c" >/dev/null && { d=$c; break; }
    git rev-parse --verify --quiet "$c" >/dev/null && { d=$c; break; }
  done
fi
echo "${d:-main}"
