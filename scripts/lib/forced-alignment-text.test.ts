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

test("Danish alignment text expands a spoken digit", () => {
  assert.equal(
    getAlignmentText('Vi skal se "Rumvikingerne 2"!', "da"),
    "vi skal se rumvikingerne to",
  );
});

test("digit expansion is scoped to the alignment language", () => {
  assert.equal(getAlignmentText("Level 2", "en"), "level 2");
});
