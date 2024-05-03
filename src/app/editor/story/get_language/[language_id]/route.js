import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { sql } from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { language_id } = params;
    const token = await getToken({ req });

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await language({ language_id });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function language({ language_id }) {
  return (await sql`SELECT * FROM language WHERE id = ${language_id}`)[0];
}
