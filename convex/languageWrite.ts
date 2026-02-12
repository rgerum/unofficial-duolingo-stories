import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

function toLegacyLanguageResponse(row: {
  legacyId: number;
  name: string;
  short: string;
  flag?: number | string;
  flag_file?: string;
  speaker?: string;
  default_text?: string;
  tts_replace?: string;
  public: boolean;
  rtl: boolean;
}) {
  return {
    id: row.legacyId,
    name: row.name,
    short: row.short,
    flag:
      typeof row.flag === "number"
        ? row.flag
        : Number.isFinite(Number(row.flag))
          ? Number(row.flag)
          : null,
    flag_file: row.flag_file ?? null,
    speaker: row.speaker ?? null,
    default_text: row.default_text ?? "",
    tts_replace: row.tts_replace ?? "",
    public: row.public,
    rtl: row.rtl,
  };
}

export const setDefaultText = mutation({
  args: {
    legacyLanguageId: v.number(),
    default_text: v.string(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.union(v.number(), v.null()),
    flag_file: v.union(v.string(), v.null()),
    speaker: v.union(v.string(), v.null()),
    default_text: v.string(),
    tts_replace: v.string(),
    public: v.boolean(),
    rtl: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyLanguageId))
      .unique();

    if (!language) {
      throw new Error(`Language ${args.legacyLanguageId} not found`);
    }

    const operationKey =
      args.operationKey ??
      `language:${args.legacyLanguageId}:default_text:${Date.now()}`;

    await ctx.db.patch(language._id, {
      default_text: args.default_text,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: operationKey,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.postgresMirror.mirrorLanguageDefaultText,
      {
        legacyLanguageId: args.legacyLanguageId,
        default_text: args.default_text,
        operationKey,
      },
    );

    return toLegacyLanguageResponse({
      ...language,
      default_text: args.default_text,
    });
  },
});

export const setTtsReplace = mutation({
  args: {
    legacyLanguageId: v.number(),
    tts_replace: v.string(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.union(v.number(), v.null()),
    flag_file: v.union(v.string(), v.null()),
    speaker: v.union(v.string(), v.null()),
    default_text: v.string(),
    tts_replace: v.string(),
    public: v.boolean(),
    rtl: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyLanguageId))
      .unique();

    if (!language) {
      throw new Error(`Language ${args.legacyLanguageId} not found`);
    }

    const operationKey =
      args.operationKey ??
      `language:${args.legacyLanguageId}:tts_replace:${Date.now()}`;

    await ctx.db.patch(language._id, {
      tts_replace: args.tts_replace,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: operationKey,
    });

    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorLanguageTtsReplace, {
      legacyLanguageId: args.legacyLanguageId,
      tts_replace: args.tts_replace,
      operationKey,
    });

    return toLegacyLanguageResponse({
      ...language,
      tts_replace: args.tts_replace,
    });
  },
});

export const setAvatarSpeaker = mutation({
  args: {
    legacyLanguageId: v.number(),
    legacyAvatarId: v.number(),
    name: v.string(),
    speaker: v.string(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.union(v.number(), v.null()),
    avatar_id: v.number(),
    language_id: v.number(),
    name: v.string(),
    speaker: v.string(),
  }),
  handler: async (ctx, args) => {
    const [language, avatar] = await Promise.all([
      ctx.db
        .query("languages")
        .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyLanguageId))
        .unique(),
      ctx.db
        .query("avatars")
        .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyAvatarId))
        .unique(),
    ]);

    if (!language) {
      throw new Error(`Language ${args.legacyLanguageId} not found`);
    }
    if (!avatar) {
      throw new Error(`Avatar ${args.legacyAvatarId} not found`);
    }

    const operationKey =
      args.operationKey ??
      `avatar_mapping:${args.legacyLanguageId}:${args.legacyAvatarId}:${Date.now()}`;

    const existing = await ctx.db
      .query("avatar_mappings")
      .withIndex("by_avatar_id_and_language_id", (q) =>
        q.eq("avatarId", avatar._id).eq("languageId", language._id),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        speaker: args.speaker,
        mirrorUpdatedAt: Date.now(),
        lastOperationKey: operationKey,
      });
    } else {
      await ctx.db.insert("avatar_mappings", {
        avatarId: avatar._id,
        languageId: language._id,
        name: args.name,
        speaker: args.speaker,
        mirrorUpdatedAt: Date.now(),
        lastOperationKey: operationKey,
      });
    }

    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorAvatarMappingUpsert, {
      legacyLanguageId: args.legacyLanguageId,
      legacyAvatarId: args.legacyAvatarId,
      name: args.name,
      speaker: args.speaker,
      operationKey,
    });

    return {
      id: existing?.legacyId ?? null,
      avatar_id: args.legacyAvatarId,
      language_id: args.legacyLanguageId,
      name: args.name,
      speaker: args.speaker,
    };
  },
});

export const upsertSpeakerFromVoice = mutation({
  args: {
    localeShort: v.optional(v.string()),
    languageShort: v.optional(v.string()),
    speaker: v.string(),
    gender: v.string(),
    type: v.string(),
    service: v.string(),
    operationKey: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      legacyLanguageId: v.number(),
      speaker: v.string(),
      gender: v.string(),
      type: v.string(),
      service: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const language =
      (args.localeShort
        ? await ctx.db
            .query("languages")
            .withIndex("by_short", (q) => q.eq("short", args.localeShort!))
            .unique()
        : null) ??
      (args.languageShort
        ? await ctx.db
            .query("languages")
            .withIndex("by_short", (q) => q.eq("short", args.languageShort!))
            .unique()
        : null);

    if (!language || language.legacyId === undefined) {
      return null;
    }

    const existing = (
      await ctx.db
        .query("speakers")
        .withIndex("by_speaker", (q) => q.eq("speaker", args.speaker))
        .collect()
    )[0];

    const operationKey =
      args.operationKey ?? `speaker:${args.speaker}:upsert:${Date.now()}`;

    if (existing) {
      await ctx.db.patch(existing._id, {
        languageId: language._id,
        speaker: args.speaker,
        gender: args.gender,
        type: args.type,
        service: args.service,
        mirrorUpdatedAt: Date.now(),
        lastOperationKey: operationKey,
      });
    } else {
      await ctx.db.insert("speakers", {
        languageId: language._id,
        speaker: args.speaker,
        gender: args.gender,
        type: args.type,
        service: args.service,
        mirrorUpdatedAt: Date.now(),
        lastOperationKey: operationKey,
      });
    }

    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorSpeakerUpsert, {
      legacyLanguageId: language.legacyId,
      speaker: args.speaker,
      gender: args.gender,
      type: args.type,
      service: args.service,
      operationKey,
    });

    return {
      legacyLanguageId: language.legacyId,
      speaker: args.speaker,
      gender: args.gender,
      type: args.type,
      service: args.service,
    };
  },
});
