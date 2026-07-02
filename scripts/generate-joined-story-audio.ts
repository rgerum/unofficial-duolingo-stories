import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { processStoryFile } from "../src/components/editor/story/syntax_parser_new";
import type {
  Audio,
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "../src/components/editor/story/syntax_parser_types";

const BLOB_BASE_URL =
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com";

type CliOptions = {
  storyFile: string;
  outDir: string;
  storyId: number;
  fromLanguage: string;
  learningLanguage: string;
  gapMs: number;
  silenceThreshold: string;
  silenceDurationSeconds: number;
  bitrate: string;
  sampleRate: number;
  normalize: boolean;
  keepTemp: boolean;
};

type SpokenSegment = {
  partIndex: number;
  elementIndex: number;
  kind: "header" | "line";
  text: string;
  audio: Audio;
};

type GeneratedSegment = {
  index: number;
  partIndex: number;
  elementIndex: number;
  kind: "header" | "line";
  text: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  originalAudioUrl: string;
  originalAudioPath: string;
  trimmedAudioPath: string;
  trim: {
    leadingMs: number;
    trailingMs: number;
    originalDurationMs: number;
    trimmedDurationMs: number;
  };
  keypoints: { rangeEnd: number; startMs: number }[];
};

type JoinedStoryAudioManifest = {
  version: 1;
  storyId: number;
  sourceStoryFile: string;
  generatedAt: string;
  audio: {
    filename: string;
    codec: "aac-lc";
    container: "m4a";
    bitrate: string;
    sampleRate: number;
    channels: 1;
  };
  options: {
    gapMs: number;
    silenceThreshold: string;
    silenceDurationSeconds: number;
    normalize: boolean;
  };
  durationMs: number;
  segments: GeneratedSegment[];
};

type SilenceEvent = {
  start: number;
  end?: number;
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:join-story -- --story-file database/stories/test-en/1_1_es-en-buenos-dias.txt

Options:
  --out-dir <dir>                  Output directory (default: tmp/story-audio/<story-file-name>)
  --story-id <number>              Numeric parser story id (default: stable hash of story path)
  --from-language <code>           Parser from-language code (default: en)
  --learning-language <code>       Parser learning-language code (default: es)
  --gap-ms <number>                Silence between lines (default: 800)
  --silence-threshold <ffmpeg dB>  silencedetect threshold (default: -45dB)
  --silence-duration <seconds>     Minimum silence duration (default: 0.05)
  --bitrate <ffmpeg bitrate>       AAC output bitrate (default: 96k)
  --sample-rate <number>           Output sample rate (default: 44100)
  --no-normalize                   Disable loudnorm on each line
  --keep-temp                      Keep ffmpeg concat list and silence WAV
`);
  process.exit(exitCode);
}

function takeValue(args: string[], index: number, name: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}.`);
  }
  return value;
}

function parsePositiveInteger(value: string, name: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function parsePositiveNumber(value: string, name: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return parsed;
}

function stableStoryId(storyFile: string) {
  const hash = createHash("sha1").update(storyFile).digest("hex").slice(0, 8);
  return Number.parseInt(hash, 16);
}

function parseCliOptions(args: string[]): CliOptions {
  let storyFile: string | undefined;
  let outDir: string | undefined;
  let storyId: number | undefined;
  let fromLanguage = "en";
  let learningLanguage = "es";
  let gapMs = 800;
  let silenceThreshold = "-45dB";
  let silenceDurationSeconds = 0.05;
  let bitrate = "96k";
  let sampleRate = 44100;
  let normalize = true;
  let keepTemp = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--story-file") {
      storyFile = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--out-dir") {
      outDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--story-id") {
      storyId = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--from-language") {
      fromLanguage = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--learning-language") {
      learningLanguage = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--gap-ms") {
      gapMs = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--silence-threshold") {
      silenceThreshold = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--silence-duration") {
      silenceDurationSeconds = parsePositiveNumber(
        takeValue(args, index, arg),
        arg,
      );
      index += 1;
      continue;
    }
    if (arg === "--bitrate") {
      bitrate = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--sample-rate") {
      sampleRate = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--no-normalize") {
      normalize = false;
      continue;
    }
    if (arg === "--keep-temp") {
      keepTemp = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!storyFile) usage(1);
  const absoluteStoryFile = path.resolve(storyFile);
  const defaultOutDir = path.join(
    "tmp",
    "story-audio",
    path.basename(storyFile, path.extname(storyFile)),
  );

  return {
    storyFile: absoluteStoryFile,
    outDir: path.resolve(outDir ?? defaultOutDir),
    storyId: storyId ?? stableStoryId(absoluteStoryFile),
    fromLanguage,
    learningLanguage,
    gapMs,
    silenceThreshold,
    silenceDurationSeconds,
    bitrate,
    sampleRate,
    normalize,
    keepTemp,
  };
}

function runCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code}\n${stderr}`,
        ),
      );
    });
  });
}

async function ensureTool(name: string) {
  try {
    await runCommand(name, ["-version"]);
  } catch (error) {
    throw new Error(
      `${name} is required to generate joined audio. Install ffmpeg and try again.\n${String(error)}`,
    );
  }
}

function resolveAudioUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BLOB_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

function filenameFromUrl(url: string, index: number) {
  const parsed = new URL(resolveAudioUrl(url));
  const extension = path.extname(parsed.pathname) || ".mp3";
  return `${String(index).padStart(3, "0")}-original${extension}`;
}

async function downloadFile(url: string, outputPath: string) {
  if (existsSync(outputPath)) return;

  const response = await fetch(resolveAudioUrl(url));
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function probeDurationSeconds(filePath: string) {
  const { stdout } = await runCommand("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration for ${filePath}`);
  }
  return duration;
}

function parseSilenceEvents(stderr: string): SilenceEvent[] {
  const events: SilenceEvent[] = [];
  for (const line of stderr.split("\n")) {
    const start = line.match(/silence_start:\s*([0-9.]+)/);
    if (start) {
      events.push({ start: Number(start[1]) });
      continue;
    }

    const end = line.match(/silence_end:\s*([0-9.]+)/);
    if (end && events.length > 0) {
      events[events.length - 1].end = Number(end[1]);
    }
  }
  return events.filter((event) => Number.isFinite(event.start));
}

async function detectTrimSeconds(
  inputPath: string,
  durationSeconds: number,
  options: Pick<CliOptions, "silenceThreshold" | "silenceDurationSeconds">,
) {
  const { stderr } = await runCommand("ffmpeg", [
    "-hide_banner",
    "-i",
    inputPath,
    "-af",
    `silencedetect=noise=${options.silenceThreshold}:d=${options.silenceDurationSeconds}`,
    "-f",
    "null",
    "-",
  ]);
  const events = parseSilenceEvents(stderr);

  let leadingSeconds = 0;
  const first = events[0];
  if (first && first.start <= 0.001 && first.end !== undefined) {
    leadingSeconds = Math.min(first.end, durationSeconds);
  }

  let trailingSeconds = 0;
  const last = events.at(-1);
  if (last) {
    const silenceEnd = last.end ?? durationSeconds;
    if (Math.abs(silenceEnd - durationSeconds) <= 0.08) {
      trailingSeconds = Math.max(0, durationSeconds - last.start);
    }
  }

  if (leadingSeconds + trailingSeconds > durationSeconds - 0.1) {
    return { leadingSeconds: 0, trailingSeconds: 0 };
  }

  return { leadingSeconds, trailingSeconds };
}

async function trimAndNormalizeAudio(
  inputPath: string,
  outputPath: string,
  durationSeconds: number,
  leadingSeconds: number,
  trailingSeconds: number,
  options: Pick<CliOptions, "normalize" | "sampleRate">,
) {
  const endSeconds = Math.max(
    leadingSeconds + 0.1,
    durationSeconds - trailingSeconds,
  );
  const filters = [
    `atrim=start=${leadingSeconds.toFixed(3)}:end=${endSeconds.toFixed(3)}`,
    "asetpts=PTS-STARTPTS",
  ];
  if (options.normalize) {
    filters.push("loudnorm=I=-18:TP=-1.5:LRA=11");
  }

  await runCommand("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    inputPath,
    "-af",
    filters.join(","),
    "-ar",
    String(options.sampleRate),
    "-ac",
    "1",
    outputPath,
  ]);

}

