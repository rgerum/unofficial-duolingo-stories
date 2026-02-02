import { NextResponse, NextRequest } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
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

    const answer = await fetchQuery(api.editor.getLanguage, {
      languageLegacyId: parseInt(language_id),
    });

    if (answer === null)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}
