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

const adminStoryImportRepairSourceValidator = v.object({
  id: v.number(),
  name: v.string(),
  duoId: v.union(v.string(), v.null()),
  setId: v.union(v.number(), v.null()),
  setIndex: v.union(v.number(), v.null()),
});

const adminStoryImportRepairRowValidator = v.object({
  targetStoryId: v.number(),
  targetName: v.string(),
  targetDuoId: v.union(v.string(), v.null()),
  targetSetId: v.union(v.number(), v.null()),
  targetSetIndex: v.union(v.number(), v.null()),
  currentSourceStoryId: v.union(v.number(), v.null()),
  currentSourceStoryName: v.union(v.string(), v.null()),
  suggestedSourceStoryId: v.union(v.number(), v.null()),
  suggestedSourceStoryName: v.union(v.string(), v.null()),
  status: v.union(
    v.literal("matched"),
    v.literal("missing"),
    v.literal("mismatch"),
    v.literal("ambiguous"),
  ),
  suggestionReason: v.string(),
});

const adminStoryImportRepairValidator = v.object({
  sourceStories: v.array(adminStoryImportRepairSourceValidator),
  rows: v.array(adminStoryImportRepairRowValidator),
});

const yesNoAllFilterValidator = v.union(
  v.literal("all"),
  v.literal("yes"),
  v.literal("no"),
);
const roleFilterValidator = v.union(
  v.literal("all"),
  v.literal("user"),
  v.literal("contributor"),
  v.literal("admin"),
);

const adminUserValidator = v.object({
  rowKey: v.string(),
  id: v.number(),
  name: v.string(),
  email: v.string(),
  image: v.union(v.string(), v.null()),
  regdate: v.union(v.number(), v.null()),
  activated: v.boolean(),
  role: v.boolean(),
  admin: v.boolean(),
  discordLinked: v.boolean(),
  discordAccountId: v.union(v.string(), v.null()),
  discordStoriesRole: v.union(v.string(), v.null()),
  discordStoriesSyncStatus: v.union(
    v.literal("assigned"),
    v.literal("up_to_date"),
    v.literal("no_milestone"),
    v.literal("not_linked"),
    v.literal("member_not_found"),
    v.literal("error"),
    v.null(),
  ),
  discordStoriesLastSyncedAt: v.union(v.number(), v.null()),
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
    image?: string | null;
    createdAt?: number | null;
    role?: string | null;
    emailVerified?: boolean | null;
  } | null;
}

function toAdminUser(
  user: {
    _id?: string;
    userId?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt?: number | null;
    role?: string | null;
    emailVerified?: unknown;
  },
  discordAccountId?: string | null,
  storiesRoleSnapshot?: {
    assignedStoriesCount?: number | null;
    syncStatus?:
      | "assigned"
      | "up_to_date"
      | "no_milestone"
      | "not_linked"
      | "member_not_found"
      | "error"
      | null;
    lastSyncedAt?: number | null;
  } | null,
) {
  const numericId = Number.parseInt(user.userId ?? "", 10);
  const role = user.role ?? null;
  const assignedStoriesCount =
    typeof storiesRoleSnapshot?.assignedStoriesCount === "number"
      ? storiesRoleSnapshot.assignedStoriesCount
      : null;
  return {
    rowKey:
      user._id ??
      `${user.userId ?? ""}-${user.email ?? ""}-${user.createdAt ?? 0}`,
    id: Number.isFinite(numericId) ? numericId : 0,
    name: user.name ?? "",
    email: user.email ?? "",
    image:
      typeof user.image === "string" && user.image.length > 0
        ? user.image
        : null,
    regdate: typeof user.createdAt === "number" ? user.createdAt : null,
    activated: Boolean(user.emailVerified),
    role: role === "contributor" || role === "admin",
    admin: role === "admin",
    discordLinked:
      typeof discordAccountId === "string" && discordAccountId.length > 0,
    discordAccountId:
      typeof discordAccountId === "string" && discordAccountId.length > 0
        ? discordAccountId
        : null,
    discordStoriesRole:
      typeof assignedStoriesCount === "number" && assignedStoriesCount > 0
        ? `${assignedStoriesCount} Stories`
        : null,
    discordStoriesSyncStatus: storiesRoleSnapshot?.syncStatus ?? null,
    discordStoriesLastSyncedAt:
      typeof storiesRoleSnapshot?.lastSyncedAt === "number"
        ? storiesRoleSnapshot.lastSyncedAt
        : null,
  };
}

