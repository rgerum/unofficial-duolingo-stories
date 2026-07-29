import assert from "node:assert/strict";
import test from "node:test";

import {
  findNextMatchingAlignedWord,
  keepLexicalAlignedWords,
  selectLatestSuccessfulStoryRuns,
  validateAlignmentAudioFile,
  validateAlignmentArtifactStoryIds,
  validateAlignmentStoryCoverage,
} from "./forced-alignment-safety";

test("saved audio timing is rejected after the story audio file changes", () => {
  assert.equal(
    validateAlignmentAudioFile({
      resultFilename: "old-line.mp3",
      manifestFilename: "old-line.mp3",
      currentFilename: "replacement-line.mp3",
    }),
    "current audio file changed",
  );
});

test("saved audio timing is rejected when its result names another audio file", () => {
  assert.equal(
    validateAlignmentAudioFile({
      resultFilename: "unexpected-line.mp3",
      manifestFilename: "line.mp3",
      currentFilename: "line.mp3",
    }),
    "result audio file differs from manifest",
  );
});

test("a story is rejected when an alignment result row is missing", () => {
  assert.equal(
    validateAlignmentStoryCoverage({
      resultIds: ["LINE-1-1"],
      manifestIds: ["LINE-1-1", "LINE-2-2"],
      currentIds: ["LINE-1-1", "LINE-2-2"],
    }),
    "result rows differ from manifest",
  );
});

test("a story is rejected when its current audio-backed rows changed", () => {
  assert.equal(
    validateAlignmentStoryCoverage({
      resultIds: ["LINE-1-1"],
      manifestIds: ["LINE-1-1"],
      currentIds: ["LINE-1-1", "LINE-2-2"],
    }),
    "current story rows differ from manifest",
  );
});

test("a failed later rerun prevents fallback to an older successful artifact", () => {
  assert.deepEqual(
    selectLatestSuccessfulStoryRuns([
      { storyId: 9103, status: "done", run: "old" },
      { storyId: 9103, status: "failed", run: "new" },
    ]),
    [],
  );
});

test("a mismatched aligner token is not accepted as a fallback match", () => {
  assert.equal(
    findNextMatchingAlignedWord(
      [{ normalized: "to", startMs: 100 }],
      "2",
      0,
    ),
    null,
  );
});

test("punctuation-only aligner segments are ignored before warning checks", () => {
  assert.deepEqual(
    keepLexicalAlignedWords([
      { word: "dig", normalized: "dig", startMs: 700 },
      { word: "…", normalized: "", startMs: 800 },
    ]),
    [{ word: "dig", normalized: "dig", startMs: 700 }],
  );
});

test("lexical aligner segments remain available to mismatch warnings", () => {
  assert.deepEqual(
    keepLexicalAlignedWords([
      { word: "dig", normalized: "dig", startMs: 700 },
      { word: "ekstra", normalized: "ekstra", startMs: 800 },
    ]),
    [
      { word: "dig", normalized: "dig", startMs: 700 },
      { word: "ekstra", normalized: "ekstra", startMs: 800 },
    ],
  );
});

test("a batch manifest for another story is rejected", () => {
  assert.equal(
    validateAlignmentArtifactStoryIds({
      expectedStoryId: 7799,
      manifestStoryId: 7800,
      resultsStoryId: 7799,
    }),
    "manifest story ID differs from batch story",
  );
});

test("an alignment result file for another story is rejected", () => {
  assert.equal(
    validateAlignmentArtifactStoryIds({
      expectedStoryId: 7799,
      manifestStoryId: 7799,
      resultsStoryId: 7800,
    }),
    "results story ID differs from batch story",
  );
});
