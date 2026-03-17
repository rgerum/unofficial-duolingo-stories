import { v } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ContributorCtx = QueryCtx | MutationCtx;

type AdapterWhere = Array<{
  field: string;
  operator?: "eq" | "in";
  value: string | Array<string>;
}>;

type AuthUserRow = {
  _id?: string | null;
  userId?: string | null;
  name?: string | null;
  image?: string | null;
};

type AuthAccountRow = {
  userId?: string | null;
  providerId?: string | null;
};

type PaginatedAdapterResponse<T> = {
  page: T[];
  isDone?: boolean;
  continueCursor?: string | null;
};

export const courseContributorValidator = v.object({
  legacyUserId: v.number(),
  name: v.string(),
  image: v.union(v.string(), v.null()),
  discordLinked: v.boolean(),
});

export type CourseContributor = {
  legacyUserId: number;
  name: string;
  image: string | null;
  discordLinked: boolean;
  latestDate: number;
  active: boolean;
};

async function findManyAll<T>(
  ctx: ContributorCtx,
  model: "user" | "account",
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

async function getUsersByLegacyId(
  ctx: ContributorCtx,
  legacyUserIds: number[],
): Promise<
  Map<number, { name: string; image: string | null; discordLinked: boolean }>
> {
  const uniqueLegacyIds = Array.from(
    new Set(
      legacyUserIds.filter((legacyUserId) => Number.isFinite(legacyUserId)),
    ),
  );
  if (!uniqueLegacyIds.length) {
    return new Map<
      number,
      { name: string; image: string | null; discordLinked: boolean }
    >();
  }

  const users = await findManyAll<AuthUserRow>(ctx, "user", [
    {
      field: "userId",
      operator: "in",
      value: uniqueLegacyIds.map((legacyUserId) => String(legacyUserId)),
    },
  ]);

  const authDocIds = users
    .map((user) => user._id)
    .filter((authDocId): authDocId is string => Boolean(authDocId));
  const accounts =
    authDocIds.length === 0
      ? []
      : await findManyAll<AuthAccountRow>(ctx, "account", [
          { field: "providerId", operator: "eq", value: "discord" },
          { field: "userId", operator: "in", value: authDocIds },
        ]);

  const discordLinkedAuthDocIds = new Set(
    accounts
      .map((account) => account.userId)
      .filter((authDocId): authDocId is string => Boolean(authDocId)),
  );

  const map = new Map<
    number,
    { name: string; image: string | null; discordLinked: boolean }
  >();
  for (const user of users) {
    const legacyUserId = Number.parseInt(user.userId ?? "", 10);
    if (!Number.isFinite(legacyUserId)) continue;
    map.set(legacyUserId, {
      name: user.name?.trim() || `User ${legacyUserId}`,
      image:
        typeof user.image === "string" && user.image.length > 0
          ? user.image
          : null,
      discordLinked:
        typeof user._id === "string" && discordLinkedAuthDocIds.has(user._id),
    });
  }

  return map;
}

export async function getRankedCourseContributors(
  ctx: ContributorCtx,
  courseId: Id<"courses">,
): Promise<CourseContributor[]> {
  const courseStories = await ctx.db
    .query("stories")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();

  const latestApprovalByUser = new Map<number, number>();
  for (const story of courseStories) {
    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();
    for (const approval of approvals) {
      if (typeof approval.legacyUserId !== "number") continue;
      const existing = latestApprovalByUser.get(approval.legacyUserId) ?? 0;
      if (approval.date > existing) {
        latestApprovalByUser.set(approval.legacyUserId, approval.date);
      }
    }
  }

  const usersByLegacyId = await getUsersByLegacyId(
    ctx,
    Array.from(latestApprovalByUser.keys()),
  );
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return Array.from(latestApprovalByUser.entries())
    .map(([legacyUserId, latestDate]) => {
      const user = usersByLegacyId.get(legacyUserId);
      return {
        legacyUserId,
        name: user?.name ?? `User ${legacyUserId}`,
        image: user?.image ?? null,
        discordLinked: user?.discordLinked ?? false,
        latestDate,
        active: latestDate > cutoffMs,
      };
    })
    .sort((a, b) => b.latestDate - a.latestDate);
}

export function partitionCourseContributors(contributors: CourseContributor[]) {
  return {
    contributors: contributors
      .filter((contributor) => contributor.active)
      .map(({ legacyUserId, name, image, discordLinked }) => ({
        legacyUserId,
        name,
        image,
        discordLinked,
      })),
    contributors_past: contributors
      .filter((contributor) => !contributor.active)
      .map(({ legacyUserId, name, image, discordLinked }) => ({
        legacyUserId,
        name,
        image,
        discordLinked,
      })),
  };
}
