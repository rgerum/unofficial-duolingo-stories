import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUser, isContributor } from "@/lib/userInterface";
import { getPostHogClient } from "@/lib/posthog-server";
import { mirrorCourse } from "@/lib/lookupTableMirror";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ story_id: string }> },
) {
  const token = await getUser();

  if (!token || !isContributor(token))
    return new Response("Error not allowed", { status: 401 });

  let answer = await set_approve({
    story_id: parseInt((await params).story_id),
    user_id: token.userId,
  });

  if (answer === undefined)
    return new Response("Error not found", { status: 404 });

  return NextResponse.json(answer);
}

async function set_status(data: { status: string | undefined; id: number }) {
  return sql`
  UPDATE story SET ${sql(data, "status")}
  WHERE id = ${data.id}
`;
}

async function set_approve({
  story_id,
  user_id,
}: {
  story_id: number;
  user_id: number;
}) {
  const mirroredCourseIds = new Set<number>();
  const mirrorCourseById = async (courseId: number, operation: string) => {
    if (mirroredCourseIds.has(courseId)) return;
    const course = (
      await sql`SELECT * FROM course WHERE id = ${courseId} LIMIT 1`
    )[0];
    if (!course) return;
    await mirrorCourse(course, `course:${course.id}:${operation}`);
    mirroredCourseIds.add(courseId);
  };
  const storyCourseId = Number(
    (await sql`SELECT course_id FROM story WHERE id = ${story_id} LIMIT 1`)[0]
      ?.course_id,
  );

  let res =
    await sql`SELECT id FROM story_approval WHERE story_id = ${story_id} AND user_id = ${user_id};`;
  let action;
  if (res.length) {
    await sql`DELETE FROM story_approval WHERE story_id = ${story_id} AND user_id = ${user_id};`;
    action = "deleted";
  } else {
    await sql`INSERT INTO story_approval (story_id, user_id) VALUES (${story_id}, ${user_id});`;
    action = "added";
  }
  let res2 = (
    await sql`SELECT COUNT(id) as count FROM story_approval WHERE story_id = ${story_id};`
  )[0];
  let count = parseInt(res2.count);
  let status = undefined;
  if (count === 0) status = "draft";
  if (count === 1) status = "feedback";
  if (count >= 2) status = "finished";

  await set_status({ status: status, id: story_id });

  // get the number of finished stories in this set
  let res3 =
    await sql`SELECT story.id, story.public FROM story WHERE set_id = (SELECT set_id FROM story WHERE id = ${story_id} LIMIT 1) AND
                                            course_id = (SELECT course_id FROM story WHERE id = ${story_id} LIMIT 1) AND status = 'finished' AND NOT deleted;`;

  let published = [];
  if (res3.length >= 4) {
    let date_published = new Date().toISOString();
    let count_published = 0;
    for (let story of res3) {
      if (!story.public) {
        await sql`UPDATE story SET public = true, date_published = ${date_published} WHERE id = ${story.id};`;
        published.push(story.id);
        count_published++;
      }
    }
    //console.log("published", count_published);
    if (count_published) {
      await sql`UPDATE course
SET count = (
    SELECT COUNT(*)
    FROM story
    WHERE story.course_id = course.id AND story.public AND NOT story.deleted
) WHERE id = (SELECT course_id FROM story WHERE id = ${res3[0].id});`;
      const publishedCourseId = Number(
        (
          await sql`SELECT course_id FROM story WHERE id = ${res3[0].id} LIMIT 1`
        )[0]?.course_id,
      );
      if (Number.isFinite(publishedCourseId)) {
        await mirrorCourseById(publishedCourseId, "approve_publish_count");
      }
      revalidateTag("course_data", "day");
      revalidateTag("story_data", "day");
    }
    // update contributor list
    await sql`UPDATE course
SET contributors = (SELECT COALESCE(array_agg(name), '{}')
                         FROM (SELECT u.name                                           AS name,
                                      MAX(sa.date) > CURRENT_DATE - INTERVAL '1 month' AS active
                               FROM course c
                                        JOIN
                                    story s ON c.id = s.course_id
                                        JOIN
                                    story_approval sa ON s.id = sa.story_id
                                        JOIN
                                    "users" u ON u.id = sa.user_id
                               WHERE course_id = course.id
                               GROUP BY u.id, c.id, c.short, u.name
                               ORDER BY MAX(sa.date) DESC) AS contributors
                         WHERE active)
WHERE id = ${storyCourseId};`;
    if (Number.isFinite(storyCourseId)) {
      await mirrorCourseById(storyCourseId, "approve_contributors");
    }
    await sql`UPDATE course
SET contributors_past = (SELECT COALESCE(array_agg(name), '{}')
                         FROM (SELECT u.name                                           AS name,
                                      MAX(sa.date) > CURRENT_DATE - INTERVAL '1 month' AS active
                               FROM course c
                                        JOIN
                                    story s ON c.id = s.course_id
                                        JOIN
                                    story_approval sa ON s.id = sa.story_id
                                        JOIN
                                    "users" u ON u.id = sa.user_id
                               WHERE course_id = course.id
                               GROUP BY u.id, c.id, c.short, u.name
                               ORDER BY MAX(sa.date) DESC) AS contributors
                         WHERE NOT active)
WHERE id = ${storyCourseId};`;
    if (Number.isFinite(storyCourseId)) {
      await mirrorCourseById(storyCourseId, "approve_contributors_past");
    }
  }

  // Track story approval event server-side
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: `user_${user_id}`,
    event: "story_approved",
    properties: {
      story_id: story_id,
      action: action,
      approval_count: count,
      story_status: status,
      finished_in_set: res3.length,
      stories_published: published.length,
    },
  });
  await posthog.shutdown();

  return {
    count: count,
    story_status: status,
    finished_in_set: res3.length,
    action: action,
    published: published,
  };
}
