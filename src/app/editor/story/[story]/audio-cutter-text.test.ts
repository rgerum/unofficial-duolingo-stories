import assert from "node:assert/strict";
import test from "node:test";
import {
  getGraphemeLength,
  getTranscriptWordTokens,
} from "./audio-cutter-text";

test("keeps Devanagari combining marks with their word token", () => {
  const text = "सुप्रभात, प्रीती!";
  const tokens = getTranscriptWordTokens(text);

  assert.deepEqual(
    tokens.map((token) => token.text),
    ["सुप्रभात", "प्रीती"],
  );
  assert.deepEqual(
    tokens.map(({ start, end }) => text.slice(start, end)),
    ["सुप्रभात", "प्रीती"],
  );
});

test("counts Devanagari grapheme clusters instead of code points", () => {
  assert.equal(getGraphemeLength("सुप्रभात"), 4);
});
