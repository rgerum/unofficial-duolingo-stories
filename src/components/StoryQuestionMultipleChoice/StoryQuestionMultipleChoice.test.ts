import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { StoryElementMultipleChoice } from "@/components/editor/story/syntax_parser_types";
import StoryQuestionMultipleChoice from "./StoryQuestionMultipleChoice";

const hintedContent = {
  text: "desayuno",
  hintMap: [{ hintIndex: 0, rangeFrom: 0, rangeTo: 7 }],
  hints: ["breakfast"],
};

test("expands question answer hints when inline translations are enabled", () => {
  const element: StoryElementMultipleChoice = {
    type: "MULTIPLE_CHOICE",
    answers: [hintedContent],
    correctAnswerIndex: 0,
    question: { ...hintedContent, text: "pregunta" },
    trackingProperties: {
      line_index: 0,
      challenge_type: "multiple-choice",
    },
    lang: "es",
    editor: {},
  };

  const html = renderToStaticMarkup(
    React.createElement(StoryQuestionMultipleChoice, {
      element,
      active: false,
      advance: () => {},
      showTranslationsInline: true,
    }),
  );

  assert.doesNotMatch(html, /data-hint-tooltip/);
  assert.equal(html.match(/group\/editorhint/g)?.length, 2);
});

test("compacts answer spacing only when requested by an embedded preview", () => {
  const element: StoryElementMultipleChoice = {
    type: "MULTIPLE_CHOICE",
    answers: ["fries", "chicken"],
    correctAnswerIndex: 0,
    question: { text: "What did they order?", hintMap: [], hints: [] },
    trackingProperties: {
      line_index: 0,
      challenge_type: "multiple-choice",
    },
    lang: "en",
    editor: {},
  };
  const props = {
    element,
    active: false,
    advance: () => {},
  };

  const regularHtml = renderToStaticMarkup(
    React.createElement(StoryQuestionMultipleChoice, props),
  );
  const compactHtml = renderToStaticMarkup(
    React.createElement(StoryQuestionMultipleChoice, {
      ...props,
      compact: true,
    }),
  );

  assert.match(regularHtml, /my-5/);
  assert.match(regularHtml, /h-\[42px\]/);
  assert.doesNotMatch(regularHtml, /my-1\.5/);
  assert.match(compactHtml, /my-1\.5/);
  assert.match(compactHtml, /h-8/);
});
