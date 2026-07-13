import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireContributorOrAdmin } from "./lib/authorization";
import { recomputeCoursePublishedCount } from "./lib/courseCounts";
import { hasNoAudioCourseTag } from "./lib/courseTags";

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
    operationKey: v.optional(v.string()),
    counts: v.array(
      v.object({
        courseShort: v.optional(v.string()),
        legacyCourseId: v.optional(v.number()),
        audioProblemCount: v.number(),
      }),
    ),
    stories: v.optional(
      v.array(
        v.object({
          legacyStoryId: v.number(),
          audioProblemCount: v.number(),
        }),
      ),
    ),
  },
  returns: v.object({
    updated: v.number(),
    unchanged: v.number(),
    updatedStories: v.number(),
    unchangedStories: v.number(),
    missingStories: v.array(v.number()),
    missing: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    const operationKey =
      args.operationKey ?? `course:audio_problem_counts:${Date.now()}`;
    let updated = 0;
    let unchanged = 0;
    let updatedStories = 0;
    let unchangedStories = 0;
    const missing: string[] = [];
    const missingStories: number[] = [];

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

      const nextAudioProblemCount = hasNoAudioCourseTag(course.tags)
        ? 0
        : entry.audioProblemCount;

      if ((course.audio_problem_count ?? 0) === nextAudioProblemCount) {
        unchanged += 1;
        continue;
      }

      await ctx.db.patch(course._id, {
        audio_problem_count: nextAudioProblemCount,
        lastOperationKey: operationKey,
      });
      updated += 1;
    }

    for (const entry of args.stories ?? []) {
      if (
        entry.audioProblemCount < 0 ||
        !Number.isInteger(entry.audioProblemCount)
      ) {
        throw new Error(
          "story audioProblemCount must be a non-negative integer",
        );
      }

      const story = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", entry.legacyStoryId))
        .unique();
      if (!story) {
        missingStories.push(entry.legacyStoryId);
        continue;
      }
      const storyCourse = await ctx.db.get(story.courseId);
      const nextAudioProblemCount =
        storyCourse && hasNoAudioCourseTag(storyCourse.tags)
          ? 0
          : entry.audioProblemCount;

      if ((story.audio_problem_count ?? 0) === nextAudioProblemCount) {
        unchangedStories += 1;
        continue;
      }

      await ctx.db.patch(story._id, {
        audio_problem_count: nextAudioProblemCount,
        lastOperationKey: operationKey,
      });
      updatedStories += 1;
    }

    return {
      updated,
      unchanged,
      updatedStories,
      unchangedStories,
      missingStories,
      missing,
    };
  },
});
