import { NextResponse, NextRequest } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser } from "@/lib/userInterface";

interface StoryData {
  id?: number;
  duo_id: string;
  name: string;
  image: string;
  set_id: number;
  set_index: number;
  course_id: number;
  text: string;
  json: string;
  todo_count: number;
}

export async function POST(req: NextRequest) {
  const token = await getUser();

  if (!token?.role)
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  const data: StoryData = await req.json();
  const userId = typeof token.id === "string" ? parseInt(token.id) : (token.id ?? 0);

  try {
    const result = await fetchMutation(api.editor.updateStory, {
      storyLegacyId: data.id,
      duo_id: data.duo_id,
      name: data.name,
      image: data.image,
      set_id: data.set_id,
      set_index: data.set_index,
      courseLegacyId: data.course_id,
      text: data.text,
      json: JSON.parse(data.json),
      todo_count: data.todo_count,
      userLegacyId: userId,
    });

    if (result.success && data.id !== undefined) {
      await upload_github(
        data.id,
        data.course_id,
        data.text,
        token.name ?? "",
        `updated ${data.name} in course ${data.course_id}`,
      );
    }

    return NextResponse.json("done");
  } catch (error) {
    console.error("Error saving story:", error);
    return new Response("Error saving story.", { status: 500 });
  }
}
