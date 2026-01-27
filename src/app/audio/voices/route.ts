import { NextRequest, NextResponse } from "next/server";
import { audio_engines } from "../_lib/audio";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/userInterface";
import type { Voice } from "../_lib/audio/types";

export async function GET(_req: NextRequest) {
  const token = await getUser();

  if (!token?.admin)
    return new Response("You need to be a registered admin.", { status: 401 });

  let voices: Voice[] = [];
  for (const engine of audio_engines) {
    try {
      voices = voices.concat(await engine.getVoices());
    } catch (e) {
      console.log("error", engine.name);
    }
  }

  for (let v of voices) {
    try {
      await sql`
        REPLACE INTO speaker (language_id, speaker, gender, type, service)
         VALUES ((SELECT id FROM language WHERE short = ${v.locale} OR short = ${v.language} LIMIT 1), ${v.name}, ${v.gender}, ${v.type}, ${v.service});`;
    } catch (e) {
      console.log("unknown language", v?.language, v);
    }
  }

  return NextResponse.json(voices);
}
