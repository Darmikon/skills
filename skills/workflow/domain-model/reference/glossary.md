# Glossary format

Write the glossary in the language of the project's other docs.

## A glossary

```md
# {Project or part name}

{One or two sentences: what this project or part is for.}

## Words

**Session**:
One conversation between a user and the agent, from the first message to the last.
_Not_: chat, thread, dialog

**Tool call**:
A request from the model to run one tool, with its arguments.
_Not_: action, function call
```

Optional sections, only when they say something:

```md
## How they relate

- A **Session** holds many **Tool calls**.

## Settled confusions

- "chat" meant both the **Session** and the screen that shows it. Now the screen is the **Chat page**; "chat" alone is not used.
```

Rules:

- **One word per idea.** Pick the best word; put the others under `_Not_`.
- **One or two sentences.** Say what the thing is, not what it does or how it is built.
- **Only this project's words.** Before adding a word, ask: is this an idea of this project, or a general programming idea? Only the first goes in.
- **Group under subheadings** when the words fall into clear groups. A flat list is fine otherwise.
- Keep the words in alphabetical order inside a group, so they are easy to find.

## The map (`docs/glossary-map.md`)

```md
# Glossary map

## Parts

- [Agent](../apps/agent/docs/glossary.md): runs the model and the tools
- [Web](../apps/web/docs/glossary.md): the chat screens

## Between parts

- **Web --> Agent**: Web sends a **Session** id with each message; Agent answers with a stream of events.
- **Shared words**: **Session**, **User**. They mean the same in both parts.
```

Links are relative to `docs/`.
