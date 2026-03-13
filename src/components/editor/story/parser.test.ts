import test from "node:test";
import assert from "node:assert/strict";

import { __testTokenizeLines } from "./parser";
import { processStoryFile } from "./syntax_parser_new";

function getLineTokenTexts(tokens: Array<{ text: string; style: string }>) {
  return tokens.map((token) => token.text);
}

test("ARRANGE splits spaced button chunks for syntax highlighting", () => {
  const lines = __testTokenizeLines(`[ARRANGE]
> Tap what you hear
Speaker414: [(Nej)… (Du har) (mange)]`);

  const speakerLineTokens = lines[2] ?? [];

  assert.deepEqual(getLineTokenTexts(speakerLineTokens), [
    "Speaker414:",
    " ",
    "[",
    "(",
    "Nej",
    ")",
    "…",
    " ",
    "(",
    "Du",
    " ",
    "har",
    ")",
    " ",
    "(",
    "mange",
    ")",
    "]",
  ]);

  const duToken = speakerLineTokens.find((token) => token.text === "Du");
  const harToken = speakerLineTokens.find((token) => token.text === "har");
  assert.ok(duToken);
  assert.ok(harToken);
  assert.notEqual(duToken.style, harToken.style);
  assert.ok(["number", "meta"].includes(duToken.style));
  assert.ok(["labelName", "comment"].includes(harToken.style));
});

test("ARRANGE keeps tilde-connected button chunk as one token", () => {
  const lines = __testTokenizeLines(`[ARRANGE]
> Tap what you hear
Speaker414: [(Nej)… (Du~har) (mange)]`);

  const speakerLineTokens = lines[2] ?? [];
  const tokenTexts = getLineTokenTexts(speakerLineTokens);

  assert.ok(tokenTexts.includes("Du~har"));
  assert.ok(!tokenTexts.includes("Du"));
  assert.ok(!tokenTexts.includes("har"));
});

test("curly brace TTS override keeps the full tilde-connected phrase", () => {
  const [story] = processStoryFile(
    `[DATA]
icon_0=test
speaker_0=en-US-Test

[LINE]
Speaker0: show~word{speak~word}`,
    0,
    {},
    {
      learning_language: "en",
      from_language: "fr",
    },
    "",
  );

  const line = story.elements[0];
  assert.equal(line?.type, "LINE");
  if (line?.type !== "LINE") return;

  assert.equal(line.line.content.text, "show word");
  assert.match(
    line.line.content.audio?.ssml.text ?? "",
    /<sub alias="speak word">show word<\/sub>/,
  );
});

test("curly brace TTS override still works for single words", () => {
  const [story] = processStoryFile(
    `[DATA]
icon_0=test
speaker_0=en-US-Test

[LINE]
Speaker0: foo{bar}`,
    0,
    {},
    {
      learning_language: "en",
      from_language: "fr",
    },
    "",
  );

  const line = story.elements[0];
  assert.equal(line?.type, "LINE");
  if (line?.type !== "LINE") return;

  assert.equal(line.line.content.text, "foo");
  assert.match(
    line.line.content.audio?.ssml.text ?? "",
    /<sub alias="bar">foo<\/sub>/,
  );
});
