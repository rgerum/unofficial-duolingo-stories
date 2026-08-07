import { mutation, type MutationCtx, query } from "./_generated/server";
import { v } from "convex/values";

async function requireTokenIdentifier(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
  return identity.tokenIdentifier;
}

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
      .take(1_000);

    return pins.map((pin) => pin.courseLegacyId);
  },
});

export const setCurrentUserCoursePin = mutation({
  args: {
    courseLegacyId: v.number(),
    pinned: v.boolean(),
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
      await ctx.db.insert("user_pinned_courses", {
        tokenIdentifier,
        courseId: course._id,
        courseLegacyId: course.legacyId,
        pinnedAt: Date.now(),
      });
    } else if (!args.pinned && existingPin) {
      await ctx.db.delete(existingPin._id);
    }

    return args.pinned;
  },
});
