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
    { username: token.name, user_id: token.id },
    res.revalidate,
  );

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_course(data) {
  if (data["official"] === undefined) data["official"] = 0;
  let id;
  let tag_list = data["tag_list"] || "";
  delete data["tag_list"];
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
      "about",
    ])} WHERE id = ${data.id}`;
    id = data["id"];
  }
  // update the tags
  let tags = [...tag_list.matchAll(/[^, ]+/g)].map((d) => d[0].toLowerCase());
  let current_tags =
    await sql`SELECT *, ctm.id as map_id FROM course_tag JOIN course_tag_map ctm on course_tag.id = ctm.course_tag_id WHERE course_id = ${id};`;
  let all_tags = (await sql`SELECT name FROM course_tag;`).map((d) => d.name);
  for (let tag_entry of current_tags) {
    if (!tags.includes(tag_entry.name)) {
      await sql`DELETE FROM course_tag_map WHERE id = ${tag_entry.map_id};`;
    } else tags = tags.filter((x) => x !== tag_entry.name);
  }
  for (let tag of tags) {
    if (!all_tags.includes(tag)) {
      await sql`INSERT INTO course_tag (name) VALUES (${tag});`;
    }
    await sql`INSERT INTO course_tag_map (course_id, course_tag_id) VALUES (${id}, (SELECT id FROM course_tag WHERE name = ${tag} LIMIT 1) );`;
  }

  let result =
    await sql`UPDATE course JOIN language l on l.id = course.from_language JOIN language l2 on l2.id = course.learning_language
                       SET course.short = CONCAT(l2.short, "-", l.short)
                       WHERE course.id = ${id};`;
  // revalidate the page
  let response_course_id =
    await sql`SELECT short FROM course WHERE course.id = ${id}`;
  try {
    revalidatePath(`/${response_course_id[0].short}`);
    revalidatePath(`/`);
  } catch (e) {
    console.log("revalidate error", e);
  }
  return result;
}
