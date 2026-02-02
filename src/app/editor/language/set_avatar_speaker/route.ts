import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getUser } from "@/lib/userInterface";
import { z } from "zod";

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

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    const answer = await fetchMutation(api.editor.setAvatarSpeaker, {
      avatarLegacyId: avatar_id,
      languageLegacyId: language_id,
      name,
      speaker,
    });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}
