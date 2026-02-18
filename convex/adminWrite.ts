import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authorization";

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
          : 0,
    flag_file: row.flag_file ?? "",
    speaker: row.speaker ?? "",
    default_text: row.default_text ?? "",
    tts_replace: row.tts_replace ?? "",
    public: row.public,
    rtl: row.rtl,
  };
}

async function getNextLegacyId(
  ctx: MutationCtx,
  table: "languages" | "courses",
) {
  const page = await ctx.db.query(table).order("desc").take(1);
  const current = Number(page[0]?.legacyId ?? 0);
  return Math.max(1, current + 1);
}

async function getLanguageByLegacyId(ctx: MutationCtx, legacyId: number) {
  return await ctx.db
    .query("languages")
    .withIndex("by_id_value", (q) => q.eq("legacyId", legacyId))
    .unique();
}

export const updateAdminLanguage = mutation({
  args: {
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.number(),
    flag_file: v.string(),
    speaker: v.string(),
    rtl: v.boolean(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.number(),
    flag_file: v.string(),
    speaker: v.string(),
    default_text: v.string(),
    tts_replace: v.string(),
    public: v.boolean(),
    rtl: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const language = await getLanguageByLegacyId(ctx, args.id);

    if (!language) {
      throw new Error(`Language ${args.id} not found`);
    }

    const operationKey =
      args.operationKey ?? `language:${args.id}:admin_set:${Date.now()}`;

    await ctx.db.patch(language._id, {
      name: args.name,
      short: args.short,
      flag: args.flag,
      flag_file: args.flag_file,
      speaker: args.speaker,
      rtl: args.rtl,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: operationKey,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.postgresMirror.mirrorAdminLanguageUpdate,
      {
        id: args.id,
        name: args.name,
        short: args.short,
        flag: args.flag,
        flag_file: args.flag_file,
        speaker: args.speaker,
        rtl: args.rtl,
        operationKey,
      },
    );

    return toLegacyLanguageResponse({
      ...language,
      name: args.name,
      short: args.short,
      flag: args.flag,
      flag_file: args.flag_file,
      speaker: args.speaker,
      rtl: args.rtl,
    });
  },
});

export const createAdminLanguage = mutation({
  args: {
    name: v.string(),
    short: v.string(),
    flag: v.number(),
    flag_file: v.string(),
    speaker: v.string(),
    rtl: v.boolean(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.number(),
    flag_file: v.string(),
    speaker: v.string(),
    default_text: v.string(),
    tts_replace: v.string(),
    public: v.boolean(),
    rtl: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const legacyId = await getNextLegacyId(ctx, "languages");
    const operationKey =
      args.operationKey ?? `language:${legacyId}:admin_create:${Date.now()}`;

    await ctx.db.insert("languages", {
      legacyId,
      name: args.name,
      short: args.short,
      flag: args.flag,
      flag_file: args.flag_file,
      speaker: args.speaker,
      default_text: "",
      tts_replace: "",
      public: false,
      rtl: args.rtl,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: operationKey,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.postgresMirror.mirrorAdminLanguageInsert,
      {
        id: legacyId,
        name: args.name,
        short: args.short,
        flag: args.flag,
        flag_file: args.flag_file,
        speaker: args.speaker,
        default_text: "",
        tts_replace: "",
        public: false,
        rtl: args.rtl,
        operationKey,
      },
    );

    return {
      id: legacyId,
      name: args.name,
      short: args.short,
      flag: args.flag,
      flag_file: args.flag_file,
      speaker: args.speaker,
      default_text: "",
      tts_replace: "",
      public: false,
      rtl: args.rtl,
    };
  },
});

export const updateAdminCourse = mutation({
  args: {
    id: v.number(),
    learning_language: v.number(),
    from_language: v.number(),
    public: v.optional(v.boolean()),
    name: v.optional(v.string()),
    conlang: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    about: v.optional(v.string()),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    learning_language: v.number(),
    from_language: v.number(),
    public: v.boolean(),
    official: v.boolean(),
    name: v.union(v.string(), v.null()),
    about: v.union(v.string(), v.null()),
    conlang: v.boolean(),
    short: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [course, learningLanguage, fromLanguage] = await Promise.all([
      ctx.db
        .query("courses")
        .withIndex("by_id_value", (q) => q.eq("legacyId", args.id))
        .unique(),
      getLanguageByLegacyId(ctx, args.learning_language),
      getLanguageByLegacyId(ctx, args.from_language),
    ]);

    if (!course) throw new Error(`Course ${args.id} not found`);
    if (!learningLanguage || !fromLanguage) {
      throw new Error("Course languages not found");
    }

    const short = `${learningLanguage.short}-${fromLanguage.short}`;
    const operationKey =
      args.operationKey ?? `course:${args.id}:admin_set:${Date.now()}`;
    const nextPublic = args.public ?? course.public;
    const nextName = args.name ?? course.name ?? null;
    const nextConlang = args.conlang ?? course.conlang ?? false;
    const nextTags = args.tags ?? course.tags ?? [];
    const nextAbout = args.about ?? course.about ?? null;

    const patchData: {
      learningLanguageId: typeof learningLanguage._id;
      fromLanguageId: typeof fromLanguage._id;
      learning_language_name: string;
      from_language_name: string;
      short: string;
      public: boolean;
      mirrorUpdatedAt: number;
      lastOperationKey: string;
      name?: string;
      conlang?: boolean;
      tags?: string[];
      about?: string;
    } = {
      learningLanguageId: learningLanguage._id,
      fromLanguageId: fromLanguage._id,
      learning_language_name: learningLanguage.name,
      from_language_name: fromLanguage.name,
      short,
      public: nextPublic,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: operationKey,
    };
    if (nextName !== null) patchData.name = nextName;
    if (nextAbout !== null) patchData.about = nextAbout;
    patchData.conlang = nextConlang;
    patchData.tags = nextTags;

    await ctx.db.patch(course._id, patchData);

    await ctx.scheduler.runAfter(
      0,
      internal.postgresMirror.mirrorAdminCourseUpdate,
      {
        id: args.id,
        learning_language: args.learning_language,
        learning_language_name: learningLanguage.name,
        from_language: args.from_language,
        from_language_name: fromLanguage.name,
        short,
        public: nextPublic,
        name: nextName,
        conlang: nextConlang,
        tags: nextTags,
        about: nextAbout,
        operationKey,
      },
    );

    return {
      id: args.id,
      learning_language: args.learning_language,
      from_language: args.from_language,
      public: nextPublic,
      official: course.official,
      name: nextName,
      about: nextAbout,
      conlang: nextConlang,
      short,
      tags: nextTags,
    };
  },
});

export const createAdminCourse = mutation({
  args: {
    learning_language: v.number(),
    from_language: v.number(),
    public: v.optional(v.boolean()),
    name: v.optional(v.string()),
    official: v.optional(v.number()),
    conlang: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    about: v.optional(v.string()),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    learning_language: v.number(),
    from_language: v.number(),
    public: v.boolean(),
    official: v.boolean(),
    name: v.union(v.string(), v.null()),
    about: v.union(v.string(), v.null()),
    conlang: v.boolean(),
    short: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [learningLanguage, fromLanguage] = await Promise.all([
      getLanguageByLegacyId(ctx, args.learning_language),
      getLanguageByLegacyId(ctx, args.from_language),
    ]);
    if (!learningLanguage || !fromLanguage) {
      throw new Error("Course languages not found");
    }

    const legacyId = await getNextLegacyId(ctx, "courses");
    const short = `${learningLanguage.short}-${fromLanguage.short}`;
    const nextPublic = args.public ?? false;
    const nextOfficial = args.official ?? 0;
    const nextName = args.name ?? null;
    const nextConlang = args.conlang ?? false;
    const nextTags = args.tags ?? [];
    const nextAbout = args.about ?? null;
    const operationKey =
      args.operationKey ?? `course:${legacyId}:admin_create:${Date.now()}`;

    await ctx.db.insert("courses", {
      legacyId,
      short,
      learningLanguageId: learningLanguage._id,
      fromLanguageId: fromLanguage._id,
      public: nextPublic,
      official: nextOfficial !== 0,
      name: nextName ?? undefined,
      about: nextAbout ?? undefined,
      conlang: nextConlang,
      tags: nextTags,
      learning_language_name: learningLanguage.name,
      from_language_name: fromLanguage.name,
      mirrorUpdatedAt: Date.now(),
      lastOperationKey: operationKey,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.postgresMirror.mirrorAdminCourseInsert,
      {
        id: legacyId,
        learning_language: args.learning_language,
        learning_language_name: learningLanguage.name,
        from_language: args.from_language,
        from_language_name: fromLanguage.name,
        short,
        public: nextPublic,
        official: nextOfficial,
        name: nextName,
        conlang: nextConlang,
        tags: nextTags,
        about: nextAbout,
        operationKey,
      },
    );

    return {
      id: legacyId,
      learning_language: args.learning_language,
      from_language: args.from_language,
      public: nextPublic,
      official: nextOfficial !== 0,
      name: nextName,
      about: nextAbout,
      conlang: nextConlang,
      short,
      tags: nextTags,
    };
  },
});
