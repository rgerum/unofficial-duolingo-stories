import {
  action,
  httpAction,
  internalAction,
  type ActionCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function requireDiscordAvatarSyncSecret(req: Request) {
  const expectedSecret = process.env.DISCORD_AVATAR_SYNC_SECRET;
  if (!expectedSecret) {
    return {
      ok: false,
      response: json(
        { ok: false, error: "Missing DISCORD_AVATAR_SYNC_SECRET env var" },
        500,
      ),
    } as const;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: json({ ok: false, error: "Invalid JSON body" }, 400),
    } as const;
  }

  const parsed = body as { secret?: unknown };
  if (parsed.secret !== expectedSecret) {
    return {
      ok: false,
      response: json({ ok: false, error: "Unauthorized" }, 401),
    } as const;
  }

  return { ok: true, body } as const;
}

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

export const backfillDiscordUserImages = action({
  args: backfillArgsValidator,
  returns: backfillReturnsValidator,
  handler: async (ctx, args) => {
    const identity = (await ctx.auth.getUserIdentity()) as {
      role?: string | null;
    } | null;
    if (identity?.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await runDiscordAvatarBackfill(ctx, args);
  },
});

export const backfillDiscordUserImagesHttp = httpAction(async (ctx, req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const auth = await requireDiscordAvatarSyncSecret(req);
  if (!auth.ok) return auth.response;

  const body = auth.body as {
    batchSize?: unknown;
    cursor?: unknown;
    dryRun?: unknown;
  };

  if (body.batchSize !== undefined && typeof body.batchSize !== "number") {
    return json({ ok: false, error: "batchSize must be a number" }, 400);
  }
  if (
    body.cursor !== undefined &&
    body.cursor !== null &&
    typeof body.cursor !== "string"
  ) {
    return json({ ok: false, error: "cursor must be a string or null" }, 400);
  }
  if (body.dryRun !== undefined && typeof body.dryRun !== "boolean") {
    return json({ ok: false, error: "dryRun must be a boolean" }, 400);
  }

  const result: BackfillResult = await ctx.runAction(
    internal.discordAvatarSync.backfillDiscordUserImagesInternal,
    {
      batchSize:
        typeof body.batchSize === "number" ? body.batchSize : undefined,
      cursor:
        typeof body.cursor === "string" || body.cursor === null
          ? body.cursor
          : undefined,
      dryRun: typeof body.dryRun === "boolean" ? body.dryRun : undefined,
    },
  );
  return json(result);
});
