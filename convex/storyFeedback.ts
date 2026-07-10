import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireContributorOrAdmin } from "./lib/authorization";

const feedbackCategoryValidator = v.union(
  v.literal("Text"),
  v.literal("Translation hints"),
  v.literal("Audio"),
  v.literal("Other"),
);

const feedbackStatusValidator = v.union(
  v.literal("open"),
  v.literal("reviewed"),
  v.literal("resolved"),
);

const feedbackReportValidator = v.object({
  _id: v.id("story_feedback_reports"),
  _creationTime: v.number(),
  storyId: v.number(),
  storyTitle: v.string(),
  courseShort: v.string(),
  line: v.optional(v.number()),
  lineText: v.optional(v.string()),
  category: feedbackCategoryValidator,
  comment: v.string(),
  userId: v.union(v.string(), v.null()),
  userName: v.union(v.string(), v.null()),
  userEmail: v.union(v.string(), v.null()),
  status: feedbackStatusValidator,
  createdAt: v.number(),
});

export const submitStoryFeedback = mutation({
  args: {
    storyId: v.number(),
    storyTitle: v.string(),
    courseShort: v.string(),
    line: v.optional(v.number()),
    lineText: v.optional(v.string()),
    category: feedbackCategoryValidator,
    comment: v.string(),
  },
  returns: v.object({
    reportId: v.id("story_feedback_reports"),
  }),
  handler: async (ctx, args) => {
    const comment = args.comment.trim();
    if (!comment) {
      throw new Error("Comment is required");
    }
    if (comment.length > 2000) {
      throw new Error("Comment is too long");
    }

    const storyTitle = args.storyTitle.trim();
    if (storyTitle.length > 200) {
      throw new Error("Story title is too long");
    }

    const courseShort = args.courseShort.trim();
    if (courseShort.length > 20) {
      throw new Error("Course short is too long");
    }

    const lineText = args.lineText?.trim();
    if (lineText !== undefined && lineText.length > 500) {
      throw new Error("Line text is too long");
    }

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story) {
      throw new Error("Unknown story");
    }

    const openReports = await ctx.db
      .query("story_feedback_reports")
      .withIndex("by_story_and_status", (q) =>
        q.eq("storyId", args.storyId).eq("status", "open"),
      )
      .take(25);
    if (openReports.length >= 25) {
      throw new Error(
        "This story already has many open reports. Please try again later.",
      );
    }

    const identity = (await ctx.auth.getUserIdentity()) as {
      tokenIdentifier?: string | null;
      name?: string | null;
      email?: string | null;
    } | null;

    const reportId = await ctx.db.insert("story_feedback_reports", {
      storyId: args.storyId,
      storyTitle,
      courseShort,
      ...(args.line !== undefined ? { line: args.line } : {}),
      ...(lineText ? { lineText } : {}),
      category: args.category,
      comment,
      userId: identity?.tokenIdentifier ?? null,
      userName: identity?.name?.trim() || null,
      userEmail: identity?.email?.trim() || null,
      status: "open",
      createdAt: Date.now(),
    });

    return { reportId };
  },
});

export const listStoryFeedbackReports = query({
  args: {
    status: feedbackStatusValidator,
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(feedbackReportValidator),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    return await ctx.db
      .query("story_feedback_reports")
      .withIndex("by_status_and_created_at", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const updateStoryFeedbackStatus = mutation({
  args: {
    reportId: v.id("story_feedback_reports"),
    status: feedbackStatusValidator,
  },
  returns: feedbackReportValidator,
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    await ctx.db.patch(args.reportId, {
      status: args.status,
    });

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Feedback report not found");
    }

    return report;
  },
});
