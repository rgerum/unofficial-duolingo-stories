import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getSessionLegacyUserId } from "./lib/authorization";

const storyDoneInputValidator = v.object({
  legacyStoryId: v.number(),
  time: v.optional(v.number()),
});

export const recordStoryDone = mutation({
  args: storyDoneInputValidator.fields,
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("story_done"),
  }),
  handler: async (ctx, args) => {
    const legacyUserId = await getSessionLegacyUserId(ctx);

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      throw new Error(`Missing story for legacy id ${args.legacyStoryId}`);
    }

    const docId = await ctx.db.insert("story_done", {
      storyId: story._id,
      legacyUserId: legacyUserId ?? undefined,
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
  args: {},
  returns: v.union(v.array(v.number()), v.null()),
  handler: async (ctx) => {
    const identity = (await ctx.auth.getUserIdentity()) as
      | { userId?: string | number | null }
      | null;

    const rawLegacyUserId = identity?.userId;
    const legacyUserId =
      typeof rawLegacyUserId === "number"
        ? rawLegacyUserId
        : Number.isFinite(Number(rawLegacyUserId))
          ? Number(rawLegacyUserId)
          : NaN;

    if (!Number.isFinite(legacyUserId)) return null;

    const doneRows = await ctx.db
      .query("story_done")
      .withIndex("by_user", (q) => q.eq("legacyUserId", legacyUserId))
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

export const getLastDoneCourseShortForLegacyUser = query({
  args: {
    legacyUserId: v.number(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const doneRows = await ctx.db
      .query("story_done")
      .withIndex("by_user_time", (q) => q.eq("legacyUserId", args.legacyUserId))
      .order("desc")
      .take(20);

    for (const doneRow of doneRows) {
      const story = await ctx.db.get(doneRow.storyId);
      if (!story || story.deleted) continue;
      const course = await ctx.db.get(story.courseId);
      if (!course?.short) continue;
      return course.short;
    }

    return null;
  },
});
