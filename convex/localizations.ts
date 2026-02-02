import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Queries
// ============================================

/**
 * Get all localizations for a language
 */
export const listByLanguage = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("localizations")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();
  },
});

/**
 * Get a specific localization by language and tag
 */
export const getByTag = query({
  args: { languageId: v.id("languages"), tag: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("localizations")
      .withIndex("by_language_tag", (q) =>
        q.eq("languageId", args.languageId).eq("tag", args.tag)
      )
      .first();
  },
});

/**
 * Get all localizations as a dictionary { tag: text } for a language
 */
export const getDictionary = query({
  args: { languageId: v.id("languages") },
  handler: async (ctx, args) => {
    const localizations = await ctx.db
      .query("localizations")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();

    const dict: Record<string, string> = {};
    for (const loc of localizations) {
      dict[loc.tag] = loc.text;
    }
    return dict;
  },
});

/**
 * Get all localizations for all languages (for caching)
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("localizations").collect();
  },
});

/**
 * Get all localizations grouped by language short code
 */
export const getAllGrouped = query({
  args: {},
  handler: async (ctx) => {
    const localizations = await ctx.db.query("localizations").collect();
    const languages = await ctx.db.query("languages").collect();

    // Create a map of language ID to short code
    const langIdToShort = new Map<string, string>();
    for (const lang of languages) {
      langIdToShort.set(lang._id, lang.short);
    }

    // Group localizations by language
    const grouped: Record<string, Record<string, string>> = {};
    for (const loc of localizations) {
      const short = langIdToShort.get(loc.languageId);
      if (short) {
        if (!grouped[short]) {
          grouped[short] = {};
        }
        grouped[short][loc.tag] = loc.text;
      }
    }

    return grouped;
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Upsert a localization (insert or update)
 */
export const upsert = mutation({
  args: {
    languageId: v.id("languages"),
    tag: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language_tag", (q) =>
        q.eq("languageId", args.languageId).eq("tag", args.tag)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { text: args.text });
      return existing._id;
    }

    return await ctx.db.insert("localizations", {
      languageId: args.languageId,
      tag: args.tag,
      text: args.text,
    });
  },
});

/**
 * Delete a localization
 */
export const remove = mutation({
  args: { languageId: v.id("languages"), tag: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language_tag", (q) =>
        q.eq("languageId", args.languageId).eq("tag", args.tag)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Bulk upsert localizations for a language
 */
export const bulkUpsert = mutation({
  args: {
    languageId: v.id("languages"),
    entries: v.array(v.object({ tag: v.string(), text: v.string() })),
  },
  handler: async (ctx, args) => {
    // Get existing localizations for this language
    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language", (q) => q.eq("languageId", args.languageId))
      .collect();

    const existingByTag = new Map(existing.map((loc) => [loc.tag, loc]));

    for (const entry of args.entries) {
      const existingLoc = existingByTag.get(entry.tag);
      if (existingLoc) {
        if (existingLoc.text !== entry.text) {
          await ctx.db.patch(existingLoc._id, { text: entry.text });
        }
      } else {
        await ctx.db.insert("localizations", {
          languageId: args.languageId,
          tag: entry.tag,
          text: entry.text,
        });
      }
    }
  },
});
