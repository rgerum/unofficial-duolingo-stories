import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { getUser } from "@/lib/userInterface";
import { z } from "zod";

const DefaultTextSchema = z.object({
  id: z.number(),
  default_text: z.string(),
});

export async function POST(req: Request) {
  try {
    const { id, default_text } = DefaultTextSchema.parse(await req.json());
    const token = await getUser();

    if (!token?.role)
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    const answer = await fetchMutation(api.editor.updateLanguageDefaultText, {
      languageLegacyId: id,
      default_text,
    });

    return NextResponse.json(answer);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
    });
  }
}
