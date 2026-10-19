# fix ai

Fix what `scan ai` found. Small, local fixes are done here after a yes; the rest goes to a design talk, as `fix security` does. `llm` is another name for this command.

Step 1 (the findings) in [../SKILL.md](../SKILL.md) applies; steps 2 to 5 apply to the first group below.

## 1. Two groups

A finding is **direct** when all three hold: the change touches at most two files, it needs no new package, and the code around it gets the same thing as before (the same return type, the same errors). Otherwise it is **discuss**. This rule wins over the lists below, with one exception: replacing the same literal by the same import in many files is one mechanical change, however many files it touches (E2).

Usually direct:

- E2: model ids into one config (`llm/models.ts`, `failures.md` §8), the literals replaced by it in every file, however many; this is direct.
- E7: `max_tokens` chosen per call for what the call returns.
- A7: a tool failure returned as a `tool_result` with `is_error: true` and the error text (`failures.md` §3).
- A4, when the fix is one setting: `maxRetries: 0` on the client under an own loop, or the own loop removed when only the SDK should retry (`failures.md` §2).
- A8: `Promise.all` over model calls becomes `Promise.allSettled` with the failures kept (`failures.md` §4, §9). A concurrency limit that needs `p-limit` is discuss.
- A9: tool calls acted on only after the stream ends, in one function (`failures.md` §5).
- E4: dynamic text moved after the cache breakpoint, `cache_control` on the stable prefix (`failures.md` §6).
- G8: a `permissions.deny` list for secret files in `.claude/settings.json` (`security.md` §5).

Usually discuss: the retry layer (A1–A3, A5), refusal handling (A6: callers get a new error), all of B, C and D, E1, E3, E5, E6, E8, F, G1 (the call moves to a backend), G3–G7, G9–G12, M.

## 2. The plan

The plan of ../SKILL.md step 2, in two numbered groups with one numbering across both:

- **I fix these:** one line per change: the file and line, what changes, the finding's id.
- **We discuss these:** one line per finding: title, rank, id.

End with: "Do I go ahead with the first group? Answer yes, or yes except some numbers. Which of the second group do we design a fix for? Numbers, all, or none."

## 3. The first group

Steps 3 to 5 of ../SKILL.md. Write each fix from the matching file in `reference/ai/`, adapted to the project's names, paths and framework. Before writing code, check the version of the library in the project against its current docs (Context7 or the vendor's docs); the examples were written for `@anthropic-ai/sdk` 0.135. Python: the same fix in Python, written from the library's docs; the examples are TypeScript.

## 4. The second group

For the findings chosen from it, do [handoff.md](handoff.md) section 2 "Hand over" (its section 1 is replaced by the answer to the plan): the `brainstorming` skill gets them, and the message that carries its first question opens with one line naming the skill as `brainstorming` (the name is not translated) and the findings it takes, then the report of the first group (section 5), then the question. Add to the topic, per finding, the `reference/ai/` files and sections that cover it (from the table below, as absolute paths), and the line "Check every package version against its current docs before writing code."

| Ids | Example code |
|---|---|
| A1–A5 | `failures.md` §1–2 |
| A6, A7 | `failures.md` §3 |
| A8 | `failures.md` §4 |
| A9, E6 | `failures.md` §5 |
| E4 | `failures.md` §6 |
| E5 | `failures.md` §7 |
| E1–E3 | `failures.md` §8 |
| F1–F3 | `failures.md` §9 |
| the single wrapper for a NestJS backend | `failures.md` §10 |
| B1–B11, E8 | `observability.md` (missing tracing: its "Setup playbook", starting from "Default stacks") |
| C1–C5, D1–D5 | `testing.md` |
| G1–G12 | `security.md` (G1 on mobile also `mobile.md` "Rule zero") |
| M1–M10 | `mobile.md` |

None chosen: skip this step.

## 5. The report

The report of ../SKILL.md step 5, then which findings went to the design step. A leaked key (G1 or G2 found in history or in client code): always "Rotate the key; removing it from the code or history is not enough", whatever was approved.
