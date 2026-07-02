import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

type CliOptions = {
  courses: string[];
  all: boolean;
  upload: boolean;
  overwrite: boolean;
  force: boolean;
  dryRun: boolean;
  dryRunUpload: boolean;
  concurrency: number;
  limitCourses?: number;
  contentRepoDir: string;
  outRoot: string;
};

type CourseSummary = {
  course: string;
  ok: number;
  missingSource: number;
  failed: number;
};

type UploadSummary = {
  dryRun: boolean;
  total: number;
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:run-courses -- --course da-en --upload --overwrite
  pnpm audio:run-courses -- --all --upload --overwrite

Options:
  --course <short>        Course to process. Can be repeated.
  --all                   Process all courses from Convex sidebar
  --upload                Upload generated artifacts to Vercel Blob
  --overwrite             Forward --overwrite to upload
  --force                 Re-run even when local upload summary is complete
  --dry-run               Print commands without running them
  --dry-run-upload        Forward --dry-run to upload
  --concurrency <number>  Per-course story generation concurrency (default: 2)
  --limit-courses <num>   Process only the first N selected courses
  --content-repo-dir <dir> Content repo checkout (default: tmp/story-content)
  --out-root <dir>        Course audio output root (default: tmp/story-audio/courses)
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
  const courses: string[] = [];
  let all = false;
  let upload = false;
  let overwrite = false;
  let force = false;
  let dryRun = false;
  let dryRunUpload = false;
  let concurrency = 2;
  let limitCourses: number | undefined;
  let contentRepoDir = path.join("tmp", "story-content");
  let outRoot = path.join("tmp", "story-audio", "courses");

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--course") {
      courses.push(takeValue(args, index, arg));
      index += 1;
      continue;
    }
    if (arg === "--all") {
      all = true;
      continue;
    }
    if (arg === "--upload") {
      upload = true;
      continue;
    }
    if (arg === "--overwrite") {
      overwrite = true;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--dry-run-upload") {
      dryRunUpload = true;
      continue;
    }
    if (arg === "--concurrency") {
      concurrency = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--limit-courses") {
      limitCourses = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--content-repo-dir") {
      contentRepoDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--out-root") {
      outRoot = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!all && courses.length === 0) usage(1);

  return {
    courses,
    all,
    upload,
    overwrite,
    force,
    dryRun,
    dryRunUpload,
    concurrency,
    limitCourses,
    contentRepoDir: path.resolve(contentRepoDir),
    outRoot: path.resolve(outRoot),
  };
}

async function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  }
  return new ConvexHttpClient(url);
}

async function listAllCourses() {
  const sidebar = await (await getClient()).query(api.editorRead.getEditorSidebarData, {});
  return (sidebar.courses ?? [])
    .map((course) => course.short)
    .filter((short): short is string => Boolean(short))
    .sort();
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  if (!existsSync(filePath)) return undefined;
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function isCourseComplete(course: string, options: CliOptions) {
  const courseDir = path.join(options.outRoot, course);
  const summary = await readJson<CourseSummary>(path.join(courseDir, "summary.json"));
  if (!summary) return false;
  const generated =
    summary.course === course &&
    summary.failed === 0 &&
    summary.missingSource === 0;
  if (!generated) return false;
  if (!options.upload) return true;

  const uploadSummary = await readJson<UploadSummary>(
    path.join(courseDir, "blob-upload-summary.json"),
  );
  return (
    uploadSummary !== undefined &&
    uploadSummary.dryRun === false &&
    uploadSummary.total === summary.ok
  );
}

function runCommand(command: string, args: string[], dryRun: boolean) {
  const printable = [command, ...args].join(" ");
  if (dryRun) {
    console.log(`[dry-run] ${printable}`);
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${printable} failed with exit code ${code}`));
    });
  });
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const selectedCourses = options.all ? await listAllCourses() : options.courses;
  const courses = Array.from(new Set(selectedCourses)).slice(0, options.limitCourses);
  const runReport = [];

  console.log(`Selected ${courses.length} course(s).`);
  for (const [index, course] of courses.entries()) {
    const outDir = path.join(options.outRoot, course);
    const complete = !options.force && (await isCourseComplete(course, options));
    if (complete) {
      console.log(`[${index + 1}/${courses.length}] ${course}: already complete`);
      runReport.push({ course, status: "skipped_complete" });
      continue;
    }

    console.log(`[${index + 1}/${courses.length}] ${course}: generating`);
    await runCommand(
      "pnpm",
      [
        "audio:join-course",
        "--",
        "--course",
        course,
        "--sync-content-repo",
        "--content-repo-dir",
        options.contentRepoDir,
        "--out-dir",
        outDir,
        "--concurrency",
        String(options.concurrency),
      ],
      options.dryRun,
    );

    if (options.upload) {
      console.log(`[${index + 1}/${courses.length}] ${course}: uploading`);
      await runCommand(
        "pnpm",
        [
          "audio:upload-joined",
          "--",
          "--course",
          course,
          "--input-dir",
          outDir,
          ...(options.overwrite ? ["--overwrite"] : []),
          ...(options.dryRunUpload ? ["--dry-run"] : []),
        ],
        options.dryRun,
      );
    }

    runReport.push({ course, status: "processed", uploaded: options.upload });
  }

  const reportPath = path.join(options.outRoot, "run-summary.json");
  if (!options.dryRun) {
    await writeFile(
      reportPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          upload: options.upload,
          overwrite: options.overwrite,
          force: options.force,
          courses: runReport,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Wrote ${reportPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
