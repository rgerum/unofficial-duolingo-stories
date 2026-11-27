import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDocsSearchIndex,
  markTerms,
  markdownToText,
  searchDocs,
  sectionHref,
  splitSections,
} from "./docs_search_index";

const index = buildDocsSearchIndex([
  {
    slug: "story-editing/overview",
    title: "Overview",
    group: "Story Editing",
    body: [
      "Duostories is not like *Word*.",
      "",
      "### Comments",
      "```",
      "# This line is a comment",
      "```",
      "You can mark a line with the hash sign `#`.",
      "",
      "### Save",
      'Click the ![save](/docs/save.png "save") symbol. See [GitHub](https://github.com).',
    ].join("\n"),
  },
  {
    slug: "audio-generation/overview",
    title: "Audio overview",
    group: "Audio Generation",
    body: "### Voices\nPick a voice for each character.\n",
  },
]);

test("splits pages at ### headings and ignores headings in code", () => {
  const sections = index[0].sections;
  assert.deepEqual(
    sections.map((s) => [s.heading, s.anchor]),
    [
      [null, null],
      ["Comments", "comments"],
      ["Save", "save"],
    ],
  );
  assert.match(sections[1].text, /This line is a comment/);
});

test("reduces markdown to readable text", () => {
  assert.equal(
    markdownToText(
      '<Info>Click ![save](/a.png "t") on [GitHub](https://x) **now**</Info>',
    ),
    "Click save on GitHub now",
  );
  assert.equal(splitSections("a", "#### Deep\ntext")[0].text, "Deep text");
});

test("matches case-insensitively and ranks titles first", () => {
  const results = searchDocs(index, "OVERVIEW");
  assert.deepEqual(
    results.map((r) => r.page.slug),
    ["story-editing/overview", "audio-generation/overview"],
  );
});

test("requires every word and finds the matching section", () => {
  const [result, ...rest] = searchDocs(index, "save symbol");
  assert.equal(rest.length, 0);
  assert.equal(result.hits[0].section.heading, "Save");
  assert.equal(
    sectionHref(result.hits[0].section),
    "/docs/story-editing/overview#save",
  );
  assert.ok(result.hits[0].snippet.some((part) => part.match));
  assert.deepEqual(searchDocs(index, "save voice"), []);
});

test("returns nothing for an empty query", () => {
  assert.deepEqual(searchDocs(index, "   "), []);
});

test("marks every occurrence of the terms", () => {
  assert.deepEqual(markTerms("Save and save", ["save"]), [
    { text: "Save", match: true },
    { text: " and ", match: false },
    { text: "save", match: true },
  ]);
});

test("matches words split between the page title and a heading", () => {
  const engines = buildDocsSearchIndex([
    {
      slug: "audio-generation/engines",
      title: "Speech Engines",
      group: "Audio Generation",
      body: "Intro text.\n\n### Azure TTS\nMicrosoft voices.\n",
    },
  ]);
  const [result] = searchDocs(engines, "speech azure");
  assert.equal(result?.hits[0]?.section.heading, "Azure TTS");
});
