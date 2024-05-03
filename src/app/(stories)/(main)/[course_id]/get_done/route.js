import { sql } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const token = await getToken({ req });

  let answer = await get_course_done({
    course_id: params.course_id,
    user_id: token?.id,
  });

  if (answer === undefined)
    return new Response("Error not found", {
      status: 404,
    });

  return NextResponse.json(answer);
}

async function get_course_done({ course_id, user_id }) {
  // (SELECT id FROM course WHERE short = ? LIMIT 1)
  const done_query = await sql`SELECT s.id FROM story_done 
JOIN story s on s.id = story_done.story_id WHERE user_id = ${user_id} AND s.course_id = ${course_id} GROUP BY s.id`;
  const done = {};
  for (let d of done_query) {
    done[d.id] = true;
  }

  return done;
}
