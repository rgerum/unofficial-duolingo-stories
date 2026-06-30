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
const CONVEX_AUTH_TOKEN = process.env.CONVEX_AUTH_TOKEN;

if (!CONVEX_URL) {
  console.error("Error: FORCED_ALIGN_CONVEX_URL/NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const batchDirs = resolveBatchDirs(args.batchDir);
const shouldApply = args.apply === true;
const publicOnly = args.includePrivate !== true;
const forcedAlignmentComment =
  args.comment ??
  `# Forced alignment: word timings applied ${new Date()
    .toISOString()
    .slice(0, 10)} from batches ${batchDirs.map((dir) => path.basename(dir)).join(", ")}.`;
const reportPath =
  args.report ??
  path.join(
    "tmp",
    `apply-forced-alignments-${shouldApply ? "apply" : "dry-run"}.json`,
  );

if (batchDirs.length === 0) {
  console.error("Error: provide at least one --batch-dir or FORCED_ALIGN_BATCH_DIRS.");
  process.exit(1);
}

if (shouldApply && !CONVEX_AUTH_TOKEN) {
  console.error("Error: CONVEX_AUTH_TOKEN is required for --apply.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
if (CONVEX_AUTH_TOKEN) {
  client.setAuth(CONVEX_AUTH_TOKEN);
}

type CliArgs = {
  batchDir: string[];
  storyIds: number[];
  limit?: number;
  report?: string;
  comment?: string;
  apply?: boolean;
  includePrivate?: boolean;
};

type BatchSummaryItem = {
  storyId: number;
  storyName: string;
  public?: boolean;
  status: string;
  warnings?: number;
  rows?: number;
  runRoot: string;
  storyDir: string;
};

type Manifest = {
  storyId: number;
  storyName: string;
  items: ManifestItem[];
};

type ManifestItem = {
  id: string;
  text: string;
  filename: string;
  ssml?: Audio["ssml"];
};

type AlignmentResultsFile = {
  results?: AlignmentResult[];
};

type AlignmentResult = {
  itemId: string;
  filename: string;
  text: string;
  wordCount: number;
  alignedWordCount: number;
  keypoints: Keypoint[];
  serializedText: string;
  warnings: string[];
};

type Keypoint = { rangeEnd: number; audioStart: number };

type AlignableItem = {
  id: string;
  type: "HEADER" | "LINE";
  lineIndex: number;
  text: string;
  filename: string;
  ssml: Audio["ssml"];
  existingKeypoints: Keypoint[];
};

type StoryReport = {
  storyId: number;
  storyName: string;
  public: boolean;
  status: "saved" | "would-save" | "unchanged" | "skipped" | "error";
  reason?: string;
  rowsTotal?: number;
  rowsApplied?: number;
  rowsSkipped?: number;
  sourceRun?: string;
};

async function main() {
  const candidates = await collectSuccessfulStories(batchDirs);
  const selectedStories = candidates
    .filter((story) => !publicOnly || story.public === true)
    .filter(
      (story) => args.storyIds.length === 0 || args.storyIds.includes(story.storyId),
    )
    .slice(0, args.limit);

  console.log(
    `${shouldApply ? "Applying" : "Dry-running"} ${selectedStories.length} ` +
      `story/stories from ${batchDirs.length} batch dir(s).`,
  );

  const reports: StoryReport[] = [];
  for (const story of selectedStories) {
    try {
      const report = await processStory(story);
      reports.push(report);
      console.log(
        `${report.status.padEnd(10)} ${story.storyId} ${story.storyName}` +
          `${report.reason ? `: ${report.reason}` : ""}`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      reports.push({
        storyId: story.storyId,
        storyName: story.storyName,
        public: story.public === true,
        status: "error",
        reason,
        sourceRun: path.basename(story.runRoot),
      });
      console.error(`error      ${story.storyId} ${story.storyName}: ${reason}`);
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? "apply" : "dry-run",
    convexUrl: CONVEX_URL,
    batchDirs,
    publicOnly,
    selectedStories: selectedStories.length,
    saved: reports.filter((report) => report.status === "saved").length,
    wouldSave: reports.filter((report) => report.status === "would-save").length,
    unchanged: reports.filter((report) => report.status === "unchanged").length,
    skipped: reports.filter((report) => report.status === "skipped").length,
    errors: reports.filter((report) => report.status === "error").length,
    reports,
  };

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`\nReport: ${reportPath}`);
  console.log(JSON.stringify({ ...summary, reports: undefined }, null, 2));
}

async function collectSuccessfulStories(runRoots: string[]) {
  const byStory = new Map<number, BatchSummaryItem>();
  for (const runRoot of runRoots) {
    const summary = await readJson<{ summary?: BatchSummaryItem[] }>(
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

async function processStory(story: BatchSummaryItem): Promise<StoryReport> {
  const [manifest, resultsFile, data] = await Promise.all([
    readJson<Manifest>(path.join(story.storyDir, "manifest.json")),
    readJson<AlignmentResultsFile>(path.join(story.storyDir, "results.json")),
    client.query(api.editorRead.getEditorStoryPageData, { storyId: story.storyId }),
  ]);

  if (!data) {
    return skipped(story, "story not found in Convex");
  }

  const { learningLanguage, fromLanguage, avatarNames } = await getParseContext(
    data.story_data.learning_language,
    data.story_data.from_language,
  );

  const [parsedStory, , audioInsertLines] = processStoryFile(
    data.story_data.text,
    data.story_data.id,
    avatarNames,
    {
      learning_language: learningLanguage?.short ?? "",
      from_language: fromLanguage?.short ?? "",
    },
    learningLanguage?.tts_replace ?? "",
  );

  const currentItems = getAlignableItems(parsedStory.elements);
  const currentItemsById = new Map(currentItems.map((item) => [item.id, item]));
  const manifestItemsById = new Map(manifest.items.map((item) => [item.id, item]));
  const updates: { inserIndex: number | undefined; serializedText: string }[] = [];
  const skipReasons = new Map<string, number>();
  let rowsSkipped = 0;

  for (const result of resultsFile.results ?? []) {
    const manifestItem = manifestItemsById.get(result.itemId);
    const currentItem = currentItemsById.get(result.itemId);
    const validationError = validateResult(result, manifestItem, currentItem);
    if (validationError) {
      rowsSkipped += 1;
      skipReasons.set(validationError, (skipReasons.get(validationError) ?? 0) + 1);
      continue;
    }
    if (!currentItem) {
      rowsSkipped += 1;
      skipReasons.set(
        "current story row missing",
        (skipReasons.get("current story row missing") ?? 0) + 1,
      );
      continue;
    }
    const nextSerializedText = timingsToText({
      filename: currentItem.filename,
      keypoints: result.keypoints,
    });
    if (
      timingsToText({
        filename: currentItem.filename,
        keypoints: currentItem.existingKeypoints,
      }) === nextSerializedText
    ) {
      continue;
    }
    updates.push({
      inserIndex: currentItem.ssml?.inser_index,
      serializedText: nextSerializedText,
    });
  }

  if (rowsSkipped > 0) {
    const reasonSummary = [...skipReasons.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([reason, count]) => `${reason}: ${count}`)
      .join("; ");
    return skipped(story, `${rowsSkipped} row(s) failed safety checks`, {
      reason: `${rowsSkipped} row(s) failed safety checks (${reasonSummary})`,
      rowsTotal: resultsFile.results?.length ?? 0,
      rowsSkipped,
    });
  }

  if (updates.length === 0) {
    return {
      storyId: story.storyId,
      storyName: story.storyName,
      public: story.public === true,
      status: "unchanged",
      rowsTotal: resultsFile.results?.length ?? 0,
      rowsApplied: 0,
      rowsSkipped,
      sourceRun: path.basename(story.runRoot),
    };
  }

  const patchedText = addForcedAlignmentComment(
    applyTimingUpdates(data.story_data.text, updates, audioInsertLines),
  );
  if (patchedText === data.story_data.text) {
    return skipped(story, "patch produced no text changes", {
      rowsTotal: resultsFile.results?.length ?? 0,
      rowsSkipped,
    });
  }

  const [nextParsedStory, nextParsedMeta] = processStoryFile(
    patchedText,
    data.story_data.id,
    avatarNames,
    {
      learning_language: learningLanguage?.short ?? "",
      from_language: fromLanguage?.short ?? "",
    },
    learningLanguage?.tts_replace ?? "",
  );

  if (shouldApply) {
    await client.mutation(api.storyWrite.setStory, {
      legacyStoryId: data.story_data.id,
      duo_id: data.story_data.duo_id ?? "",
      name: data.story_data.name,
      image: data.story_data.image,
      set_id: data.story_data.set_id,
      set_index: data.story_data.set_index,
      legacyCourseId: data.story_data.course_id,
      text: patchedText,
      json: toConvexValue(nextParsedStory),
      todo_count: nextParsedMeta.todo_count ?? 0,
      change_date: new Date().toISOString(),
      confirmOfficialOverwrite: data.story_data.official || undefined,
      operationKey: `story:${data.story_data.id}:forced-align-bulk:${Date.now()}`,
    });
  }

  return {
    storyId: story.storyId,
    storyName: story.storyName,
    public: story.public === true,
    status: shouldApply ? "saved" : "would-save",
    rowsTotal: resultsFile.results?.length ?? 0,
    rowsApplied: updates.length,
    rowsSkipped,
    sourceRun: path.basename(story.runRoot),
  };
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

function validateResult(
  result: AlignmentResult,
  manifestItem: ManifestItem | undefined,
  currentItem: AlignableItem | undefined,
) {
  if (!manifestItem) return "missing manifest item";
  if (!currentItem) return "current story row missing";
  if (result.warnings.length > 0) return "alignment warnings present";
  if (result.text !== manifestItem.text) return "result text differs from manifest";
  if (currentItem.text !== manifestItem.text) return "current text changed";
  if (result.filename !== manifestItem.filename) return "result filename differs";

  const tokenEnds = getWordTokens(currentItem.text).map((token) => token.end);
  if (tokenEnds.length !== result.keypoints.length) {
    return "keypoint count differs from current token count";
  }
  for (let index = 0; index < tokenEnds.length; index += 1) {
    const point = result.keypoints[index];
    if (point.rangeEnd !== tokenEnds[index]) return "keypoint range mismatch";
    if (!Number.isFinite(point.audioStart) || point.audioStart < 0) {
      return "invalid audioStart";
    }
    if (index > 0 && point.audioStart < result.keypoints[index - 1].audioStart) {
      return "audioStart values are not monotonic";
    }
  }
  return null;
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
      type: element.type,
      lineIndex: element.trackingProperties.line_index || 0,
      text,
      filename: audio.url.replace(/^audio\//, ""),
      ssml: audio.ssml,
      existingKeypoints: audio.keypoints ?? [],
    });
  }

  return items;
}

function getElementAudio(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER") return element.audio;
  return element.line.content.audio ?? element.audio;
}

function getElementText(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER") {
    return element.learningLanguageTitleContent?.text ?? "";
  }
  return element.line.content?.text ?? "";
}

function applyTimingUpdates(
  docText: string,
  updates: { inserIndex: number | undefined; serializedText: string }[],
  audioInsertLines: [number | undefined, number][],
) {
  const lines = docText.split("\n");
  const lineUpdates = updates
    .map((update) => {
      if (update.inserIndex === undefined) return null;
      const target = audioInsertLines[update.inserIndex];
      if (!target) return null;
      return { target, serializedText: update.serializedText };
    })
    .filter((update): update is NonNullable<typeof update> => update !== null)
    .sort((left, right) => getSortLine(right.target) - getSortLine(left.target));

  for (const update of lineUpdates) {
    const [line, lineInsert] = update.target;
    if (line !== undefined) {
      lines[Math.max(0, line - 1)] = update.serializedText;
      continue;
    }
    lines.splice(Math.max(0, lineInsert - 2), 0, update.serializedText);
  }

  return lines.join("\n");
}

function getSortLine(target: [number | undefined, number]) {
  return target[0] ?? target[1];
}

function addForcedAlignmentComment(docText: string) {
  const lines = docText.split("\n");
  const filteredLines = lines.filter(
    (line) => !line.trim().startsWith("# Forced alignment:"),
  );
  return [forcedAlignmentComment, ...filteredLines].join("\n");
}

function timingsToText(item: { filename: string; keypoints: Keypoint[] }) {
  let text = `$${item.filename}`;
  let lastEnd = 0;
  let lastTime = 0;
  for (const point of item.keypoints) {
    text += `;${Math.round(point.rangeEnd - lastEnd)},${Math.round(
      point.audioStart - lastTime,
    )}`;
    lastEnd = point.rangeEnd;
    lastTime = point.audioStart;
  }
  return text;
}

function getWordTokens(text: string) {
  const tokens: { end: number }[] = [];
  const regex = /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu;
  for (const match of text.matchAll(regex)) {
    const word = match[0];
    const start = match.index ?? 0;
    const normalized = normalizeWord(word);
    if (!normalized) continue;
    tokens.push({ end: start + word.length });
  }
  return tokens;
}

function normalizeWord(word: string) {
  return word
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function skipped(
  story: BatchSummaryItem,
  reason: string,
  extra: Partial<StoryReport> = {},
): StoryReport {
  return {
    storyId: story.storyId,
    storyName: story.storyName,
    public: story.public === true,
    status: "skipped",
    reason,
    sourceRun: path.basename(story.runRoot),
    ...extra,
  };
}

function toConvexValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => toConvexValue(item));
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toConvexValue(item);
    }
    return result;
  }
  return value;
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
    else if (arg === "--comment") parsed.comment = argv[++index];
    else if (arg === "--apply") parsed.apply = true;
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
  console.log(`Usage: pnpm forced-align:apply-batch [options]

Applies saved forced-alignment result files through storyWrite.setStory.
Defaults to dry-run and public stories only.

Options:
  --batch-dir <dir>      Batch directory containing summary.json and story-* dirs.
                         May be supplied more than once.
  --story <id>           Restrict to a story id. May be supplied more than once.
  --limit <n>            Process only the first n selected stories.
  --report <path>        Write JSON report to path.
  --comment <text>       Story comment inserted above existing story text.
  --include-private      Include private stories too.
  --apply                Actually write to Convex.
  --help                 Show this help.

Environment:
  FORCED_ALIGN_BATCH_DIRS  ${path.delimiter}-separated batch directories.
  FORCED_ALIGN_CONVEX_URL / NEXT_PUBLIC_CONVEX_URL / CONVEX_URL
  CONVEX_AUTH_TOKEN        Required for --apply.
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
