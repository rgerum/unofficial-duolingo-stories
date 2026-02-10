import { query } from "./_generated/server";
import { v } from "convex/values";

const localizationEntryValidator = v.object({
  tag: v.string(),
  text: v.string(),
});

export const getLocalizationWithEnglishFallback = query({
  args: {
    languageId: v.id("languages"),
  },
  returns: v.array(localizationEntryValidator),
  handler: async (ctx, args) => {
    const english = await ctx.db
      .query("languages")
      .withIndex("by_short", (q) => q.eq("short", "en"))
      .unique();

    const englishRows = english
      ? await ctx.db
          .query("localizations")
          .withIndex("by_language_id_and_tag", (q) =>
            q.eq("languageId", english._id),
          )
          .collect()
      : [];

    const targetRows =
      english?._id === args.languageId
        ? englishRows
        : await ctx.db
            .query("localizations")
            .withIndex("by_language_id_and_tag", (q) =>
              q.eq("languageId", args.languageId),
            )
            .collect();

    const merged = new Map<string, string>();
    for (const row of englishRows) {
      if (!row.tag || !row.text) continue;
      merged.set(row.tag, row.text);
    }
    for (const row of targetRows) {
      if (!row.tag || !row.text) continue;
      merged.set(row.tag, row.text);
    }

    return Array.from(merged.entries()).map(([tag, text]) => ({ tag, text }));
  },
});

export const getLanguageFlagById = query({
  args: {
    languageId: v.id("languages"),
  },
  returns: v.union(
    v.object({
      short: v.string(),
      flag: v.optional(v.union(v.number(), v.string())),
      flag_file: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const language = await ctx.db.get(args.languageId);
    if (!language) return null;
    const numericFlag =
      typeof language.flag === "number"
        ? language.flag
        : Number.isFinite(Number(language.flag))
          ? Number(language.flag)
          : undefined;
    return {
      short: language.short,
      flag: numericFlag,
      flag_file: language.flag_file,
    };
  },
});
