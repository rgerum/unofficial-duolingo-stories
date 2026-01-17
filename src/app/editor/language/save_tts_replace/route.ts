import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";

export async function POST(req) {
  try {
    const { id, tts_replace } = await req.json();
    const token = await getUser(req);

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_avatar({ id, tts_replace });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function set_avatar({ id, tts_replace }) {
  return sql`
  UPDATE language SET ${sql({ tts_replace })}
  WHERE id = ${id}
`;
}
