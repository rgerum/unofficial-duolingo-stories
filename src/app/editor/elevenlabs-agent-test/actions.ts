"use server";

import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { getUser, isContributor } from "@/lib/userInterface";

type StoryLine = {
  speaker: string;
  text: string;
  voiceId: string;
};

export type PreviewActionState = {
  error?: string;
  audioBase64?: string;
  transcript?: string;
  lines?: StoryLine[];
  events?: string[];
};

const DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17";

const SPEAKER_TO_VOICE_ID: Record<string, string> = {
  narrator: "CwhRBWXzGAHq8TQ4Fs17",
  vikram: "onwK4e9ZLuTAKqWW03F9",
  viktram: "onwK4e9ZLuTAKqWW03F9",
  speaker593: "onwK4e9ZLuTAKqWW03F9",
  priti: "FGY2WhTYpPnrIDTdsKH5",
  speaker560: "FGY2WhTYpPnrIDTdsKH5",
};

function sanitizeSpeakerLabel(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");
}

function voiceIdForSpeaker(speaker: string): string {
  const key = sanitizeSpeakerLabel(speaker).toLowerCase();
  return SPEAKER_TO_VOICE_ID[key] ?? DEFAULT_VOICE_ID;
}

function pushIfLine(lines: StoryLine[], speaker: unknown, text: unknown): void {
  if (typeof text !== "string") return;
  const trimmed = text.trim();
  if (!trimmed) return;
  const rawSpeaker =
    typeof speaker === "string" && speaker.trim() ? speaker : "Narrator";
  lines.push({
    speaker: rawSpeaker,
    text: trimmed,
    voiceId: voiceIdForSpeaker(rawSpeaker),
  });
}

function extractStoryLines(elements: unknown[], maxLines: number): StoryLine[] {
  const lines: StoryLine[] = [];

  for (const element of elements) {
    if (lines.length >= maxLines) break;
    if (!element || typeof element !== "object") continue;

    const candidate = element as {
      type?: unknown;
      learningLanguageTitleContent?: { text?: unknown };
      line?: {
        type?: unknown;
        characterName?: unknown;
        characterId?: unknown;
        content?: { text?: unknown };
      };
    };

    if (candidate.type === "HEADER") {
      pushIfLine(
        lines,
        "Narrator",
        candidate.learningLanguageTitleContent?.text,
      );
      continue;
    }

    if (candidate.type !== "LINE") continue;

    const lineType = candidate.line?.type;
    const speaker =
      lineType === "CHARACTER"
        ? (candidate.line?.characterName ??
          candidate.line?.characterId ??
          "Narrator")
        : "Narrator";

    pushIfLine(lines, speaker, candidate.line?.content?.text);
  }

  return lines;
}

async function generateDialogueAudio(
  lines: StoryLine[],
): Promise<{ audioBase64: string; events: string[] }> {
  const apiKey = process.env.ELEVENLABS_APIKEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_APIKEY is not configured.");
  }

  const payload = {
    inputs: lines.map((line) => ({ text: line.text, voice_id: line.voiceId })),
    model_id: "eleven_v3",
  };

  console.log(
    "[ElevenLabs Dialogue Test] Payload sent:",
    JSON.stringify(payload, null, 2),
  );

  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-dialogue",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs text-to-dialogue failed (${response.status}): ${errorText}`,
    );
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  if (audioBuffer.length === 0) {
    throw new Error("ElevenLabs returned empty audio.");
  }

  return {
    audioBase64: audioBuffer.toString("base64"),
    events: ["text-to-dialogue:ok"],
  };
}

export async function generatePreviewAction(
  _prevState: PreviewActionState,
  formData: FormData,
): Promise<PreviewActionState> {
  const token = await getUser();
  if (!token || !isContributor(token)) {
    return { error: "You need to be a registered contributor." };
  }

  const storyIdRaw = formData.get("storyId");
  const lineCountRaw = formData.get("lineCount");

  const storyId = Number(storyIdRaw);
  const lineCountParsed = Number(lineCountRaw);
  const lineCount = Number.isFinite(lineCountParsed)
    ? Math.max(1, Math.min(20, Math.floor(lineCountParsed)))
    : 5;

  if (!Number.isFinite(storyId) || storyId <= 0) {
    return { error: "Story ID must be a positive number." };
  }

  const story = await fetchQuery(api.storyRead.getStoryByLegacyId, { storyId });
  if (!story) {
    return { error: `Story ${storyId} not found.` };
  }

  const lines = extractStoryLines(story.elements, lineCount);
  if (lines.length === 0) {
    return { error: "No speakable lines found for this story." };
  }

  const transcript = lines
    .map((line) => `[${line.speaker} -> ${line.voiceId}] ${line.text}`)
    .join("\n");

  try {
    const generation = await generateDialogueAudio(lines);
    return {
      audioBase64: generation.audioBase64,
      transcript,
      lines,
      events: generation.events,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Dialogue generation failed.",
      transcript,
      lines,
    };
  }
}
