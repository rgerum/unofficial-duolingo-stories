import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all languages
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("languages").collect();
  },
});

/**
 * Get all public languages
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const languages = await ctx.db.query("languages").collect();
    return languages.filter((lang) => lang.public === true);
  },
});

/**
 * Get a language by its short code
 */
export const getByShort = query({
  args: { short: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("languages")
      .withIndex("by_short", (q) => q.eq("short", args.short))
      .first();
  },
});

/**
 * Get a language by ID
 */
export const get = query({
  args: { id: v.id("languages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a language by legacy PostgreSQL ID (for migration)
 */
export const getByLegacyId = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();
  },
});
