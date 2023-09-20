import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import query from "lib/db";
import { upload_github } from "lib/editor/upload_github";

export async function POST(req) {
  try {
    const token = await getToken({ req });

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
  await query(`UPDATE story SET deleted = 1, public = 0 WHERE id = ?;`, [id]);
  let data = (await query(`SELECT * FROM story WHERE id = ?;`, [id]))[0];
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
