import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

type StorySummary = {
  id: number;
  name: string;
  public: boolean;
  set_id: number;
  set_index: number;
};

type CourseSummary = {
  id: number;
  short: string;
};

type CliOptions = {
  course: string;
  contentRoot: string;
  contentRepoUrl: string;
  contentRepoDir: string;
  syncContentRepo: boolean;
  outDir: string;
  limit?: number;
  concurrency: number;
  gapMs: number;
  materializeFromConvex: boolean;
  sourceOutDir: string;
};

type SourceMetadata = {
  repo?: string;
  commit?: string;
  path?: string;
  sha256: string;
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:join-course -- --course da-en --sync-content-repo

Options:
  --course <short>                 Course short code, e.g. da-en
  --content-root <dir>             Directory containing course folders (default: database/stories)
  --content-repo-url <url>         Content repo URL (default: https://github.com/rgerum/unofficial-duolingo-stories-content.git)
  --content-repo-dir <dir>         Content repo checkout directory (default: tmp/story-content)
  --sync-content-repo              Clone or pull the content repo before processing
  --out-dir <dir>                  Output directory (default: tmp/story-audio/courses/<course>)
  --limit <number>                 Process only the first N published stories
  --concurrency <number>           Number of stories to process at once (default: 2)
  --gap-ms <number>                Silence between lines, forwarded to audio:join-story (default: 800)
  --materialize-from-convex        Fetch missing story text into tmp/story-source/<course>
  --source-out-dir <dir>           Materialized source directory (default: tmp/story-source/<course>)
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
  let contentRoot = "database/stories";
  let contentRepoUrl =
    "https://github.com/rgerum/unofficial-duolingo-stories-content.git";
  let contentRepoDir = path.join("tmp", "story-content");
  let syncContentRepo = false;
  let outDir: string | undefined;
  let limit: number | undefined;
  let concurrency = 2;
  let gapMs = 800;
  let materializeFromConvex = false;
  let sourceOutDir: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--course") {
      course = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--content-root") {
      contentRoot = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--content-repo-url") {
      contentRepoUrl = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--content-repo-dir") {
      contentRepoDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--sync-content-repo") {
      syncContentRepo = true;
      continue;
    }
    if (arg === "--out-dir") {
      outDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--limit") {
      limit = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--concurrency") {
      concurrency = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--gap-ms") {
      gapMs = parsePositiveInteger(takeValue(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg === "--materialize-from-convex") {
      materializeFromConvex = true;
      continue;
    }
    if (arg === "--source-out-dir") {
      sourceOutDir = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!course) usage(1);

  const resolvedContentRepoDir = path.resolve(contentRepoDir);
  const resolvedContentRoot = syncContentRepo
    ? path.join(resolvedContentRepoDir, "database", "stories")
    : path.resolve(contentRoot);

  return {
    course,
    contentRoot: resolvedContentRoot,
    contentRepoUrl,
    contentRepoDir: resolvedContentRepoDir,
    syncContentRepo,
    outDir: path.resolve(outDir ?? path.join("tmp", "story-audio", "courses", course)),
    limit,
    concurrency,
    gapMs,
    materializeFromConvex,
    sourceOutDir: path.resolve(
      sourceOutDir ?? path.join("tmp", "story-source", course),
    ),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function expectedPrefix(story: StorySummary) {
  return `${story.set_id}_${story.set_index}_`;
}

async function findLocalStoryFile(
  story: StorySummary,
  courseDir: string,
): Promise<string | undefined> {
  if (!existsSync(courseDir)) return undefined;
  const storyIdFile = path.join(courseDir, `${story.id}.txt`);
  if (existsSync(storyIdFile)) return storyIdFile;

  const { readdir } = await import("node:fs/promises");
  const files = await readdir(courseDir);
  const prefix = expectedPrefix(story);
  const matches = files
    .filter((file) => file.endsWith(".txt") && file.startsWith(prefix))
    .sort();
  const exactish = matches.find((file) => file.includes(slugify(story.name)));
  return matches.length > 0 ? path.join(courseDir, exactish ?? matches[0]) : undefined;
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

async function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  }
  return new ConvexHttpClient(url);
}

async function syncContentRepo(options: CliOptions) {
  if (existsSync(path.join(options.contentRepoDir, ".git"))) {
    console.log(`Updating content repo: ${options.contentRepoDir}`);
    await runCommand("git", ["-C", options.contentRepoDir, "pull", "--ff-only"]);
    return;
  }

  if (existsSync(options.contentRepoDir)) {
    throw new Error(
      `Content repo directory exists but is not a git checkout: ${options.contentRepoDir}`,
    );
  }

  await mkdir(path.dirname(options.contentRepoDir), { recursive: true });
  console.log(`Cloning content repo: ${options.contentRepoUrl}`);
  await runCommand("git", [
    "clone",
    "--depth",
    "1",
    options.contentRepoUrl,
    options.contentRepoDir,
  ]);
}

async function getContentRepoCommit(options: CliOptions) {
  if (!options.syncContentRepo) return undefined;
  const { stdout } = await runCommand("git", [
    "-C",
    options.contentRepoDir,
    "rev-parse",
    "HEAD",
  ]);
  return stdout.trim();
}

async function sourceMetadataForFile(
  filePath: string,
  options: CliOptions,
  contentRepoCommit: string | undefined,
): Promise<SourceMetadata> {
  const buffer = await readFile(filePath);
  return {
    repo: options.syncContentRepo ? options.contentRepoUrl : undefined,
    commit: contentRepoCommit,
    path: options.syncContentRepo
      ? path.relative(options.contentRepoDir, filePath)
      : path.relative(process.cwd(), filePath),
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

async function getCourseStories(client: ConvexHttpClient, courseShort: string) {
  const sidebar = await client.query(api.editorRead.getEditorSidebarData, {});
  const course = (sidebar.courses ?? []).find(
    (candidate) => candidate.short === courseShort,
  ) as CourseSummary | undefined;
  if (!course) throw new Error(`Course not found: ${courseShort}`);

  const stories = (await client.query(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    { identifier: String(course.id) },
  )) as StorySummary[];

  return {
    course,
    stories: stories
      .filter((story) => story.public)
      .sort((a, b) => a.set_id - b.set_id || a.set_index - b.set_index || a.id - b.id),
  };
}

async function materializeStorySource(
  client: ConvexHttpClient,
  story: StorySummary,
  outputDir: string,
) {
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(
    outputDir,
    `${story.set_id}_${story.set_index}_${story.id}_${slugify(story.name)}.txt`,
  );
  if (existsSync(filePath)) return filePath;

  const data = await client.query(api.editorRead.getEditorStoryPageData, {
    storyId: story.id,
  });
  const text = data?.story_data?.text;
  if (!text) throw new Error(`No story text returned for ${story.id}`);
  await writeFile(filePath, text);
  return filePath;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
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

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.syncContentRepo) await syncContentRepo(options);
  const contentRepoCommit = await getContentRepoCommit(options);
  const client = await getClient();
  const { course, stories } = await getCourseStories(client, options.course);
  const selectedStories = options.limit ? stories.slice(0, options.limit) : stories;
  const courseDir = options.syncContentRepo
    ? path.join(options.contentRepoDir, String(course.id))
    : path.join(options.contentRoot, options.course);

  console.log(
    `Found ${stories.length} published ${options.course} stories; processing ${selectedStories.length}.`,
  );
  console.log(`Content directory: ${courseDir}`);
  console.log(`Output directory: ${options.outDir}`);

  await mkdir(options.outDir, { recursive: true });

  const startedAt = Date.now();
  const results = await mapWithConcurrency(
    selectedStories,
    options.concurrency,
    async (story, index) => {
      const storyLabel = `${story.set_id}_${story.set_index}_${story.id}_${slugify(story.name)}`;
      const outputDir = path.join(options.outDir, storyLabel);
      const localFile =
        (await findLocalStoryFile(story, courseDir)) ??
        (options.materializeFromConvex
          ? await materializeStorySource(client, story, options.sourceOutDir)
          : undefined);

      if (!localFile) {
        return {
          storyId: story.id,
          status: "missing_source" as const,
          message: `No local story source found for ${storyLabel}`,
        };
      }

      console.log(
        `[${index + 1}/${selectedStories.length}] ${storyLabel} from ${path.relative(
          process.cwd(),
          localFile,
        )}`,
      );

      try {
        const source = await sourceMetadataForFile(
          localFile,
          options,
          contentRepoCommit,
        );
        await runCommand("pnpm", [
          "audio:join-story",
          "--",
          "--story-file",
          localFile,
          "--story-id",
          String(story.id),
          "--out-dir",
          outputDir,
          "--gap-ms",
          String(options.gapMs),
          "--source-sha256",
          source.sha256,
          "--source-path",
          source.path ?? "",
          ...(source.repo ? ["--source-repo", source.repo] : []),
          ...(source.commit ? ["--source-commit", source.commit] : []),
        ]);
        const manifestPath = path.join(outputDir, "joined.audio.json");
        const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
          generatorVersion?: string;
          source?: SourceMetadata;
          durationMs: number;
          segments: unknown[];
        };
        return {
          storyId: story.id,
          status: "ok" as const,
          outputDir: path.relative(process.cwd(), outputDir),
          generatorVersion: manifest.generatorVersion,
          source: manifest.source,
          durationMs: manifest.durationMs,
          segments: manifest.segments.length,
        };
      } catch (error) {
        return {
          storyId: story.id,
          status: "failed" as const,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  const summary = {
    course: options.course,
    sourceRepo: options.syncContentRepo ? options.contentRepoUrl : undefined,
    sourceCommit: contentRepoCommit,
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    total: results.length,
    ok: results.filter((result) => result.status === "ok").length,
    missingSource: results.filter((result) => result.status === "missing_source")
      .length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };

  const summaryPath = path.join(options.outDir, "summary.json");
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Wrote ${summaryPath}`);
  console.log(
    `Done: ok=${summary.ok}, missing=${summary.missingSource}, failed=${summary.failed}, elapsed=${(
      summary.elapsedMs / 1000
    ).toFixed(1)}s`,
  );

  if (summary.failed > 0 || summary.missingSource > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
