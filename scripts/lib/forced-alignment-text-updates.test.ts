import assert from "node:assert/strict";
import test from "node:test";

import { applyTimingUpdates } from "./forced-alignment-text-updates";

test("inserts timing text at the parser's 1-based line insertion anchor", () => {
  assert.equal(
    applyTimingUpdates(
      ["[SELECT_PHRASE]", "> Prompt", "Speaker: Text", "~ Hint", "+ Answer"].join(
        "\n",
      ),
      [{ inserIndex: 0, serializedText: "$audio.mp3" }],
      [[undefined, 5]],
    ),
    [
      "[SELECT_PHRASE]",
      "> Prompt",
      "Speaker: Text",
      "~ Hint",
      "$audio.mp3",
      "+ Answer",
    ].join("\n"),
  );
});

test("clamps an insertion anchor to the current final line", () => {
  assert.equal(
    applyTimingUpdates(
      "first\nsecond\nthird",
      [{ inserIndex: 0, serializedText: "$audio.mp3" }],
      [[undefined, 10]],
    ),
    "first\nsecond\n$audio.mp3\nthird",
  );
});

test("preserves replacement behavior for an existing timing line", () => {
  assert.equal(
    applyTimingUpdates(
      "first\n$old.mp3\nthird",
      [{ inserIndex: 0, serializedText: "$new.mp3" }],
      [[2, 3]],
    ),
    "first\n$new.mp3\nthird",
  );
});
