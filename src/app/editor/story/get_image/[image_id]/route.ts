import { NextResponse } from "next/server";
import { sql } from "@/lib/db.ts";
import { getUser } from "@/lib/userInterface";

export async function GET(req, { params }) {
  try {
    const { image_id } = await params;
    const token = await getUser(req);

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await get_image({ image_id });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function get_image({ image_id }) {
  return (await sql`SELECT * FROM image WHERE id = ${image_id}`)[0];
}
