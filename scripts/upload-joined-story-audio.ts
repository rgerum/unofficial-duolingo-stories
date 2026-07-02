import dotenv from "dotenv";
import { put } from "@vercel/blob";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: ".env.local" });

type CliOptions = {
  course: string;
  inputDir: string;
  prefix: string;
  outputFile: string;
  limit?: number;
  dryRun: boolean;
  overwrite: boolean;
  cacheMaxAgeSeconds: number;
};

type CourseSummaryResult = {
  storyId: number;
  status: string;
  outputDir?: string;
  generatorVersion?: string;
  source?: {
    repo?: string;
    commit?: string;
    path?: string;
    sha256?: string;
  };
  durationMs?: number;
  segments?: number;
};

type CourseSummary = {
  course: string;
  generatedAt: string;
  total: number;
  ok: number;
  missingSource: number;
  failed: number;
  results: CourseSummaryResult[];
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:upload-joined -- --course da-en --input-dir tmp/story-audio/courses/da-en

Options:
  --course <short>                 Course short code, e.g. da-en
  --input-dir <dir>                Course audio output directory (default: tmp/story-audio/courses/<course>)
  --prefix <path>                  Blob key prefix (default: stitched-audio/v1)
  --output-file <path>             Upload summary file (default: <input-dir>/blob-upload-summary.json)
  --limit <number>                 Upload only the first N ok stories
  --dry-run                        Print planned uploads without writing to Blob
  --overwrite                      Replace existing deterministic Blob keys
  --cache-max-age-seconds <number> Blob cache max age (default: 31536000)
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

function parseCliOptions(args: string[]): CliOptions {
  let course = "";
  let inputDir: string | undefined;
  let prefix = "stitched-audio/v1";
  let outputFile: string | undefined;
  let limit: number | undefined;
  let dryRun = false;
  let overwrite = false;
  let cacheMaxAgeSeconds = 365 * 24 * 60 * 60;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--course") {
      course = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--input-dir") {
      inputDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--prefix") {
      prefix = takeValue(args, index, arg).replace(/^\/+|\/+$/g, "");
      index += 1;
      continue;
    }
    if (arg === "--output-file") {
      outputFile = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--limit") {
      limit = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--overwrite") {
      overwrite = true;
      continue;
    }
    if (arg === "--cache-max-age-seconds") {
      cacheMaxAgeSeconds = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!course) usage(1);
  const resolvedInputDir = path.resolve(
    inputDir ?? path.join("tmp", "story-audio", "courses", course),
  );

  return {
    course,
    inputDir: resolvedInputDir,
    prefix,
    outputFile: path.resolve(
      outputFile ?? path.join(resolvedInputDir, "blob-upload-summary.json"),
    ),
    limit,
    dryRun,
    overwrite,
    cacheMaxAgeSeconds,
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function fileHash(filePath: string) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

function blobStoryPrefix(options: CliOptions, storyId: number) {
  return `${options.prefix}/${options.course}/${storyId}`;
}

async function uploadFile({
  filePath,
  pathname,
  contentType,
  options,
}: {
  filePath: string;
  pathname: string;
  contentType: string;
  options: CliOptions;
}) {
  const buffer = await readFile(filePath);
  if (options.dryRun) {
    return {
      pathname,
      url: null,
      size: buffer.byteLength,
      uploaded: false,
    };
  }

  const result = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: options.overwrite,
    cacheControlMaxAge: options.cacheMaxAgeSeconds,
    contentType,
  });
  return {
    pathname: result.pathname,
    url: result.url,
    size: buffer.byteLength,
    uploaded: true,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const summaryPath = path.join(options.inputDir, "summary.json");
  const summary = await readJson<CourseSummary>(summaryPath);
  if (summary.course !== options.course) {
    throw new Error(
      `Summary course mismatch: expected ${options.course}, got ${summary.course}`,
    );
  }
  if (!options.dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }

  const stories = summary.results
    .filter((result) => result.status === "ok" && result.outputDir)
    .slice(0, options.limit);

  console.log(
    `${options.dryRun ? "Planning" : "Uploading"} ${stories.length} stitched ${options.course} stories to ${options.prefix}`,
  );

  const uploaded = [];
  for (const [index, story] of stories.entries()) {
    const sourceDir = path.resolve(story.outputDir!);
    const audioPath = path.join(sourceDir, "joined.m4a");
    const manifestPath = path.join(sourceDir, "joined.audio.json");
    const prefix = blobStoryPrefix(options, story.storyId);

    console.log(`[${index + 1}/${stories.length}] story ${story.storyId}`);
    const [audioHash, manifestHash] = await Promise.all([
      fileHash(audioPath),
      fileHash(manifestPath),
    ]);
    const [audio, manifest] = await Promise.all([
      uploadFile({
        filePath: audioPath,
        pathname: `${prefix}/joined.m4a`,
        contentType: "audio/mp4",
        options,
      }),
      uploadFile({
        filePath: manifestPath,
        pathname: `${prefix}/joined.audio.json`,
        contentType: "application/json; charset=utf-8",
        options,
      }),
    ]);

    uploaded.push({
      storyId: story.storyId,
      course: options.course,
      generatorVersion: story.generatorVersion,
      source: story.source,
      durationMs: story.durationMs,
      segments: story.segments,
      audio: {
        ...audio,
        sha256: audioHash,
      },
      manifest: {
        ...manifest,
        sha256: manifestHash,
      },
    });
  }

  const uploadSummary = {
    course: options.course,
    sourceSummary: path.relative(process.cwd(), summaryPath),
    uploadedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    overwrite: options.overwrite,
    prefix: options.prefix,
    total: uploaded.length,
    artifacts: uploaded,
  };

  await writeFile(options.outputFile, `${JSON.stringify(uploadSummary, null, 2)}\n`);
  console.log(`Wrote ${options.outputFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
