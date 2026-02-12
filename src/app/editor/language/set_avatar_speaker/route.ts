import { NextResponse } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";
import { z } from "zod";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

const AvatarSetSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  speaker: z.string(),
  language_id: z.number(),
  avatar_id: z.number(),
});

export async function POST(req: Request) {
  try {
    const { name, speaker, language_id, avatar_id } = AvatarSetSchema.parse(
      await req.json(),
    );
    const token = await getUser();

    if (!token)
      return new Response("You need to be logged in.", {
        status: 401,
      });

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_avatar({
      name,
      speaker,
      language_id,
      avatar_id,
    });

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

async function set_avatar({
  name,
  speaker,
  language_id,
  avatar_id,
}: {
  name: string;
  speaker: string;
  language_id: number;
  avatar_id: number;
}) {
  return await fetchAuthMutation(api.languageWrite.setAvatarSpeaker, {
    legacyLanguageId: language_id,
    legacyAvatarId: avatar_id,
    name,
    speaker,
    operationKey: `avatar_mapping:${language_id}:${avatar_id}:route`,
  });
}
