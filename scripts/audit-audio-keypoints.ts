import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

const execFileAsync = promisify(execFile);

const AUDIO_BASE = "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/";
const DEFAULT_OUTPUT_PATH = "tmp/audio-keypoint-audit.json";

type Args = {
  course: string;
  output: string;
  limit: number;
  publicOnly: boolean;
  toleranceMs: number;
};

type Keypoint = {
  audioStart: number;
  rangeEnd: number;
};

type AuditIssue = {
  storyId: number;
  storyName: string;
  lineIndex: number;
  text: string;
  audioUrl: string;
  durationMs: number;
  maxAudioStart: number;
  badCount: number;
  keypoints: Keypoint[];
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    course: process.env.AUDIO_KEYPOINT_AUDIT_COURSE ?? "da-en",
    output: process.env.AUDIO_KEYPOINT_AUDIT_OUTPUT ?? DEFAULT_OUTPUT_PATH,
    limit: Number(process.env.AUDIO_KEYPOINT_AUDIT_LIMIT ?? "0"),
    publicOnly: parseBooleanEnv(
      process.env.AUDIO_KEYPOINT_AUDIT_PUBLIC_ONLY,
      true,
    ),
    toleranceMs: Number(process.env.AUDIO_KEYPOINT_AUDIT_TOLERANCE_MS ?? "50"),
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--") continue;
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--course" && next) {
      parsed.course = next;
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = next;
      index += 1;
      continue;
    }
    if (arg === "--limit" && next) {
      parsed.limit = Number(next);
      index += 1;
      continue;
    }
    if (arg === "--tolerance-ms" && next) {
      parsed.toleranceMs = Number(next);
      index += 1;
      continue;
    }
    if (arg === "--all") {
      parsed.publicOnly = false;
      continue;
    }

    console.error(`Unknown or incomplete argument: ${arg}`);
    printHelp();
    process.exit(1);
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: pnpm audit:audio-keypoints [options]

Scans story audio keypoints and reports rows whose word timestamps exceed the
actual audio duration. Requires ffprobe in PATH.

Options:
  --course <id>          Course identifier or legacy id. Default: da-en
  --output <path>        JSON output path. Default: ${DEFAULT_OUTPUT_PATH}
  --limit <n>            Limit stories scanned. Default: 0 (no limit)
  --tolerance-ms <n>     Allowed timestamp overrun. Default: 50
  --all                  Include private/unpublished stories

Env:
  AUDIO_KEYPOINT_AUDIT_CONVEX_URL overrides NEXT_PUBLIC_CONVEX_URL/CONVEX_URL
  AUDIO_KEYPOINT_AUDIT_CONCURRENCY defaults to 8
`);
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () =>
      runWorker(),
    ),
  );
  return results;
}

function resolveConvexUrl() {
  return (
    process.env.AUDIO_KEYPOINT_AUDIT_CONVEX_URL ??
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL
  );
}

function resolveAudioUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${AUDIO_BASE}${url.replace(/^\/+/, "")}`;
}

function getElementAudio(element: any) {
  if (element.type === "HEADER") return element.audio;
  if (element.type === "LINE") return element.line?.content?.audio ?? element.audio;
  return null;
}

function getElementText(element: any) {
  if (element.type === "HEADER") {
    return element.learningLanguageTitleContent?.text ?? element.title ?? "";
  }
  if (element.type === "LINE") return element.line?.content?.text ?? "";
  return "";
}

async function getDurationMs(url: string) {
  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      url,
    ],
    { timeout: 20_000, maxBuffer: 1024 * 1024 },
  );
  const seconds = Number(stdout.trim());
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
}

function getBadKeypoints(
  keypoints: Keypoint[],
  durationMs: number,
  toleranceMs: number,
) {
  return keypoints.filter(
    (point) =>
      Number.isFinite(point.audioStart) &&
      point.audioStart > durationMs + toleranceMs,
  );
}

