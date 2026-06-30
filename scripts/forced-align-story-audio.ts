import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { processStoryFile } from "../src/components/editor/story/syntax_parser_new";
import type {
  Audio,
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "../src/components/editor/story/syntax_parser_types";
import { timings_to_text } from "../src/lib/editor/audio/audio_edit_tools";

dotenv.config({ path: ".env.local", quiet: true });

const DEFAULT_AUDIO_BASE_URL =
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/";
const CONVEX_URL =
  process.env.FORCED_ALIGN_CONVEX_URL ??
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL;
const CONVEX_AUTH_TOKEN = process.env.CONVEX_AUTH_TOKEN;
const AUDIO_BASE_URL =
  process.env.ALIGN_AUDIO_BASE_URL ?? process.env.NEXT_PUBLIC_AUDIO_BASE_URL;
const ALIGN_COMMAND = process.env.FORCED_ALIGN_COMMAND;
const ALIGN_TIME_UNIT = process.env.FORCED_ALIGN_TIME_UNIT ?? "seconds";

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const storyId = parseRequiredNumber(args.story ?? process.env.FORCED_ALIGN_STORY_ID);
const shouldAlign = args.align === true || parseBooleanEnv(process.env.FORCED_ALIGN_RUN, false);
const shouldApply = args.apply === true || parseBooleanEnv(process.env.FORCED_ALIGN_APPLY, false);
const outputRoot =
  args.output ??
  process.env.FORCED_ALIGN_OUTPUT_DIR ??
  path.join("tmp", "forced-alignment", `story-${storyId}`);

if (shouldApply && !shouldAlign) {
  console.error("Error: --apply requires --align.");
  process.exit(1);
}

if (shouldAlign && !ALIGN_COMMAND) {
  console.error("Error: FORCED_ALIGN_COMMAND is required when using --align.");
  console.error(
    "See docs/forced-alignment-admin-workflow.md for installation and command examples.",
  );
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
if (CONVEX_AUTH_TOKEN) {
  client.setAuth(CONVEX_AUTH_TOKEN);
}

type CliArgs = {
  story?: string;
  output?: string;
  align?: boolean;
  apply?: boolean;
};

type AlignableItem = {
  id: string;
  order: number;
  type: "HEADER" | "LINE";
  lineIndex: number;
  speaker: string;
  text: string;
  audioUrl: string;
  filename: string;
  ssml: Audio["ssml"];
  existingKeypoints: { rangeEnd: number; audioStart: number }[];
};

type WordToken = {
  text: string;
  normalized: string;
  start: number;
  end: number;
};

type AlignedWord = {
  word: string;
  normalized: string;
  startMs: number;
  endMs?: number;
};

type AlignmentResult = {
  itemId: string;
  filename: string;
  text: string;
  wordCount: number;
  alignedWordCount: number;
  keypoints: { rangeEnd: number; audioStart: number }[];
  serializedText: string;
  warnings: string[];
};

async function main() {
  await mkdir(outputRoot, { recursive: true });
  await mkdir(path.join(outputRoot, "audio"), { recursive: true });
  await mkdir(path.join(outputRoot, "text"), { recursive: true });
  await mkdir(path.join(outputRoot, "aligned"), { recursive: true });

  console.log(`Loading story ${storyId}...`);
  const data = await client.query(api.editorRead.getEditorStoryPageData, {
    storyId,
  });

  if (!data) {
    throw new Error(`Story ${storyId} was not found.`);
  }

  const [learningLanguage, fromLanguage] = await Promise.all([
    client.query(api.editorRead.getEditorLanguageByLegacyId, {
      legacyLanguageId: data.story_data.learning_language,
    }),
    client.query(api.editorRead.getEditorLanguageByLegacyId, {
      legacyLanguageId: data.story_data.from_language,
    }),
  ]);

  const [parsedStory, , audioInsertLines] = processStoryFile(
    data.story_data.text,
    data.story_data.id,
    {},
    {
      learning_language: learningLanguage?.short ?? "",
      from_language: fromLanguage?.short ?? "",
    },
    learningLanguage?.tts_replace ?? "",
  );

  const items = getAlignableItems(parsedStory.elements);
  await writeJson(path.join(outputRoot, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    storyId,
    storyName: data.story_data.name,
    courseShort: data.story_data.short,
    learningLanguage: learningLanguage?.short ?? "",
    fromLanguage: fromLanguage?.short ?? "",
    alignCommand: ALIGN_COMMAND ?? null,
    items,
  });

  console.log(`Found ${items.length} audio-backed story rows.`);

  const results: AlignmentResult[] = [];
  for (const item of items) {
    const audioPath = path.join(outputRoot, "audio", safeFileName(item.id, ".mp3"));
    const textPath = path.join(outputRoot, "text", safeFileName(item.id, ".txt"));
    const jsonPath = path.join(outputRoot, "aligned", safeFileName(item.id, ".json"));

    await writeFile(textPath, `${getAlignmentText(item.text)}\n`, "utf8");
    await downloadFile(item.audioUrl, audioPath);

    if (!shouldAlign || !ALIGN_COMMAND) continue;

    console.log(`Aligning ${item.id}...`);
    await runAlignCommand(ALIGN_COMMAND, {
      audio: audioPath,
      text: textPath,
      json: jsonPath,
      language: learningLanguage?.short ?? "da",
      model: process.env.FORCED_ALIGN_MODEL ?? "",
    });

    const alignedWords = await readAlignedWords(jsonPath);
    const result = buildAlignmentResult(item, alignedWords);
    results.push(result);
  }

  if (!shouldAlign) {
    console.log(`Export complete: ${outputRoot}`);
    console.log("Run again with --align after setting FORCED_ALIGN_COMMAND.");
    return;
  }

  await writeJson(path.join(outputRoot, "results.json"), {
    generatedAt: new Date().toISOString(),
    storyId,
    results,
  });

  const patchedText = applyTimingUpdates(
    data.story_data.text,
    results.map((result) => ({
      inserIndex: items.find((item) => item.id === result.itemId)?.ssml.inser_index,
      serializedText: result.serializedText,
    })),
    audioInsertLines,
  );
  await writeFile(path.join(outputRoot, "story.patched.txt"), patchedText, "utf8");

  printSummary(results, outputRoot);

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to save these timings to Convex.");
    return;
  }

  if (!CONVEX_AUTH_TOKEN) {
    throw new Error("CONVEX_AUTH_TOKEN is required for --apply.");
  }

  const [nextParsedStory, nextParsedMeta] = processStoryFile(
    patchedText,
    data.story_data.id,
    {},
    {
      learning_language: learningLanguage?.short ?? "",
      from_language: fromLanguage?.short ?? "",
    },
    learningLanguage?.tts_replace ?? "",
  );

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
    operationKey: `story:${data.story_data.id}:forced-align:${Date.now()}`,
  });

  console.log(`Saved forced-aligned timings for story ${storyId}.`);
}

