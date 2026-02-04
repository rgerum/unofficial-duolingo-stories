import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/userInterface";

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
  const data: LanguageData = await req.json();
  const token = await getUser();

  if (!token?.admin)
    return new Response("You need to be a registered admin.", {
      status: 401,
    });

  const answer = await set_language(data);

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_language(data: LanguageData) {
  if (data.id === undefined)
    return (await sql`INSERT INTO language ${sql(data)} RETURNING *`)[0];
  return (
    await sql`UPDATE language SET ${sql(data, [
      "name",
      "short",
      "flag",
      "flag_file",
      "rtl",
      "speaker",
    ])} WHERE id = ${data.id} RETURNING *`
  )[0];
}
