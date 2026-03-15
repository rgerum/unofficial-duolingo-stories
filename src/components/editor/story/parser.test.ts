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

test("LINE rejects ambiguous inline TTS replacements inside a token", () => {
  const [story] = processStoryFile(
    `[LINE]
Speaker414: ジュニア! 今日{ちゅー}|や  何{ぬー} 食{か}み欲{ぶ}さん|なー?
~            Junior   today     's what   to~want~to~eat        (friendly~question)`,
    0,
    {
      0: {
        id: 0,
        avatar_id: 0,
        language_id: 0,
        name: "Narrator",
        link: "",
        speaker: "ja-JP-Wavenet-C",
      },
      414: {
        id: 414,
        avatar_id: 414,
        language_id: 0,
        name: "Junior",
        link: "",
        speaker: "ja-JP-Wavenet-C",
      },
    },
    {
      learning_language: "ja",
      from_language: "en",
    },
    "",
  );

  assert.equal(story.elements.length, 1);
  assert.equal(story.elements[0]?.type, "ERROR");
  assert.match(
    story.elements[0]?.text ?? "",
    /Invalid inline TTS replacement "食\{か\}み欲\{ぶ\}さん"/,
  );
});
