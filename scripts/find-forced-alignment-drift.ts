import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Avatar } from "../src/app/editor/story/[story]/types";
import { processStoryFile } from "../src/components/editor/story/syntax_parser_new";
import type {
  Audio,
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "../src/components/editor/story/syntax_parser_types";

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
  includePrivate?: boolean;
};

type SummaryItem = {
  storyId: number;
  storyName: string;
  public?: boolean;
  status: string;
  runRoot: string;
  storyDir: string;
};

type Manifest = {
  items: { id: string; text: string; filename: string }[];
};

type AlignableItem = {
  id: string;
  text: string;
  filename: string;
};

async function main() {
  const stories = (await collectSuccessfulStories(batchDirs))
    .filter((story) => args.includePrivate || story.public === true)
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
        storyName: story.storyName,
        public: story.public === true,
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
    const currentById = new Map(
      getAlignableItems(parsedStory.elements).map((item) => [item.id, item]),
    );

    const changedRows = [];
    const missingRows = [];
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
    if (changedRows.length > 0 || missingRows.length > 0 || textChangedRows.length > 0) {
      driftStories.push({
        storyId: story.storyId,
        storyName: story.storyName,
        public: story.public === true,
        sourceRun: path.basename(story.runRoot),
        rows: manifest.items.length,
        changedAudioRows: changedRows.length,
        missingRows,
        textChangedRows,
        changedRows,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    convexUrl: CONVEX_URL,
    batchDirs,
    publicOnly: args.includePrivate !== true,
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
      `${story.storyId} ${story.storyName}: audio=${story.changedAudioRows ?? 0} ` +
        `missing=${story.missingRows?.length ?? 0} text=${story.textChangedRows?.length ?? 0}`,
    );
  }
  console.log(`Report: ${outputPath}`);
}

async function collectSuccessfulStories(runRoots: string[]) {
  const byStory = new Map<number, SummaryItem>();
  for (const runRoot of runRoots) {
    const summary = await readJson<{ summary?: SummaryItem[] }>(
      path.join(runRoot, "summary.json"),
    );
    for (const item of summary.summary ?? []) {
      if (item.status !== "done") continue;
      byStory.set(item.storyId, {
        ...item,
        runRoot,
        storyDir: path.join(runRoot, `story-${item.storyId}`),
      });
    }
  }
  return [...byStory.values()].sort((a, b) => a.storyId - b.storyId);
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

function getAlignableItems(elements: StoryElement[]) {
  const items: AlignableItem[] = [];
  for (const element of elements) {
    if (element.type !== "HEADER" && element.type !== "LINE") continue;
    const audio = getElementAudio(element);
    if (!audio?.url || !audio.ssml) continue;
    const text = getElementText(element);
    if (!text.trim()) continue;
    items.push({
      id: `${element.type}-${element.trackingProperties.line_index}-${audio.ssml.inser_index}`,
      text,
      filename: audio.url.replace(/^audio\//, ""),
    });
  }
  return items;
}

function getElementAudio(element: StoryElementHeader | StoryElementLine): Audio | undefined {
  if (element.type === "HEADER") return element.audio;
  return element.line.content.audio ?? element.audio;
}

function getElementText(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER") {
    return element.learningLanguageTitleContent?.text ?? "";
  }
  return element.line.content?.text ?? "";
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
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
    else if (arg === "--include-private") parsed.includePrivate = true;
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
  --include-private      Include private/unpublished stories.
  --help                 Show this help.

Environment:
  FORCED_ALIGN_BATCH_DIRS  ${path.delimiter}-separated batch directories.
  FORCED_ALIGN_CONVEX_URL / NEXT_PUBLIC_CONVEX_URL / CONVEX_URL
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
