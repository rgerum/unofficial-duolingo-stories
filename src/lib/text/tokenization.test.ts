import assert from "node:assert/strict";
import test from "node:test";

import {
  isAudioWordCharacter,
  splitAlignedHintText,
  splitAlignedText,
  splitDisplayText,
} from "./tokenization";

test("aligned story tokens retain punctuation and source offsets", () => {
  const text = "କାମ କର ।";
  const tokens = splitAlignedText(text);

  assert.deepEqual(tokens, ["କାମ", " ", "କର", " ।", ""]);
  assert.equal(tokens.join(""), text);
});

test("aligned story tokens recognize both invisible separators", () => {
  const text = "one​two⁠three";
  const tokens = splitAlignedText(text);

  assert.deepEqual(tokens, ["one", "​", "two", "⁠", "three"]);
  assert.equal(tokens.join(""), text);
});

test("tilde separation is explicit for story and hint text", () => {
  assert.deepEqual(splitAlignedText("one~two"), ["one~two"]);
  assert.deepEqual(splitAlignedText("one ~ two", { tilde: "separator" }), [
    "one",
    " ~ ",
    "two",
  ]);
  assert.deepEqual(splitAlignedHintText("one~two"), ["one~two"]);
  assert.deepEqual(splitAlignedHintText("one~two", { tilde: "separator" }), [
    "one",
    "~",
    "two",
  ]);
});

test("audio word classification follows the shared separator policy", () => {
  assert.equal(isAudioWordCharacter("କ"), true);
  assert.equal(isAudioWordCharacter("ା"), true);
  assert.equal(isAudioWordCharacter("।"), false);
  assert.equal(isAudioWordCharacter("॥"), true);
  assert.equal(isAudioWordCharacter("​"), false);
  assert.equal(isAudioWordCharacter("⁠"), false);
});

test("display tokens separate attached punctuation", () => {
  const text = "one,two ।";
  const tokens = splitDisplayText(text);

  assert.deepEqual(tokens, ["one", ",", "two", " ।", ""]);
  assert.equal(tokens.join(""), text);
});
