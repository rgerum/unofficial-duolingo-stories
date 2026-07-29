import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Avatar } from "@/app/editor/story/[story]/types";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { selectLatestSuccessfulStoryRuns } from "./lib/forced-alignment-safety";
import { getAudioBackedStoryItems } from "./lib/forced-alignment-story-items";

const CONVEX_URL = process.env.FORCED_ALIGN_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: FORCED_ALIGN_CONVEX_URL must be set explicitly.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const batchDirs = resolveBatchDirs(args.batchDir);
const outputPath =
  args.report ?? path.join("tmp", "forced-alignment-drift.json");

if (batchDirs.length === 0) {
  console.error("Error: provide at least one --batch-dir or FORCED_ALIGN_BATCH_DIRS.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

type CliArgs = {
  batchDir: string[];
  storyIds: number[];
  report?: string;
  limit?: number;
  includeUnpublished?: boolean;
};

type SummaryItem = {
  storyId: number;
  storyTitle?: string;
  /** Kept only for reading batches generated before the terminology update. */
  storyName?: string;
  published?: boolean;
  /** Kept only for reading batches generated before the terminology update. */
  public?: boolean;
  status: string;
  runRoot: string;
  storyDir: string;
};

type Manifest = {
  items: { id: string; text: string; filename: string }[];
};

async function main() {
  const stories = (await collectSuccessfulStories(batchDirs))
    .filter((story) => args.includeUnpublished || isStoryPublished(story))
    .filter(
      (story) => args.storyIds.length === 0 || args.storyIds.includes(story.storyId),
    )
    .slice(0, args.limit);
  const driftStories = [];

  for (const story of stories) {
    const [manifest, data] = await Promise.all([
      readJson<Manifest>(path.join(story.storyDir, "manifest.json")),
      client.query(api.editorRead.getEditorStoryPageData, { storyId: story.storyId }),
    ]);
    if (!data) {
      driftStories.push({
        storyId: story.storyId,
        storyTitle: getStoryTitle(story),
        published: isStoryPublished(story),
        status: "missing-current-story",
      });
      continue;
    }

    const { learningLanguage, fromLanguage, avatarNames } = await getParseContext(
      data.story_data.learning_language,
      data.story_data.from_language,
    );
    const [parsedStory] = processStoryFile(
      data.story_data.text,
      data.story_data.id,
      avatarNames,
      {
        learning_language: learningLanguage?.short ?? "",
        from_language: fromLanguage?.short ?? "",
      },
      learningLanguage?.tts_replace ?? "",
    );
    const currentItems = getAudioBackedStoryItems(parsedStory.elements);
    const currentById = new Map(currentItems.map((item) => [item.id, item]));
    const manifestIds = new Set(manifest.items.map((item) => item.id));

    const changedRows = [];
    const missingRows = [];
    const addedRows = currentItems
      .filter((item) => !manifestIds.has(item.id))
      .map((item) => item.id);
    const textChangedRows = [];
    for (const manifestItem of manifest.items) {
      const current = currentById.get(manifestItem.id);
      if (!current) {
        missingRows.push(manifestItem.id);
        continue;
      }
      if (current.text !== manifestItem.text) textChangedRows.push(manifestItem.id);
      if (current.filename !== manifestItem.filename) {
        changedRows.push({
          id: manifestItem.id,
          oldFilename: manifestItem.filename,
          currentFilename: current.filename,
          textChanged: current.text !== manifestItem.text,
        });
      }
    }
    if (
      changedRows.length > 0 ||
      missingRows.length > 0 ||
      addedRows.length > 0 ||
      textChangedRows.length > 0
    ) {
      driftStories.push({
        storyId: story.storyId,
        storyTitle: getStoryTitle(story),
        published: isStoryPublished(story),
        sourceRun: path.basename(story.runRoot),
        rows: manifest.items.length,
        changedAudioRows: changedRows.length,
        missingRows,
        addedRows,
        textChangedRows,
        changedRows,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    convexUrl: CONVEX_URL,
    batchDirs,
    publishedOnly: args.includeUnpublished !== true,
    checkedStories: stories.length,
    driftStoryCount: driftStories.length,
    changedAudioStoryCount: driftStories.filter(
      (story) => (story.changedAudioRows ?? 0) > 0,
    ).length,
    driftStories,
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...report, driftStories: undefined }, null, 2));
  for (const story of driftStories.slice(0, 30)) {
    console.log(
      `${story.storyId} ${story.storyTitle}: audio=${story.changedAudioRows ?? 0} ` +
        `missing=${story.missingRows?.length ?? 0} added=${story.addedRows?.length ?? 0} ` +
        `text=${story.textChangedRows?.length ?? 0}`,
    );
  }
  console.log(`Report: ${outputPath}`);
}

async function collectSuccessfulStories(runRoots: string[]) {
  const runs: SummaryItem[] = [];
  for (const runRoot of runRoots) {
    const summary = await readJson<{ summary?: SummaryItem[] }>(
      path.join(runRoot, "summary.json"),
    );
    for (const item of summary.summary ?? []) {
      runs.push({
        ...item,
        runRoot,
        storyDir: path.join(runRoot, `story-${item.storyId}`),
      });
    }
  }
  return selectLatestSuccessfulStoryRuns(runs).sort(
    (left, right) => left.storyId - right.storyId,
  );
}

async function getParseContext(
  learningLanguageLegacyId: number,
  fromLanguageLegacyId: number,
) {
  const [learningLanguage, fromLanguage, avatarRows] = await Promise.all([
    client.query(api.editorRead.getEditorLanguageByLegacyId, {
      legacyLanguageId: learningLanguageLegacyId,
    }),
    client.query(api.editorRead.getEditorLanguageByLegacyId, {
      legacyLanguageId: fromLanguageLegacyId,
    }),
    client.query(api.editorRead.getEditorAvatarNamesByLanguageLegacyId, {
      languageLegacyId: learningLanguageLegacyId,
    }),
  ]);
  const avatarNames: Record<number, Avatar> = {};
  for (const avatar of avatarRows ?? []) {
    avatarNames[avatar.avatar_id] = avatar;
  }
  return { learningLanguage, fromLanguage, avatarNames };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function getStoryTitle(story: SummaryItem) {
  return story.storyTitle ?? story.storyName ?? `Story ${story.storyId}`;
}

function isStoryPublished(story: SummaryItem) {
  return story.published ?? story.public ?? false;
}

function resolveBatchDirs(batchDirArgs: string[]) {
  if (batchDirArgs.length > 0) return batchDirArgs;
  return (process.env.FORCED_ALIGN_BATCH_DIRS ?? "")
    .split(path.delimiter)
    .map((dir) => dir.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]) {
  const parsed: CliArgs = { batchDir: [], storyIds: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--batch-dir") parsed.batchDir.push(argv[++index]);
    else if (arg === "--story") parsed.storyIds.push(Number(argv[++index]));
    else if (arg === "--limit") parsed.limit = Number(argv[++index]);
    else if (arg === "--report") parsed.report = argv[++index];
    else if (arg === "--include-unpublished") parsed.includeUnpublished = true;
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
  console.log(`Usage: pnpm forced-align:drift [options]

Compares saved forced-alignment manifests with current Convex story text/audio
so stale batch results can be re-run before applying.

Options:
  --batch-dir <dir>      Batch directory containing summary.json and story-* dirs.
                         May be supplied more than once.
  --story <id>           Restrict to a story id. May be supplied more than once.
  --limit <n>            Process only the first n selected stories.
  --report <path>        Write JSON report to path.
  --include-unpublished  Include unpublished stories.
  --help                 Show this help.

Environment:
  FORCED_ALIGN_BATCH_DIRS  ${path.delimiter}-separated batch directories.
  FORCED_ALIGN_CONVEX_URL Required explicit Convex deployment URL.
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
