import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";

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
  // (SELECT id FROM course WHERE short = ? LIMIT 1)
  const done_query = await sql`SELECT s.id FROM story_done 
JOIN story s on s.id = story_done.story_id WHERE user_id = ${user_id} AND s.course_id = ${course_id} GROUP BY s.id`;
  const done: Record<number, boolean> = {};
  for (let d of done_query) {
    done[d.id] = true;
  }

  return done;
}
