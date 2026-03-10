import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalQuery, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const contributorUserValidator = v.object({
  legacyUserId: v.number(),
  author: v.string(),
  discordAccountId: v.string(),
});

const publicStoriesPageValidator = v.object({
  page: v.array(v.number()),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

const approvalsPageValidator = v.object({
  page: v.array(
    v.object({
      id: v.id("story_approval"),
      legacyUserId: v.number(),
      storyId: v.number(),
      date: v.number(),
    }),
  ),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

type AdapterWhere = Array<{
  field: string;
  operator?: "eq" | "in";
  value: string | Array<string>;
}>;
type BetterAuthModel = "user" | "account";

type AuthUserRow = {
  _id?: string | null;
  userId?: string | null;
  name?: string | null;
  role?: string | null;
};

type AuthAccountRow = {
  userId?: string | null;
  accountId?: string | null;
};

type PaginatedAdapterResponse<T> = {
  page: T[];
  isDone?: boolean;
  continueCursor?: string | null;
};

async function findManyAll<T>(
  ctx: QueryCtx,
  model: BetterAuthModel,
  where: AdapterWhere,
): Promise<T[]> {
  let cursor: string | null = null;
  const rows: T[] = [];

  while (true) {
    const page = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model,
      where,
      paginationOpts: { cursor, numItems: 200 },
    })) as PaginatedAdapterResponse<T>;

    rows.push(...page.page);
    if (page.isDone) break;
    cursor = page.continueCursor ?? null;
    if (!cursor) break;
  }

  return rows;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getContributorAndAdminUsers(ctx: QueryCtx) {
  const [contributors, admins] = await Promise.all([
    findManyAll<AuthUserRow>(ctx, "user", [
      { field: "role", operator: "eq", value: "contributor" },
    ]),
    findManyAll<AuthUserRow>(ctx, "user", [
      { field: "role", operator: "eq", value: "admin" },
    ]),
  ]);

  const usersByAuthId = new Map<string, AuthUserRow>();
  for (const user of [...contributors, ...admins]) {
    if (typeof user._id !== "string" || user._id.length === 0) continue;
    usersByAuthId.set(user._id, user);
  }
  return usersByAuthId;
}

export const getContributorDiscordLinks = internalQuery({
  args: {},
  returns: v.array(contributorUserValidator),
  handler: async (ctx) => {
    const usersByAuthId = await getContributorAndAdminUsers(ctx);
    const authUserIds = Array.from(usersByAuthId.keys());
    if (authUserIds.length === 0) return [];

    const accounts: AuthAccountRow[] = [];
    for (const userIds of chunk(authUserIds, 100)) {
      const rows = await findManyAll<AuthAccountRow>(ctx, "account", [
        { field: "providerId", operator: "eq", value: "discord" },
        { field: "userId", operator: "in", value: userIds },
      ]);
      accounts.push(...rows);
    }

    const discordAccountIdByUserId = new Map<string, string>();
    for (const account of accounts) {
      if (
        typeof account.userId !== "string" ||
        typeof account.accountId !== "string"
      ) {
        continue;
      }
      discordAccountIdByUserId.set(account.userId, account.accountId);
    }

    return authUserIds
      .map((authUserId) => {
        const user = usersByAuthId.get(authUserId);
        const discordAccountId = discordAccountIdByUserId.get(authUserId);
        if (!user || !discordAccountId || typeof user.name !== "string") {
          return null;
        }

        const legacyUserId = Number.parseInt(user.userId ?? "", 10);
        if (!Number.isFinite(legacyUserId)) {
          return null;
        }

        return {
          legacyUserId,
          author: user.name,
          discordAccountId,
        };
      })
      .filter(
        (
          user,
        ): user is {
          legacyUserId: number;
          author: string;
          discordAccountId: string;
        } => user !== null,
      );
  },
});

export const getPublicStoryIdsPage = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: publicStoriesPageValidator,
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("stories")
      .withIndex("by_public", (q) => q.eq("public", true).eq("deleted", false))
      .paginate(args.paginationOpts);

    return {
      page: page.page
        .map((story) => story.legacyId)
        .filter((legacyId): legacyId is number => typeof legacyId === "number"),
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

export const getApprovalPage = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sinceDate: v.optional(v.number()),
  },
  returns: approvalsPageValidator,
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("story_approval")
      .withIndex("by_date", (q) => q.gte("date", args.sinceDate ?? 0))
      .paginate(args.paginationOpts);

    const legacyUserIds = Array.from(
      new Set(
        page.page
          .map((approval) => approval.legacyUserId)
          .filter(
            (legacyUserId): legacyUserId is number =>
              typeof legacyUserId === "number",
          ),
      ),
    );

    const allowedLegacyUserIds = new Set<number>();
    for (const legacyIds of chunk(legacyUserIds, 100)) {
      const users = (await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: "user",
          where: [
            { field: "userId", operator: "in", value: legacyIds.map(String) },
          ],
          paginationOpts: { cursor: null, numItems: legacyIds.length + 20 },
        },
      )) as PaginatedAdapterResponse<AuthUserRow>;

      for (const user of users.page) {
        if (user.role !== "contributor" && user.role !== "admin") continue;
        const legacyUserId = Number.parseInt(user.userId ?? "", 10);
        if (Number.isFinite(legacyUserId)) {
          allowedLegacyUserIds.add(legacyUserId);
        }
      }
    }

    const storyIds = Array.from(
      new Set(page.page.map((approval) => approval.storyId)),
    );
    const storyMetaById = new Map<Id<"stories">, number>();
    for (const storyId of storyIds) {
      const story = await ctx.db.get(storyId);
      if (story && typeof story.legacyId === "number") {
        storyMetaById.set(storyId, story.legacyId);
      }
    }

    return {
      page: page.page
        .map((approval) => {
          if (
            typeof approval.legacyUserId !== "number" ||
            !allowedLegacyUserIds.has(approval.legacyUserId)
          ) {
            return null;
          }

          const storyLegacyId = storyMetaById.get(approval.storyId);
          if (typeof storyLegacyId !== "number") return null;

          return {
            id: approval._id,
            legacyUserId: approval.legacyUserId,
            storyId: storyLegacyId,
            date: approval.date,
          };
        })
        .filter(
          (
            approval,
          ): approval is {
            id: Id<"story_approval">;
            legacyUserId: number;
            storyId: number;
            date: number;
          } => approval !== null,
        ),
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
