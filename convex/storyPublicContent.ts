import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/authorization";
import { upsertPublicStoryContent } from "./lib/publicStoryContent";

export const backfillBatch = mutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    processed: v.number(),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const page = await ctx.db
      .query("story_content")
      .order("asc")
      .paginate(args.paginationOpts);

    for (const content of page.page) {
      await upsertPublicStoryContent(
        ctx,
        content.storyId,
        content.json,
        content.lastUpdated,
      );
    }

    return {
      processed: page.page.length,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});
