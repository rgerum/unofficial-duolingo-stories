import { test } from "node:test";
import assert from "node:assert/strict";
import { getParts } from "./parts";
import type { StoryElement } from "@/components/editor/story/syntax_parser_types";

test("getParts skips parse-error elements", () => {
  const elements = [
    { type: "HEADER", trackingProperties: { line_index: 0 } },
    {
      type: "ERROR",
      text: "bad block",
      trackingProperties: { line_index: 1, challenge_type: "error" },
    },
    { type: "LINE", trackingProperties: { line_index: 2 } },
  ] as unknown as StoryElement[];

  const parts = getParts(elements);

  assert.deepEqual(
    parts.map((part) => part.map((element) => element.type)),
    [["HEADER"], ["LINE"]],
  );
  assert.equal(parts[1][0].trackingProperties.line_index, 1);
});
