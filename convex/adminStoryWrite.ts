import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authorization";

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

    const storiesInCourse = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", story.courseId))
      .collect();
    const courseCount = storiesInCourse.filter((row) => row.public && !row.deleted).length;
    await ctx.db.patch(course._id, { count: courseCount });

    const operationKey =
      args.operationKey ?? `story:${story.legacyId}:toggle_published:${Date.now()}`;
    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorStoryPublishedToggle, {
      storyId: story.legacyId,
      public: nextPublic,
      courseLegacyId: course.legacyId,
      courseCount,
      operationKey,
    });

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
      approvalCount === 0 ? "draft" : approvalCount === 1 ? "feedback" : "finished";
    await ctx.db.patch(story._id, {
      status: storyStatus,
      approvalCount,
    });

    const operationKey =
      args.operationKey ??
      `story_approval:${args.legacyApprovalId}:admin_delete:${Date.now()}`;
    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorAdminApprovalDelete, {
      storyId: story.legacyId,
      legacyApprovalId: args.legacyApprovalId,
      storyStatus,
      approvalCount,
      operationKey,
    });

    return null;
  },
});
