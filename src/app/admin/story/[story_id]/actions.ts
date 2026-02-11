"use server";

import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import {
  mirrorCourse,
  mirrorStory,
  mirrorStoryApprovalDeleteByLegacyId,
} from "@/lib/lookupTableMirror";
import { getUser, isAdmin } from "@/lib/userInterface";

async function requireAdmin() {
  const token = await getUser();
  if (!isAdmin(token)) {
    throw new Error("You need to be a registered admin.");
  }
}

export async function togglePublished(
  id: number,
  currentPublic: boolean,
): Promise<void> {
  await requireAdmin();

  await sql`UPDATE story SET ${sql({ public: !currentPublic }, "public")} WHERE id = ${id};`;
  const storyRow = (await sql`SELECT * FROM story WHERE id = ${id} LIMIT 1`)[0];
  if (storyRow) {
    await mirrorStory(storyRow, `story:${storyRow.id}:toggle_published`);
  }

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
}

export async function removeApproval(
  _id: number,
  approval_id: number,
): Promise<void> {
  await requireAdmin();

  await sql`DELETE FROM story_approval WHERE id = ${approval_id};`;
  await mirrorStoryApprovalDeleteByLegacyId(
    approval_id,
    `story_approval:${approval_id}:admin_delete`,
  );
}
