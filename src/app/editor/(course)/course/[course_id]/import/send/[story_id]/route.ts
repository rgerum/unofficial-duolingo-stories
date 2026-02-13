import { upload_github } from "@/lib/editor/upload_github";
import { NextResponse } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

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
  const sourceLegacyId = Number.parseInt(id, 10);
  const courseId = Number.parseInt(course_id, 10);
  if (Number.isNaN(sourceLegacyId) || Number.isNaN(courseId)) return undefined;

  const data2 = await fetchAuthMutation(api.storyWrite.importStory, {
    sourceLegacyStoryId: sourceLegacyId,
    targetLegacyCourseId: courseId,
    authorLegacyUserId: user_id,
    operationKey: `story:${sourceLegacyId}:import_to:${courseId}:route`,
  });
  if (!data2) return undefined;

  try {
    await upload_github(
      data2.id,
      data2.course_id,
      data2.text,
      username,
      `added ${data2.name} in course ${data2.course_id}`,
    );
  } catch (error) {
    console.error("Import upload_github failed:", error);
  }

  return { id: data2.id };
}