async function getDiscordAccountIdsByAuthUserIds(
  ctx: AuthCtx,
  authUserIds: string[],
) {
  const uniqueAuthUserIds = Array.from(
    new Set(authUserIds.filter((value) => value.length > 0)),
  );
  if (uniqueAuthUserIds.length === 0) return new Map<string, string>();

  const response = await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "account",
    where: [
      { field: "providerId", operator: "eq", value: "discord" },
      { field: "userId", operator: "in", value: uniqueAuthUserIds },
    ],
    paginationOpts: { cursor: null, numItems: uniqueAuthUserIds.length + 20 },
  });

  const discordAccountIdByAuthUserId = new Map<string, string>();
  for (const account of response.page as Array<{
    userId?: string | null;
    accountId?: string | null;
  }>) {
    if (!account.userId || !account.accountId) continue;
    discordAccountIdByAuthUserId.set(account.userId, account.accountId);
  }
  return discordAccountIdByAuthUserId;
}

async function getStoriesRoleSnapshotsByLegacyUserIds(
  ctx: AuthCtx,
  legacyUserIds: number[],
) {
  const wantedIds = new Set(
    legacyUserIds.filter((legacyUserId) => Number.isFinite(legacyUserId)),
  );
  if (wantedIds.size === 0) {
    return new Map<
      number,
      {
        assignedStoriesCount?: number | null;
        syncStatus?:
          | "assigned"
          | "up_to_date"
          | "no_milestone"
          | "not_linked"
          | "member_not_found"
          | "error"
          | null;
        lastSyncedAt?: number | null;
      }
    >();
  }

  const snapshotByLegacyUserId = new Map<
    number,
    {
      assignedStoriesCount?: number | null;
      syncStatus?:
        | "assigned"
        | "up_to_date"
        | "no_milestone"
        | "not_linked"
        | "member_not_found"
        | "error"
        | null;
      lastSyncedAt?: number | null;
    }
  >();

  const rows = await Promise.all(
    Array.from(wantedIds).map((legacyUserId) =>
      ctx.db
        .query("discord_stories_role_sync")
        .withIndex("by_legacy_user_id", (q) =>
          q.eq("legacyUserId", legacyUserId),
        )
        .unique(),
    ),
  );

  for (const row of rows) {
    if (!row) continue;
    if (!wantedIds.has(row.legacyUserId)) continue;
    snapshotByLegacyUserId.set(row.legacyUserId, row);
  }
  return snapshotByLegacyUserId;
}

