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
  splitInterleavedPreviewPart,
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

test("splits a challenge from the preceding Line at its own source block", () => {
  const storyLine = storyElement({ block_start_no: 109 });
  const challenge = {
    type: "MULTIPLE_CHOICE",
    answers: ["fries", "chicken", "salmon"],
    correctAnswerIndex: 0,
    question: {
      text: "What food did Vikram order in the end?",
      hintMap: [],
      hints: [],
    },
    trackingProperties: {
      line_index: 42,
      challenge_type: "multiple-choice",
    },
    lang: "en",
    editor: { block_start_no: 114 },
  } satisfies StoryElement;

  assert.deepEqual(splitInterleavedPreviewPart([storyLine, challenge]), [
    [storyLine],
    [challenge],
  ]);
});

test("keeps Story Elements from the same source block together", () => {
  const first = storyElement({ block_start_no: 114 });
  const second = storyElement({ block_start_no: 114 });

  assert.deepEqual(splitInterleavedPreviewPart([first, second]), [
    [first, second],
  ]);
});

test("splits compound challenge elements by their parser source positions", () => {
  const prompt = {
    type: "CHALLENGE_PROMPT",
    prompt: { text: "Select the phrase", hintMap: [], hints: [] },
    trackingProperties: {
      line_index: 7,
      challenge_type: "select-phrases",
    },
    lang: "en",
    editor: { block_start_no: 20, start_no: 20 },
  } satisfies StoryElement;
  const storyLine = storyElement({ start_no: 22, end_no: 25 });
  const answers = {
    type: "SELECT_PHRASE",
    answers: ["one", "two"],
    correctAnswerIndex: 0,
    trackingProperties: {
      line_index: 7,
      challenge_type: "select-phrases",
    },
    lang: "el",
    editor: { start_no: 25, end_no: 28 },
  } satisfies StoryElement;

  assert.deepEqual(splitInterleavedPreviewPart([prompt, storyLine, answers]), [
    [prompt],
    [storyLine],
    [answers],
  ]);
  assert.equal(getInterleavedPreviewLineNumber([answers], 40), 25);
});

test("keeps compound challenge elements sharing a parser position together", () => {
  const storyLine = storyElement({ start_no: 22, end_no: 25 });
  const arrange = {
    type: "ARRANGE",
    characterPositions: [0],
    phraseOrder: [0],
    selectablePhrases: ["hello"],
    trackingProperties: { line_index: 7, challenge_type: "arrange" },
    lang: "el",
    editor: { start_no: 22, end_no: 25 },
  } satisfies StoryElement;

  assert.deepEqual(splitInterleavedPreviewPart([storyLine, arrange]), [
    [storyLine, arrange],
  ]);
});

test("keeps a CONTINUATION prompt with its Line and splits its answers", () => {
  const prompt = {
    type: "CHALLENGE_PROMPT",
    prompt: { text: "Complete the sentence", hintMap: [], hints: [] },
    trackingProperties: {
      line_index: 12,
      challenge_type: "continuation",
    },
    lang: "en",
    editor: { block_start_no: 131, start_no: 131 },
  } satisfies StoryElement;
  const storyLine = storyElement({ start_no: 133, end_no: 136 });
  const answers = {
    type: "MULTIPLE_CHOICE",
    answers: ["first", "second", "third"],
    correctAnswerIndex: 1,
    trackingProperties: {
      line_index: 12,
      challenge_type: "continuation",
    },
    lang: "nl",
    editor: { start_no: 136, end_no: 142 },
  } satisfies StoryElement;

  assert.deepEqual(splitInterleavedPreviewPart([prompt, storyLine, answers]), [
    [prompt, storyLine],
    [answers],
  ]);
});
