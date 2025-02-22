import { NextResponse } from "next/server";
import { audio_engines } from "../_lib/audio";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/userInterface";

export async function GET(req) {
  const token = await getUser(req);

  if (!token?.admin)
    return new Response("You need to be a registered admin.", { status: 401 });

  let voices = [];
  for (let engine of audio_engines) {
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
