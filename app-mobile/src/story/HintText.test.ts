import { describe, expect, test } from "vitest";
import { buildHintTextTokens } from "./HintTextTokens";
import {
  buildUnderlineSegments,
  splitNativeTokenParts,
  UNDERLINE_HINT_EDGE_INSET,
} from "./HintTextUnderline";

const content = {
  text: "alpha beta gamma",
  hintMap: [],
};

describe("buildHintTextTokens", () => {
  test("does not dim text when no line audio is currently playing", () => {
    const tokens = buildHintTextTokens({
      content,
      audioRange: undefined,
      showHints: true,
    });

    expect(tokens.map((token) => token.dimmed)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  test("dims text only while an audio range is active", () => {
    const tokens = buildHintTextTokens({
      content,
      audioRange: 7,
      showHints: true,
    });

    expect(tokens.map((token) => [token.text, token.dimmed])).toEqual([
      ["alpha", false],
      [" ", false],
      ["beta", false],
      [" ", true],
      ["gamma", true],
    ]);
  });
});

describe("native hint underlines", () => {
  test("splits hinted native text at word-joiner boundaries", () => {
    const parts = splitNativeTokenParts({
      token: {
        text: "wasi\u2060pim",
        start: 0,
        hidden: false,
        revealed: false,
        dimmed: false,
        hint: { translation: "restaurant" },
        hintGroupKey: "hint:0:7:0",
      },
      displayText: "wasi\u2060pim",
      shouldSplitIntoGraphemes: false,
      splitIntoGraphemes: (text) => [text],
    });

    expect(
      parts.map((part) => ({
        text: part.text,
        hint: Boolean(part.hint),
        group: part.underlineGroupKey,
      })),
    ).toEqual([
      { text: "wasi", hint: true, group: "hint:0:7:0:0" },
      { text: "\u2060", hint: false, group: undefined },
      { text: "pim", hint: true, group: "hint:0:7:0:1" },
    ]);
  });

  test("keeps a visible gap between adjacent hinted native underline pieces", () => {
    const underlines = buildUnderlineSegments({
      computedSegments: [
        hintedSegment({ key: "wasi", x: 100, width: 80, group: "hint:0" }),
        {
          ...hintedSegment({
            key: "joiner",
            x: 180,
            width: 0,
            group: undefined,
          }),
          text: "\u2060",
          hint: undefined,
        },
        hintedSegment({ key: "pim", x: 180, width: 60, group: "hint:1" }),
      ],
      colors: { border: "#ccd6dd", hiddenUnderline: "#ccd6dd" },
    });

    expect(underlines).toHaveLength(2);
    expect(underlines[1]!.x1 - underlines[0]!.x2).toBe(
      UNDERLINE_HINT_EDGE_INSET * 2,
    );
  });

  test("keeps hidden challenge native underline pieces continuous", () => {
    const underlines = buildUnderlineSegments({
      computedSegments: [
        hiddenSegment({ key: "first", x: 100, width: 80 }),
        hiddenSegment({ key: "second", x: 180, width: 60 }),
      ],
      colors: { border: "#ccd6dd", hiddenUnderline: "#ccd6dd" },
    });

    expect(underlines).toHaveLength(1);
    expect(underlines[0]).toMatchObject({
      x1: 102,
      x2: 238,
      dotted: false,
    });
  });
});

function hintedSegment({
  key,
  x,
  width,
  group,
}: {
  key: string;
  x: number;
  width: number;
  group?: string;
}) {
  return {
    key,
    start: 0,
    x,
    y: 0,
    width,
    height: 40,
    ascender: 30,
    descender: 10,
    text: key,
    hidden: false,
    revealed: false,
    hint: { translation: "restaurant" },
    tokenKey: key,
    underlineGroupKey: group,
  };
}

function hiddenSegment({
  key,
  x,
  width,
}: {
  key: string;
  x: number;
  width: number;
}) {
  return {
    ...hintedSegment({ key, x, width, group: "hidden:0:10" }),
    hidden: true,
    hint: undefined,
  };
}
