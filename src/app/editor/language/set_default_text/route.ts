import { NextResponse } from "next/server";
import { fetchAuthMutation } from "@/lib/auth-server";
import { getUser, isContributor } from "@/lib/userInterface";
import { z } from "zod";
import { api } from "@convex/_generated/api";

const DefaultTextSchema = z.object({
  id: z.number(),
  default_text: z.string(),
});

export async function POST(req: Request) {
  try {
    const { id, default_text } = DefaultTextSchema.parse(await req.json());
    const token = await getUser();

    if (!token)
      return new Response("You need to be logged in.", {
        status: 401,
      });

    if (!isContributor(token))
      return new Response("You need to be a registered contributor.", {
        status: 401,
      });

    let answer = await set_default_text({ id, default_text });

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

async function set_default_text({
  id,
  default_text,
}: {
  id: number;
  default_text: string;
}) {
  return await fetchAuthMutation(api.languageWrite.setDefaultText, {
    legacyLanguageId: id,
    default_text,
    operationKey: `language:${id}:default_text:route`,
  });
}
