import { v } from "convex/values";
import { env, internalAction } from "./_generated/server";

// Pages on the Next.js site are cached (Cache Components) and otherwise only
// refresh on a slow fallback schedule (weekly for story pages, hourly for
// course pages and lists). This clears them right away after an edit.
// Best-effort: a failure means readers see the old version until that
// fallback refresh.
export const revalidate = internalAction({
  args: { tags: v.array(v.string()) },
  returns: v.null(),
  handler: async (_ctx, { tags }) => {
    const siteUrl = env.SITE_URL;
    const secret = env.SITE_REVALIDATE_SECRET;
    if (!siteUrl || !secret || tags.length === 0) return null;

    try {
      const response = await fetch(new URL("/api/revalidate", siteUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }),
      });
      if (!response.ok) {
        console.error(
          `Site cache revalidation failed: ${response.status} ${await response.text()}`,
        );
      }
    } catch (error) {
      console.error("Site cache revalidation failed:", error);
    }
    return null;
  },
});
