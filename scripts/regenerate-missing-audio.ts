import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import type { Avatar } from "@/app/editor/story/[story]/types";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import type {
  Audio,
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import {
  synthesis_response_to_keypoints,
  timings_to_text,
} from "@/lib/editor/audio/audio_timing";
import { checkStoryLineAudio } from "@/app/editor/story/[story]/v2/audio_problem_check";

dotenv.config({ path: process.env.REGEN_ENV_FILE ?? ".env.local" });

const AUDIO_BASE_URL =
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/";
const PROD_CONVEX_URL = "https://posh-caribou-319.convex.cloud";

const TODO_COMMENT = `# TODO check audio: regenerated ${new Date().toISOString().slice(0, 10)} after the original file was lost from storage; the voice may have changed, listen and verify this line`;

type CliOptions = {
  storyIds: number[];
  prod: boolean;
  apply: boolean;
  identity: string | null;
  voiceMap: Record<string, string>;
};

function usage(exitCode: 0 | 1): never {
  console.error(`Regenerate story audio lines whose files are missing from Vercel Blob.

For each requested story this script finds $<file>.mp3 references whose file
404s in blob storage, re-runs TTS with the line's speaker voice, uploads the
new file, rewrites the $-line with fresh keypoints, inserts a
"# TODO check audio" comment above it, and saves the story.

Usage:
  pnpm exec tsx scripts/regenerate-missing-audio.ts --stories 7611,7215 [--prod] [--apply --identity '{"role":"admin","userId":11,"name":"..."}']

Options:
  --stories <ids>      Comma-separated legacy story ids (or repeat --story <id>)
  --prod               Target the production Convex deployment (required)
  --apply              Actually synthesize, upload, and save (default: dry run)
  --identity <json>    Acting identity, e.g. '{"role":"admin","userId":11,"name":"..."}'
  --voice-map <pairs>  Substitute retired TTS voices, e.g.
                       'zh-HK-TracyRUS=zh-HK-HiuGaaiNeural,zh-HK-Danny=zh-HK-WanLungNeural'

Authenticates with the deployment admin key obtained through the logged-in
Convex CLI account (~/.convex/config.json), acting as --identity.
`);
  process.exit(exitCode);
}

function parseOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    storyIds: [],
    prod: false,
    apply: false,
    identity: null,
    voiceMap: {},
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") usage(0);
    else if (arg === "--prod") options.prod = true;
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--identity") options.identity = argv[++index] ?? null;
    else if (arg === "--story") {
      options.storyIds.push(Number.parseInt(argv[++index] ?? "", 10));
    } else if (arg === "--stories") {
      for (const part of (argv[++index] ?? "").split(",")) {
        if (part.trim()) options.storyIds.push(Number.parseInt(part, 10));
      }
    } else if (arg === "--voice-map") {
      for (const pair of (argv[++index] ?? "").split(",")) {
        const [from, to] = pair.split("=").map((value) => value.trim());
        if (!from || !to) {
          console.error(`Invalid --voice-map entry: ${pair}`);
          usage(1);
        }
        options.voiceMap[from] = to;
      }
    } else {
      console.error(`Unknown argument: ${arg}`);
      usage(1);
    }
  }
  if (
    !options.storyIds.length ||
    options.storyIds.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    console.error("Provide at least one valid story id.");
    usage(1);
  }
  if (!options.identity) {
    console.error(
      "--identity is required (the editor read queries are gated on the deployment).",
    );
    usage(1);
  }
  if (!options.prod) {
    console.error("Only --prod is supported (admin key is fetched per prod deployment).");
    usage(1);
  }
  return options;
}

const options = parseOptions(process.argv.slice(2));
// The Polly engine resolves voices through NEXT_PUBLIC_CONVEX_URL at module
// load, so pin it to the target deployment before the engines are imported.
process.env.NEXT_PUBLIC_CONVEX_URL = PROD_CONVEX_URL;

