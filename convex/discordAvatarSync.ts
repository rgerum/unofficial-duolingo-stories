// The Discord avatar backfill is exposed as an internal action only (not an
// HTTP route and not a public action). To run it as an operator, invoke a
// single batch with:
//
//   pnpm exec convex run discordAvatarSync:backfillDiscordUserImagesInternal '{"dryRun": true}'
//
// then repeat, passing the returned `nextCursor` as `{"cursor": "..."}` until
// `isDone` is true. The `pnpm run backfill:discord-avatars` script drives this
// loop automatically.
import { internalAction, type ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { syncDiscordAvatarFromAccount } from "./lib/discordAvatarSync";

type AdapterWhere = Array<{
  field: string;
  operator?: "eq" | "in";
  value: string | Array<string>;
}>;

type AuthAccountRow = {
  _id?: string | null;
  userId?: string | null;
  providerId?: string | null;
  accountId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresAt?: number | null;
  scope?: string | null;
};

type PaginatedAdapterResponse<T> = {
  page: T[];
  isDone?: boolean;
  continueCursor?: string | null;
};

type BackfillArgs = {
  batchSize?: number;
  cursor?: string | null;
  dryRun?: boolean;
};

type BackfillResult = {
  processed: number;
  updatedUsers: number;
  updatedAccounts: number;
  skipped: number;
  nextCursor: string | null;
  isDone: boolean;
  errors: Array<{
    accountId: string | null;
    userId: string | null;
    message: string;
  }>;
};

const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 100;

function normalizeBatchSize(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(value)));
}

function dedupeAccounts(accounts: AuthAccountRow[]) {
  const seen = new Set<string>();
  const unique: AuthAccountRow[] = [];

  for (const account of accounts) {
    const key = `${account.userId ?? ""}:${account.accountId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(account);
  }

  return unique;
}

async function findManyPage<T>(
  ctx: ActionCtx,
  model: "account",
  where: AdapterWhere,
  cursor: string | null,
  batchSize: number,
): Promise<PaginatedAdapterResponse<T>> {
  return (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model,
    where,
    paginationOpts: { cursor, numItems: batchSize },
  })) as PaginatedAdapterResponse<T>;
}

async function runDiscordAvatarBackfill(
  ctx: ActionCtx,
  args: BackfillArgs,
): Promise<BackfillResult> {
  const batchSize = normalizeBatchSize(args.batchSize);
  const page = await findManyPage<AuthAccountRow>(
    ctx,
    "account",
    [{ field: "providerId", operator: "eq", value: "discord" }],
    args.cursor ?? null,
    batchSize,
  );

  let processed = 0;
  let updatedUsers = 0;
  let updatedAccounts = 0;
  let skipped = 0;
  const errors: Array<{
    accountId: string | null;
    userId: string | null;
    message: string;
  }> = [];

  for (const account of dedupeAccounts(page.page)) {
    processed += 1;

    if (
      typeof account._id !== "string" ||
      typeof account.userId !== "string" ||
      typeof account.providerId !== "string"
    ) {
      skipped += 1;
      continue;
    }

    try {
      const result = await syncDiscordAvatarFromAccount(account);
      if (!result.ok) {
        skipped += 1;
        continue;
      }

      if (!args.dryRun) {
        if (result.imageUrl) {
          await ctx.runMutation(components.betterAuth.adapter.updateOne, {
            input: {
              model: "user",
              where: [{ field: "_id", value: account.userId }],
              update: { image: result.imageUrl },
            },
          });
          updatedUsers += 1;
        }

        const accountUpdate: Record<string, string | number | null> = {};
        if (result.accessToken !== account.accessToken) {
          accountUpdate.accessToken = result.accessToken;
        }
        if (result.refreshToken !== account.refreshToken) {
          accountUpdate.refreshToken = result.refreshToken;
        }
        if (result.accessTokenExpiresAt !== account.accessTokenExpiresAt) {
          accountUpdate.accessTokenExpiresAt = result.accessTokenExpiresAt;
        }
        if (result.scope !== account.scope) {
          accountUpdate.scope = result.scope;
        }

        if (Object.keys(accountUpdate).length > 0) {
          await ctx.runMutation(components.betterAuth.adapter.updateOne, {
            input: {
              model: "account",
              where: [{ field: "_id", value: account._id }],
              update: accountUpdate,
            },
          });
          updatedAccounts += 1;
        }
      } else {
        if (result.imageUrl) updatedUsers += 1;
        if (
          result.accessToken !== account.accessToken ||
          result.refreshToken !== account.refreshToken ||
          result.accessTokenExpiresAt !== account.accessTokenExpiresAt ||
          result.scope !== account.scope
        ) {
          updatedAccounts += 1;
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        accountId: account.accountId ?? null,
        userId: account.userId ?? null,
        message,
      });
    }
  }

  return {
    processed,
    updatedUsers,
    updatedAccounts,
    skipped,
    nextCursor: page.continueCursor ?? null,
    isDone: page.isDone ?? true,
    errors,
  };
}

const backfillArgsValidator = {
  batchSize: v.optional(v.number()),
  cursor: v.optional(v.union(v.string(), v.null())),
  dryRun: v.optional(v.boolean()),
};

const backfillReturnsValidator = v.object({
  processed: v.number(),
  updatedUsers: v.number(),
  updatedAccounts: v.number(),
  skipped: v.number(),
  nextCursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
  errors: v.array(
    v.object({
      accountId: v.union(v.string(), v.null()),
      userId: v.union(v.string(), v.null()),
      message: v.string(),
    }),
  ),
});

export const backfillDiscordUserImagesInternal = internalAction({
  args: backfillArgsValidator,
  returns: backfillReturnsValidator,
  handler: async (ctx, args) => {
    return await runDiscordAvatarBackfill(ctx, args);
  },
});
