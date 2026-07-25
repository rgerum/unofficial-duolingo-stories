import assert from "node:assert/strict";
import test from "node:test";

import { keepClosingPunctuationWithWord } from "./text";

test("keepClosingPunctuationWithWord prevents breaks before closing punctuation", () => {
  assert.equal(
    keepClosingPunctuationWithWord("hello ! Are you sure ?"),
    "hello\u00a0! Are you sure\u00a0?",
  );
});

test("keepClosingPunctuationWithWord keeps line breaks as break opportunities", () => {
  assert.equal(
    keepClosingPunctuationWithWord("hello \n!"),
    "hello \n!",
  );
});

test("keepClosingPunctuationWithWord preserves existing non-breaking spaces", () => {
  assert.equal(
    keepClosingPunctuationWithWord("hello\u00a0!"),
    "hello\u00a0!",
  );
});
