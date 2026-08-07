import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTokenIdentifier } from "./lib/authorization";

export const MAX_PINNED_COURSES = 20;

export const listCurrentUserPins = query({
  args: {},
  returns: v.array(v.number()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];

    const pins = await ctx.db
      .query("user_pinned_courses")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .take(MAX_PINNED_COURSES);

    return pins.map((pin) => pin.courseLegacyId);
  },
});

export const setCurrentUserCoursePin = mutation({
  args: {
    courseLegacyId: v.number(),
    pinned: v.boolean(),
    operationKey: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const tokenIdentifier = await requireTokenIdentifier(ctx);
    const course = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.courseLegacyId))
      .unique();
    if (!course) throw new Error("Course not found");

    const existingPin = await ctx.db
      .query("user_pinned_courses")
      .withIndex("by_token_identifier_and_course_id", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("courseId", course._id),
      )
      .unique();

    if (args.pinned && !existingPin) {
      const pinsAtLimit = await ctx.db
        .query("user_pinned_courses")
        .withIndex("by_token_identifier", (q) =>
          q.eq("tokenIdentifier", tokenIdentifier),
        )
        .take(MAX_PINNED_COURSES);
      if (pinsAtLimit.length >= MAX_PINNED_COURSES) {
        throw new Error(`You can pin up to ${MAX_PINNED_COURSES} courses`);
      }

      const operationKey =
        args.operationKey ??
        `coursePin:${args.courseLegacyId}:${args.pinned}:${Date.now()}`;
      await ctx.db.insert("user_pinned_courses", {
        tokenIdentifier,
        courseId: course._id,
        courseLegacyId: course.legacyId,
        pinnedAt: Date.now(),
        operationKey,
      });
    } else if (!args.pinned && existingPin) {
      await ctx.db.delete(existingPin._id);
    }

    return args.pinned;
  },
});
