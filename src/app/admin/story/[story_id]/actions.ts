"use server";

import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { StorySchema, type Story } from "./schema";
import { mirrorCourse } from "@/lib/lookupTableMirror";

async function story_properties(id: number): Promise<Story> {
  let data = await sql`
    SELECT story.id, story.name, story.image, story.public, course.short
    FROM story
    JOIN course ON course.id = story.course_id
    WHERE story.id = ${id};
  `;
  if (data.length === 0) throw new Error("Story not found");
  let story = data[0];
  story.approvals = await sql`
    SELECT a.id, a.date, u.name
    FROM story_approval a
    JOIN "users" u ON u.id = a.user_id
    WHERE a.story_id = ${id};
  `;
  return StorySchema.parse(story);
}

export async function togglePublished(
  id: number,
  currentPublic: boolean,
): Promise<Story> {
  await sql`UPDATE story SET ${sql({ public: !currentPublic }, "public")} WHERE id = ${id};`;

  await sql`UPDATE course
SET count = (
    SELECT COUNT(*)
    FROM story
    WHERE story.course_id = course.id AND story.public AND NOT story.deleted
) WHERE id = (SELECT course_id FROM story WHERE id = ${id});`;
  const course = (
    await sql`SELECT c.* FROM course c JOIN story s ON s.course_id = c.id WHERE s.id = ${id} LIMIT 1`
  )[0];
  if (course) {
    await mirrorCourse(course, `course:${course.id}:toggle_published`);
  }

  revalidateTag("course_data", "max");
  revalidateTag("story_data", "max");

  return await story_properties(id);
}

export async function removeApproval(
  id: number,
  approval_id: number,
): Promise<Story> {
  await sql`DELETE FROM story_approval WHERE id = ${approval_id};`;
  return await story_properties(id);
}
