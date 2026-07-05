import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type CliOptions = {
  inputDir: string;
  courses: string[];
  apply: boolean;
  identity: string | null;
};

type CourseSummary = {
  course: string;
  missingSource: number;
  failed: number;
  results: Array<{
    storyId: number;
    status: "ok" | "missing_source" | "failed";
  }>;
};

type CourseAudioProblemCount = {
  courseShort: string;
  audioProblemCount: number;
};

type StoryAudioProblemCount = {
  legacyStoryId: number;
  audioProblemCount: number;
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:sync-problem-counts -- --course da-en --course ca-en --apply

Options:
  --input-dir <dir>   Course summary root (default: tmp/story-audio/courses)
  --course <short>    Course to sync. Can be repeated. Defaults to all summaries.
  --apply             Apply to Convex. Without this, print the payload only.
  --identity <json>   Convex run identity. Required with --apply.
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

function parseCliOptions(args: string[]): CliOptions {
  const courses: string[] = [];
  let inputDir = path.join("tmp", "story-audio", "courses");
  let apply = false;
  let identity: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--input-dir") {
      inputDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--course") {
      courses.push(takeValue(args, index, arg));
      index += 1;
      continue;
    }
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--identity") {
      identity = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    inputDir: path.resolve(inputDir),
    courses,
    apply,
    identity,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNonNegativeInteger(
  value: unknown,
  field: string,
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function parseCourseSummary(raw: unknown): CourseSummary {
  if (!isRecord(raw)) {
    throw new Error("summary must be an object.");
  }
  if (typeof raw.course !== "string" || raw.course.length === 0) {
    throw new Error("summary.course must be a non-empty string.");
  }
  assertNonNegativeInteger(raw.missingSource, "summary.missingSource");
  assertNonNegativeInteger(raw.failed, "summary.failed");
  if (!Array.isArray(raw.results)) {
    throw new Error("summary.results must be an array.");
  }

  const missingSource = raw.missingSource;
  const failed = raw.failed;
  return {
    course: raw.course,
    missingSource,
    failed,
    results: raw.results.map((entry, index) => {
      if (!isRecord(entry)) {
        throw new Error(`summary.results[${index}] must be an object.`);
      }
      const storyId = entry.storyId;
      assertNonNegativeInteger(storyId, `summary.results[${index}].storyId`);
      if (
        entry.status !== "ok" &&
        entry.status !== "missing_source" &&
        entry.status !== "failed"
      ) {
        throw new Error(
          `summary.results[${index}].status must be ok, missing_source, or failed.`,
        );
      }
      return {
        storyId,
        status: entry.status,
      };
    }),
  };
}

async function readCourseSummary(inputDir: string, course: string) {
  const summaryPath = path.join(inputDir, course, "summary.json");
  const summary = parseCourseSummary(
    JSON.parse(await readFile(summaryPath, "utf8")),
  );
  return {
    course: {
      courseShort: course,
      audioProblemCount: (summary.missingSource ?? 0) + (summary.failed ?? 0),
    },
    stories: (summary.results ?? []).map((result) => ({
      legacyStoryId: result.storyId,
      audioProblemCount: result.status === "ok" ? 0 : 1,
    })),
  };
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const selectedCourses =
    options.courses.length > 0
      ? options.courses
      : (await readdir(options.inputDir, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort();

  const counts: CourseAudioProblemCount[] = [];
  const stories: StoryAudioProblemCount[] = [];
  const skipped = [];
  for (const course of selectedCourses) {
    if (!existsSync(path.join(options.inputDir, course, "summary.json"))) {
      skipped.push(course);
      continue;
    }
    try {
      const summary = await readCourseSummary(options.inputDir, course);
      counts.push(summary.course);
      stories.push(...summary.stories);
    } catch (error) {
      skipped.push(course);
      console.error(
        `Skipping ${course}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const payload = { counts, stories };
  console.log(JSON.stringify({ ...payload, skipped }, null, 2));

  if (!options.apply) return;
  if (!options.identity) {
    throw new Error("--identity is required when using --apply.");
  }
  if (counts.length === 0) {
    console.log("No counts to apply.");
    return;
  }

  const operationKey = `audio-problem-counts:${Date.now()}`;
  await runCommand("pnpm", [
    "convex",
    "run",
    "courseWrite:setAudioProblemCounts",
    JSON.stringify({ ...payload, operationKey }),
    "--identity",
    options.identity,
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
