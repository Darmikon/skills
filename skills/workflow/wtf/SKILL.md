---
name: wtf
description: 'Stop. That last message did not land: re-pitch it.'
disable-model-invocation: true
---

# wtf

> Wait, I don't understand where you've got to here. Re-pitch that: give me a little bit of context, talk in ASD-STE100 Simplified Technical English, and call things by the names that I use.

That is the user talking. Your last message did not land. They do not want new work or a new idea. They want the same message again, built so that it lands this time.

Say it again once, then stop. Do not continue the task in the same reply. The user is lost, so the next move is theirs.

## A little bit of context

A message usually fails because it starts in the middle. You were deep in the task and the user was not. Put them back on the map before you make the point, in this order:

1. **The goal.** What we are trying to get done. One sentence.
2. **Where we are.** What is done and what is not. If you need a decision from them, say so here. If you left the plan that they agreed to, say so here too.
3. **The point.** What your last message tried to say.
4. **What you need from them.** A decision, an answer, or nothing. Ask so that the question stands alone: the user must not have to look back up the reply to answer it. For a decision, give the choices. With each choice, say in one sentence what it costs, or say that you do not know the cost.

A little context, not a history. Do not tell the user what they already know: how their own tool works, the analysis that they already agreed to. Leave out how you got here, unless the user cannot decide without it. Then keep to the one thing they must know or decide. The details can come back when they ask.

## Simplified Technical English

ASD-STE100 exists so that a tired mechanic, reading in a second language, gets a repair step right the first time. That is your reader now. The rules that matter in a chat reply:

- **Short sentences.** At most 20 words for an instruction, 25 for a description.
- **One idea in each sentence.** One instruction in each sentence.
- **Active voice, simple tenses.** "The test fails", not "the test has been failing".
- **One word for one thing.** If you call it a "queue", it stays a "queue". Do not change to "buffer" or "list" for variety.
- **Keep the small words.** Do not drop "the", "a" or "that" to look short. No contractions.
- **No noun stacks.** At most three nouns in a row. Write "the handler that retries the token refresh", not "the token refresh retry handler".
- **No idioms, no metaphors,** and no abbreviation that you did not define.
- **Short paragraphs.** At most six sentences. Steps that the user must do go in a numbered list.

STE is an English standard. If the user writes in another language, answer in that language and keep the same rules.

## The user's names for things

STE lets each project bring its own technical names. Take them from the user.

- Use the names that the user uses, exactly as they write them. Do not use a synonym. Do not use a name from the code (`usr_acct_v2`) where the user has their own name for the thing ("customer account").
- Where the user has no name for a thing, say in plain words what it is. Give its name from the code once, in backticks, so that the user can find it.

Names that you made up while you worked ("the shim", "option B", "the fast path") are in nobody's vocabulary but yours. They are a common reason a message does not land. Replace each one with the user's name for the thing, or say in full what it is. If the user agreed to something under that name ("go with option A"), say the name once, so that they can connect the two.

## A guess stays a guess

The user will decide from this reply. Short plain sentences sound sure. Do not let the re-pitch sound more sure than you are.

- Say as a fact only what you saw: in the code, in a test run, in the conversation.
- Mark everything else in the same sentence: "I think", "I did not check", "I do not know".
- A result that you worked out, but did not see, is a guess too. "I read the code, and I think that the retry sends the email twice" is honest. "The retry sends the email twice" is not, if you did not see it happen.
- Be most careful with the cost of a choice. Do not make up a cost to fill the line.
- If your last message had a hole (a term that you never explained, a number without its meaning), do not copy the hole. Fill it from what you know, or say that you do not know.
- Keep the doubts few, so that the user still sees the decision, but never do this by removing the mark from a guess. If the decision does not depend on a guess, leave the whole guess out. Say each doubt once. Do not doubt a thing that you saw or that you already reported as a fact.

## Before you send

- Is each guess marked as a guess?
- Does the reply start with the goal? Do not apologise, do not announce the method ("Here it is in Simplified Technical English"), and do not talk about the reply itself ("Now the main point").
- Could the user act on it if they read nothing else in this conversation?
- Does each thing have one name from start to end?