function getAlignableItems(elements: StoryElement[]) {
  const items: AlignableItem[] = [];
  let order = 1;

  for (const element of elements) {
    if (element.type !== "HEADER" && element.type !== "LINE") continue;
    const audio = getElementAudio(element);
    if (!audio?.url || !audio.ssml) continue;

    const text = getElementText(element);
    if (!text.trim()) continue;

    items.push({
      id: `${element.type}-${element.trackingProperties.line_index}-${audio.ssml.inser_index}`,
      order,
      type: element.type,
      lineIndex: element.trackingProperties.line_index || 0,
      speaker: getElementSpeaker(element),
      text,
      audioUrl: resolveAudioUrl(audio.url),
      filename: audio.url.replace(/^audio\//, ""),
      ssml: audio.ssml,
      existingKeypoints: audio.keypoints ?? [],
    });
    order += 1;
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

function getElementSpeaker(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER") return "Narrator";
  if (element.line.type === "CHARACTER") {
    return (
      element.line.characterName ??
      element.line.characterId?.toString() ??
      "Narrator"
    );
  }
  return "Narrator";
}

function resolveAudioUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("blob:")) return url;
  const base = AUDIO_BASE_URL ?? DEFAULT_AUDIO_BASE_URL;
  return `${base.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

async function downloadFile(url: string, outputPath: string) {
  if (url.startsWith("blob:")) {
    throw new Error(`Cannot download browser blob URL in local script: ${url}`);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function runAlignCommand(
  commandTemplate: string,
  values: Record<string, string>,
) {
  const command = commandTemplate.replace(
    /\{(audio|text|json|language|model)\}/g,
    (_, key: string) => shellQuote(values[key] ?? ""),
  );

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Alignment command failed with exit code ${code}`));
    });
  });
}

