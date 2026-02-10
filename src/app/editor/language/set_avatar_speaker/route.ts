import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser, isContributor } from "@/lib/userInterface";
import { z } from "zod";
import { mirrorAvatarMapping } from "@/lib/lookupTableMirror";

const AvatarSetSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  speaker: z.string(),
  language_id: z.number(),
  avatar_id: z.number(),
});

export async function POST(req: Request) {
  try {
    const { id, name, speaker, language_id, avatar_id } = AvatarSetSchema.parse(
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
      id,
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
  id,
  name,
  speaker,
  language_id,
  avatar_id,
}: {
  id?: number;
  name: string;
  speaker: string;
  language_id: number;
  avatar_id: number;
}) {
  let res =
    await sql`SELECT id FROM avatar_mapping WHERE language_id = ${language_id} AND avatar_id = ${avatar_id};`;

  if (res.length) {
    const existingId = res[0].id as number;
    await sql`UPDATE avatar_mapping SET ${sql({ name, speaker, language_id, avatar_id })} WHERE id = ${existingId}`;
    const updated = (
      await sql`SELECT id, avatar_id, language_id, name, speaker FROM avatar_mapping WHERE id = ${existingId} LIMIT 1`
    )[0];
    await mirrorAvatarMapping(updated, `avatar_mapping:${existingId}:set`);
    return updated;
  }
  const inserted = (
    await sql`INSERT INTO avatar_mapping ${sql({
      name,
      speaker,
      language_id,
      avatar_id,
    })} RETURNING id, avatar_id, language_id, name, speaker;`
  )[0];
  await mirrorAvatarMapping(inserted, `avatar_mapping:${inserted.id}:set`);
  return inserted;
}
