import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { update } from "lib/db";

export async function POST(req) {
  try {
    const { id, default_text } = await req.json();
    const token = await getToken({ req });

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_avatar({ id, default_text });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function set_avatar({ id, default_text }) {
  return await update("language", { id, default_text }, ["default_text"]);
}
