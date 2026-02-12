import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/userInterface";
import { mirrorLanguage } from "@/lib/lookupTableMirror";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

interface LanguageData {
  id?: number;
  name: string;
  short: string;
  flag: number;
  flag_file: string;
  speaker: string;
  rtl: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const data: LanguageData = await req.json();
    const token = await getUser();

    if (!isAdmin(token))
      return new Response("You need to be a registered admin.", {
        status: 401,
      });

    const answer = await set_language(data);

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

async function set_language(data: LanguageData) {
  if (data.id !== undefined) {
    return await fetchAuthMutation(api.adminWrite.updateAdminLanguage, {
      id: data.id,
      name: data.name,
      short: data.short,
      flag: data.flag,
      flag_file: data.flag_file,
      speaker: data.speaker,
      rtl: data.rtl,
      operationKey: `language:${data.id}:admin_set:route`,
    });
  }

  const language = (await sql`INSERT INTO language ${sql(data)} RETURNING *`)[0];

  if (language?.id) {
    await mirrorLanguage(language, `language:${language.id}:admin_set`);
  }

  return language;
}
