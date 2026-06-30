import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local", quiet: true });

const CONVEX_URL =
  process.env.FORCED_ALIGN_CONVEX_URL ??
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: FORCED_ALIGN_CONVEX_URL/NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const outputRoot =
  args.output ??
  path.join(
    "tmp",
    "forced-alignment-batches",
    `${args.course}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );

type CliArgs = {
  course: string;
  output?: string;
  storyIds: number[];
  failedFrom?: string;
  limit?: number;
  concurrency: number;
  includePrivate?: boolean;
  force?: boolean;
};

type StorySummary = {
  storyId: number;
  storyName: string;
  public?: boolean;
  status: "done" | "skipped" | "failed";
  warnings?: number;
  rows?: number;
  error?: string;
  runRoot: string;
  storyDir: string;
};

type StoryListItem = {
  id: number;
  name: string;
  public?: boolean;
};

async function main() {
  if (!Number.isFinite(args.concurrency) || args.concurrency < 1) {
    throw new Error("--concurrency must be a positive number.");
  }
  const convexUrl = CONVEX_URL;
  if (!convexUrl) {
    throw new Error("FORCED_ALIGN_CONVEX_URL/NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  }

  await mkdir(outputRoot, { recursive: true });

  const client = new ConvexHttpClient(convexUrl);
  const stories = (await client.query(api.editorRead.getEditorStoriesByCourseLegacyId, {
    identifier: args.course,
  })) as StoryListItem[];
  const failedStoryIds = args.failedFrom
    ? await readFailedStoryIds(args.failedFrom)
    : new Set<number>();
  const requestedStoryIds = new Set([...args.storyIds, ...failedStoryIds]);
  const selected = stories
    .filter((story) => args.includePrivate || story.public === true)
    .filter((story) => requestedStoryIds.size === 0 || requestedStoryIds.has(story.id))
    .slice(0, args.limit);

  const summaryPath = path.join(outputRoot, "summary.json");
  const summary: StorySummary[] = [];
  await writeSummary(summaryPath, summary);

  console.log(
    `Running forced alignment for ${selected.length}/${stories.length} story/stories ` +
      `in ${args.course} with concurrency ${args.concurrency}.`,
  );
  console.log(`Output: ${outputRoot}`);

  await mapWithConcurrency(selected, args.concurrency, async (story, index) => {
    if (index > 0 && index % 10 === 0) {
      console.log(`Started ${index}/${selected.length} stories...`);
    }

    const storyDir = path.join(outputRoot, `story-${story.id}`);
    const existing = await readExistingResult(storyDir);
    if (existing && !args.force) {
      summary.push({
        storyId: story.id,
        storyName: story.name,
        public: story.public,
        status: "done",
        warnings: countWarnings(existing),
        rows: existing.results?.length ?? 0,
        runRoot: outputRoot,
        storyDir,
      });
      await writeSummary(summaryPath, summary);
      console.log(`done       ${story.id} ${story.name} (existing)`);
      return;
    }

    try {
      await runStoryAlignment(story.id, storyDir);
      const results = await readExistingResult(storyDir);
      summary.push({
        storyId: story.id,
        storyName: story.name,
        public: story.public,
        status: "done",
        warnings: countWarnings(results),
        rows: results?.results?.length ?? 0,
        runRoot: outputRoot,
        storyDir,
      });
      console.log(`done       ${story.id} ${story.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.push({
        storyId: story.id,
        storyName: story.name,
        public: story.public,
        status: "failed",
        error: message,
        runRoot: outputRoot,
        storyDir,
      });
      console.error(`failed     ${story.id} ${story.name}: ${message}`);
    } finally {
      await writeSummary(summaryPath, summary);
    }
  });

  const report = {
    generatedAt: new Date().toISOString(),
    convexUrl: CONVEX_URL,
    course: args.course,
    outputRoot,
    selectedStories: selected.length,
    done: summary.filter((item) => item.status === "done").length,
    failed: summary.filter((item) => item.status === "failed").length,
    warnings: summary.reduce((total, item) => total + (item.warnings ?? 0), 0),
    summary,
  };
  await writeFile(summaryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...report, summary: undefined }, null, 2));
}

async function runStoryAlignment(storyId: number, storyDir: string) {
  await mkdir(storyDir, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/forced-align-story-audio.ts",
        "--story",
        String(storyId),
        "--output",
        storyDir,
        "--align",
      ],
      {
        stdio: "inherit",
        env: process.env,
      },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`story aligner exited with code ${code}`));
    });
  });
}

async function readExistingResult(storyDir: string) {
  try {
    return JSON.parse(await readFile(path.join(storyDir, "results.json"), "utf8")) as {
      results?: { warnings?: string[] }[];
    };
  } catch {
    return null;
  }
}

function countWarnings(results: { results?: { warnings?: string[] }[] } | null) {
  return (
    results?.results?.reduce(
      (total, result) => total + (result.warnings?.length ?? 0),
      0,
    ) ?? 0
  );
}

async function writeSummary(summaryPath: string, summary: StorySummary[]) {
  await writeFile(
    summaryPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        convexUrl: CONVEX_URL,
        course: args.course,
        outputRoot,
        summary,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function readFailedStoryIds(reportPath: string) {
  const parsed = JSON.parse(await readFile(reportPath, "utf8")) as {
    summary?: { storyId?: number; status?: string }[];
    reports?: { storyId?: number; status?: string }[];
  };
  const rows = parsed.summary ?? parsed.reports ?? [];
  return new Set(
    rows
      .filter((row) => row.status === "failed" || row.status === "error")
      .map((row) => row.storyId)
      .filter((storyId): storyId is number => Number.isFinite(storyId)),
  );
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let cursor = 0;
  async function runWorker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
}

function parseArgs(argv: string[]) {
  const parsed: CliArgs = {
    course: process.env.FORCED_ALIGN_COURSE ?? "da-en",
    storyIds: [],
    concurrency: Number(process.env.FORCED_ALIGN_CONCURRENCY ?? "1"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--course") parsed.course = argv[++index];
    else if (arg === "--output") parsed.output = argv[++index];
    else if (arg === "--story") parsed.storyIds.push(Number(argv[++index]));
    else if (arg === "--failed-from") parsed.failedFrom = argv[++index];
    else if (arg === "--limit") parsed.limit = Number(argv[++index]);
    else if (arg === "--concurrency") parsed.concurrency = Number(argv[++index]);
    else if (arg === "--include-private") parsed.includePrivate = true;
    else if (arg === "--force") parsed.force = true;
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }
  parsed.storyIds = parsed.storyIds.filter((storyId) => Number.isFinite(storyId));
  return parsed;
}

function printHelp() {
  console.log(`Usage: pnpm forced-align:batch [options]

Runs forced alignment for a course by invoking forced-align:story for each
selected story. Defaults to public stories and serial execution.

Options:
  --course <id>          Course identifier or legacy id. Default: da-en
  --output <dir>         Batch output directory.
  --story <id>           Restrict to a story id. May be supplied more than once.
  --failed-from <path>   Re-run stories marked failed/error in a previous report.
  --limit <n>            Process only the first n selected stories.
  --concurrency <n>      Number of story alignments to run at once. Default: 1
  --include-private      Include private/unpublished stories.
  --force                Re-run even when story results already exist.
  --help                 Show this help.

Environment:
  FORCED_ALIGN_CONVEX_URL / NEXT_PUBLIC_CONVEX_URL / CONVEX_URL
  FORCED_ALIGN_COMMAND    Required by forced-align:story.
  FORCED_ALIGN_MODEL      Optional aligner model.
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
