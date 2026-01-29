import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/userInterface";
import { z } from "zod";

const DefaultTextSchema = z.object({
  id: z.number(),
  default_text: z.string(),
});

export async function POST(req: Request) {
  try {
    const { id, default_text } = DefaultTextSchema.parse(await req.json());
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_default_text({ id, default_text });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
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
  return sql`
  UPDATE language SET ${sql({ default_text })}
  WHERE id = ${id}
`;
}
