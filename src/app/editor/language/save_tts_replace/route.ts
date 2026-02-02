import { NextResponse, NextRequest } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getUser } from "@/lib/userInterface";

export async function POST(req: NextRequest) {
  try {
    const { id, tts_replace } = await req.json();
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    const answer = await fetchMutation(api.editor.updateLanguageTtsReplace, {
      languageLegacyId: id,
      tts_replace,
    });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}