function getPartKind(parts: StoryElement[]) {
  const lastPart = parts[parts.length - 1];
  if (parts[0].type === "HEADER") return "header";
  if (parts[0].trackingProperties?.challenge_type === "arrange")
    return "arrange";
  if (lastPart.type === "POINT_TO_PHRASE") return "point-to-phrase";
  if (
    lastPart.type === "MULTIPLE_CHOICE" &&
    lastPart.trackingProperties.challenge_type === "multiple-choice"
  )
    return "multiple-choice";
  if (parts[0].trackingProperties?.challenge_type === "continuation")
    return "continuation";
  if (parts[0].trackingProperties?.challenge_type === "select-phrases")
    return "select-phrases";
  if (parts[0].trackingProperties?.challenge_type === "match") return "match";
  return "line";
}

function getParts(elements: StoryElement[]) {
  const parts: StoryElement[][] = [];
  let lastId = -1;
  for (const element of elements) {
    if (element.trackingProperties === undefined) continue;
    if (lastId !== element.trackingProperties.line_index) {
      parts.push([]);
      lastId = element.trackingProperties.line_index;
    }
    if (
      element.type === "MULTIPLE_CHOICE" &&
      (parts.at(-1)?.length ?? 0) > 1 &&
      element.trackingProperties.challenge_type === "multiple-choice"
    ) {
      parts.push([]);
    }
    parts[parts.length - 1].push(element);
  }
  return parts;
}

function audioForHeader(element: StoryElementHeader) {
  return element.audio ?? element.learningLanguageTitleContent.audio;
}

function audioForLine(element: StoryElementLine) {
  return element.audio ?? element.line.content.audio;
}

function textForLine(element: StoryElementLine) {
  return element.line.content.text;
}

function selectListeningSegment(parts: StoryElement[], partIndex: number) {
  const kind = getPartKind(parts);
  if (kind === "match") return undefined;

  if (kind === "header") {
    const header = parts[0] as StoryElementHeader;
    const audio = audioForHeader(header);
    if (!audio?.url) return undefined;
    return {
      partIndex,
      elementIndex: 0,
      kind: "header",
      text: header.learningLanguageTitleContent.text,
      audio,
    } satisfies SpokenSegment;
  }

  const line = parts.find(
    (element): element is StoryElementLine => element.type === "LINE",
  );
  if (!line) return undefined;
  const audio = audioForLine(line);
  if (!audio?.url) return undefined;

  return {
    partIndex,
    elementIndex: parts.indexOf(line),
    kind: "line",
    text: textForLine(line),
    audio,
  } satisfies SpokenSegment;
}

function keypointsForSegment(
  audio: Audio,
  segmentStartMs: number,
  leadingTrimMs: number,
) {
  return (audio.keypoints ?? []).map((keypoint) => ({
    rangeEnd: keypoint.rangeEnd,
    startMs: Math.max(
      segmentStartMs,
      Math.round(segmentStartMs + keypoint.audioStart - leadingTrimMs),
    ),
  }));
}

