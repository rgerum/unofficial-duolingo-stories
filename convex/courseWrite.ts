import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireContributorOrAdmin } from "./lib/authorization";
import { recomputeCoursePublishedCount } from "./lib/courseCounts";

export const recomputePublishedCount = mutation({
  args: {
    legacyCourseId: v.number(),
  },
  returns: v.object({
    count: v.number(),
    updated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    const course = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyCourseId))
      .unique();
    if (!course) {
      throw new Error(`Course ${args.legacyCourseId} not found`);
    }

    const previousCount = course.count ?? 0;
    const count = await recomputeCoursePublishedCount(ctx, course._id);

    return {
      count,
      updated: previousCount !== count,
    };
  },
});
