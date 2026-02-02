import { NextResponse, NextRequest } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser } from "@/lib/userInterface";

export async function POST(req: NextRequest) {
  try {
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    const { id } = await req.json();

    // Get story data for GitHub upload before deleting
    const storyData = await fetchQuery(api.editor.getStoryForEditor, {
      storyLegacyId: id,
    });

    if (!storyData) {
      return new Response("Story not found.", { status: 404 });
    }

    // Soft delete the story
    await fetchMutation(api.editor.deleteStory, {
      storyLegacyId: id,
    });

    // Upload deletion to GitHub
    await upload_github(
      id,
      storyData.course_id,
      storyData.text,
      token.name ?? "",
      `delete ${storyData.name} from course ${storyData.course_id}`,
      true,
    );

    return NextResponse.json("done");
  } catch (err) {
    console.error("Error deleting story:", err);
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}
