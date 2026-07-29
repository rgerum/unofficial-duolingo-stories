import assert from "node:assert/strict";
import test from "node:test";

import { getAlignmentText, normalizeAlignmentWord } from "./forced-alignment-text";

test("alignment text folds accents unsupported by the aligner vocabulary", () => {
  assert.equal(getAlignmentText("Åh... og dét er et problem?"), "ah og det er et problem");
});

test("alignment normalization preserves Danish letter transliteration", () => {
  assert.equal(normalizeAlignmentWord("RØDGRØD"), "rodgrod");
  assert.equal(normalizeAlignmentWord("æble"), "aeble");
});
