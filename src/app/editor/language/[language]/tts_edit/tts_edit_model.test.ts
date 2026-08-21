import assert from "node:assert/strict";
import test from "node:test";
import { formatTestVoice } from "./tts_edit_model";

test("keeps the selected voice unchanged at the default prosody", () => {
  assert.equal(formatTestVoice("nl-NL-FennaNeural", 2, 2), "nl-NL-FennaNeural");
});

test("adds pitch and rate modifiers to pronunciation test voices", () => {
  assert.equal(
    formatTestVoice("nl-NL-FennaNeural", 1, 3),
    "nl-NL-FennaNeural(pitch=low, rate=fast)",
  );
  assert.equal(
    formatTestVoice("nl-NL-FennaNeural", 4, 2),
    "nl-NL-FennaNeural(pitch=x-high)",
  );
  assert.equal(
    formatTestVoice("nl-NL-FennaNeural", 2, 0),
    "nl-NL-FennaNeural(rate=x-slow)",
  );
});
