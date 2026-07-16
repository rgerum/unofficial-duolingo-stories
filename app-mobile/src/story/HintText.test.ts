import { describe, expect, test } from "vitest";
import { buildHintTextTokens } from "./HintTextTokens";

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
