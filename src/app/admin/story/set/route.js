import { sql } from "lib/db";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const token = await getToken({ req });

    if (!token?.admin)
      return new Response("You need to be a registered admin.", {
        status: 401,
      });

    let answer;
    if (data.approval_id) {
      answer = await remove_approval(data, {
        username: token.name,
        user_id: token.id,
      });
    } else
      answer = await set_story(data, {
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

async function story_properties(id) {
  let data =
    await sql`SELECT story.id, story.name, story.image, story.public, course.short FROM story JOIN course ON course.id = story.course_id WHERE story.id = ${id};`;
  if (data.length === 0) return null;
  let story = data[0];
  story.approvals =
    await sql`SELECT a.id, a.date, u.username FROM story_approval a JOIN "user" u ON u.id = a.user_id WHERE a.story_id = ${id};`;
  return story;
}

async function set_story(data) {
  await sql`UPDATE story SET ${sql(data, "public")}`;
  return await story_properties(data.id);
}

async function remove_approval(data) {
  await sql`DELETE FROM story_approval WHERE id = ${data.approval_id};`;
  return await story_properties(data.id);
}
