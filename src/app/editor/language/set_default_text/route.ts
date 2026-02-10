import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser, isContributor } from "@/lib/userInterface";
import { z } from "zod";
import { mirrorLanguage } from "@/lib/lookupTableMirror";

const DefaultTextSchema = z.object({
  id: z.number(),
  default_text: z.string(),
});

export async function POST(req: Request) {
  try {
    const { id, default_text } = DefaultTextSchema.parse(await req.json());
    const token = await getUser();

    if (!token)
      return new Response("You need to be logged in.", {
        status: 401,
      });

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_default_text({ id, default_text });

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

async function set_default_text({
  id,
  default_text,
}: {
  id: number;
  default_text: string;
}) {
  const language = (
    await sql`
  UPDATE language SET ${sql({ default_text })}
  WHERE id = ${id}
  RETURNING *
`
  )[0];

  if (language?.id) {
    await mirrorLanguage(language, `language:${language.id}:default_text`);
  }

  return language;
}
