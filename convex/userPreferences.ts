import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getSessionLegacyUserId } from "./lib/authorization";

const storyPreferencesValidator = v.object({
  hasSavedPreference: v.boolean(),
  hideStoryQuestions: v.boolean(),
});

export const getCurrentStoryPreferences = query({
  args: {},
  returns: storyPreferencesValidator,
  handler: async (ctx) => {
    const identity = (await ctx.auth.getUserIdentity()) as {
      tokenIdentifier?: string | null;
    } | null;
    const tokenIdentifier = identity?.tokenIdentifier;
    if (!tokenIdentifier) {
      return {
        hasSavedPreference: false,
        hideStoryQuestions: false,
      };
    }

    const preference = await ctx.db
      .query("user_preferences")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();

    return {
      hasSavedPreference: preference !== null,
      hideStoryQuestions: preference?.hideStoryQuestions ?? false,
    };
  },
});

export const setCurrentStoryPreferences = mutation({
  args: {
    hideStoryQuestions: v.boolean(),
  },
  returns: storyPreferencesValidator,
  handler: async (ctx, args) => {
    const identity = (await ctx.auth.getUserIdentity()) as {
      tokenIdentifier?: string | null;
    } | null;
    const tokenIdentifier = identity?.tokenIdentifier;
    if (!tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const legacyUserId = await getSessionLegacyUserId(ctx);
    const existingPreference = await ctx.db
      .query("user_preferences")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();

    const updatedAt = Date.now();

    if (existingPreference) {
      await ctx.db.patch(existingPreference._id, {
        legacyUserId: legacyUserId ?? undefined,
        hideStoryQuestions: args.hideStoryQuestions,
        updatedAt,
      });
    } else {
      await ctx.db.insert("user_preferences", {
        tokenIdentifier,
        legacyUserId: legacyUserId ?? undefined,
        hideStoryQuestions: args.hideStoryQuestions,
        updatedAt,
      });
    }

    return {
      hasSavedPreference: true,
      hideStoryQuestions: args.hideStoryQuestions,
    };
  },
});
