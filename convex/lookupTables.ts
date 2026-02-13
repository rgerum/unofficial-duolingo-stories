import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireContributorOrAdmin } from "./lib/authorization";

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

const speakerValidator = {
  legacyId: v.optional(v.number()),
  legacyLanguageId: v.number(),
  speaker: v.string(),
  gender: v.string(),
  type: v.string(),
  service: v.string(),
};

const localizationValidator = {
  legacyId: v.optional(v.number()),
  legacyLanguageId: v.number(),
  tag: v.string(),
  text: v.string(),
};

const courseValidator = {
  legacyId: v.number(),
  short: v.optional(v.string()),
  legacyLearningLanguageId: v.number(),
  legacyFromLanguageId: v.number(),
  public: v.boolean(),
  official: v.boolean(),
  name: v.optional(v.string()),
  about: v.optional(v.string()),
  conlang: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
  count: v.optional(v.number()),
  // Legacy denormalized fields kept only for Postgres-compat migration.
  // TODO(postgres-sunset): drop from mirror payload and schema.
  learning_language_name: v.optional(v.string()),
  from_language_name: v.optional(v.string()),
  contributors: v.optional(v.array(v.string())),
  contributors_past: v.optional(v.array(v.string())),
  todo_count: v.optional(v.number()),
};

const avatarMappingValidator = {
  legacyId: v.optional(v.number()),
  legacyAvatarId: v.number(),
  legacyLanguageId: v.number(),
  name: v.optional(v.string()),
  speaker: v.optional(v.string()),
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
    await requireContributorOrAdmin(ctx);
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
    await requireContributorOrAdmin(ctx);
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
    await requireContributorOrAdmin(ctx);
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

export const upsertSpeaker = mutation({
  args: {
    speaker: v.object(speakerValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("speakers"),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.speaker.legacyLanguageId),
      )
      .unique();
    if (!language) {
      throw new Error(
        `Missing language for legacy id ${args.speaker.legacyLanguageId}`,
      );
    }

    const existing = await ctx.db
      .query("speakers")
      .withIndex("by_speaker", (q) => q.eq("speaker", args.speaker.speaker))
      .unique();

    const doc = {
      legacyId: args.speaker.legacyId,
      languageId: language._id,
      speaker: args.speaker.speaker,
      gender: args.speaker.gender,
      type: args.speaker.type,
      service: args.speaker.service,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("speakers", doc);
    return { inserted: true, docId };
  },
});

export const upsertLocalization = mutation({
  args: {
    localization: v.object(localizationValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("localizations"),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.localization.legacyLanguageId),
      )
      .unique();
    if (!language) {
      throw new Error(
        `Missing language for legacy id ${args.localization.legacyLanguageId}`,
      );
    }

    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language_id_and_tag", (q) =>
        q.eq("languageId", language._id).eq("tag", args.localization.tag),
      )
      .unique();

    const doc = {
      legacyId: args.localization.legacyId,
      languageId: language._id,
      tag: args.localization.tag,
      text: args.localization.text,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("localizations", doc);
    return { inserted: true, docId };
  },
});

export const upsertCourse = mutation({
  args: {
    course: v.object(courseValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("courses"),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const learningLanguage = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.course.legacyLearningLanguageId),
      )
      .unique();
    if (!learningLanguage) {
      throw new Error(
        `Missing learning language for legacy id ${args.course.legacyLearningLanguageId}`,
      );
    }
    const fromLanguage = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.course.legacyFromLanguageId),
      )
      .unique();
    if (!fromLanguage) {
      throw new Error(
        `Missing from language for legacy id ${args.course.legacyFromLanguageId}`,
      );
    }

    const existing = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.course.legacyId))
      .unique();

    const doc = {
      legacyId: args.course.legacyId,
      short: args.course.short,
      learningLanguageId: learningLanguage._id,
      fromLanguageId: fromLanguage._id,
      public: args.course.public,
      official: args.course.official,
      name: args.course.name,
      about: args.course.about,
      conlang: args.course.conlang,
      tags: args.course.tags,
      count: args.course.count,
      learning_language_name: args.course.learning_language_name,
      from_language_name: args.course.from_language_name,
      contributors: args.course.contributors,
      contributors_past: args.course.contributors_past,
      todo_count: args.course.todo_count,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("courses", doc);
    return { inserted: true, docId };
  },
});

export const upsertAvatarMapping = mutation({
  args: {
    avatarMapping: v.object(avatarMappingValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("avatar_mappings"),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const avatar = await ctx.db
      .query("avatars")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.avatarMapping.legacyAvatarId),
      )
      .unique();
    if (!avatar) {
      throw new Error(
        `Missing avatar for legacy id ${args.avatarMapping.legacyAvatarId}`,
      );
    }
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.avatarMapping.legacyLanguageId),
      )
      .unique();
    if (!language) {
      throw new Error(
        `Missing language for legacy id ${args.avatarMapping.legacyLanguageId}`,
      );
    }

    const existing = await ctx.db
      .query("avatar_mappings")
      .withIndex("by_avatar_id_and_language_id", (q) =>
        q.eq("avatarId", avatar._id).eq("languageId", language._id),
      )
      .unique();

    const doc = {
      legacyId: args.avatarMapping.legacyId,
      avatarId: avatar._id,
      languageId: language._id,
      name: args.avatarMapping.name,
      speaker: args.avatarMapping.speaker,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: args.operationKey,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("avatar_mappings", doc);
    return { inserted: true, docId };
  },
});
