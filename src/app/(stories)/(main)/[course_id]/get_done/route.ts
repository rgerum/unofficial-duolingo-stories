import { NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";
import { get_course_done } from "../get_story_data_convex";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ course_id: string }> },
) {
  const token = await getUser();
  if (!token || !token?.id)
    return new Response("Error not found", {
      status: 404,
    });

  const courseShort = (await params).course_id;
  const userId = typeof token.id === "string" ? parseInt(token.id) : token.id;

  let answer = await get_course_done({
    courseShort,
    user_id: userId,
  });

  return NextResponse.json(answer);
}
