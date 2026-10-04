# Screen prototype

3 to 5 really different variants of one screen, inside the running app, switched with a bar at the bottom. The user flips through them, picks one or takes parts from several, and the rest is thrown away.

These cannot live in the temp folder: they need the app's real components, styles and data. They live in the app's code for as long as the choice takes, and are removed after it.

## Where they go

- **An existing page (the default).** Show the variants on the same page, picked with a `?variant=` URL parameter. The page's data loading, params and auth stay; only what is drawn changes. A new section or card for an existing page also goes here: next to the real header and real data, weak designs show themselves.
- **A new page, only when nothing existing could host it.** A throwaway route under the project's own routing, with `prototype` in its path.

Write the plan in one line at the top of the switcher file: "Three variants of the settings page, `?variant=A|B|C`, on `/settings`."

## The variants

Three by default, five at most. Each one:

- uses the page's purpose and the data it already has;
- uses the project's components and styling, whatever they are;
- is its own component: `PrototypeVariantA`, `PrototypeVariantB`, …

They must differ in structure: layout, what comes first, the main action. Three card grids in different colours is not a prototype. If two come out alike, redo one with "no card grid" as a rule. Variants share small parts at most (a header), never the layout.

No real writes: a variant that needs to change data calls a stub.

## The switcher

One component that reads `?variant=` and draws that variant, plus a small bar fixed at the bottom centre:

- left arrow, the current variant's key and name ("B: sidebar"), right arrow; the arrows wrap around;
- the arrows change the URL parameter through the app's router, so a variant can be shared and survives a reload;
- the `←` and `→` keys do the same, except while an input, textarea or editable field has focus;
- it looks clearly unlike the page (a dark pill with a shadow), so nobody judges it as part of a design;
- it never shows in a production build (`process.env.NODE_ENV !== 'production'` or the project's equivalent).

## Hand it over

Give the URL with each `?variant=` key, and start the dev server if it is not running. The useful answer is often "the header from B with the list from C".

## Clean up

When the user has chosen, list the files the prototype added or changed, and after a yes:

- remove every variant, the switcher and the throwaway route;
- restore the page as it was (`git diff` on it must show nothing from the prototype);
- the winner goes into the real page only after its own yes, rewritten to the project's standards, not copied.

Never commit the prototype, never move it to a branch.
