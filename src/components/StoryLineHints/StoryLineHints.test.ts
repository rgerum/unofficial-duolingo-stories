import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StoryLineHints from "./StoryLineHints";

test("inline hint segments keep multi-word phrases together", () => {
  const html = renderToStaticMarkup(
    React.createElement(StoryLineHints, {
      content: {
        text: "Ancha k acham",
        hintMap: [{ hintIndex: 0, rangeFrom: 0, rangeTo: 12 }],
        hints: ["bonita es"],
      },
      showTranslationsInline: true,
    }),
  );

  assert.match(
    html,
    /my-0\.5 inline-flex grow flex-col whitespace-nowrap/,
    "the complete hint segment should not wrap internally",
  );
  assert.match(
    html,
    /<span class="whitespace-nowrap"><span class="select-text">Ancha<\/span><span class="select-text"> <\/span><span class="select-text">k<\/span><span class="select-text"> <\/span><span class="select-text">acham<\/span><\/span>/,
    "the source phrase should be one flex row",
  );
});
