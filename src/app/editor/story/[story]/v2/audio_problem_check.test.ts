import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import {
  checkStoryLineAudio,
  collectStoryLineAudioUrls,
} from "./audio_problem_check";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function storyWithAudioUrls(urls: (string | undefined)[]): StoryType {
  return {
    elements: urls.map((url, index) => ({
      type: "LINE",
      line: {
        type: "PROSE",
        content: {
          text: `Line ${index}`,
          hintMap: [],
          audio: {
            ssml: {
              text: `Line ${index}`,
              speaker: "Speaker",
              id: 1,
              inser_index: index,
            },
            url,
            keypoints: [],
          },
        },
      },
      trackingProperties: { line_index: index + 1 },
      lang: "en",
      editor: {},
    })),
  } as StoryType;
}

test("collectStoryLineAudioUrls resolves relative blob audio paths", () => {
  assert.deepEqual(
    collectStoryLineAudioUrls(storyWithAudioUrls(["audio/1/example.mp3"])),
    [
      "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/audio/1/example.mp3",
    ],
  );
});

test("checkStoryLineAudio reports missing audio references", async () => {
  globalThis.fetch = async () => new Response(null, { status: 200 });

  const result = await checkStoryLineAudio(storyWithAudioUrls([undefined]));

  assert.equal(result.audioProblemCount, 1);
  assert.equal(result.expectedAudioCount, 1);
  assert.equal(result.missingAudioCount, 1);
  assert.equal(result.checkedUrlCount, 0);
});

test("checkStoryLineAudio reports failed audio URLs", async () => {
  globalThis.fetch = async () => new Response(null, { status: 404 });

  const result = await checkStoryLineAudio(
    storyWithAudioUrls(["https://example.com/missing.mp3"]),
  );

  assert.equal(result.audioProblemCount, 1);
  assert.equal(result.failedUrlCount, 1);
});

test("checkStoryLineAudio falls back to GET when HEAD is unsupported", async () => {
  const calls: string[] = [];
  globalThis.fetch = async (_url, init) => {
    calls.push(init?.method ?? "GET");
    if (init?.method === "HEAD") {
      return new Response(null, { status: 405 });
    }
    return new Response(null, { status: 206 });
  };

  const result = await checkStoryLineAudio(
    storyWithAudioUrls(["https://example.com/audio.mp3"]),
  );

  assert.equal(result.audioProblemCount, 0);
  assert.deepEqual(calls, ["HEAD", "GET"]);
});

test("checkStoryLineAudio falls back to GET when HEAD throws a TypeError", async () => {
  const calls: string[] = [];
  globalThis.fetch = async (_url, init) => {
    calls.push(init?.method ?? "GET");
    if (init?.method === "HEAD") {
      throw new TypeError("HEAD request blocked");
    }
    return new Response(null, { status: 206 });
  };

  const result = await checkStoryLineAudio(
    storyWithAudioUrls(["https://example.com/audio.mp3"]),
  );

  assert.equal(result.audioProblemCount, 0);
  assert.deepEqual(calls, ["HEAD", "GET"]);
});