// Authenticate like `convex run --prod --identity ...` does, but in-process:
// trade the CLI account token for the prod deployment admin key and act as
// the given identity. (The CLI itself cannot be used for saves — story JSON
// payloads can exceed the OS per-argument size limit.)
async function createAdminClient() {
  const configPath = path.join(os.homedir(), ".convex", "config.json");
  const { accessToken } = JSON.parse(await readFile(configPath, "utf8")) as {
    accessToken: string;
  };
  const deploymentName = (process.env.CONVEX_DEPLOYMENT ?? "").replace(
    /^[a-z]+:/,
    "",
  );
  if (!deploymentName) throw new Error("CONVEX_DEPLOYMENT is not set.");
  const response = await fetch(
    "https://api.convex.dev/api/deployment/authorize_prod",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Convex-Client": "npm-cli-1.0.0",
      },
      body: JSON.stringify({ deploymentName }),
    },
  );
  if (!response.ok) {
    throw new Error(`authorize_prod failed (${response.status}).`);
  }
  const { url, adminKey } = (await response.json()) as {
    url: string;
    adminKey: string;
  };
  const identityBase = JSON.parse(options.identity!) as Record<string, unknown>;
  const issuer = String(identityBase.issuer ?? "https://convex.test");
  const subject = String(identityBase.subject ?? "regenerate-missing-audio");
  const identity = {
    ...identityBase,
    issuer,
    subject,
    tokenIdentifier: `${issuer}|${subject}`,
  };
  const client = new ConvexHttpClient(url);
  (
    client as unknown as {
      setAdminAuth: (token: string, actingAs: unknown) => void;
    }
  ).setAdminAuth(adminKey, identity);
  return client;
}

let adminClient: ConvexHttpClient;

// biome-ignore lint/suspicious/noExplicitAny: untyped by-name function calls
function fn(name: string): any {
  return name;
}

function runConvexQuery<T>(functionName: string, payload: unknown): Promise<T> {
  return adminClient.query(fn(functionName), payload as never) as Promise<T>;
}

function runConvexMutation(functionName: string, payload: unknown) {
  return adminClient.mutation(fn(functionName), payload as never);
}

type RegenTarget = {
  element: StoryElementLine | StoryElementHeader;
  ssml: Audio["ssml"];
  oldUrl: string;
  lineNo: number;
  lineIndex: number | undefined;
  plainText: string;
};

function getAudioContent(element: StoryElement) {
  if (element.type === "LINE") return element.line?.content;
  if (element.type === "HEADER") return element.learningLanguageTitleContent;
  return undefined;
}

// Mirrors the sanitizer the v2 editor applies before storyWrite:setStory.
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

// Only a confirmed 404 may trigger regeneration — a rate limit, 5xx, or
// network error must not cause an existing file to be replaced.
async function checkUrl(url: string): Promise<"exists" | "missing" | "unknown"> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) return "exists";
    if (response.status === 404) return "missing";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function getParseContext(
  learningLanguageId: number,
  fromLanguageId: number,
) {
  const [learningLanguage, fromLanguage, avatars] = await Promise.all([
    runConvexQuery<{ short?: string; tts_replace?: string } | null>(
      "editorRead:getEditorLanguageByLegacyId",
      { legacyLanguageId: learningLanguageId },
    ),
    runConvexQuery<{ short?: string } | null>(
      "editorRead:getEditorLanguageByLegacyId",
      { legacyLanguageId: fromLanguageId },
    ),
    runConvexQuery<Avatar[]>(
      "editorRead:getEditorAvatarNamesByLanguageLegacyId",
      { languageLegacyId: learningLanguageId },
    ),
  ]);
  const avatarNames: Record<number, Avatar> = {};
  for (const avatar of avatars) {
    let speaker = avatar.speaker ?? "";
    for (const [from, to] of Object.entries(options.voiceMap)) {
      if (speaker.includes(from)) {
        speaker = speaker.split(from).join(to);
        console.log(
          `  voice-map: avatar ${avatar.avatar_id} (${avatar.name}) ${avatar.speaker} -> ${speaker}`,
        );
      }
    }
    avatarNames[avatar.avatar_id] = { ...avatar, speaker };
  }
  return { learningLanguage, fromLanguage, avatarNames };
}

