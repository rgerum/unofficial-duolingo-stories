import test from "node:test";
import assert from "node:assert/strict";

import { __testTokenizeLines } from "./parser";
import { processStoryFile } from "./syntax_parser_new";

function getLineTokenTexts(tokens: Array<{ text: string; style: string }>) {
  return tokens.map((token) => token.text);
}

const testAvatars = {
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
};

function parseLine(
  text: string,
  from_language = "en",
  learning_language = "ja",
) {
  const [story] = processStoryFile(
    text,
    0,
    testAvatars,
    { learning_language, from_language },
    "",
  );
  return story.elements[0];
}

function parseStory(
  text: string,
  from_language = "en",
  learning_language = "ja",
) {
  const [story] = processStoryFile(
    text,
    0,
    testAvatars,
    { learning_language, from_language },
    "",
  );
  return story;
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

test("LINE syntax highlighting marks invalid inline TTS replacements", () => {
  const lines = __testTokenizeLines(`[LINE]
Speaker414: foo{} bar`);

  const speakerLineTokens = lines[1] ?? [];
  const invalidToken = speakerLineTokens.find(
    (token) => token.text === "foo{}",
  );

  assert.ok(invalidToken);
  assert.equal(invalidToken.style, "deleted");
});

test("LINE syntax highlighting does not mark valid inline TTS replacements", () => {
  const lines = __testTokenizeLines(`[LINE]
Speaker414: foo{f u:ipa} bar`);

  const speakerLineTokens = lines[1] ?? [];
  const braceTokens = speakerLineTokens.filter(
    (token) => token.text.includes("{") || token.text.includes("}"),
  );

  assert.ok(braceTokens.length > 0);
  for (const token of braceTokens) {
    assert.notEqual(token.style, "deleted");
  }
});

test("LINE syntax highlighting does not mark valid inline TTS replacements with suffixes", () => {
  const lines = __testTokenizeLines(`[LINE]
Speaker414: 家{やー}んかい 向かとーん{んかとーん}。`);

  const speakerLineTokens = lines[1] ?? [];
  const braceTokens = speakerLineTokens.filter(
    (token) => token.text.includes("{") || token.text.includes("}"),
  );

  assert.ok(braceTokens.length > 0);
  for (const token of braceTokens) {
    assert.notEqual(token.style, "deleted");
  }
});

test("LINE rejects ambiguous inline TTS replacements inside a token", () => {
  const element = parseLine(`[LINE]
Speaker414: ジュニア! 今日{ちゅー}|や  何{ぬー} 食{か}み欲{ぶ}さん|なー?
~            Junior   today     's what   to~want~to~eat        (friendly~question)`);

  assert.equal(element?.type, "ERROR");
  assert.match(
    element?.text ?? "",
    /Multiple inline TTS replacements in one segment are not allowed: "食\{か\}み欲\{ぶ\}さん"/,
  );
});

test('LINE keeps a valid inline TTS replacement before "|"', () => {
  const element = parseLine(`[LINE]
Speaker414: ジュニア! 今日{ちゅー}|や?
~            Junior   today`);

  assert.equal(element?.type, "LINE");
  assert.equal(element?.line.content.text, "ジュニア! 今日⁠や?");
  assert.match(
    element?.audio?.ssml.text ?? "",
    /<sub alias="ちゅー"><mark name="8"\/>今日<\/sub><mark name="10"\/>⁠や\?/,
  );
});

test("LINE keeps a valid inline TTS replacement with suffix text", () => {
  const element = parseLine(`[LINE]
Speaker414: リノー 家{やー}んかい 向かとーん{んかとーん}。
~            Lin~is house/home~{やー} to(wards) is~heading~(into)~{んかとーん}`);

  assert.equal(element?.type, "LINE");
  assert.equal(element?.line.content.text, "リノー 家んかい 向かとーん。");
  assert.match(
    element?.audio?.ssml.text ?? "",
    /<sub alias="やー">.*家<\/sub>.*んかい/,
  );
});

test("LINE keeps multiple valid inline TTS replacements on one line", () => {
  const element = parseLine(`[LINE]
Speaker414: 今日{ちゅー} 何{ぬー}?
~            today    what`);

  assert.equal(element?.type, "LINE");
  assert.equal(element?.line.content.text, "今日 何?");
  assert.match(
    element?.audio?.ssml.text ?? "",
    /<sub alias="ちゅー"><mark name="2"\/>今日<\/sub> <sub alias="ぬー"><mark name="4"\/>何<\/sub>\?/,
  );
});

test("LINE keeps valid inline IPA replacements", () => {
  const element = parseLine(`[LINE]
Speaker414: foo{f u:ipa}
~            bar`);

  assert.equal(element?.type, "LINE");
  assert.equal(element?.line.content.text, "foo");
  assert.match(
    element?.audio?.ssml.text ?? "",
    /<phoneme alphabet="ipa" ph="f u"><mark name="2"\/>foo<\/phoneme>/,
  );
});

test('LINE rejects inline TTS replacements without a closing "}"', () => {
  const element = parseLine(`[LINE]
Speaker414: foo{bar
~            baz`);

  assert.equal(element?.type, "ERROR");
  assert.match(
    element?.text ?? "",
    /Inline TTS replacement is missing "\}": "foo\{bar"/,
  );
});

test('LINE rejects inline TTS replacements without text before "{"', () => {
  const element = parseLine(`[LINE]
Speaker414: {bar}
~            baz`);

  assert.equal(element?.type, "ERROR");
  assert.match(
    element?.text ?? "",
    /Inline TTS replacement needs text before "\{": "\{bar\}"/,
  );
});

test("LINE rejects inline TTS replacements with an empty alias", () => {
  const element = parseLine(`[LINE]
Speaker414: foo{}
~            bar`);

  assert.equal(element?.type, "ERROR");
  assert.equal(element?.errorKind, "parse");
  assert.equal(element?.lineNumber, 2);
  assert.equal(element?.sourceLine, "Speaker414: foo{}");
  assert.match(
    element?.text ?? "",
    /Inline TTS replacement needs spoken text inside braces: "foo\{\}"/,
  );
});

test("unknown blocks expose structured editor error metadata", () => {
  const element = parseLine(`[NOT_A_BLOCK]
Speaker414: hello`);

  assert.equal(element?.type, "ERROR");
  assert.equal(element?.errorKind, "unknown_block");
  assert.equal(element?.lineNumber, 1);
  assert.equal(element?.sourceLine, "[NOT_A_BLOCK]");
  assert.equal(element?.text, 'Unknown block type "NOT_A_BLOCK"');
});

test("unknown blocks only emit one error and skip to the next valid block", () => {
  const [story] = processStoryFile(
    `[LINEX]
> ザリー|とぅ{トゥ} リリー|や バス|んかい 乗とーん{ぬとーん}ん。
~ Zari and Lily are   bus on riding~{ぬとーん}
$8287/14b74d63.mp3

[LINE]
Speaker418: リリー、 クラス|んかい 転校生|ぬ っ来ゃん{っちゃん}|さ！
~            Lily  (our)~class in new~student~{てんこうせい} is came~{っちゃん} (sentence~ending)`,
    0,
    testAvatars,
    { learning_language: "ja", from_language: "en" },
    "",
  );

  assert.equal(story.elements.length, 2);
  assert.equal(story.elements[0]?.type, "ERROR");
  assert.equal(story.elements[0]?.errorKind, "unknown_block");
  assert.match(story.elements[0]?.details ?? "", /Ignored 3 lines/);
  assert.equal(story.elements[1]?.type, "LINE");
});

test("block parse errors only emit one error and skip to the next valid block", () => {
  const story = parseStory(
    `[SELECT_PHRASE]
> Select the missing phrase
> [ピッツリア 食{か}み欲{ぶ}さん]。
~  pizza to~want~to~eat
- ピッツリア 誰ち 持っちょーん
+ ピッツリア 二ち 持っちょーん
- ピッツリア 二ち 持ちょーん

[LINE]
Speaker414: 今日{ちゅー} 何{ぬー}?
~            today    what`,
  );

  assert.equal(story.elements.length, 2);
  assert.equal(story.elements[0]?.type, "ERROR");
  assert.equal(story.elements[0]?.errorKind, "parse");
  assert.match(
    story.elements[0]?.text ?? "",
    /Multiple inline TTS replacements in one segment are not allowed: "食\{か\}み欲\{ぶ\}さん"/,
  );
  assert.equal(story.elements[1]?.type, "LINE");
  assert.equal(story.elements[1]?.line.content.text, "今日 何?");
});

test("editor block anchors use the block header line and keep the text line active", () => {
  const story = parseStory(`[DATA]
fromLanguageName=Good Morning
icon=783305780a6dad8e0e4eb34109d948e6a5fc2c35
set=1|1

[HEADER]
> うきみそーちー
~ good~morning
$8275/691934ea.mp3;5,50;1,600

[LINE]
Speaker414: うきみそーちー、 プリティー!
~            good~morning  Priti
$8275/8e8657d3.mp3;5,50;2,550;1,438;7,162;0,525`);

  assert.equal(story.elements[0]?.type, "HEADER");
  assert.deepEqual(story.elements[0]?.editor, {
    block_start_no: 6,
    start_no: 6,
    end_no: 11,
    active_no: 7,
  });

  assert.equal(story.elements[1]?.type, "LINE");
  assert.deepEqual(story.elements[1]?.editor, {
    block_start_no: 11,
    start_no: 11,
    end_no: 15,
    active_no: 12,
  });
});
