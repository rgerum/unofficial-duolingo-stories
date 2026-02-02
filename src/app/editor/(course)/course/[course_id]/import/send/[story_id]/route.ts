import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../../../../convex/_generated/api";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser } from "@/lib/userInterface";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ course_id: string; story_id: string }> },
) {
  const token = await getUser();

  if (!token || !token.role || !token.id || !token.name)
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  const { course_id, story_id } = await params;

  try {
    // Get target course legacy ID
    const course = await fetchQuery(api.editor.getCourse, { id: course_id });
    if (!course) {
      return new Response("Course not found.", { status: 404 });
    }

    const result = await fetchMutation(api.editor.importStory, {
      sourceStoryLegacyId: parseInt(story_id),
      targetCourseLegacyId: course.id,
      userLegacyId: parseInt(token.id),
    });

    if (!result.success) {
      return new Response(result.error || "Import failed.", { status: 400 });
    }

    // Get source story data for GitHub upload
    const storyData = await fetchQuery(api.editor.getStoryForEditor, {
      storyLegacyId: parseInt(story_id),
    });

    if (storyData && result.newLegacyId) {
      await upload_github(
        result.newLegacyId,
        course.id,
        storyData.text,
        token.name,
        `added ${storyData.name} in course ${course.id}`,
      );
    }

    // Return the new story's legacy ID for the frontend to redirect
    return NextResponse.json({ id: result.newLegacyId });
  } catch (error) {
    console.error("Error importing story:", error);
    return new Response("Error: import failed.", { status: 500 });
  }
}