async function synthesizeLine(
  engines: Awaited<typeof import("@/app/audio/_lib/audio")>["audio_engines"],
  storyId: number,
  ssml: Audio["ssml"],
) {
  const speaker = (ssml.speaker ?? "").trim();
  if (!speaker) throw new Error("Line has no speaker voice.");

  const file = `${randomUUID().split("-")[0]}.mp3`;
  const blobPath = `audio/${storyId}/${file}`;
  for (const engine of engines) {
    if (await engine.isValidVoice(speaker)) {
      const answer = await engine.synthesizeSpeech(blobPath, speaker, ssml.text);
      const keypoints = synthesis_response_to_keypoints(
        answer,
        (ssml as { mapping?: Record<number, number> }).mapping ?? {},
      );
      return {
        engine: engine.name,
        blobPath,
        serializedText: timings_to_text({
          filename: `${storyId}/${file}`,
          keypoints,
        }),
      };
    }
  }
  throw new Error(`No TTS engine accepts voice "${speaker}".`);
}

function applyTextUpdates(
  docText: string,
  updates: { lineNo: number; serializedText: string }[],
) {
  const lines = docText.split("\n");
  const sorted = [...updates].sort((a, b) => b.lineNo - a.lineNo);
  for (const update of sorted) {
    const index = update.lineNo - 1;
    if (index < 0 || index >= lines.length || !lines[index].trim().startsWith("$")) {
      throw new Error(
        `Line ${update.lineNo} is not an audio line: ${JSON.stringify(lines[index])}`,
      );
    }
    lines[index] = update.serializedText;
    const previous = lines[index - 1] ?? "";
    if (!previous.trim().startsWith("# TODO check audio")) {
      lines.splice(index, 0, TODO_COMMENT);
    }
  }
  return lines.join("\n");
}

