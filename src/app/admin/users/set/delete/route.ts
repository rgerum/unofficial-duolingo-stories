import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";

export async function POST(req) {
  try {
    const data = await req.json();
    const token = await getUser(req);

    if (!token?.admin)
      return new Response("You need to be a registered admin.", {
        status: 401,
      });

    let answer = await delete_user(data);

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function delete_user({ id }) {
  return await sql`UPDATE "users" SET name = 'deleted', email = 'deleted', image = 'deleted' WHERE "users".id = ${id};`;
}
