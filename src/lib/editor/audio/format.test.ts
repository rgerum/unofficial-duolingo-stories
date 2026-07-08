import assert from "node:assert/strict";
import test from "node:test";

import {
  clamp,
  formatSeconds,
  getErrorMessage,
  getFileBaseName,
} from "@/lib/editor/audio/format";

test("formatSeconds handles zero", () => {
  assert.equal(formatSeconds(0), "00:00.000");
});

test("formatSeconds handles sub-minute values", () => {
  assert.equal(formatSeconds(12.345), "00:12.345");
});

test("formatSeconds handles values over a minute", () => {
  assert.equal(formatSeconds(75.5), "01:15.500");
});

test("formatSeconds rounds fractional milliseconds", () => {
  assert.equal(formatSeconds(0.0006), "00:00.001");
});

test("formatSeconds clamps negatives to zero", () => {
  assert.equal(formatSeconds(-5), "00:00.000");
});

test("clamp returns the min when below range", () => {
  assert.equal(clamp(-3, 0, 10), 0);
});

test("clamp returns the value when within range", () => {
  assert.equal(clamp(4, 0, 10), 4);
});

test("clamp returns the max when above range", () => {
  assert.equal(clamp(42, 0, 10), 10);
});

test("getFileBaseName strips a single extension", () => {
  assert.equal(getFileBaseName("song.mp3"), "song");
});

test("getFileBaseName returns the name unchanged without an extension", () => {
  assert.equal(getFileBaseName("song"), "song");
});

test("getFileBaseName only strips the last extension of dotted names", () => {
  assert.equal(getFileBaseName("my.song.mp3"), "my.song");
});

test("getFileBaseName keeps leading-dot names intact", () => {
  assert.equal(getFileBaseName(".hidden"), ".hidden");
});

test("getErrorMessage uses the Error message when present", () => {
  assert.equal(getErrorMessage(new Error("boom"), "fallback"), "boom");
});

test("getErrorMessage falls back for an empty Error message", () => {
  assert.equal(getErrorMessage(new Error(""), "fallback"), "fallback");
});

test("getErrorMessage falls back for non-Error values", () => {
  assert.equal(getErrorMessage("nope", "fallback"), "fallback");
});
