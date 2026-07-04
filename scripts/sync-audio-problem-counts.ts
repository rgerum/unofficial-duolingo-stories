import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type CliOptions = {
  inputDir: string;
  courses: string[];
  apply: boolean;
  identity: string;
};

type CourseSummary = {
  course: string;
  missingSource: number;
  failed: number;
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:sync-problem-counts -- --course da-en --course ca-en --apply

Options:
  --input-dir <dir>   Course summary root (default: tmp/story-audio/courses)
  --course <short>    Course to sync. Can be repeated. Defaults to all summaries.
  --apply             Apply to Convex. Without this, print the payload only.
  --identity <json>   Convex run identity (default: {"role":"admin","userId":1})
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
  let identity = JSON.stringify({ role: "admin", userId: 1 });

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

async function readCourseSummary(inputDir: string, course: string) {
  const summaryPath = path.join(inputDir, course, "summary.json");
  const summary = JSON.parse(await readFile(summaryPath, "utf8")) as CourseSummary;
  return {
    courseShort: course,
    audioProblemCount: (summary.missingSource ?? 0) + (summary.failed ?? 0),
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

  const counts = [];
  const skipped = [];
  for (const course of selectedCourses) {
    if (!existsSync(path.join(options.inputDir, course, "summary.json"))) {
      skipped.push(course);
      continue;
    }
    try {
      counts.push(await readCourseSummary(options.inputDir, course));
    } catch (error) {
      skipped.push(course);
      console.error(
        `Skipping ${course}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const payload = { counts };
  console.log(JSON.stringify({ ...payload, skipped }, null, 2));

  if (!options.apply) return;
  if (counts.length === 0) {
    console.log("No counts to apply.");
    return;
  }

  await runCommand("pnpm", [
    "convex",
    "run",
    "courseWrite:setAudioProblemCounts",
    JSON.stringify(payload),
    "--identity",
    options.identity,
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
