import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/userInterface";
import { mirrorCourse } from "@/lib/lookupTableMirror";

interface CourseData {
  id?: number;
  learning_language: number;
  from_language: number;
  public?: boolean;
  name?: string;
  official?: number;
  conlang?: boolean;
  tags?: string | string[];
  short?: string;
  about?: string;
  from_language_name?: string;
  learning_language_name?: string;
}

export async function POST(req: NextRequest) {
  try {
    const data: CourseData = await req.json();
    const token = await getUser();

    if (!isAdmin(token))
      return new Response("You need to be a registered admin.", { status: 401 });

    const answer = await set_course(data);

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isMirrorFailure = message.includes("Convex mirror");
    return new Response(message, {
      status: isMirrorFailure ? 502 : 500,
    });
  }
}

async function set_course(data: CourseData) {
  if (data["official"] === undefined) data["official"] = 0;
  let id;
  let tag_list = data["tags"] || "";

  if (typeof tag_list === "string") {
    data["tags"] = [...tag_list.matchAll(/[^, ]+/g)].map((d) =>
      d[0].toLowerCase(),
    );
  }
  //data["public"] = data["public"] == 1 || data["public"] === "true";
  const from_language = (
    await sql`SELECT name, short FROM language WHERE id = ${data["from_language"]};`
  )[0];
  const learning_language = (
    await sql`SELECT name, short FROM language WHERE id = ${data["learning_language"]};`
  )[0];
  data["short"] = `${learning_language.short}-${from_language.short}`;
  data["from_language_name"] = from_language.name;
  data["learning_language_name"] = learning_language.name;
  if (data.id === undefined) {
    id = (await sql`INSERT INTO course ${sql(data)} RETURNING id`)[0].id;
  } else {
    await sql`UPDATE course SET ${sql(data, [
      "learning_language",
      "learning_language_name",
      "from_language",
      "from_language_name",
      "public",
      "name",
      //"official",
      "conlang",
      "tags",
      "short",
      "about",
    ])} WHERE id = ${data.id}`;
    id = data["id"];
  }
  let data_new = await sql`SELECT * FROM course WHERE id = ${id}`;

  // revalidate the page
  let response_course_id =
    await sql`SELECT short FROM course WHERE course.id = ${id}`;
  try {
    revalidatePath(`/${response_course_id[0].short}`);
    revalidatePath(`/`);
  } catch (e) {
    //console.log("revalidate error", e);
  }
  await mirrorCourse(data_new[0], `course:${id}:admin_set`);
  return data_new[0];
}
