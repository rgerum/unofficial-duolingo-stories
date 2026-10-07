import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// Called by Convex (convex/siteCache.ts) after story edits so cached pages
// update immediately instead of at their hourly refresh.
const ALLOWED_TAG =
  /^(story-\d+|course-[a-zA-Z0-9-]+|courses|landing|recent|localization)$/;

function isAuthorized(request: Request) {
  const secret = process.env.SITE_REVALIDATE_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const tags =
    typeof body === "object" && body !== null && "tags" in body
      ? body.tags
      : undefined;
  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    tags.length > 100 ||
    !tags.every((tag) => typeof tag === "string" && ALLOWED_TAG.test(tag))
  ) {
    return Response.json({ error: "Invalid tags" }, { status: 400 });
  }

  // expire: 0 so the next visit renders fresh content instead of serving the
  // stale page once more while revalidating in the background.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}
