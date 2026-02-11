import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

async function isAdmin(ctx: any) {
  const identity = (await ctx.auth.getUserIdentity()) as
    | { role?: string | null }
    | null;
  return identity?.role === "admin";
}

const adminLanguageValidator = v.object({
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
});

const adminCourseValidator = v.object({
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
});

const adminApprovalValidator = v.object({
  id: v.number(),
  date: v.number(),
  name: v.string(),
});

const adminStoryValidator = v.object({
  id: v.number(),
  name: v.string(),
  image: v.string(),
  public: v.boolean(),
  short: v.string(),
  approvals: v.array(adminApprovalValidator),
});

export const getAdminLanguages = query({
  args: {},
  returns: v.array(adminLanguageValidator),
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return [];

    const rows = await ctx.db.query("languages").collect();
    return rows
      .map((row) => ({
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
      }))
      .sort((a, b) => a.id - b.id);
  },
});

export const getAdminCourses = query({
  args: {},
  returns: v.object({
    courses: v.array(adminCourseValidator),
    languages: v.array(adminLanguageValidator),
  }),
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return {
        courses: [],
        languages: [],
      };
    }

    const [courseRows, languageRows] = await Promise.all([
      ctx.db.query("courses").collect(),
      ctx.db.query("languages").collect(),
    ]);

    const languageIdToLegacy = new Map<Id<"languages">, number>();
    for (const language of languageRows) {
      languageIdToLegacy.set(language._id, language.legacyId);
    }

    const courses = courseRows
      .map((row) => ({
        id: row.legacyId,
        learning_language: languageIdToLegacy.get(row.learningLanguageId) ?? 0,
        from_language: languageIdToLegacy.get(row.fromLanguageId) ?? 0,
        public: row.public,
        official: row.official,
        name: row.name ?? null,
        about: row.about ?? null,
        conlang: row.conlang ?? false,
        short: row.short ?? null,
        tags: row.tags ?? [],
      }))
      .sort((a, b) => a.id - b.id);

    const languages = languageRows
      .map((row) => ({
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
      }))
      .sort((a, b) => a.id - b.id);

    return { courses, languages };
  },
});

export const getAdminStoryByLegacyId = query({
  args: {
    legacyStoryId: v.number(),
  },
  returns: v.union(adminStoryValidator, v.null()),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story || typeof story.legacyId !== "number") return null;

    const course = await ctx.db.get(story.courseId);
    if (!course || !course.short) return null;

    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();

    const legacyIds = approvals
      .map((approval) => approval.legacyUserId)
      .filter((id): id is number => typeof id === "number");

    const authUsers = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      where: [{ field: "userId", operator: "in", value: legacyIds.map(String) }],
      paginationOpts: { cursor: null, numItems: legacyIds.length + 10 },
    });
    const userNameByLegacyId = new Map<number, string>();
    for (const user of (authUsers.page as Array<{ userId?: string | null; name?: string | null }>)) {
      const legacyId = Number.parseInt(user.userId ?? "", 10);
      if (!Number.isFinite(legacyId) || !user.name) continue;
      userNameByLegacyId.set(legacyId, user.name);
    }

    return {
      id: story.legacyId,
      name: story.name,
      image: story.imageId ? (await ctx.db.get(story.imageId))?.legacyId ?? "" : "",
      public: story.public,
      short: course.short,
      approvals: approvals
        .map((approval) => ({
          id: approval.legacyId ?? 0,
          date: approval.date,
          name:
            typeof approval.legacyUserId === "number"
              ? userNameByLegacyId.get(approval.legacyUserId) ?? "Unknown"
              : "Unknown",
        }))
        .filter((approval) => approval.id > 0),
    };
  },
});
