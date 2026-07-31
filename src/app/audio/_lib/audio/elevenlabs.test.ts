import assert from "node:assert/strict";
import test from "node:test";

import { parseElevenLabsMessage } from "@/app/audio/_lib/audio/elevenlabs";

test("parses current ElevenLabs snake_case completion and alignment fields", () => {
  assert.deepEqual(
    parseElevenLabsMessage(
      JSON.stringify({
        audio: "YXVkaW8=",
        is_final: true,
        alignment: {
          chars: ["H", "i"],
          char_start_times_ms: [0, 25],
        },
      }),
    ),
    {
      audio: "YXVkaW8=",
      isFinal: true,
      alignment: [
        ["H", 0],
        ["i", 25],
      ],
    },
  );
});

test("continues to parse legacy ElevenLabs camelCase fields", () => {
  assert.deepEqual(
    parseElevenLabsMessage(
      JSON.stringify({
        isFinal: false,
        alignment: {
          chars: ["A"],
          charStartTimesMs: [10],
        },
      }),
    ),
    {
      audio: undefined,
      isFinal: false,
      alignment: [["A", 10]],
    },
  );
});

test("parses ElevenLabs error frames instead of leaving generation pending", () => {
  assert.deepEqual(
    parseElevenLabsMessage(
      JSON.stringify({ error: "voice_id_does_not_exist" }),
    ),
    {
      audio: undefined,
      isFinal: false,
      alignment: [],
      error: "voice_id_does_not_exist",
    },
  );
});
