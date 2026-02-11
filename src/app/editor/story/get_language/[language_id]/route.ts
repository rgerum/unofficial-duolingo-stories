import { NextResponse, NextRequest } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

interface RouteParams {
  params: Promise<{ language_id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { language_id } = await params;
    const token = await getUser();

    if (!token)
      return new Response("You need to be logged in.", {
        status: 401,
      });

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    const answer = await language({ language_id });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}

async function language({ language_id }: { language_id: string }) {
  return await fetchQuery(api.editorRead.getEditorLanguageByLegacyId, {
    legacyLanguageId: Number(language_id),
  });
}
