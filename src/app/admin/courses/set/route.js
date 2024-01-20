import { sql } from "lib/db";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req, res) {
  const data = await req.json();
  const token = await getToken({ req });

  if (!token?.admin)
    return new Response("You need to be a registered admin.", { status: 401 });

  let answer = await set_course(
    data,
    { name: token.name, user_id: token.id },
    res.revalidate,
  );

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_course(data) {
  if (data["official"] === undefined) data["official"] = 0;
  let id;
  let tag_list = data["tags"] || "";

  if (typeof tag_list === "string") {
    data["tags"] = [...tag_list.matchAll(/[^, ]+/g)].map((d) =>
      d[0].toLowerCase(),
    );
  }
  data["public"] =
    data["public"] == 1 || data["public"] === "true" ? "true" : "false";
  data["short"] = (
    await sql`SELECT CONCAT(l2.short, '-', l.short) as short
FROM language l, language l2
WHERE l.id = ${data["from_language"]}
      AND l2.id = ${data["learning_language"]};`
  )[0].short;

  if (data.id === undefined) {
    id = (await sql`INSERT INTO course ${sql(data)} RETURNING id`)[0].id;
  } else {
    await sql`UPDATE course SET ${sql(data, [
      "learning_language",
      "from_language",
      "public",
      "name",
      "official",
      "conlang",
      "tags",
      "short",
      "about",
    ])} WHERE id = ${data.id}`;
    id = data["id"];
  }

  // revalidate the page
  let response_course_id =
    await sql`SELECT short FROM course WHERE course.id = ${id}`;
  try {
    revalidatePath(`/${response_course_id[0].short}`);
    revalidatePath(`/`);
  } catch (e) {
    console.log("revalidate error", e);
  }
  return data;
}
