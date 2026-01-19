import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/userInterface";

interface RouteParams {
  params: Promise<{ language_id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { language_id } = await params;
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await language({ language_id });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
  }
}

async function language({ language_id }: { language_id: string }) {
  return (await sql`SELECT * FROM language WHERE id = ${language_id}`)[0];
}
