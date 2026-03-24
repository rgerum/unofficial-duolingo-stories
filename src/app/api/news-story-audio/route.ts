import { NextResponse } from "next/server";
import { audio_engines } from "@/app/audio/_lib/audio";
import type { SynthesisResult } from "@/app/audio/_lib/audio/types";

/**
 * POST /api/news-story-audio
 *
 * Generates TTS audio for a single story line.
 * No authentication required (for news-test page).
 * Returns base64-encoded MP3 audio + word timing marks.
 *
 * Body: { text: string, voice: string }
 * Response: { content: string, marks?: AudioMark[], timepoints?: Timepoint[] }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { text, voice } = body as { text: string; voice: string };

  if (!text || !voice) {
    return NextResponse.json(
      { error: "Missing 'text' or 'voice' in request body" },
      { status: 400 },
    );
  }

  console.log(
    `[news-story-audio] Generating audio: voice="${voice}", text="${text.substring(0, 60)}..."`,
  );

  let result: SynthesisResult | undefined;
  for (const engine of audio_engines) {
    if (await engine.isValidVoice(voice)) {
      try {
        console.log(`[news-story-audio] Using engine: ${engine.name}`);
        // Pass undefined as filename → engine returns base64 content instead of saving to blob
        result = await engine.synthesizeSpeech(
          undefined as unknown as string,
          voice,
          text,
        );
        result.engine = engine.name;
        break;
      } catch (e) {
        console.error(`[news-story-audio] Engine ${engine.name} failed:`, e);
      }
      break;
    }
  }

  if (!result) {
    console.error(`[news-story-audio] No engine could handle voice: ${voice}`);
    return NextResponse.json(
      { error: `No TTS engine found for voice: ${voice}` },
      { status: 404 },
    );
  }

  console.log(`[news-story-audio] Audio generated via ${result.engine}`);

  return NextResponse.json({
    content: result.content,
    marks: result.marks,
    timepoints: result.timepoints,
    engine: result.engine,
  });
}
