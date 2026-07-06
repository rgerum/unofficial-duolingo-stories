import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type { Audio } from "@/components/editor/story/syntax_parser_types";

const PUBLIC_BLOB_BASE_URL =
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/";

type AudioCheckItem = {
  url: string | null;
};

export type StoryAudioProblemCheckResult = {
  audioProblemCount: 0 | 1;
  expectedAudioCount: number;
  missingAudioCount: number;
  checkedUrlCount: number;
  failedUrlCount: number;
};

function getAudioUrl(audio: Audio | undefined) {
  if (!audio?.url) return null;
  if (audio.url.startsWith("blob:") || audio.url.startsWith("http")) {
    return audio.url;
  }
  return `${PUBLIC_BLOB_BASE_URL}${audio.url}`;
}

export function collectStoryLineAudioUrls(story: StoryType): (string | null)[] {
  const items: AudioCheckItem[] = [];
  for (const element of story.elements) {
    if (element.type === "HEADER") {
      items.push({ url: getAudioUrl(element.audio) });
      continue;
    }
    if (element.type === "LINE") {
      items.push({
        url: getAudioUrl(element.line.content.audio ?? element.audio),
      });
    }
  }
  return items.map((item) => item.url);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function canLoadAudioUrl(url: string) {
  try {
    const headResponse = await fetchWithTimeout(
      url,
      { method: "HEAD", cache: "no-store" },
      10_000,
    );
    if (headResponse.ok) return true;
    if (headResponse.status !== 405 && headResponse.status !== 501) {
      return false;
    }
  } catch {
    // Fall back to a tiny GET; some object stores do not support HEAD/CORS HEAD.
  }

  try {
    const getResponse = await fetchWithTimeout(
      url,
      {
        method: "GET",
        cache: "no-store",
        headers: { Range: "bytes=0-0" },
      },
      10_000,
    );
    return getResponse.ok;
  } catch {
    return false;
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
) {
  const results: R[] = new Array(values.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(values[currentIndex]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export async function checkStoryLineAudio(
  story: StoryType,
): Promise<StoryAudioProblemCheckResult> {
  const urls = collectStoryLineAudioUrls(story);
  const missingAudioCount = urls.filter((url) => !url).length;
  const uniqueUrls = [
    ...new Set(urls.filter((url): url is string => Boolean(url))),
  ];
  const loadResults = await mapWithConcurrency(uniqueUrls, 8, canLoadAudioUrl);
  const failedUrlCount = loadResults.filter((ok) => !ok).length;

  return {
    audioProblemCount: missingAudioCount > 0 || failedUrlCount > 0 ? 1 : 0,
    expectedAudioCount: urls.length,
    missingAudioCount,
    checkedUrlCount: uniqueUrls.length,
    failedUrlCount,
  };
}
