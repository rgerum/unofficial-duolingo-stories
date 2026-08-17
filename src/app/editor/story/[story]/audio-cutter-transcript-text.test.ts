import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AudioMark } from "@/app/audio/_lib/audio/types";
import type { ContentWithHints } from "@/components/editor/story/syntax_parser_types";
import { renderTranscriptContent } from "./audio-cutter-transcript-text";

function render(
  content: ContentWithHints,
  marks: AudioMark[] = [],
  activeWordIndex = -1,
) {
  return renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      renderTranscriptContent(content, marks, activeWordIndex),
    ),
  );
}

function mark(start: number, end: number, time: number): AudioMark {
  return { start, end, time, type: "word", value: "" } as AudioMark;
}

test("renders the plain text when the line has no hints", () => {
  const html = render({ text: "Hej med dig", hintMap: [] });

  assert.equal(html, "Hej med dig");
});

test("stacks the translation below the hinted words", () => {
  const html = render({
    text: "Hej med dig",
    hintMap: [{ hintIndex: 0, rangeFrom: 4, rangeTo: 10 }],
    hints: ["with you"],
    lang_hints: "en",
  });

  assert.match(html, /^Hej /, "text before the hint stays inline");
  assert.match(
    html,
    /inline-flex flex-col/,
    "the hinted words become a column",
  );
  assert.match(html, />med dig</, "the hinted words are kept together");
  assert.match(html, /with you/, "the translation is rendered");
  assert.match(
    html,
    /italic leading-snug opacity-50 en/,
    "hint uses lang_hints",
  );
});

test("renders the pronunciation hint below the translation", () => {
  const html = render({
    text: "你好",
    hintMap: [{ hintIndex: 0, rangeFrom: 0, rangeTo: 1 }],
    hints: ["hello"],
    hints_pronunciation: ["nǐ hǎo"],
  });

  assert.match(html, /hello/);
  assert.match(html, /nǐ hǎo/);
});

test("keeps word playback buttons inside hinted words", () => {
  const html = render(
    {
      text: "Hej med dig",
      hintMap: [{ hintIndex: 0, rangeFrom: 4, rangeTo: 10 }],
      hints: ["with you"],
    },
    [mark(0, 3, 0), mark(4, 7, 500), mark(8, 11, 900)],
    1,
  );

  assert.equal(
    (html.match(/<button/g) ?? []).length,
    3,
    "every word stays clickable",
  );
  assert.match(
    html,
    /bg-\[#0f5f83\][^>]*>med</,
    "the active word is highlighted inside the hint column",
  );
});

test("does not duplicate text when a word mark crosses a hint boundary", () => {
  const content: ContentWithHints = {
    text: "Hej med dig",
    hintMap: [{ hintIndex: 0, rangeFrom: 4, rangeTo: 10 }],
    hints: ["with you"],
  };
  const html = render(content, [mark(0, 7, 0), mark(8, 11, 900)], -1);
  const textOnly = html.replace(/<[^>]*>/g, "");

  // The source text stays intact and in order; only the hint is appended after
  // the words it belongs to.
  assert.equal(textOnly, "Hej med digwith you");
});
