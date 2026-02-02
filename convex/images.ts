import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all images as a map by legacy ID
 */
export const getAllByLegacyId = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db.query("images").collect();
    const imageMap: Record<string, {
      id: string;
      active: string;
      gilded: string;
      active_lip: string;
      gilded_lip: string;
    }> = {};

    for (const image of images) {
      if (image.legacyId) {
        imageMap[image.legacyId] = {
          id: image.legacyId,
          active: image.active ?? "",
          gilded: image.gilded ?? "",
          active_lip: image.active_lip ?? "",
          gilded_lip: image.gilded_lip ?? "",
        };
      }
    }

    return imageMap;
  },
});

/**
 * Get an image by its Convex ID
 */
export const get = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get an image by legacy ID
 */
export const getByLegacyId = query({
  args: { legacyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("images")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();
  },
});
