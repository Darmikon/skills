# Logic prototype

One self-contained HTML file that lets anyone push a state model through cases by clicking buttons. For questions about business rules, state changes or the shape of data: things that look fine on paper and feel wrong once you press through a real case.

## 1. Write the question down

One paragraph at the top of the page, visible, not in a comment: what model is being tried and what question it should answer. A prototype that answers the wrong question is wasted, so make it checkable.

## 2. Keep the logic in one pure module

Put the logic in one `<script>` block, written so it could be lifted into the real code later. Pick the shape that fits the question:

- a reducer `(state, action) => state`, when actions are separate events;
- a state machine with explicit states and transitions, when "which actions are allowed now" is part of the question;
- a few pure functions over plain data, when there is no current state;
- a small class, when the logic really owns ongoing state.

Pure: no DOM, no `document`, no click handlers inside it. The page calls the module; nothing goes the other way.

## 3. Build the page

Plain HTML, CSS and JavaScript, all inline. No framework, no bundler, no server, no CDN: it must open from a file and survive being sent by mail.

From top to bottom:

1. **Title and one line** on what the page lets you explore.
2. **The current state** as a readable panel with labelled fields (not raw JSON), redrawn after every click. Mark what just changed.
3. **Free buttons**: one per action, always there, to press in any order.
4. **Scenarios**: one tab each, with a short plain description (the situation and what to watch for) and the steps as real buttons in order. Starting a scenario resets to a known state. Cover the normal path, a tricky edge case and something that should be refused.

Clean and quiet: readable type, space, one accent colour, no animations.

## 4. Save and open it

Write it to `<tmp>/prototype-<slug>-<date +%Y%m%d-%H%M%S>.html`, where `<tmp>` is `${TMPDIR:-/tmp}` without its trailing slash. Never into the project. Open it (`open <path>` on macOS, `xdg-open` on Linux) and give the path as a `file://` link, so it can be sent to someone else.

The best moments are "wait, that should not be possible" and "I thought X would happen": those are holes in the idea, which is the point. Add actions or scenarios when asked.

## 5. Clean up

Nothing to remove from the project: the file lives in the temp folder, which the OS clears on its own. The proven module goes into the real code only after a yes (see "When it has answered" in the skill).
