import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

type AuthCtx = MutationCtx | QueryCtx;

async function isAdmin(ctx: AuthCtx) {
  const identity = (await ctx.auth.getUserIdentity()) as {
    role?: string | null;
  } | null;
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

const adminFilterValidator = v.union(
  v.literal("all"),
  v.literal("yes"),
  v.literal("no"),
);

const adminUserValidator = v.object({
  rowKey: v.string(),
  id: v.number(),
  name: v.string(),
  email: v.string(),
  regdate: v.union(v.number(), v.null()),
  activated: v.boolean(),
  role: v.boolean(),
  admin: v.boolean(),
});

async function findAuthUserByLegacyId(ctx: AuthCtx, legacyId: number) {
  return (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "userId", operator: "eq", value: String(legacyId) }],
  })) as {
    _id: string;
    userId?: string | null;
    name?: string | null;
    email?: string | null;
    createdAt?: number | null;
    role?: string | null;
    emailVerified?: boolean | null;
  } | null;
}

function toAdminUser(user: {
  _id?: string;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  createdAt?: number | null;
  role?: string | null;
  emailVerified?: boolean | null;
}) {
  const numericId = Number.parseInt(user.userId ?? "", 10);
  const role = user.role ?? null;
  return {
    rowKey:
      user._id ??
      `${user.userId ?? ""}-${user.email ?? ""}-${user.createdAt ?? 0}`,
    id: Number.isFinite(numericId) ? numericId : 0,
    name: user.name ?? "",
    email: user.email ?? "",
    regdate: typeof user.createdAt === "number" ? user.createdAt : null,
    activated: Boolean(user.emailVerified),
    role: role === "contributor" || role === "admin",
    admin: role === "admin",
  };
}

export const getAdminUsersPage = query({
  args: {
    query: v.string(),
    page: v.number(),
    perPage: v.number(),
    activatedFilter: adminFilterValidator,
    roleFilter: adminFilterValidator,
    adminFilter: adminFilterValidator,
  },
  returns: v.object({
    users: v.array(adminUserValidator),
    hasPrevPage: v.boolean(),
    hasNextPage: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      return { users: [], hasPrevPage: false, hasNextPage: false };
    }

    const page = Math.max(1, Math.floor(args.page));
    const perPage = Math.max(1, Math.min(200, Math.floor(args.perPage)));
    const offset = (page - 1) * perPage;
    const searchLower = args.query.trim().toLowerCase();
    const where: Array<{
      connector?: "AND" | "OR";
      field: string;
      operator?:
        | "lt"
        | "lte"
        | "gt"
        | "gte"
        | "eq"
        | "in"
        | "not_in"
        | "ne"
        | "contains"
        | "starts_with"
        | "ends_with";
      value: string | number | boolean | Array<string> | Array<number> | null;
    }> = [];

    if (searchLower.length > 0) {
      const isNumericId = /^\d+$/.test(searchLower);
      if (isNumericId) {
        where.push({ field: "userId", operator: "eq", value: searchLower });
      } else if (searchLower.includes("@")) {
        where.push({
          field: "email",
          operator: "contains",
          value: searchLower,
        });
      } else {
        where.push({ field: "name", operator: "contains", value: searchLower });
      }
    }

    if (args.activatedFilter === "yes") {
      where.push({ field: "emailVerified", operator: "eq", value: true });
    } else if (args.activatedFilter === "no") {
      where.push({ field: "emailVerified", operator: "eq", value: false });
    }

    // Apply role/admin filters at query time to keep pagination consistent.
    // `role` is nullable for many legacy users, so the "no contributor/admin"
    // cases are modeled with negative predicates.
    if (args.adminFilter === "yes" && args.roleFilter === "no") {
      return { users: [], hasPrevPage: page > 1, hasNextPage: false };
    }

    if (args.adminFilter === "yes") {
      where.push({ field: "role", operator: "eq", value: "admin" });
    } else if (args.roleFilter === "yes") {
      if (args.adminFilter === "no") {
        where.push({ field: "role", operator: "eq", value: "contributor" });
      } else {
        where.push({
          field: "role",
          operator: "in",
          value: ["admin", "contributor"],
        });
      }
    } else if (args.roleFilter === "no") {
      where.push({
        field: "role",
        operator: "not_in",
        value: ["admin", "contributor"],
      });
    } else if (args.adminFilter === "no") {
      where.push({ field: "role", operator: "ne", value: "admin" });
    }

    const response = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "user",
        where,
        offset,
        paginationOpts: { cursor: null, numItems: perPage + 1 },
        sortBy: { field: "createdAt", direction: "desc" },
      },
    )) as {
      page: Array<{
        _id?: string;
        userId?: string | null;
        name?: string | null;
        email?: string | null;
        createdAt?: number | null;
        role?: string | null;
        emailVerified?: boolean | null;
      }>;
    };

    const hasNextPage = response.page.length > perPage;
    const users = (
      hasNextPage ? response.page.slice(0, perPage) : response.page
    ).map(toAdminUser);

    return {
      users,
      hasPrevPage: page > 1,
      hasNextPage,
    };
  },
});

export const getAdminUserByLegacyId = query({
  args: {
    id: v.number(),
  },
  returns: v.union(adminUserValidator, v.null()),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;
    const user = await findAuthUserByLegacyId(ctx, args.id);
    if (!user?._id) return null;
    return toAdminUser(user);
  },
});

export const setAdminUserActivated = mutation({
  args: {
    id: v.number(),
    activated: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;
    const user = await findAuthUserByLegacyId(ctx, args.id);
    if (!user?._id) return null;

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { emailVerified: args.activated },
      },
    });
    return null;
  },
});

export const setAdminUserWrite = mutation({
  args: {
    id: v.number(),
    write: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;
    const user = await findAuthUserByLegacyId(ctx, args.id);
    if (!user?._id) return null;

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { role: args.write ? "contributor" : "user" },
      },
    });
    return null;
  },
});

export const setAdminUserDelete = mutation({
  args: {
    id: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;
    const user = await findAuthUserByLegacyId(ctx, args.id);
    if (!user?._id) return null;

    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
      },
    });
    return null;
  },
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

    const authUsers = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "user",
        where: [
          { field: "userId", operator: "in", value: legacyIds.map(String) },
        ],
        paginationOpts: { cursor: null, numItems: legacyIds.length + 10 },
      },
    );
    const userNameByLegacyId = new Map<number, string>();
    for (const user of authUsers.page as Array<{
      userId?: string | null;
      name?: string | null;
    }>) {
      const legacyId = Number.parseInt(user.userId ?? "", 10);
      if (!Number.isFinite(legacyId) || !user.name) continue;
      userNameByLegacyId.set(legacyId, user.name);
    }

    return {
      id: story.legacyId,
      name: story.name,
      image: story.imageId
        ? ((await ctx.db.get(story.imageId))?.legacyId ?? "")
        : "",
      public: story.public,
      short: course.short,
      approvals: approvals
        .map((approval) => ({
          id: approval.legacyId ?? 0,
          date: approval.date,
          name:
            typeof approval.legacyUserId === "number"
              ? (userNameByLegacyId.get(approval.legacyUserId) ?? "Unknown")
              : "Unknown",
        }))
        .filter((approval) => approval.id > 0),
    };
  },
});
