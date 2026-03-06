import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { getUser, isContributor } from "@/lib/userInterface";

const WebSocket = require("ws");

type StoryLine = {
  speaker: string;
  text: string;
};

type AgentPreviewResult = {
  audioBase64: string;
  transcript: string;
  lines: StoryLine[];
  events: string[];
};

function sanitizeSpeakerLabel(input: string): string {
  const normalized = input
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");
  if (!normalized) return "Narrator";
  if (/^[0-9]/.test(normalized)) return `Speaker_${normalized}`;
  return normalized;
}

const SPEAKER_LABEL_MAP: Record<string, string> = {
  narrator: "Narrator",
  viktram: "Speaker593",
  speaker593: "Speaker593",
  priti: "Speaker560",
  speaker560: "Speaker560",
};

const VOICE_ID_HINTS: Record<string, string> = {
  Narrator: "V34B5u5UbLdNJVEkcgXp",
  Speaker593: "xj6X4BCUsv9oxohm1E8o",
  Speaker560: "4RklGmuxoAskAbGXplXN",
};

function mapSpeakerToAgentLabel(input: string): string {
  const key = sanitizeSpeakerLabel(input).toLowerCase();
  return SPEAKER_LABEL_MAP[key] ?? "Narrator";
}

function pushIfLine(lines: StoryLine[], speaker: unknown, text: unknown): void {
  if (typeof text !== "string") return;
  const trimmed = text.trim();
  if (!trimmed) return;
  const rawSpeaker =
    typeof speaker === "string" && speaker.trim() ? speaker : "Narrator";
  lines.push({ speaker: mapSpeakerToAgentLabel(rawSpeaker), text: trimmed });
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

function toTaggedTranscript(lines: StoryLine[]): string {
  return lines
    .map((line) => `<${line.speaker}>${line.text}</${line.speaker}>`)
    .join("\n");
}

async function generateAgentPreview(
  agentId: string,
  taggedTranscript: string,
): Promise<{ audioBase64: string; events: string[] }> {
  const apiKey = process.env.ELEVENLABS_APIKEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_APIKEY is not configured.");
  }

  const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
  const ws = new WebSocket(url, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  return await new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const events: string[] = [];
    let sawAgentResponse = false;
    let idleTimer: NodeJS.Timeout | undefined;
    let hardTimeout: NodeJS.Timeout | undefined;

    function resetIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (sawAgentResponse && chunks.length > 0) {
          ws.close();
          resolve({ audioBase64: chunks.join(""), events });
        }
      }, 1500);
    }

    function cleanupTimers() {
      if (idleTimer) clearTimeout(idleTimer);
      if (hardTimeout) clearTimeout(hardTimeout);
    }

    hardTimeout = setTimeout(() => {
      cleanupTimers();
      ws.close();
      reject(new Error("Timed out waiting for agent audio response."));
    }, 30000);

    ws.on("open", () => {
      const voiceHints = [
        "Speaker label voice references:",
        `<Narrator> -> ${VOICE_ID_HINTS.Narrator}`,
        `<Speaker593> -> ${VOICE_ID_HINTS.Speaker593}`,
        `<Speaker560> -> ${VOICE_ID_HINTS.Speaker560}`,
      ].join("\n");
      const promptText = [
        "Read the following text exactly as written, preserving the speaker tags.",
        "Do not add or remove words.",
        voiceHints,
        "",
        taggedTranscript,
      ].join("\n");

      ws.send(
        JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_initiation_client_data: {},
        }),
      );

      ws.send(
        JSON.stringify({
          type: "user_message",
          text: promptText,
        }),
      );

      resetIdleTimer();
    });

    ws.on("message", (rawData: Buffer | string) => {
      const payload = rawData.toString();
      let data: Record<string, unknown>;

      try {
        data = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        return;
      }

      const eventType = typeof data.type === "string" ? data.type : "unknown";
      events.push(eventType);

      if (eventType === "agent_response") {
        sawAgentResponse = true;
      }

      const directAudio = typeof data.audio === "string" ? data.audio : null;
      const audioEvent =
        data.audio_event && typeof data.audio_event === "object"
          ? (data.audio_event as { audio_base_64?: unknown })
          : undefined;
      const eventAudio =
        audioEvent && typeof audioEvent.audio_base_64 === "string"
          ? audioEvent.audio_base_64
          : null;

      if (directAudio) {
        chunks.push(directAudio);
      }
      if (eventAudio) {
        chunks.push(eventAudio);
      }

      if (directAudio || eventAudio || eventType === "agent_response") {
        resetIdleTimer();
      }
    });

    ws.on("error", (error: Error) => {
      cleanupTimers();
      reject(error);
    });

    ws.on("close", () => {
      cleanupTimers();
      if (chunks.length > 0) {
        resolve({ audioBase64: chunks.join(""), events });
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const token = await getUser();
  if (!token || !isContributor(token)) {
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });
  }

  const body = (await req.json()) as {
    storyId?: unknown;
    lineCount?: unknown;
    agentId?: unknown;
  };

  const storyId = Number(body.storyId);
  const lineCountRaw = Number(body.lineCount);
  const lineCount = Number.isFinite(lineCountRaw)
    ? Math.max(1, Math.min(20, Math.floor(lineCountRaw)))
    : 5;
  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";

  if (!Number.isFinite(storyId) || storyId <= 0) {
    return new Response("Invalid storyId", { status: 400 });
  }

  if (!agentId) {
    return new Response("agentId is required", { status: 400 });
  }

  const story = await fetchQuery(api.storyRead.getStoryByLegacyId, {
    storyId,
  });

  if (!story) {
    return new Response("Story not found", { status: 404 });
  }

  const lines = extractStoryLines(story.elements, lineCount);
  if (lines.length === 0) {
    return new Response("No speakable lines found for this story", {
      status: 400,
    });
  }

  const transcript = toTaggedTranscript(lines);

  let generation: { audioBase64: string; events: string[] };
  try {
    generation = await generateAgentPreview(agentId, transcript);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent generation failed";
    return NextResponse.json(
      {
        error: message,
        transcript,
        lines,
      },
      { status: 502 },
    );
  }

  if (!generation.audioBase64) {
    return NextResponse.json(
      {
        error: "Agent returned no audio chunks.",
        transcript,
        lines,
        events: generation.events,
      },
      { status: 502 },
    );
  }

  const result: AgentPreviewResult = {
    audioBase64: generation.audioBase64,
    transcript,
    lines,
    events: generation.events,
  };

  return NextResponse.json(result);
}
