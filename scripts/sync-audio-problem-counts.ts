import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type CliOptions = {
  inputDir: string;
  courses: string[];
  apply: boolean;
  identity: string | null;
  prod: boolean;
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

type StoryMetadata = {
  legacyId: number;
  missing?: boolean;
  public?: boolean;
  deleted?: boolean;
  courseShort?: string | null;
};

type FilteredStory = {
  course: string;
  storyId: number;
  status: "ok" | "missing_source" | "failed";
  reason: string;
};

type CourseProblemPayload = {
  course: CourseAudioProblemCount;
  stories: StoryAudioProblemCount[];
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:sync-problem-counts -- --course da-en --course ca-en --apply --prod

Options:
  --input-dir <dir>   Course summary root (default: tmp/story-audio/courses)
  --course <short>    Course to sync. Can be repeated. Defaults to all summaries.
  --apply             Apply to Convex. Without this, print the payload only.
  --identity <json>   Convex run identity. Required with --apply.
  --prod              Target the production Convex deployment.
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
  let prod = false;

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
    if (arg === "--prod") {
      prod = true;
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
    prod,
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
  return parseCourseSummary(
    JSON.parse(await readFile(summaryPath, "utf8")),
  );
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

function runCommandOutput(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

function parseJsonOutput<T>(stdout: string): T {
  const trimmed = stdout.trim();
  const candidateStarts = [...trimmed.matchAll(/[\[{]/g)].map(
    (match) => match.index,
  );
  if (candidateStarts.length === 0) {
    throw new Error("Convex command did not print JSON.");
  }

  for (const jsonStart of candidateStarts) {
    if (jsonStart === undefined) continue;
    const jsonEnd = findJsonEnd(trimmed, jsonStart);
    if (jsonEnd === null) continue;
    try {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd)) as T;
    } catch {
      // Keep scanning; leading log output can contain bracket-like text.
    }
  }

  throw new Error("Convex command did not print valid JSON.");
}

function findJsonEnd(text: string, start: number) {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      stack.push("}");
      continue;
    }
    if (char === "[") {
      stack.push("]");
      continue;
    }
    if (char === "}" || char === "]") {
      if (stack.pop() !== char) return null;
      if (stack.length === 0) return index + 1;
    }
  }

  return null;
}

async function readStoryMetadata(storyIds: number[], prod: boolean) {
  const metadata = new Map<number, StoryMetadata>();
  const uniqueStoryIds = [...new Set(storyIds)].sort((left, right) => left - right);
  const batchSize = 400;

  for (let index = 0; index < uniqueStoryIds.length; index += batchSize) {
    const batch = uniqueStoryIds.slice(index, index + batchSize);
    const query = `const ids = ${JSON.stringify(batch)};
const out = [];
for (const id of ids) {
  const story = await ctx.db
    .query("stories")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .unique();
  if (!story) {
    out.push({ legacyId: id, missing: true });
    continue;
  }
  const course = await ctx.db.get(story.courseId);
  out.push({
    legacyId: story.legacyId,
    public: !!story.public,
    deleted: !!story.deleted,
    courseShort: course?.short ?? null,
  });
}
return out;`;
    const args = ["convex", "run"];
    if (prod) {
      args.push("--prod");
    }
    args.push("--inline-query", query);
    const stdout = await runCommandOutput("pnpm", args);
    for (const story of parseJsonOutput<StoryMetadata[]>(stdout)) {
      metadata.set(story.legacyId, story);
    }
  }

  return metadata;
}

function filterReason(metadata: StoryMetadata | undefined, course: string) {
  if (!metadata || metadata.missing) return "missing-prod-story";
  if (metadata.deleted) return "deleted";
  if (!metadata.public) return "private";
  if (metadata.courseShort !== course) return `course-mismatch:${metadata.courseShort}`;
  return null;
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

  const summaries: Array<{ course: string; summary: CourseSummary }> = [];
  const skipped = [];
  for (const course of selectedCourses) {
    if (!existsSync(path.join(options.inputDir, course, "summary.json"))) {
      skipped.push(course);
      continue;
    }
    try {
      const summary = await readCourseSummary(options.inputDir, course);
      summaries.push({ course, summary });
    } catch (error) {
      skipped.push(course);
      console.error(
        `Skipping ${course}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const storyMetadata = await readStoryMetadata(
    summaries.flatMap(({ summary }) => summary.results.map((result) => result.storyId)),
    options.prod,
  );
  const coursePayloads: CourseProblemPayload[] = [];
  const filtered: FilteredStory[] = [];

  for (const { course, summary } of summaries) {
    let audioProblemCount = 0;
    const courseStories: StoryAudioProblemCount[] = [];
    for (const result of summary.results) {
      const metadata = storyMetadata.get(result.storyId);
      const reason = filterReason(metadata, course);
      if (reason) {
        filtered.push({
          course,
          storyId: result.storyId,
          status: result.status,
          reason,
        });
        if (metadata && !metadata.missing) {
          courseStories.push({
            legacyStoryId: result.storyId,
            audioProblemCount: 0,
          });
        }
        continue;
      }

      const storyAudioProblemCount = result.status === "ok" ? 0 : 1;
      audioProblemCount += storyAudioProblemCount;
      courseStories.push({
        legacyStoryId: result.storyId,
        audioProblemCount: storyAudioProblemCount,
      });
    }
    coursePayloads.push({
      course: {
        courseShort: course,
        audioProblemCount,
      },
      stories: courseStories,
    });
  }

  const counts = coursePayloads.map((entry) => entry.course);
  const stories = coursePayloads.flatMap((entry) => entry.stories);
  const payload = { counts, stories };
  console.log(
    JSON.stringify(
      {
        ...payload,
        skipped,
        filtered,
        filteredCount: filtered.length,
      },
      null,
      2,
    ),
  );

  if (!options.apply) return;
  if (!options.identity) {
    throw new Error("--identity is required when using --apply.");
  }
  if (counts.length === 0) {
    console.log("No counts to apply.");
    return;
  }

  const operationKey = `audio-problem-counts:${Date.now()}`;
  const chunkSize = 20;
  for (let index = 0; index < coursePayloads.length; index += chunkSize) {
    const chunk = coursePayloads.slice(index, index + chunkSize);
    const chunkPayload = {
      operationKey: `${operationKey}:${Math.floor(index / chunkSize) + 1}`,
      counts: chunk.map((entry) => entry.course),
      stories: chunk.flatMap((entry) => entry.stories),
    };
    console.log(
      `Applying chunk ${Math.floor(index / chunkSize) + 1}/${Math.ceil(
        coursePayloads.length / chunkSize,
      )}: courses=${chunkPayload.counts.length} stories=${chunkPayload.stories.length}`,
    );
    const args = ["convex", "run"];
    if (options.prod) {
      args.push("--prod");
    }
    args.push(
      "courseWrite:setAudioProblemCounts",
      JSON.stringify(chunkPayload),
      "--identity",
      options.identity,
    );
    await runCommand("pnpm", args);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
