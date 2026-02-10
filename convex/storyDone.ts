import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordStoryDone = mutation({
  args: {
    legacyStoryId: v.number(),
    legacyUserId: v.optional(v.number()),
    time: v.optional(v.number()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("story_done"),
  }),
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      throw new Error(`Missing story for legacy id ${args.legacyStoryId}`);
    }

    // Keep one done row per (user, story) for logged-in users.
    if (typeof args.legacyUserId === "number") {
      const existing = await ctx.db
        .query("story_done")
        .withIndex("by_user_and_story", (q) =>
          q.eq("legacyUserId", args.legacyUserId).eq("storyId", story._id),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          time: args.time ?? Date.now(),
        });
        return { inserted: false, docId: existing._id };
      }
    }

    const docId = await ctx.db.insert("story_done", {
      storyId: story._id,
      legacyUserId: args.legacyUserId,
      time: args.time ?? Date.now(),
    });
    return { inserted: true, docId };
  },
});

export const getDoneStoryIdsForCourse = query({
  args: {
    legacyCourseId: v.number(),
    legacyUserId: v.number(),
  },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyCourseId))
      .unique();
    if (!course) return [];

    const doneRows = await ctx.db
      .query("story_done")
      .withIndex("by_user", (q) => q.eq("legacyUserId", args.legacyUserId))
      .collect();

    const result = new Set<number>();
    for (const row of doneRows) {
      const story = await ctx.db.get(row.storyId);
      if (!story) continue;
      if (story.courseId !== course._id) continue;
      if (typeof story.legacyId !== "number") continue;
      result.add(story.legacyId);
    }
    return Array.from(result.values());
  },
});
