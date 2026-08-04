import assert from "node:assert/strict";
import test from "node:test";

import { analyzeCourseVocabulary, tokenizeWords } from "./course-vocabulary";

test("tokenizeWords handles Danish letters, apostrophes, and case", () => {
  assert.deepEqual(tokenizeWords("Æble, æble! blåbær og Mads' cykel."), [
    "æble",
    "æble",
    "blåbær",
    "og",
    "mads",
    "cykel",
  ]);
});

test("analyzeCourseVocabulary tracks new and cumulative words by story", () => {
  const analysis = analyzeCourseVocabulary([
    { id: 1, name: "One", setId: 1, setIndex: 1, lines: ["Hej verden"] },
    {
      id: 2,
      name: "Two",
      setId: 1,
      setIndex: 2,
      lines: ["Hej igen, verden!"],
    },
  ]);

  assert.equal(analysis.totalWordCount, 5);
  assert.equal(analysis.uniqueWordCount, 3);
  assert.deepEqual(analysis.stories[0]?.newWords, ["hej", "verden"]);
  assert.deepEqual(analysis.stories[1]?.newWords, ["igen"]);
  assert.deepEqual(
    analysis.stories.map((story) => story.cumulativeUniqueWords),
    [2, 3],
  );
});