async function main() {
  const args = parseArgs();
  const convexUrl = resolveConvexUrl();
  const concurrency = Number(
    process.env.AUDIO_KEYPOINT_AUDIT_CONCURRENCY ?? "8",
  );

  if (!convexUrl) {
    console.error(
      "Error: AUDIO_KEYPOINT_AUDIT_CONVEX_URL/NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.",
    );
    process.exit(1);
  }
  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    console.error("Error: AUDIO_KEYPOINT_AUDIT_CONCURRENCY must be positive.");
    process.exit(1);
  }
  if (!Number.isFinite(args.limit) || args.limit < 0) {
    console.error("Error: --limit must be zero or a positive number.");
    process.exit(1);
  }
  if (!Number.isFinite(args.toleranceMs) || args.toleranceMs < 0) {
    console.error("Error: --tolerance-ms must be zero or a positive number.");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  const stories = await client.query(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    { identifier: args.course },
  );
  const publicFiltered = args.publicOnly
    ? stories.filter((story) => story.public)
    : stories;
  const selected =
    args.limit > 0 ? publicFiltered.slice(0, args.limit) : publicFiltered;

  console.log(
    `Scanning ${selected.length}/${stories.length} ${args.publicOnly ? "public " : ""}stories for course ${args.course} with concurrency ${concurrency}...`,
  );

  const issues: AuditIssue[] = [];
  let checkedAudio = 0;

  await mapWithConcurrency(selected, concurrency, async (story, index) => {
    if (index > 0 && index % 20 === 0) {
      console.log(`Checked stories ${index}/${selected.length}...`);
    }

    const detail = await client.query(api.storyRead.getStoryByLegacyId, {
      storyId: story.id,
    });
    if (!detail) return;

    for (const element of detail.elements ?? []) {
      if (element.type !== "HEADER" && element.type !== "LINE") continue;

      const audio = getElementAudio(element);
      const keypoints = (audio?.keypoints ?? []) as Keypoint[];
      if (!audio?.url || keypoints.length === 0) continue;

      const audioUrl = resolveAudioUrl(audio.url);
      let durationMs = 0;

      try {
        durationMs = await getDurationMs(audioUrl);
      } catch (error) {
        console.error(
          `ffprobe failed story=${story.id} audio=${audio.url}`,
          error instanceof Error ? error.message : error,
        );
        continue;
      }

      checkedAudio += 1;
      const bad = getBadKeypoints(keypoints, durationMs, args.toleranceMs);
      if (bad.length === 0) continue;
      const audioStarts = keypoints
        .map((point) => point.audioStart)
        .filter(Number.isFinite);

      issues.push({
        storyId: story.id,
        storyName: story.name,
        lineIndex: element.trackingProperties?.line_index ?? 0,
        text: getElementText(element),
        audioUrl: audio.url,
        durationMs,
        maxAudioStart: Math.max(...audioStarts),
        badCount: bad.length,
        keypoints,
      });
    }
  });

  issues.sort(
    (a, b) =>
      b.maxAudioStart -
      b.durationMs -
      (a.maxAudioStart - a.durationMs),
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    convexUrl,
    course: args.course,
    publicOnly: args.publicOnly,
    toleranceMs: args.toleranceMs,
    scannedStories: selected.length,
    checkedAudio,
    issueCount: issues.length,
    affectedStories: new Set(issues.map((issue) => issue.storyId)).size,
    issues,
  };

  await mkdir(dirname(args.output), { recursive: true });
  await writeFile(args.output, JSON.stringify(summary, null, 2) + "\n", "utf8");

  console.log("\n=== Audio Keypoint Audit Summary ===");
  console.log(`Stories scanned: ${summary.scannedStories}`);
  console.log(`Audio rows checked: ${summary.checkedAudio}`);
  console.log(`Rows with timestamps after audio end: ${summary.issueCount}`);
  console.log(`Affected stories: ${summary.affectedStories}`);
  console.log(`Results saved to ${args.output}`);

  if (issues.length > 0) {
    console.log("\nWorst rows:");
    for (const issue of issues.slice(0, 20)) {
      console.log(
        `- story=${issue.storyId} line=${issue.lineIndex} duration=${issue.durationMs}ms max=${issue.maxAudioStart}ms bad=${issue.badCount} name=${JSON.stringify(issue.storyName)}`,
      );
    }
  }
}

main().catch((error) => {
  console.error("Audio keypoint audit failed:");
  console.error(error);
  process.exit(1);
});