function escapeConcatPath(filePath: string) {
  return filePath.replace(/'/g, "'\\''");
}

async function createSilenceFile(filePath: string, options: CliOptions) {
  await runCommand("ffmpeg", [
    "-hide_banner",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=${options.sampleRate}:cl=mono`,
    "-t",
    (options.gapMs / 1000).toFixed(3),
    "-ar",
    String(options.sampleRate),
    "-ac",
    "1",
    filePath,
  ]);
}

async function concatenateAudio(
  trimmedPaths: string[],
  outputPath: string,
  workDir: string,
  options: CliOptions,
) {
  const listPath = path.join(workDir, "concat-list.txt");
  const silencePath = path.join(workDir, "gap.wav");
  if (options.gapMs > 0 && trimmedPaths.length > 1) {
    await createSilenceFile(silencePath, options);
  }

  const listLines: string[] = [];
  trimmedPaths.forEach((trimmedPath, index) => {
    listLines.push(`file '${escapeConcatPath(trimmedPath)}'`);
    if (options.gapMs > 0 && index < trimmedPaths.length - 1) {
      listLines.push(`file '${escapeConcatPath(silencePath)}'`);
    }
  });
  await writeFile(listPath, `${listLines.join("\n")}\n`);

  await runCommand("ffmpeg", [
    "-hide_banner",
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c:a",
    "aac",
    "-b:a",
    options.bitrate,
    "-ar",
    String(options.sampleRate),
    "-ac",
    "1",
    "-movflags",
    "+faststart",
    outputPath,
  ]);

  if (!options.keepTemp) {
    await rm(listPath, { force: true });
    await rm(silencePath, { force: true });
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  await ensureTool("ffmpeg");
  await ensureTool("ffprobe");

  const storyText = await readFile(options.storyFile, "utf8");
  const [story] = processStoryFile(
    storyText,
    options.storyId,
    {},
    {
      from_language: options.fromLanguage,
      learning_language: options.learningLanguage,
    },
    "",
  );
  const parts = getParts(story.elements);
  const spokenSegments = parts
    .map((part, partIndex) => selectListeningSegment(part, partIndex))
    .filter((segment): segment is SpokenSegment => Boolean(segment));

  if (spokenSegments.length === 0) {
    throw new Error("No spoken story segments with audio URLs were found.");
  }

  const partsDir = path.join(options.outDir, "parts");
  await mkdir(partsDir, { recursive: true });

  const generatedSegments: GeneratedSegment[] = [];
  const trimmedPaths: string[] = [];
  let cursorMs = 0;

  for (const [index, segment] of spokenSegments.entries()) {
    const originalPath = path.join(partsDir, filenameFromUrl(segment.audio.url!, index));
    const trimmedPath = path.join(
      partsDir,
      `${String(index).padStart(3, "0")}-trimmed.wav`,
    );
    const originalUrl = resolveAudioUrl(segment.audio.url!);

    console.log(
      `Processing ${index + 1}/${spokenSegments.length}: part ${segment.partIndex} ${segment.kind}`,
    );
    await downloadFile(segment.audio.url!, originalPath);

    const originalDurationSeconds = await probeDurationSeconds(originalPath);
    const trim = await detectTrimSeconds(originalPath, originalDurationSeconds, options);
    await trimAndNormalizeAudio(
      originalPath,
      trimmedPath,
      originalDurationSeconds,
      trim.leadingSeconds,
      trim.trailingSeconds,
      options,
    );

    const trimmedDurationMs = Math.round(
      (await probeDurationSeconds(trimmedPath)) * 1000,
    );
    const startMs = cursorMs;
    const endMs = startMs + trimmedDurationMs;
    const leadingMs = Math.round(trim.leadingSeconds * 1000);
    const trailingMs = Math.round(trim.trailingSeconds * 1000);

    generatedSegments.push({
      index,
      partIndex: segment.partIndex,
      elementIndex: segment.elementIndex,
      kind: segment.kind,
      text: segment.text,
      startMs,
      endMs,
      durationMs: trimmedDurationMs,
      originalAudioUrl: originalUrl,
      originalAudioPath: path.relative(options.outDir, originalPath),
      trimmedAudioPath: path.relative(options.outDir, trimmedPath),
      trim: {
        leadingMs,
        trailingMs,
        originalDurationMs: Math.round(originalDurationSeconds * 1000),
        trimmedDurationMs,
      },
      keypoints: keypointsForSegment(segment.audio, startMs, leadingMs),
    });

    trimmedPaths.push(trimmedPath);
    cursorMs = endMs + (index < spokenSegments.length - 1 ? options.gapMs : 0);
  }

  const audioFilename = "joined.m4a";
  const outputAudioPath = path.join(options.outDir, audioFilename);
  await concatenateAudio(trimmedPaths, outputAudioPath, options.outDir, options);
  const joinedDurationMs = Math.round(
    (await probeDurationSeconds(outputAudioPath)) * 1000,
  );

  const manifest: JoinedStoryAudioManifest = {
    version: 1,
    storyId: options.storyId,
    sourceStoryFile: path.relative(process.cwd(), options.storyFile),
    generatedAt: new Date().toISOString(),
    audio: {
      filename: audioFilename,
      codec: "aac-lc",
      container: "m4a",
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      channels: 1,
    },
    options: {
      gapMs: options.gapMs,
      silenceThreshold: options.silenceThreshold,
      silenceDurationSeconds: options.silenceDurationSeconds,
      normalize: options.normalize,
    },
    durationMs: joinedDurationMs,
    segments: generatedSegments,
  };

  await writeFile(
    path.join(options.outDir, "joined.audio.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`\nWrote ${outputAudioPath}`);
  console.log(`Wrote ${path.join(options.outDir, "joined.audio.json")}`);
  console.log(
    `Segments: ${generatedSegments.length}, duration: ${(joinedDurationMs / 1000).toFixed(2)}s`,
  );

  // Keep parts/*.wav and originals for inspection; only concat helper files are
  // deleted unless --keep-temp is passed.
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
