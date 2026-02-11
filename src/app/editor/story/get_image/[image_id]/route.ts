import { NextResponse, NextRequest } from "next/server";
import { getUser, isContributor } from "@/lib/userInterface";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

interface RouteParams {
  params: Promise<{ image_id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { image_id } = await params;
    const token = await getUser();

    if (!token)
      return new Response("You need to be logged in.", {
        status: 401,
      });

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await get_image({ image_id });

    if (answer === undefined)
      return new Response("Error not found.", { status: 404 });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}

async function get_image({ image_id }: { image_id: string }) {
  return await fetchQuery(api.editorRead.getEditorImageByLegacyId, {
    legacyImageId: image_id,
  });
}
