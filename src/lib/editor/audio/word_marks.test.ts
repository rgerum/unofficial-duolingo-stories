import assert from "node:assert/strict";
import test from "node:test";

import {
  applyWordMarkTimeOverrides,
  getActiveWordMarkIndex,
  getApproximateWordMarks,
  getApproximateWordPlaybackRange,
} from "@/lib/editor/audio/word_marks";
import type { Segment } from "@/lib/editor/audio/segments";

const segment: Segment = { id: "s", start: 0, end: 10, skipRanges: [] };

test("getApproximateWordMarks returns one ascending mark per word", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  assert.equal(marks.length, 2);
  assert.ok(marks[0]!.time < marks[1]!.time);
  // Marks fall within the segment bounds (expressed in milliseconds).
  for (const mark of marks) {
    assert.ok(mark.time >= segment.start * 1000);
    assert.ok(mark.time <= segment.end * 1000);
    assert.equal(mark.type, "word");
  }
  // Character offsets point back into the source text.
  assert.equal(marks[0]!.value, "hello");
  assert.equal(marks[1]!.value, "world");
});

test("getApproximateWordMarks yields no marks for empty text", () => {
  assert.deepEqual(getApproximateWordMarks("   ", segment), []);
  assert.deepEqual(getApproximateWordMarks("", segment), []);
});

test("getApproximateWordPlaybackRange stays within segment bounds", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  const first = getApproximateWordPlaybackRange(segment, marks, 0);
  const second = getApproximateWordPlaybackRange(segment, marks, 1);
  assert.ok(first);
  assert.ok(second);
  assert.ok(first!.startSeconds >= segment.start);
  assert.ok(second!.endSeconds <= segment.end);
});

test("getApproximateWordPlaybackRange produces non-overlapping consecutive ranges", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  const first = getApproximateWordPlaybackRange(segment, marks, 0);
  const second = getApproximateWordPlaybackRange(segment, marks, 1);
  assert.ok(first!.startSeconds < first!.endSeconds);
  assert.ok(second!.startSeconds < second!.endSeconds);
  assert.ok(first!.endSeconds <= second!.startSeconds);
});

test("getApproximateWordPlaybackRange returns null for an out-of-range index", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  assert.equal(getApproximateWordPlaybackRange(segment, marks, 5), null);
});

test("applyWordMarkTimeOverrides returns the input unchanged when there are no marks", () => {
  assert.deepEqual(applyWordMarkTimeOverrides([], undefined, segment), []);
});

test("applyWordMarkTimeOverrides keeps in-bounds marks ascending", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  const adjusted = applyWordMarkTimeOverrides(marks, undefined, segment);
  assert.equal(adjusted.length, marks.length);
  assert.ok(adjusted[0]!.time <= adjusted[1]!.time);
  for (const mark of adjusted) {
    assert.ok(mark.time >= segment.start * 1000);
    assert.ok(mark.time <= segment.end * 1000);
  }
});

test("applyWordMarkTimeOverrides clamps an override within the allowed window", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  // Push the first mark far past the second; it must stay below the gap limit.
  const adjusted = applyWordMarkTimeOverrides(marks, [9000, 5000], segment);
  assert.ok(adjusted[0]!.time <= adjusted[1]!.time);
});

test("getActiveWordMarkIndex finds the mark covering the current time", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  assert.equal(getActiveWordMarkIndex(segment, marks, 0), 0);
  assert.equal(getActiveWordMarkIndex(segment, marks, 6), 1);
});

test("getActiveWordMarkIndex returns -1 outside the segment bounds", () => {
  const marks = getApproximateWordMarks("hello world", segment);
  assert.equal(getActiveWordMarkIndex(segment, marks, -1), -1);
  assert.equal(getActiveWordMarkIndex(segment, marks, 11), -1);
});
