import test from "node:test";
import assert from "node:assert/strict";

import { __testTokenizeLines } from "./parser";

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
