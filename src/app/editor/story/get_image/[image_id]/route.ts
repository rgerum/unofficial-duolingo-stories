import { NextResponse, NextRequest } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getUser } from "@/lib/userInterface";

interface RouteParams {
  params: Promise<{ image_id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { image_id } = await params;
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    const answer = await fetchQuery(api.editor.getImage, {
      imageLegacyId: image_id,
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
