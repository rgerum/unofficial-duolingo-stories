import { sql } from "@/lib/db";
import { upload_github } from "@/lib/editor/upload_github";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";
import { getPostHogClient } from "@/lib/posthog-server";

export async function GET(
  req: Request,

  { params }: { params: Promise<{ course_id: string; story_id: string }> },
) {
  const token = await getUser();

  if (!token || !token.role || !token.id || !token.name)
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  let answer = await set_import(
    { id: (await params).story_id, course_id: (await params).course_id },
    { user_id: token.id, username: token.name },
  );

  if (answer === undefined)
    return new Response("Error: not found.", { status: 403 });

  return NextResponse.json(answer);
}

async function set_import(
  { id, course_id }: { id: string; course_id: string },
  { user_id, username }: { user_id: string; username: string },
) {
  let data = (
    await sql`SELECT duo_id, name, image, set_id, set_index, text, json FROM story WHERE id = ${id};`
  )[0];

  data["author"] = user_id;
  data["course_id"] = course_id;

  let data2 = (
    await sql`INSERT INTO story ${sql(data, [
      "duo_id",
      "name",
      "author",
      "image",
      "set_id",
      "set_index",
      "course_id",
      "text",
      "json",
    ])} RETURNING id, text, name, course_id;`
  )[0];

  await upload_github(
    data2["id"],
    data2["course_id"],
    data2["text"],
    username,
    `added ${data["name"]} in course ${data["course_id"]}`,
  );

  // Track story imported event
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: username,
    event: "story_imported",
    properties: {
      source_story_id: id,
      new_story_id: data2.id,
      story_name: data2.name,
      target_course_id: course_id,
    },
  });

  return { id: data2.id };
}
