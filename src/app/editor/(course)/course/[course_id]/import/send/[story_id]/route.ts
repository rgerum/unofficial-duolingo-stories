import { sql } from "@/lib/db";
import { upload_github } from "@/lib/editor/upload_github";
import { NextResponse } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";
import { mirrorStory } from "@/lib/lookupTableMirror";

export async function GET(
  req: Request,

  { params }: { params: Promise<{ course_id: string; story_id: string }> },
) {
  const token = await getUser();

  if (!token || !isContributor(token))
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  let answer = await set_import(
    { id: (await params).story_id, course_id: (await params).course_id },
    { user_id: token.userId, username: token.name ?? "unknown" },
  );

  if (answer === undefined)
    return new Response("Error: story not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_import(
  { id, course_id }: { id: string; course_id: string },
  { user_id, username }: { user_id: number; username: string },
) {
  const courseId = Number.parseInt(course_id, 10);

  if (Number.isNaN(courseId)) return undefined;

  let data = (
    await sql`SELECT duo_id, name, image, set_id, set_index, text, json FROM story WHERE id = ${id};`
  )[0];

  if (!data) return undefined;

  data["author"] = user_id;
  data["course_id"] = courseId;

  const data2 = (
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
    ])} RETURNING *;`
  )[0];

  if (data2) {
    await mirrorStory(data2, `story:${data2.id}:import`, { mirrorContent: true });
  }

  try {
    await upload_github(
      data2["id"],
      data2["course_id"],
      data2["text"],
      username,
      `added ${data["name"]} in course ${data["course_id"]}`,
    );
  } catch (error) {
    console.error("Import upload_github failed:", error);
  }

  return { id: data2.id };
}
