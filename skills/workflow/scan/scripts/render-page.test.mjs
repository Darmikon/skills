import { test } from "node:test";
import assert from "node:assert/strict";
import { renderPage, buildPrompt } from "./render-page.mjs";

const base = () => ({
  command: "unused",
  project: "/Users/me/shop",
  findings: [
    { id: "f1", title: "Nobody calls `unusedHelper`", rank: "High", group: "safe to remove", action: "delete",
      places: [{ path: "src/app/session.ts", line: 12 }], seen: "knip and git grep find no caller", direction: "delete it" },
    { id: "f2", title: "Drop export of `CLAUDE_MODEL`", group: "safe to remove", action: "drop export",
      places: [{ path: "src/claude.ts", line: 3 }] },
  ],
  page: {
    lang: "en",
    title: "Unused in shop",
    facts: [["Project", "/Users/me/shop"]],
    summary: [{ label: "safe to remove", value: 2 }],
    sections: [{ title: "Code nobody calls", block: "lines", findings: ["f1", "f2"] }],
  },
});

test("escapes text and turns backticks into code chips", () => {
  const data = base();
  data.findings[0].seen = "<script>alert(1)</script> and `a<b>`";
  data.page.sections = [{ title: "Cards", block: "cards", findings: ["f1"] }];
  const html = renderPage(data);
  assert.ok(!html.includes("<script>alert(1)"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes('<code class="sym">a&lt;b&gt;</code>'));
});

test("draws a path tile that opens the file in Cursor at its line", () => {
  const html = renderPage(base());
  assert.ok(html.includes('href="cursor://file/Users/me/shop/src/app/session.ts:12"'));
  assert.ok(html.includes('<span class="dir">src/<wbr>app/<wbr></span><span class="file">session.ts</span><span class="ln">L12</span>'));
});

test("a section with two findings gets a section copy button; with one it does not", () => {
  const two = renderPage(base());
  assert.equal((two.match(/class="copy"/g) || []).length, 3);
  const data = base();
  data.page.sections[0].findings = ["f1"];
  const one = renderPage(data);
  assert.equal((one.match(/class="copy"/g) || []).length, 1);
});

test("the prompt stands alone and ends with the ask in the page language", () => {
  const data = base();
  const en = buildPrompt(data.findings[0], data);
  assert.match(en, /^Project: \/Users\/me\/shop\nFound by: \/scan unused\n/);
  assert.match(en, /src\/app\/session\.ts:12/);
  assert.match(en, /Check this against the code first/);
  data.page.lang = "ru";
  assert.match(buildPrompt(data.findings[0], data), /Сначала проверь это по коду/);
});

test("ask commands name /ask in the prompt", () => {
  const data = base();
  data.command = "what-is-it";
  data.family = "ask";
  assert.match(buildPrompt(data.findings[0], data), /Found by: \/ask what-is-it/);
});

test("loads mermaid only when a diagram block is present", () => {
  assert.ok(!renderPage(base()).includes("mermaid"));
  const data = base();
  data.page.sections.push({ title: "Parts", block: "diagram", mermaid: "flowchart LR\n  a --> b" });
  const html = renderPage(data);
  assert.ok(html.includes("mermaid.esm.min.mjs"));
  assert.ok(html.includes('<pre class="mermaid">flowchart LR\n  a --&gt; b</pre>'));
});

test("sets the html lang and draws table, text, summary and top pick", () => {
  const data = base();
  data.page.lang = "ru";
  data.page.sections.push({ title: "Folders", block: "table", columns: ["Folder", "Job"], rows: [["src/", "the code"]] });
  data.page.sections.push({ title: "About", block: "text", text: "A small `shop`." });
  data.page.top_pick = { finding: "f1", why: "it is dead code" };
  const html = renderPage(data);
  assert.ok(html.includes('<html lang="ru">'));
  assert.ok(html.includes("<th>Folder</th>"));
  assert.ok(html.includes('A small <code class="sym">shop</code>.'));
  assert.ok(html.includes("it is dead code"));
  assert.ok(html.includes('href="#f1"'));
});

test("badges get colours for known words and a neutral one otherwise", () => {
  const html = renderPage(base());
  assert.ok(html.includes('<span class="badge b-red">High</span>'));
  assert.ok(html.includes('<span class="badge b-green">safe to remove</span>'));
  const data = base();
  data.findings[0].rank = "whatever";
  assert.ok(renderPage(data).includes('<span class="badge b-grey">whatever</span>'));
});

test("a finding listed in a section but missing from findings is reported, not dropped silently", () => {
  const data = base();
  data.page.sections[0].findings = ["f1", "nope"];
  assert.throws(() => renderPage(data), /unknown finding "nope"/);
});
