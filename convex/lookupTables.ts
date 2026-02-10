import { mutation } from "./_generated/server";
import { v } from "convex/values";

const languageValidator = {
  legacyId: v.number(),
  name: v.string(),
  short: v.string(),
  flag: v.optional(v.number()),
  flag_file: v.optional(v.string()),
  speaker: v.optional(v.string()),
  default_text: v.optional(v.string()),
  tts_replace: v.optional(v.string()),
  public: v.boolean(),
  rtl: v.boolean(),
};

const imageValidator = {
  legacyId: v.string(),
  active: v.string(),
  gilded: v.string(),
  locked: v.string(),
  active_lip: v.string(),
  gilded_lip: v.string(),
};

const avatarValidator = {
  legacyId: v.number(),
  link: v.string(),
  name: v.optional(v.string()),
};

export const upsertLanguage = mutation({
  args: {
    language: v.object(languageValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("languages"),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.language.legacyId))
      .unique();

    const doc = {
      ...args.language,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("languages", doc);
    return { inserted: true, docId };
  },
});

export const upsertLanguagesBatch = mutation({
  args: {
    languages: v.array(v.object(languageValidator)),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const language of args.languages) {
      const existing = await ctx.db
        .query("languages")
        .withIndex("by_id_value", (q) => q.eq("legacyId", language.legacyId))
        .unique();

      if (existing) {
        await ctx.db.replace(existing._id, {
          ...language,
          mirrorUpdatedAt: Date.now(),
        });
        updated += 1;
      } else {
        await ctx.db.insert("languages", {
          ...language,
          mirrorUpdatedAt: Date.now(),
        });
        inserted += 1;
      }
    }

    return { inserted, updated, total: args.languages.length };
  },
});

export const upsertImage = mutation({
  args: {
    image: v.object(imageValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("images"),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("images")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.image.legacyId))
      .unique();

    const doc = {
      ...args.image,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("images", doc);
    return { inserted: true, docId };
  },
});

export const upsertImagesBatch = mutation({
  args: {
    images: v.array(v.object(imageValidator)),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const image of args.images) {
      const existing = await ctx.db
        .query("images")
        .withIndex("by_id_value", (q) => q.eq("legacyId", image.legacyId))
        .unique();

      if (existing) {
        await ctx.db.replace(existing._id, {
          ...image,
          mirrorUpdatedAt: Date.now(),
        });
        updated += 1;
      } else {
        await ctx.db.insert("images", {
          ...image,
          mirrorUpdatedAt: Date.now(),
        });
        inserted += 1;
      }
    }

    return { inserted, updated, total: args.images.length };
  },
});

export const upsertAvatar = mutation({
  args: {
    avatar: v.object(avatarValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("avatars"),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("avatars")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.avatar.legacyId))
      .unique();

    const doc = {
      ...args.avatar,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("avatars", doc);
    return { inserted: true, docId };
  },
});

export const upsertAvatarsBatch = mutation({
  args: {
    avatars: v.array(v.object(avatarValidator)),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const avatar of args.avatars) {
      const existing = await ctx.db
        .query("avatars")
        .withIndex("by_id_value", (q) => q.eq("legacyId", avatar.legacyId))
        .unique();

      if (existing) {
        await ctx.db.replace(existing._id, {
          ...avatar,
          mirrorUpdatedAt: Date.now(),
        });
        updated += 1;
      } else {
        await ctx.db.insert("avatars", {
          ...avatar,
          mirrorUpdatedAt: Date.now(),
        });
        inserted += 1;
      }
    }

    return { inserted, updated, total: args.avatars.length };
  },
});
