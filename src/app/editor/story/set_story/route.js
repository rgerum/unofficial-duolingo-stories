import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser } from "@/lib/userInterface";

export async function POST(req) {
  const token = await getUser(req);

  if (!token?.role)
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  let answer = await set_story(await req.json(), {
    username: token.name,
    user_id: token.id,
  });

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_story(data, { username, user_id }) {
  data["api"] = 2;
  data["change_date"] = new Date().toISOString();
  data["author_change"] = user_id;

  // if no id is given we look for a
  if (data["id"] === undefined) {
    let res =
      await sql`SELECT id FROM story WHERE duo_id = ${data["duo_id"]} AND course_id = ${data["course_id"]} LIMIT 1;`;
    if (res.length) data["id"] = res[0]["id"];
  }

  await sql`
  UPDATE story SET ${sql(data, [
    "duo_id",
    "name",
    "image",
    "change_date",
    "author_change",
    "set_id",
    "set_index",
    "course_id",
    "text",
    "json",
    "todo_count",
  ])}
  WHERE id = ${data.id}
`;
  await sql`UPDATE course SET todo_count = (SELECT SUM(todo_count) FROM story WHERE course_id = ${data["course_id"]}) WHERE id = ${data["course_id"]}`;

  await upload_github(
    data["id"],
    data["course_id"],
    data["text"],
    username,
    `updated ${data["name"]} in course ${data["course_id"]}`,
  );
  return "done";
}
