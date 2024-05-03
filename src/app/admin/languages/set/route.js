import { sql } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();
  const token = await getToken({ req });

  if (!token?.admin)
    return new Response("You need to be a registered admin.", {
      status: 401,
    });

  let answer = await set_language(data, {
    name: token.name,
    user_id: token.id,
  });

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_language(data) {
  if (data.id === undefined)
    return (await sql`INSERT INTO language ${sql(data)} RETURNING *`)[0];
  return (
    await sql`UPDATE language SET ${sql(data, [
      "name",
      "short",
      "flag",
      "flag_file",
      "rtl",
      "speaker",
    ])} WHERE id = ${data.id} RETURNING *`
  )[0];
}
