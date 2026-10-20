import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

// /api/revalidate accepts at most 100 tags per request.
const MAX_TAGS_PER_REQUEST = 100;

// For writes whose tag count isn't bounded (e.g. one per affected story).
export async function scheduleSiteRevalidation(
  ctx: MutationCtx,
  tags: string[],
) {
  const unique = [...new Set(tags)];
  for (let i = 0; i < unique.length; i += MAX_TAGS_PER_REQUEST) {
    await ctx.scheduler.runAfter(0, internal.siteCache.revalidate, {
      tags: unique.slice(i, i + MAX_TAGS_PER_REQUEST),
    });
  }
}
