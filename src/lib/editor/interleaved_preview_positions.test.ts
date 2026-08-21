import assert from "node:assert/strict";
import test from "node:test";
import type {
  StoryElement,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import {
  getInterleavedPreviewInteractionKey,
  getInterleavedPreviewLineNumber,
  getInterleavedPreviewRenderKey,
} from "./interleaved_preview_positions";

function storyElement(editor: StoryElementLine["editor"]): StoryElement {
  return {
    type: "LINE",
    line: {
      type: "PROSE",
      content: { text: "Hello", hintMap: [], hints: [] },
    },
    trackingProperties: { line_index: 1 },
    lang: "en",
    editor,
  };
}

test("places an interleaved preview before its source block", () => {
  assert.equal(
    getInterleavedPreviewLineNumber(
      [storyElement({ block_start_no: 12, start_no: 13, end_no: 15 })],
      20,
    ),
    12,
  );
});

test("uses the earliest positioned element in a grouped preview part", () => {
  assert.equal(
    getInterleavedPreviewLineNumber(
      [
        storyElement({ block_start_no: 9 }),
        storyElement({ block_start_no: 8 }),
      ],
      20,
    ),
    8,
  );
});

test("clamps stale parser positions to the current document", () => {
  assert.equal(
    getInterleavedPreviewLineNumber([storyElement({ block_start_no: 24 })], 10),
    10,
  );
});

test("skips a preview part without a source position", () => {
  assert.equal(getInterleavedPreviewLineNumber([storyElement({})], 10), null);
});

test("keeps the render key stable when only source positions move", () => {
  const settings = { rtl: false, showHints: true, showAudio: false };
  const before = storyElement({ block_start_no: 12, start_no: 13, end_no: 15 });
  const after = storyElement({ block_start_no: 14, start_no: 15, end_no: 17 });

  assert.equal(
    getInterleavedPreviewRenderKey([before], settings),
    getInterleavedPreviewRenderKey([after], settings),
  );
  assert.notEqual(
    getInterleavedPreviewInteractionKey([before]),
    getInterleavedPreviewInteractionKey([after]),
  );
});

test("changes the render key when visible story content changes", () => {
  const settings = { rtl: false, showHints: true, showAudio: false };
  const before = storyElement({ block_start_no: 12 });
  const after = storyElement({ block_start_no: 12 });
  if (after.type !== "LINE") throw new Error("Expected a line element");
  after.line.content.text = "Goodbye";

  assert.notEqual(
    getInterleavedPreviewRenderKey([before], settings),
    getInterleavedPreviewRenderKey([after], settings),
  );
});
