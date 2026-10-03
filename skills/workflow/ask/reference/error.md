# ask error

Where an error comes from and which paths lead to it. Answer in the chat.

## Read what was given

A message, an error code or class, or a whole stack trace. A stack trace: follow its frames that are in this project, from the bottom up, reading the code at each.

## Find it

- Search for the exact text first (`git grep -n -F '<text>'`), then its fixed parts when it has values in it (`git grep -n -E '<fixed part>.*<fixed part>'`), then the error code or class.
- For each place that produces it: its path and line, the condition that throws it, and the callers one or two levels up that lead there.
- Several places: list them all and say which fits the text best. None: say so, and what was searched.

## The answer

The place (or places), the condition, the path that leads there as plain-character steps, and what input or state makes it happen, marked as a guess where it is one. Then one question: dig into one path (`/ask how <part>`), or it is a bug to fix (`/systematic-debugging`).