async function readAlignedWords(jsonPath: string) {
  const raw = await readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const candidates = collectWordCandidates(parsed);

  return candidates.flatMap((candidate) => {
    const word = getString(candidate, ["word", "text", "label", "token"]);
    const start = getNumber(candidate, [
      "start",
      "start_time",
      "startTime",
      "time",
      "timestamp.0",
    ]);
    const end = getNumber(candidate, ["end", "end_time", "endTime", "timestamp.1"]);
    if (!word || start === undefined) return [];
    return [
      {
        word,
        normalized: normalizeWord(word),
        startMs: toMilliseconds(start),
        endMs: end === undefined ? undefined : toMilliseconds(end),
      },
    ] satisfies AlignedWord[];
  });
}

function collectWordCandidates(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectWordCandidates(item));
  }
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of [
    "words",
    "word_segments",
    "single_word_segments",
    "segments",
    "alignment",
    "chunks",
  ]) {
    if (Array.isArray(record[key])) {
      return collectWordCandidates(record[key]);
    }
  }

  if (
    getString(record, ["word", "text", "label", "token"]) &&
    getNumber(record, ["start", "start_time", "startTime", "time", "timestamp.0"]) !==
      undefined
  ) {
    return [record];
  }

  return [];
}

function buildAlignmentResult(item: AlignableItem, alignedWords: AlignedWord[]) {
  const tokens = getWordTokens(item.text);
  const warnings: string[] = [];
  const keypoints: { rangeEnd: number; audioStart: number }[] = [];
  let alignedIndex = 0;

  for (const token of tokens) {
    const aligned = findNextAlignedWord(alignedWords, token.normalized, alignedIndex);
    if (!aligned) {
      warnings.push(`No aligned word found for "${token.text}" at ${token.start}.`);
      continue;
    }
    if (aligned.index !== alignedIndex) {
      warnings.push(
        `Skipped ${aligned.index - alignedIndex} aligned word(s) before "${token.text}".`,
      );
    }
    alignedIndex = aligned.index + 1;
    keypoints.push({
      rangeEnd: token.end,
      audioStart: aligned.word.startMs,
    });
  }

  if (alignedIndex < alignedWords.length) {
    warnings.push(`${alignedWords.length - alignedIndex} trailing aligned word(s).`);
  }

  return {
    itemId: item.id,
    filename: item.filename,
    text: item.text,
    wordCount: tokens.length,
    alignedWordCount: alignedWords.length,
    keypoints,
    serializedText: timings_to_text({
      filename: item.filename,
      keypoints,
    }),
    warnings,
  } satisfies AlignmentResult;
}

function findNextAlignedWord(
  alignedWords: AlignedWord[],
  normalizedToken: string,
  fromIndex: number,
) {
  for (let index = fromIndex; index < alignedWords.length; index += 1) {
    const aligned = alignedWords[index];
    if (aligned?.normalized === normalizedToken) {
      return { index, word: aligned };
    }
  }
  const fallback = alignedWords[fromIndex];
  if (!fallback) return null;
  return { index: fromIndex, word: fallback };
}

