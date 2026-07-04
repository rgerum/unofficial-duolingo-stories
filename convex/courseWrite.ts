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

export const setAudioProblemCounts = mutation({
  args: {
    counts: v.array(
      v.object({
        courseShort: v.optional(v.string()),
        legacyCourseId: v.optional(v.number()),
        audioProblemCount: v.number(),
      }),
    ),
  },
  returns: v.object({
    updated: v.number(),
    unchanged: v.number(),
    missing: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    let updated = 0;
    let unchanged = 0;
    const missing: string[] = [];

    for (const entry of args.counts) {
      if (
        entry.audioProblemCount < 0 ||
        !Number.isInteger(entry.audioProblemCount)
      ) {
        throw new Error("audioProblemCount must be a non-negative integer");
      }
      if (!entry.courseShort && entry.legacyCourseId === undefined) {
        throw new Error("Each count needs courseShort or legacyCourseId");
      }

      const course =
        entry.legacyCourseId !== undefined
          ? await ctx.db
              .query("courses")
              .withIndex("by_id_value", (q) =>
                q.eq("legacyId", entry.legacyCourseId!),
              )
              .unique()
          : await ctx.db
              .query("courses")
              .withIndex("by_short", (q) => q.eq("short", entry.courseShort))
              .unique();

      if (!course) {
        missing.push(entry.courseShort ?? String(entry.legacyCourseId));
        continue;
      }

      if ((course.audio_problem_count ?? 0) === entry.audioProblemCount) {
        unchanged += 1;
        continue;
      }

      await ctx.db.patch(course._id, {
        audio_problem_count: entry.audioProblemCount,
      });
      updated += 1;
    }

    return { updated, unchanged, missing };
  },
});
