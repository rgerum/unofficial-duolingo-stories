import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  requireContributorOrAdmin,
  requireSessionLegacyUserId,
} from "./lib/authorization";

const storyApprovalInputValidator = {
  legacyStoryId: v.number(),
  date: v.optional(v.number()),
  legacyApprovalId: v.optional(v.number()),
};

export const upsertStoryApproval = mutation({
  args: storyApprovalInputValidator,
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("story_approval"),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      throw new Error(`Missing story for legacy id ${args.legacyStoryId}`);
    }

    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", story._id).eq("legacyUserId", legacyUserId),
      )
      .unique();

    const doc = {
      storyId: story._id,
      legacyUserId,
      date: args.date ?? Date.now(),
      legacyId: args.legacyApprovalId,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("story_approval", doc);
    return { inserted: true, docId };
  },
});

export const deleteStoryApproval = mutation({
  args: {
    legacyStoryId: v.number(),
  },
  returns: v.object({
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      return { deleted: false };
    }

    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", story._id).eq("legacyUserId", legacyUserId),
      )
      .unique();
    if (!existing) return { deleted: false };

    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const deleteStoryApprovalByLegacyId = mutation({
  args: {
    legacyApprovalId: v.number(),
  },
  returns: v.object({
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyApprovalId))
      .unique();
    if (!existing) return { deleted: false };
    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const getApprovalCountByStory = query({
  args: {
    legacyStoryId: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) return 0;
    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();
    return approvals.length;
  },
});
