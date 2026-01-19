import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
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
    const { id, name, speaker, language_id, avatar_id } = AvatarSetSchema.parse(
      await req.json(),
    );
    const token = await getUser();

    if (!token?.role)
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
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
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
    return sql`UPDATE avatar_mapping SET ${sql({ name, speaker, language_id, avatar_id })} WHERE id = ${existingId}`;
  }
  return (
    await sql`INSERT INTO avatar_mapping ${sql({
      name,
      speaker,
      language_id,
      avatar_id,
    })} RETURNING id;`
  )[0];
}
