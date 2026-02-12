import { NextRequest, NextResponse } from "next/server";
import { audio_engines } from "../_lib/audio";
import { getUser, isAdmin } from "@/lib/userInterface";
import type { Voice } from "../_lib/audio/types";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function GET(_req: NextRequest) {
  const token = await getUser();

  if (!isAdmin(token))
    return new Response("You need to be a registered admin.", { status: 401 });

  let voices: Voice[] = [];
  for (const engine of audio_engines) {
    try {
      voices = voices.concat(await engine.getVoices());
    } catch (e) {
      //console.log("error", engine.name);
    }
  }

  for (let v of voices) {
    try {
      await fetchAuthMutation(api.languageWrite.upsertSpeakerFromVoice, {
        localeShort: v.locale,
        languageShort: v.language,
        speaker: v.name,
        gender: v.gender,
        type: v.type,
        service: v.service,
        operationKey: `speaker:${v.name}:sync:route`,
      });
    } catch (e) {
      //console.log("unknown language", v?.language, v);
    }
  }

  return NextResponse.json(voices);
}
