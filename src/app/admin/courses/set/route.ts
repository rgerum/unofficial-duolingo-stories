import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/userInterface";
import { mirrorCourse } from "@/lib/lookupTableMirror";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

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
  let id: number;
  let updatedResponse:
    | {
        id: number;
        short: string | null;
      }
    | undefined;
  let tag_list = data["tags"] || "";

  if (typeof tag_list === "string") {
    data["tags"] = [...tag_list.matchAll(/[^, ]+/g)].map((d) =>
      d[0].toLowerCase(),
    );
  }
  //data["public"] = data["public"] == 1 || data["public"] === "true";
  if (data.id === undefined) {
    const from_language = (
      await sql`SELECT name, short FROM language WHERE id = ${data["from_language"]};`
    )[0];
    const learning_language = (
      await sql`SELECT name, short FROM language WHERE id = ${data["learning_language"]};`
    )[0];
    data["short"] = `${learning_language.short}-${from_language.short}`;
    data["from_language_name"] = from_language.name;
    data["learning_language_name"] = learning_language.name;
    // TODO(postgres-sunset): remove denormalized course language-name writes.
    id = (await sql`INSERT INTO course ${sql(data)} RETURNING id`)[0].id;
    let data_new = await sql`SELECT * FROM course WHERE id = ${id}`;
    await mirrorCourse(data_new[0], `course:${id}:admin_set`);
  } else {
    updatedResponse = await fetchAuthMutation(api.adminWrite.updateAdminCourse, {
      id: data.id,
      learning_language: data.learning_language,
      from_language: data.from_language,
      public: data.public,
      name: data.name ?? undefined,
      conlang: data.conlang ?? undefined,
      tags: (data.tags as string[]) ?? undefined,
      about: data.about ?? undefined,
      operationKey: `course:${data.id}:admin_set:route`,
    });
    id = updatedResponse.id;
  }

  // revalidate the page
  const response_short =
    updatedResponse?.short ??
    (await sql`SELECT short FROM course WHERE course.id = ${id}`)[0]?.short;
  try {
    if (response_short) {
      revalidatePath(`/${response_short}`);
    }
    revalidatePath(`/`);
  } catch (e) {
    //console.log("revalidate error", e);
  }
  if (updatedResponse) return updatedResponse;

  const created = await sql`SELECT * FROM course WHERE id = ${id}`;
  return created[0];
}
