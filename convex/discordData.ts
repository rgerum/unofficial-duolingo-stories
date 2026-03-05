import { internalQuery } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

type AdapterWhere = Array<{
  field: string;
  operator?: "eq" | "in";
  value: string | Array<string>;
}>;

async function findManyAll(ctx: any, model: string, where: AdapterWhere) {
  let cursor: string | null = null;
  const rows: any[] = [];
  while (true) {
    const page = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model,
      where,
      paginationOpts: { cursor, numItems: 500 },
    })) as { page: any[]; isDone?: boolean; continueCursor?: string | null };

    rows.push(...page.page);
    if (page.isDone) break;
    cursor = page.continueCursor ?? null;
    if (!cursor) break;
  }
  return rows;
}

export const getCombineData = internalQuery({
  args: {},
  returns: v.object({
    user_to_discord_mapping: v.record(v.string(), v.string()),
    approvals: v.array(
      v.object({
        author: v.string(),
        story_id: v.number(),
        date: v.number(),
        public: v.union(v.literal(0), v.literal(1)),
      }),
    ),
  }),
  handler: async (ctx) => {
    const [accounts, approvals] = await Promise.all([
      findManyAll(ctx, "account", [
        { field: "providerId", operator: "eq", value: "discord" },
      ]),
      ctx.db.query("story_approval").collect(),
    ]);

    const authUserIds = Array.from(
      new Set(
        accounts
          .map((row: any) =>
            typeof row.userId === "string" ? row.userId : null,
          )
          .filter((value): value is string => value !== null),
      ),
    );

    const authUsers = authUserIds.length
      ? await findManyAll(ctx, "user", [
          { field: "_id", operator: "in", value: authUserIds },
        ])
      : [];

    const authNameByAuthId = new Map<string, string>();
    const authNameByLegacyUserId = new Map<number, string>();
    for (const user of authUsers) {
      const authId = typeof user._id === "string" ? user._id : null;
      const name = typeof user.name === "string" ? user.name : "";
      if (authId && name) authNameByAuthId.set(authId, name);
      const legacyId = Number.parseInt(user.userId ?? "", 10);
      if (Number.isFinite(legacyId) && name) {
        authNameByLegacyUserId.set(legacyId, name);
      }
    }

    const userToDiscordMapping: Record<string, string> = {};
    for (const account of accounts) {
      const authUserId =
        typeof account.userId === "string" ? account.userId : null;
      const discordAccountId =
        typeof account.accountId === "string" ? account.accountId : null;
      if (!authUserId || !discordAccountId) continue;
      const name = authNameByAuthId.get(authUserId);
      if (!name) continue;
      userToDiscordMapping[name] = discordAccountId;
    }

    const storyIds = Array.from(new Set(approvals.map((row) => row.storyId)));
    const stories = await Promise.all(storyIds.map((id) => ctx.db.get(id)));
    const storyMetaById = new Map(
      stories
        .filter((story): story is NonNullable<typeof story> => Boolean(story))
        .map((story) => [
          story._id,
          {
            legacyId:
              typeof story.legacyId === "number" ? story.legacyId : null,
            public: story.public,
          },
        ]),
    );

    const approvalRows = approvals
      .map((approval) => {
        const meta = storyMetaById.get(approval.storyId);
        if (!meta?.legacyId) return null;
        if (typeof approval.legacyUserId !== "number") return null;
        const author = authNameByLegacyUserId.get(approval.legacyUserId);
        if (!author) return null;
        return {
          author,
          story_id: meta.legacyId,
          date: approval.date,
          public: meta.public ? (1 as const) : (0 as const),
        };
      })
      .filter(
        (
          row,
        ): row is {
          author: string;
          story_id: number;
          date: number;
          public: 0 | 1;
        } => row !== null,
      )
      .sort((a, b) => {
        if (a.story_id !== b.story_id) return a.story_id - b.story_id;
        return a.date - b.date;
      });

    return {
      user_to_discord_mapping: userToDiscordMapping,
      approvals: approvalRows,
    };
  },
});