async function processStory(
  storyId: number,
  engines: Awaited<typeof import("@/app/audio/_lib/audio")>["audio_engines"],
) {
  const data = await runConvexQuery<{
    story_data: {
      id: number;
      official: boolean;
      course_id: number;
      duo_id: string;
      name: string;
      text: string;
      learning_language: number;
      from_language: number;
    };
  } | null>("editorRead:getEditorStoryPageData", { storyId });
  if (!data) {
    console.error(`[${storyId}] story not found, skipping.`);
    return { storyId, status: "not_found" as const };
  }
  const storyData = data.story_data;
  if (storyData.official) {
    console.error(`[${storyId}] story is official, skipping.`);
    return { storyId, status: "official_skipped" as const };
  }

  const { learningLanguage, fromLanguage, avatarNames } = await getParseContext(
    storyData.learning_language,
    storyData.from_language,
  );
  const storyLanguages = {
    learning_language: learningLanguage?.short ?? "",
    from_language: fromLanguage?.short ?? "",
  };
  const ttsReplace = learningLanguage?.tts_replace ?? "";

  const [parsedStory, , audioInsertLines] = processStoryFile(
    storyData.text,
    storyData.id,
    avatarNames,
    storyLanguages,
    ttsReplace,
  );

  const targets: RegenTarget[] = [];
  const checkFailures: string[] = [];
  for (const element of parsedStory.elements) {
    if (element.type !== "LINE" && element.type !== "HEADER") continue;
    const content = getAudioContent(element);
    const audio = content?.audio;
    if (!audio?.url || !audio.ssml) continue;
    if (/^(https?:|blob:)/.test(audio.url)) continue;
    const status = await checkUrl(
      `${AUDIO_BASE_URL}${audio.url.replace(/^\/+/, "")}`,
    );
    if (status === "exists") continue;
    if (status === "unknown") {
      console.error(
        `[${storyId}] could not verify ${audio.url} (not a 404), skipping that line.`,
      );
      checkFailures.push(`${audio.url}: existence check inconclusive`);
      continue;
    }
    const inserIndex = (audio.ssml as { inser_index?: number }).inser_index;
    const lineNo =
      inserIndex !== undefined ? audioInsertLines[inserIndex]?.[0] : undefined;
    if (lineNo === undefined) {
      console.error(
        `[${storyId}] cannot locate the $-line for missing audio ${audio.url}, skipping that line.`,
      );
      continue;
    }
    targets.push({
      element,
      ssml: audio.ssml,
      oldUrl: audio.url,
      lineNo,
      lineIndex: element.trackingProperties?.line_index,
      plainText: content?.text ?? "",
    });
  }

  if (!targets.length) {
    if (checkFailures.length) {
      return { storyId, status: "failed" as const, failures: checkFailures };
    }
    console.log(
      `[${storyId}] all referenced audio files exist, nothing to do.`,
    );
    return { storyId, status: "ok" as const, regenerated: 0 };
  }

  console.log(`[${storyId}] ${storyData.name}: ${targets.length} line(s) with missing audio.`);
  for (const target of targets) {
    console.log(
      `  line ${target.lineNo} (${target.oldUrl}) voice=${target.ssml.speaker ?? "<none>"} text=${JSON.stringify(target.plainText.slice(0, 60))}`,
    );
  }
  if (!options.apply) {
    return {
      storyId,
      status: "dry_run" as const,
      regenerated: targets.length,
      failures: checkFailures,
    };
  }

  const updates: { lineNo: number; serializedText: string }[] = [];
  const failures: string[] = [...checkFailures];
  for (const target of targets) {
    try {
      const result = await synthesizeLine(engines, storyData.id, target.ssml);
      if ((await checkUrl(`${AUDIO_BASE_URL}${result.blobPath}`)) !== "exists") {
        throw new Error(`Upload verification failed for ${result.blobPath}.`);
      }
      updates.push({
        lineNo: target.lineNo,
        serializedText: result.serializedText,
      });
      console.log(
        `  line ${target.lineNo}: regenerated via ${result.engine} -> ${result.blobPath}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`line ${target.lineNo}: ${message}`);
      console.error(`  line ${target.lineNo}: FAILED (${message})`);
    }
  }

  if (!updates.length) {
    return { storyId, status: "failed" as const, failures };
  }

  const newText = applyTextUpdates(storyData.text, updates);
  const [newParsedStory, newMeta] = processStoryFile(
    newText,
    storyData.id,
    avatarNames,
    storyLanguages,
    ttsReplace,
  );
  const audioCheck = await checkStoryLineAudio(newParsedStory);

  await runConvexMutation("storyWrite:setStory", {
    legacyStoryId: storyData.id,
    duo_id: storyData.duo_id ?? "",
    name: newMeta.fromLanguageName,
    image: newMeta.icon ?? "",
    set_id: newMeta.set_id,
    set_index: newMeta.set_index,
    legacyCourseId: storyData.course_id,
    text: newText,
    expectedText: storyData.text,
    json: toConvexValue(newParsedStory),
    todo_count: newMeta.todo_count,
    audioProblemCount: audioCheck.audioProblemCount,
    change_date: new Date().toISOString(),
    operationKey: `story:${storyData.id}:regenerate_missing_audio:${Date.now()}`,
  });
  console.log(
    `[${storyId}] saved (${updates.length} regenerated, ${failures.length} failed, audioProblemCount=${audioCheck.audioProblemCount}).`,
  );
  return {
    storyId,
    status: failures.length ? ("partial" as const) : ("ok" as const),
    regenerated: updates.length,
    failures,
  };
}

async function main() {
  adminClient = await createAdminClient();
  const { audio_engines } = await import("@/app/audio/_lib/audio");
  const results = [];
  for (const storyId of options.storyIds) {
    try {
      results.push(await processStory(storyId, audio_engines));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${storyId}] FAILED: ${message}`);
      results.push({ storyId, status: "failed" as const, failures: [message] });
    }
  }

  console.log("\nSummary:");
  for (const result of results) {
    const failures = "failures" in result ? result.failures : undefined;
    console.log(
      `  ${result.storyId}: ${result.status}` +
        ("regenerated" in result && result.regenerated !== undefined
          ? ` (${result.regenerated} line(s))`
          : "") +
        (failures?.length ? ` failures: ${failures.join("; ")}` : ""),
    );
  }
  const bad = results.filter(
    (result) =>
      (result.status !== "ok" && result.status !== "dry_run") ||
      ("failures" in result && (result.failures?.length ?? 0) > 0),
  );
  process.exit(bad.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
