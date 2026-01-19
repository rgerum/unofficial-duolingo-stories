import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser } from "@/lib/userInterface";

export async function POST(req: NextRequest) {
  try {
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await delete_story(await req.json(), {
      username: token.name,
    });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
  }
}

async function delete_story({ id }: { id: number }, { username }: { username: string }) {
  await sql`UPDATE story SET deleted = true, public = false WHERE id = ${id};`;
  let data = (await sql`SELECT * FROM story WHERE id = ${id};`)[0];
  await upload_github(
    data["id"],
    data["course_id"],
    data["text"],
    username,
    `delete ${data["name"]} from course ${data["course_id"]}`,
    true,
  );
  return "done";
}
