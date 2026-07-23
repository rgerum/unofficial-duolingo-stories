import assert from "node:assert/strict";
import test from "node:test";
import type { StoryElement } from "@/components/editor/story/syntax_parser_types";
import { getParts } from "@/components/StoryProgress/parts";
import { getFeedbackLineIndex } from "@/components/StoryFeedback/feedbackContext";

function storyElement(
  type: StoryElement["type"],
  lineIndex: number,
  sourceLineIndex?: number,
) {
  return {
    type,
    trackingProperties: {
      line_index: lineIndex,
      ...(type === "MULTIPLE_CHOICE"
        ? { challenge_type: "multiple-choice" }
        : {}),
      ...(sourceLineIndex !== undefined
        ? { source_line_index: sourceLineIndex }
        : {}),
    },
  } as StoryElement;
}

test("web feedback uses the visible story element tracking index", () => {
  const currentPart = [
    storyElement("LINE", 4),
    storyElement("MULTIPLE_CHOICE", 5),
  ];

  assert.equal(getFeedbackLineIndex(currentPart, 0), 4);
  assert.equal(getFeedbackLineIndex(currentPart, 1), 5);
});

test("web feedback prefers the source index on the visible challenge", () => {
  const currentPart = [
    storyElement("LINE", 4),
    storyElement("MULTIPLE_CHOICE", 5, 2),
  ];

  assert.equal(getFeedbackLineIndex(currentPart, 1), 2);
});

test("web feedback prefers the source tracking index used by the backend", () => {
  const parts = getParts([
    storyElement("LINE", 0),
    storyElement("LINE", 1),
    storyElement("CHALLENGE_PROMPT", 1),
    storyElement("MULTIPLE_CHOICE", 1),
    storyElement("LINE", 2),
  ]);

  assert.equal(parts[2][0].trackingProperties.line_index, 2);
  assert.equal(getFeedbackLineIndex(parts[2], 0), 1);
});

test("web feedback omits the tracking index without a visible story element", () => {
  assert.equal(getFeedbackLineIndex(undefined, 0), undefined);
});

test("web feedback ignores a visible element without tracking metadata", () => {
  const untrackedElement = { type: "LINE" } as StoryElement;

  assert.equal(getFeedbackLineIndex([untrackedElement], 0), undefined);
});
