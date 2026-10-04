---
name: to-questionnaire
description: 'Turn a decision you cannot make alone into a questionnaire for the person who knows: a Markdown file in the OS temp folder, ready to send or to fill in together on a call.'
argument-hint: '[the decision or topic]'
disable-model-invocation: true
---

# to-questionnaire

The user is stuck on something that someone else knows: a product owner, a tech lead, a designer, a client. Write them a questionnaire that pulls that knowledge out, to send and get back later, or to fill in together on a call.

**Ask the user only about the sending**, never about the subject: they cannot answer the subject, that is why the questionnaire exists. The questions in the file aim at the gap between what the recipient knows and what the user needs.

## Steps

1. **Who is it for?** One question: the person's role, what they know that the user does not, and how they relate to the user (a manager, a client, a teammate). This sets the tone and how much context the file must carry.
2. **What do you need back?** One question: the decisions or facts the user cannot settle alone. Done when there is a concrete list of what the user must be able to do or decide afterwards.
3. **Write it.** Use the template below. Take the context from the conversation, the code and the project's docs; use the project's words (its glossary if it has one). Write it to `<tmp>/questionnaire-<slug>-<date +%Y%m%d-%H%M%S>.md`, where `<tmp>` is `${TMPDIR:-/tmp}` without its trailing slash and `<slug>` comes from the topic. Never into the project.
4. **Hand it over.** Give the path as a `file://` link, the number of questions, and check that every item from step 2 has a question. Offer to open it (`open <path>` on macOS) or to change anything.

If the topic came after `/to-questionnaire`, start at step 1 with it. Without it, ask what decision is stuck, and stop.

## The template

Write it in the user's language, unless they say the recipient reads another one. The most important questions first: the recipient may answer only once.

```md
# <Title>

**Why:** the decision that depends on the answers.

**From:** <the user> · **To:** <the recipient> · **The answers will be used for:** <what>

## Context

One paragraph, enough for someone who was not in the conversation to answer well. Not a page.

## How to answer

By when, and about how long it takes. "I don't know" and partial answers help: mark what you are unsure about instead of skipping it.

## <Theme>

### <One question, one idea>

_Why it matters: <one line>_

>

### <Next question>

>

## Anything we did not ask?

>
```

Rules for the questions:

- One idea per question; never two in one.
- Each question has an empty answer line (`>`) under it.
- "Why it matters" only where the question could be misread or invite a throwaway answer.
- Group questions under `##` themes once there are more than five; a short list needs no themes.
- No question the user could answer by reading the code or the docs: look it up instead and put it in the context.

Answer in the user's language.

Adapted from `to-questionnaire` in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).
