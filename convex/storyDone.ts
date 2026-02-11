import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const storyDoneInputValidator = v.object({
  legacyStoryId: v.number(),
  legacyUserId: v.optional(v.number()),
  time: v.optional(v.number()),
});

export const recordStoryDone = mutation({
  args: storyDoneInputValidator.fields,
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

    const docId = await ctx.db.insert("story_done", {
      storyId: story._id,
      legacyUserId: args.legacyUserId,
      time: args.time ?? Date.now(),
    });
    return { inserted: true, docId };
  },
});

export const recordStoryDoneBatch = mutation({
  args: {
    rows: v.array(v.object(storyDoneInputValidator.fields)),
  },
  returns: v.object({
    inserted: v.number(),
    missingStories: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    const uniqueLegacyStoryIds = Array.from(
      new Set(args.rows.map((row) => row.legacyStoryId)),
    );

    const storyByLegacyId = new Map<number, Id<"stories">>();
    for (const legacyStoryId of uniqueLegacyStoryIds) {
      const story = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyStoryId))
        .unique();
      if (!story) continue;
      storyByLegacyId.set(legacyStoryId, story._id);
    }

    let inserted = 0;
    const missingStories: Array<number> = [];
    for (const row of args.rows) {
      const storyId = storyByLegacyId.get(row.legacyStoryId);
      if (!storyId) {
        missingStories.push(row.legacyStoryId);
        continue;
      }
      await ctx.db.insert("story_done", {
        storyId,
        legacyUserId: row.legacyUserId,
        time: row.time ?? Date.now(),
      });
      inserted += 1;
    }

    return {
      inserted,
      missingStories: Array.from(new Set(missingStories)),
    };
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

    const courseStories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();

    const doneRows = await ctx.db
      .query("story_done")
      .withIndex("by_user", (q) => q.eq("legacyUserId", args.legacyUserId))
      .collect();
    const doneStoryIds = new Set(doneRows.map((row) => row.storyId));

    const result: Array<number> = [];
    for (const story of courseStories) {
      if (!doneStoryIds.has(story._id)) continue;
      if (typeof story.legacyId !== "number") continue;
      result.push(story.legacyId);
    }
    return result;
  },
});

export const getDoneCourseIdsForUser = query({
  args: {
    legacyUserId: v.number(),
  },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    const doneRows = await ctx.db
      .query("story_done")
      .withIndex("by_user", (q) => q.eq("legacyUserId", args.legacyUserId))
      .collect();
    if (doneRows.length === 0) return [];

    const latestDoneAtByCourse = new Map<number, number>();
    for (const doneRow of doneRows) {
      const story = await ctx.db.get(doneRow.storyId);
      if (!story || !story.courseId) continue;
      const course = await ctx.db.get(story.courseId);
      if (!course || typeof course.legacyId !== "number") continue;
      const existing = latestDoneAtByCourse.get(course.legacyId) ?? 0;
      if (doneRow.time > existing) {
        latestDoneAtByCourse.set(course.legacyId, doneRow.time);
      }
    }

    return Array.from(latestDoneAtByCourse.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([legacyCourseId]) => legacyCourseId);
  },
});