function getWordTokens(text: string) {
  const tokens: WordToken[] = [];
  const regex = /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu;
  for (const match of text.matchAll(regex)) {
    const word = match[0];
    const start = match.index ?? 0;
    const normalized = normalizeWord(word);
    if (!normalized) continue;
    tokens.push({
      text: word,
      normalized,
      start,
      end: start + word.length,
    });
  }
  return tokens;
}

function getAlignmentText(text: string) {
  const tokens = getWordTokens(text).map((token) => token.normalized);
  if (tokens.length > 0) return tokens.join(" ");
  return normalizeWord(text);
}

function normalizeWord(word: string) {
  return word
    .toLocaleLowerCase("da-DK")
    .normalize("NFKC")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^\p{L}\p{N}]+/gu, "");
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

function parseArgs(argv: string[]) {
  const parsed: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--story") parsed.story = argv[++index];
    else if (arg === "--output") parsed.output = argv[++index];
    else if (arg === "--align") parsed.align = true;
    else if (arg === "--apply") parsed.apply = true;
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return parsed;
}

function parseRequiredNumber(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    console.error("Error: provide --story <legacyStoryId>.");
    process.exit(1);
  }
  return parsed;
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

function toMilliseconds(value: number) {
  if (ALIGN_TIME_UNIT === "ms" || ALIGN_TIME_UNIT === "milliseconds") {
    return Math.round(value);
  }
  return Math.round(value * 1000);
}

function getString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getPath(record, key);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function getNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getPath(record, key);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function getPath(record: Record<string, unknown>, pathKey: string): unknown {
  return pathKey.split(".").reduce<unknown>((value, key) => {
    if (Array.isArray(value)) return value[Number(key)];
    if (value && typeof value === "object") {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
}

function safeFileName(value: string, extension: string) {
  return `${value.replace(/[^a-zA-Z0-9_-]+/g, "_")}${extension}`;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function printSummary(results: AlignmentResult[], outputPath: string) {
  const warningCount = results.reduce(
    (total, result) => total + result.warnings.length,
    0,
  );
  console.log("\n=== Forced Alignment Summary ===");
  console.log(`Aligned rows: ${results.length}`);
  console.log(`Warnings: ${warningCount}`);
  console.log(`Results: ${path.join(outputPath, "results.json")}`);
  console.log(`Patched story text: ${path.join(outputPath, "story.patched.txt")}`);
  for (const result of results.filter((item) => item.warnings.length > 0)) {
    console.log(`\n${result.itemId}:`);
    for (const warning of result.warnings.slice(0, 5)) {
      console.log(`- ${warning}`);
    }
    if (result.warnings.length > 5) {
      console.log(`- ...${result.warnings.length - 5} more`);
    }
  }
}

function printHelp() {
  console.log(`Usage:
  pnpm exec tsx scripts/forced-align-story-audio.ts --story <legacyStoryId>
  pnpm exec tsx scripts/forced-align-story-audio.ts --story <legacyStoryId> --align
  pnpm exec tsx scripts/forced-align-story-audio.ts --story <legacyStoryId> --align --apply

Environment:
  NEXT_PUBLIC_CONVEX_URL or CONVEX_URL
  FORCED_ALIGN_CONVEX_URL            Optional explicit Convex URL override
  CONVEX_AUTH_TOKEN                  Required for --apply
  ALIGN_AUDIO_BASE_URL               Optional audio blob base URL
  FORCED_ALIGN_COMMAND               Required for --align
  FORCED_ALIGN_MODEL                 Optional command placeholder
  FORCED_ALIGN_TIME_UNIT=seconds|ms  Defaults to seconds

Command placeholders:
  {audio} {text} {json} {language} {model}
`);
}

main().catch((error) => {
  console.error("Forced alignment failed.");
  console.error(error);
  process.exit(1);
});
