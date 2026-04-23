import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authorization";
import { recomputeCoursePublishedCount } from "./lib/courseCounts";

export const togglePublished = mutation({
  args: {
    legacyStoryId: v.number(),
    operationKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story || typeof story.legacyId !== "number") {
      throw new Error(`Story ${args.legacyStoryId} not found`);
    }

    const course = await ctx.db.get(story.courseId);
    if (!course || typeof course.legacyId !== "number") {
      throw new Error(`Course missing for story ${args.legacyStoryId}`);
    }

    const nextPublic = !story.public;
    await ctx.db.patch(story._id, { public: nextPublic });
    await recomputeCoursePublishedCount(ctx, course._id);

    return null;
  },
});

export const removeApproval = mutation({
  args: {
    legacyStoryId: v.number(),
    legacyApprovalId: v.number(),
    operationKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story || typeof story.legacyId !== "number") {
      throw new Error(`Story ${args.legacyStoryId} not found`);
    }

    const approval = await ctx.db
      .query("story_approval")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyApprovalId))
      .unique();
    if (!approval) {
      return null;
    }

    if (approval.storyId !== story._id) {
      throw new Error("Approval does not belong to story");
    }

    await ctx.db.delete(approval._id);

    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();
    const approvalCount = approvals.length;
    const storyStatus: "draft" | "feedback" | "finished" =
      approvalCount === 0
        ? "draft"
        : approvalCount === 1
          ? "feedback"
          : "finished";
    await ctx.db.patch(story._id, {
      status: storyStatus,
      approvalCount,
    });

    return null;
  },
});

export const repairImportedStoryMatch = mutation({
  args: {
    targetLegacyStoryId: v.number(),
    sourceLegacyStoryId: v.number(),
    sourceCourseLegacyId: v.optional(v.number()),
    targetCourseLegacyId: v.optional(v.number()),
    operationKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const [targetStory, sourceStory] = await Promise.all([
      ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", args.targetLegacyStoryId),
        )
        .unique(),
      ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", args.sourceLegacyStoryId),
        )
        .unique(),
    ]);

    if (!targetStory || typeof targetStory.legacyId !== "number") {
      throw new Error(`Target story ${args.targetLegacyStoryId} not found`);
    }
    if (!sourceStory || typeof sourceStory.legacyId !== "number") {
      throw new Error(`Source story ${args.sourceLegacyStoryId} not found`);
    }
    if (!sourceStory.duo_id) {
      throw new Error(
        `Source story ${args.sourceLegacyStoryId} has no duo_id to repair from`,
      );
    }

    const [targetCourse, sourceCourse] = await Promise.all([
      ctx.db.get(targetStory.courseId),
      ctx.db.get(sourceStory.courseId),
    ]);

    if (!targetCourse || !sourceCourse) {
      throw new Error("Source or target course not found");
    }
    if (targetCourse._id === sourceCourse._id) {
      throw new Error(
        "Source and target stories must belong to different courses",
      );
    }
    if (args.sourceCourseLegacyId !== undefined) {
      if (sourceCourse.legacyId !== args.sourceCourseLegacyId) {
        throw new Error(
          "Source story does not belong to the selected source course",
        );
      }
    }
    if (args.targetCourseLegacyId !== undefined) {
      if (targetCourse.legacyId !== args.targetCourseLegacyId) {
        throw new Error(
          "Target story does not belong to the selected target course",
        );
      }
    }

    await ctx.db.patch(targetStory._id, {
      duo_id: sourceStory.duo_id,
      set_id: sourceStory.set_id,
      set_index: sourceStory.set_index,
      imageId: sourceStory.imageId,
      change_date: Date.now(),
    });

    return null;
  },
});