export const getAdminUsersPage = query({
  args: {
    query: v.string(),
    limit: v.number(),
    activatedFilter: yesNoAllFilterValidator,
    roleFilter: roleFilterValidator,
  },
  returns: v.object({
    users: v.array(adminUserValidator),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      return { users: [], hasMore: false };
    }

    const limit = Math.max(1, Math.min(500, Math.floor(args.limit)));
    const queryLimit = limit + 1;
    const searchTerm = args.query.trim();
    const searchLower = searchTerm.toLowerCase();
    const searchMode =
      searchTerm.length === 0
        ? "none"
        : /^\d+$/.test(searchLower)
          ? "id"
          : searchTerm.includes("@")
            ? "email"
            : "username";

    const matchedUsers =
      searchMode === "id"
        ? await ctx.runQuery(components.betterAuth.adapter.searchUsersById, {
            activatedFilter: args.activatedFilter,
            roleFilter: args.roleFilter,
            id: searchTerm,
          })
        : searchMode === "email"
          ? await ctx.runQuery(
              components.betterAuth.adapter.searchUsersByEmailPrefix,
              {
                activatedFilter: args.activatedFilter,
                roleFilter: args.roleFilter,
                prefix: searchTerm,
                limit: queryLimit,
              },
            )
          : searchMode === "username"
            ? await ctx.runQuery(
                components.betterAuth.adapter.searchUsersByUsernamePrefix,
                {
                  activatedFilter: args.activatedFilter,
                  roleFilter: args.roleFilter,
                  prefix: searchTerm,
                  limit: queryLimit,
                },
              )
            : await ctx.runQuery(components.betterAuth.adapter.searchUsersAll, {
                activatedFilter: args.activatedFilter,
                roleFilter: args.roleFilter,
                limit: queryLimit,
              });
    const pageUsers = matchedUsers.slice(0, limit) as Array<{
      _id?: string;
      userId?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      createdAt?: number | null;
      role?: string | null;
      emailVerified?: unknown;
    }>;
    const discordAccountIdByAuthUserId =
      await getDiscordAccountIdsByAuthUserIds(
        ctx,
        pageUsers
          .map((user) => user._id)
          .filter((value): value is string => typeof value === "string"),
      );
    const storiesRoleSnapshotByLegacyUserId =
      await getStoriesRoleSnapshotsByLegacyUserIds(
        ctx,
        pageUsers
          .map((user) => Number.parseInt(user.userId ?? "", 10))
          .filter((value) => Number.isFinite(value)),
      );
    const users = pageUsers.map((user) =>
      toAdminUser(
        user,
        typeof user._id === "string"
          ? (discordAccountIdByAuthUserId.get(user._id) ?? null)
          : null,
        (() => {
          const legacyUserId = Number.parseInt(user.userId ?? "", 10);
          return Number.isFinite(legacyUserId)
            ? (storiesRoleSnapshotByLegacyUserId.get(legacyUserId) ?? null)
            : null;
        })(),
      ),
    );
    return { users, hasMore: matchedUsers.length > limit };
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
    const discordAccountIdByAuthUserId =
      await getDiscordAccountIdsByAuthUserIds(ctx, [user._id]);
    const storiesRoleSnapshotByLegacyUserId =
      await getStoriesRoleSnapshotsByLegacyUserIds(ctx, [args.id]);
    return toAdminUser(
      user,
      discordAccountIdByAuthUserId.get(user._id) ?? null,
      storiesRoleSnapshotByLegacyUserId.get(args.id) ?? null,
    );
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

export const getAdminStoryImportRepairData = query({
  args: {
    sourceCourseLegacyId: v.number(),
    targetCourseLegacyId: v.number(),
  },
  returns: adminStoryImportRepairValidator,
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      return { sourceStories: [], rows: [] };
    }

    const [sourceCourse, targetCourse] = await Promise.all([
      ctx.db
        .query("courses")
        .withIndex("by_id_value", (q) =>
          q.eq("legacyId", args.sourceCourseLegacyId),
        )
        .unique(),
      ctx.db
        .query("courses")
        .withIndex("by_id_value", (q) =>
          q.eq("legacyId", args.targetCourseLegacyId),
        )
        .unique(),
    ]);
    if (!sourceCourse || !targetCourse) {
      return { sourceStories: [], rows: [] };
    }

    const [sourceStoriesRaw, targetStoriesRaw] = await Promise.all([
      ctx.db
        .query("stories")
        .withIndex("by_course", (q) => q.eq("courseId", sourceCourse._id))
        .collect(),
      ctx.db
        .query("stories")
        .withIndex("by_course", (q) => q.eq("courseId", targetCourse._id))
        .collect(),
    ]);

    const sourceStories = sourceStoriesRaw
      .filter(
        (
          story,
        ): story is typeof story & {
          legacyId: number;
        } => !story.deleted && typeof story.legacyId === "number",
      )
      .sort((a, b) => {
        const setCompare = (a.set_id ?? 0) - (b.set_id ?? 0);
        if (setCompare !== 0) return setCompare;
        return (a.set_index ?? 0) - (b.set_index ?? 0);
      });

    const targetStories = targetStoriesRaw
      .filter(
        (
          story,
        ): story is typeof story & {
          legacyId: number;
        } => !story.deleted && typeof story.legacyId === "number",
      )
      .sort((a, b) => {
        const setCompare = (a.set_id ?? 0) - (b.set_id ?? 0);
        if (setCompare !== 0) return setCompare;
        return (a.set_index ?? 0) - (b.set_index ?? 0);
      });

    const sourceByDuoId = new Map<string, typeof sourceStories>();
    const sourceBySetKey = new Map<string, typeof sourceStories>();

    for (const story of sourceStories) {
      if (story.duo_id) {
        const storiesForDuoId = sourceByDuoId.get(story.duo_id) ?? [];
        storiesForDuoId.push(story);
        sourceByDuoId.set(story.duo_id, storiesForDuoId);
      }
      if (
        typeof story.set_id === "number" &&
        typeof story.set_index === "number"
      ) {
        const setKey = `${story.set_id}:${story.set_index}`;
        const storiesForSet = sourceBySetKey.get(setKey) ?? [];
        storiesForSet.push(story);
        sourceBySetKey.set(setKey, storiesForSet);
      }
    }

    const rows = targetStories
      .map((targetStory) => {
        const currentMatches = targetStory.duo_id
          ? (sourceByDuoId.get(targetStory.duo_id) ?? [])
          : [];
        const suggestedMatches =
          typeof targetStory.set_id === "number" &&
          typeof targetStory.set_index === "number"
            ? (sourceBySetKey.get(
                `${targetStory.set_id}:${targetStory.set_index}`,
              ) ?? [])
            : [];

        const currentSource =
          currentMatches.length === 1 ? currentMatches[0] : null;
        const suggestedSource =
          suggestedMatches.length === 1 ? suggestedMatches[0] : null;

        let status: "matched" | "missing" | "mismatch" | "ambiguous" =
          "matched";
        let suggestionReason =
          "Current duo_id already matches the source story.";

        if (currentMatches.length > 1) {
          status = "ambiguous";
          suggestionReason =
            "Current duo_id matches multiple source stories. Pick one manually.";
        } else if (!currentSource && suggestedSource) {
          status = "missing";
          suggestionReason =
            "No unique duo_id match. Suggested via set_id/set_index.";
        } else if (!currentSource) {
          status = "missing";
          suggestionReason =
            "No unique source match found. Pick the correct story manually.";
        } else if (
          suggestedSource &&
          suggestedSource.legacyId !== currentSource.legacyId
        ) {
          status = "mismatch";
          suggestionReason =
            "Current duo_id points to a different source than set_id/set_index.";
        }

        return {
          targetStoryId: targetStory.legacyId,
          targetName: targetStory.name,
          targetDuoId: targetStory.duo_id ?? null,
          targetSetId: targetStory.set_id ?? null,
          targetSetIndex: targetStory.set_index ?? null,
          currentSourceStoryId: currentSource?.legacyId ?? null,
          currentSourceStoryName: currentSource?.name ?? null,
          suggestedSourceStoryId: suggestedSource?.legacyId ?? null,
          suggestedSourceStoryName: suggestedSource?.name ?? null,
          status,
          suggestionReason,
        };
      })
      .sort((a, b) => {
        const statusOrder = {
          mismatch: 0,
          ambiguous: 1,
          missing: 2,
          matched: 3,
        } as const;
        const statusCompare = statusOrder[a.status] - statusOrder[b.status];
        if (statusCompare !== 0) return statusCompare;
        const setCompare = (a.targetSetId ?? 0) - (b.targetSetId ?? 0);
        if (setCompare !== 0) return setCompare;
        return (a.targetSetIndex ?? 0) - (b.targetSetIndex ?? 0);
      });

    return {
      sourceStories: sourceStories.map((story) => ({
        id: story.legacyId,
        name: story.name,
        duoId: story.duo_id ?? null,
        setId: story.set_id ?? null,
        setIndex: story.set_index ?? null,
      })),
      rows,
    };
  },
});
