import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSessionLegacyUserId } from "./lib/authorization";

export const deleteCurrentUser = mutation({
  args: {},
  returns: v.object({
    deletedRows: v.number(),
    anonymizedReports: v.number(),
  }),
  handler: async (ctx) => {
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const identity = (await ctx.auth.getUserIdentity()) as {
      tokenIdentifier?: string | null;
    } | null;
    const tokenIdentifier = identity?.tokenIdentifier;
    if (!tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "userId", operator: "eq", value: String(legacyUserId) }],
    })) as { _id?: string | null } | null;

    if (!user?._id) {
      throw new Error("Account not found.");
    }

    // Account deletion currently covers:
    // - deleted: story_done, story_done_state, course_activity, discord_stories_role_sync, user_preferences
    // - anonymized: story_feedback_reports
    // - deleted via Better Auth adapter: user, session, account
    // Add future legacyUserId/tokenIdentifier-owned tables here.
    let deletedRows = 0;
    let anonymizedReports = 0;

    const storyDoneRows = await ctx.db
      .query("story_done")
      .withIndex("by_user", (q) => q.eq("legacyUserId", legacyUserId))
      .collect();
    for (const row of storyDoneRows) {
      await ctx.db.delete(row._id);
      deletedRows += 1;
    }

    const storyDoneStateRows = await ctx.db
      .query("story_done_state")
      .withIndex("by_user_and_story", (q) => q.eq("legacyUserId", legacyUserId))
      .collect();
    for (const row of storyDoneStateRows) {
      await ctx.db.delete(row._id);
      deletedRows += 1;
    }

    const courseActivityRows = await ctx.db
      .query("course_activity")
      .withIndex("by_user_and_course", (q) =>
        q.eq("legacyUserId", legacyUserId),
      )
      .collect();
    for (const row of courseActivityRows) {
      await ctx.db.delete(row._id);
      deletedRows += 1;
    }

    const discordRoleSyncRows = await ctx.db
      .query("discord_stories_role_sync")
      .withIndex("by_legacy_user_id", (q) => q.eq("legacyUserId", legacyUserId))
      .collect();
    for (const row of discordRoleSyncRows) {
      await ctx.db.delete(row._id);
      deletedRows += 1;
    }

    const preferenceRows = await ctx.db
      .query("user_preferences")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .collect();
    for (const row of preferenceRows) {
      await ctx.db.delete(row._id);
      deletedRows += 1;
    }

    const feedbackReportRows = await ctx.db
      .query("story_feedback_reports")
      .withIndex("by_user_id", (q) => q.eq("userId", tokenIdentifier))
      .collect();
    for (const row of feedbackReportRows) {
      await ctx.db.patch(row._id, {
        userId: null,
        userName: null,
        userEmail: null,
      });
      anonymizedReports += 1;
    }

    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
      },
    });
    deletedRows += 1;

    for (const model of ["session", "account"] as const) {
      let cursor: string | null = null;
      let isDone = false;
      while (!isDone) {
        const result = (await ctx.runMutation(
          components.betterAuth.adapter.deleteMany,
          {
            input: {
              model,
              where: [{ field: "userId", value: user._id }],
            },
            paginationOpts: { numItems: 100, cursor },
          },
        )) as {
          isDone: boolean;
          continueCursor: string;
          count: number;
        };
        deletedRows += result.count;
        cursor = result.continueCursor;
        isDone = result.isDone;
      }
    }

    return { deletedRows, anonymizedReports };
  },
});
