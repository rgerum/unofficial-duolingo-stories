import { NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ course_id: string }> },
) {
  const token = await getUser();
  if (!token)
    return new Response("Error not found", {
      status: 404,
    });

  let answer = await get_course_done({
    course_id: (await params).course_id,
    user_id: token.userId,
  });

  if (answer === undefined)
    return new Response("Error not found", {
      status: 404,
    });

  return NextResponse.json(answer);
}

async function get_course_done({
  course_id,
  user_id,
}: {
  course_id: string;
  user_id: number;
}) {
  const numericCourseId = Number.parseInt(course_id, 10);
  if (!Number.isFinite(numericCourseId)) return {};
  const done_query = await convex.query(api.storyDone.getDoneStoryIdsForCourse, {
    legacyCourseId: numericCourseId,
    legacyUserId: user_id,
  });
  const done: Record<number, boolean> = {};
  for (let storyId of done_query) {
    done[storyId] = true;
  }

  return done;
}
