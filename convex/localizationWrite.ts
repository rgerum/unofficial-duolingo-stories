import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireContributorOrAdmin } from "./lib/authorization";

export const setLocalization = mutation({
  args: {
    legacyLanguageId: v.number(),
    tag: v.string(),
    text: v.string(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.union(v.number(), v.null()),
    language_id: v.number(),
    tag: v.string(),
    text: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyLanguageId))
      .unique();

    if (!language) {
      throw new Error(`Language ${args.legacyLanguageId} not found`);
    }

    const operationKey =
      args.operationKey ??
      `localization:${args.legacyLanguageId}:${args.tag}:${Date.now()}`;

    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language_id_and_tag", (q) =>
        q.eq("languageId", language._id).eq("tag", args.tag),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        text: args.text,
        mirrorUpdatedAt: Date.now(),
        lastOperationKey: operationKey,
      });
    } else {
      await ctx.db.insert("localizations", {
        languageId: language._id,
        tag: args.tag,
        text: args.text,
        mirrorUpdatedAt: Date.now(),
        lastOperationKey: operationKey,
      });
    }

    await ctx.scheduler.runAfter(
      0,
      internal.postgresMirror.mirrorLocalizationUpsert,
      {
        legacyLanguageId: args.legacyLanguageId,
        tag: args.tag,
        text: args.text,
        operationKey,
      },
    );

    return {
      id: existing?.legacyId ?? null,
      language_id: args.legacyLanguageId,
      tag: args.tag,
      text: args.text,
    };
  },
});
