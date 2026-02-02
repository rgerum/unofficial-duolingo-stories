import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getUser } from "@/lib/userInterface";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ story_id: string }> },
) {
  const token = await getUser();

  if (!token || !token.role || !token.id)
    return new Response("Error not allowed", { status: 401 });

  try {
    const result = await fetchMutation(api.editor.toggleApproval, {
      storyLegacyId: parseInt((await params).story_id),
      userLegacyId: parseInt(token.id),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling approval:", error);
    return new Response("Error not found", { status: 404 });
  }
}
