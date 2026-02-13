import { NextResponse, NextRequest } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const { id, tts_replace } = await req.json();
    const token = await getUser();

    if (!token)
      return new Response("You need to be logged in.", {
        status: 401,
      });

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_tts_replace({ id, tts_replace });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isMirrorFailure = message.includes("Convex mirror");
    return new Response(message, {
      status: isMirrorFailure ? 502 : 500,
    });
  }
}

async function set_tts_replace({
  id,
  tts_replace,
}: {
  id: number;
  tts_replace: string;
}) {
  return await fetchAuthMutation(api.languageWrite.setTtsReplace, {
    legacyLanguageId: id,
    tts_replace,
    operationKey: `language:${id}:tts_replace:route`,
  });
}
