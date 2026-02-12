import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser, isContributor } from "@/lib/userInterface";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

const payloadSchema = z.object({
  tag: z.string().min(1),
  text: z.string(),
  language_id: z.number(),
});

export async function POST(req: NextRequest) {
  const token = await getUser();
  if (!token || !isContributor(token)) {
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });
  }

  const parsed = payloadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { tag, text, language_id } = parsed.data;

  const row = await fetchAuthMutation(api.localizationWrite.setLocalization, {
    legacyLanguageId: language_id,
    tag,
    text,
    operationKey: `localization:${language_id}:${tag}:route`,
  });

  return NextResponse.json(row);
}
