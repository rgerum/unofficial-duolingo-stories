import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/userInterface";
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
  let tag_list = data["tags"] || "";

  if (typeof tag_list === "string") {
    data["tags"] = [...tag_list.matchAll(/[^, ]+/g)].map((d) =>
      d[0].toLowerCase(),
    );
  }
  //data["public"] = data["public"] == 1 || data["public"] === "true";
  const tags = (data.tags as string[] | undefined) ?? undefined;
  let response:
    | {
        id: number;
        short: string | null;
      }
    | undefined;

  if (data.id === undefined) {
    response = await fetchAuthMutation(api.adminWrite.createAdminCourse, {
      learning_language: data.learning_language,
      from_language: data.from_language,
      public: data.public,
      name: data.name ?? undefined,
      official: data.official,
      conlang: data.conlang ?? undefined,
      tags,
      about: data.about ?? undefined,
      operationKey: `course:create:${data.learning_language}:${data.from_language}:route`,
    });
  } else {
    response = await fetchAuthMutation(api.adminWrite.updateAdminCourse, {
      id: data.id,
      learning_language: data.learning_language,
      from_language: data.from_language,
      public: data.public,
      name: data.name ?? undefined,
      conlang: data.conlang ?? undefined,
      tags,
      about: data.about ?? undefined,
      operationKey: `course:${data.id}:admin_set:route`,
    });
  }

  // revalidate the page
  const response_short = response?.short;
  try {
    if (response_short) {
      revalidatePath(`/${response_short}`);
    }
    revalidatePath(`/`);
  } catch (e) {
    //console.log("revalidate error", e);
  }
  return response;
}
