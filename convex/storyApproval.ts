import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const storyApprovalInputValidator = {
  legacyStoryId: v.number(),
  legacyUserId: v.number(),
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
        q.eq("storyId", story._id).eq("legacyUserId", args.legacyUserId),
      )
      .unique();

    const doc = {
      storyId: story._id,
      legacyUserId: args.legacyUserId,
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
    legacyUserId: v.number(),
  },
  returns: v.object({
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
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
        q.eq("storyId", story._id).eq("legacyUserId", args.legacyUserId),
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
    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyApprovalId))
      .unique();
    if (!existing) return { deleted: false };
    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const upsertStoryApprovalBatch = mutation({
  args: {
    rows: v.array(v.object(storyApprovalInputValidator)),
  },
  returns: v.object({
    upserted: v.number(),
    missingStories: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    const uniqueLegacyStoryIds = Array.from(
      new Set(args.rows.map((row) => row.legacyStoryId)),
    );
    const storyIdByLegacyStoryId = new Map<number, Id<"stories">>();
    for (const legacyStoryId of uniqueLegacyStoryIds) {
      const story = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyStoryId))
        .unique();
      if (!story) continue;
      storyIdByLegacyStoryId.set(legacyStoryId, story._id);
    }

    let upserted = 0;
    const missingStories: Array<number> = [];
    for (const row of args.rows) {
      const storyId = storyIdByLegacyStoryId.get(row.legacyStoryId);
      if (!storyId) {
        missingStories.push(row.legacyStoryId);
        continue;
      }
      const existing = await ctx.db
        .query("story_approval")
        .withIndex("by_story_and_user", (q) =>
          q.eq("storyId", storyId).eq("legacyUserId", row.legacyUserId),
        )
        .unique();
      const doc = {
        storyId,
        legacyUserId: row.legacyUserId,
        date: row.date ?? Date.now(),
        legacyId: row.legacyApprovalId,
      };
      if (existing) {
        await ctx.db.replace(existing._id, doc);
      } else {
        await ctx.db.insert("story_approval", doc);
      }
      upserted += 1;
    }

    return {
      upserted,
      missingStories: Array.from(new Set(missingStories)),
    };
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
