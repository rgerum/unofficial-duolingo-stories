import { NextResponse } from "next/server";
import { sql } from "@/lib/db.ts";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser } from "@/lib/userInterface";

export async function POST(req) {
  try {
    const token = await getUser(req);

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await delete_story(await req.json(), {
      username: token.name,
      user_id: token.id,
    });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

async function delete_story({ id }, { username }) {
  await sql`UPDATE story SET deleted = true, public = false WHERE id = ${id};`;
  let data = (await sql`SELECT * FROM story WHERE id = ${id};`)[0];
  await upload_github(
    data["id"],
    data["course_id"],
    data["text"],
    username,
    `delete ${data["name"]} from course ${data["course_id"]}`,
    true,
  );
  return "done";
}
