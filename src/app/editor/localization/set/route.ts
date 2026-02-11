import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getUser, isContributor } from "@/lib/userInterface";
import { mirrorLocalization } from "@/lib/lookupTableMirror";

const payloadSchema = z.object({
  tag: z.string().min(1),
  text: z.string(),
  language_id: z.number(),
});

export async function POST(req: NextRequest) {
  const token = await getUser();
  if (!token || !isContributor(token)) {
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });
  }

  const parsed = payloadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { tag, text, language_id } = parsed.data;

  const row = (
    await sql`INSERT INTO localization (tag, text, language_id)
      VALUES (${tag}, ${text}, ${language_id})
      ON CONFLICT (tag, language_id)
      DO UPDATE SET text = EXCLUDED.text
      RETURNING id, language_id, tag, text`
  )[0];

  await mirrorLocalization(row, `localization:${row.language_id}:${row.tag}:set`);

  return NextResponse.json(row);
}
