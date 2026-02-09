import { sql } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";

export async function POST(req: NextRequest) {
  try {
    const { id, tts_replace } = await req.json();
    const token = await getUser();

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_tts_replace({ id, tts_replace });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
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
  return sql`
  UPDATE language SET ${sql({ tts_replace })}
  WHERE id = ${id}
`;
}
