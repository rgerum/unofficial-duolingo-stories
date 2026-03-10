import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

type Role = "user" | "contributor" | "admin";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function requireDiscordSyncSecret(req: Request) {
  const expectedSecret = process.env.DISCORD_ROLE_SYNC_SECRET;
  if (!expectedSecret) {
    return {
      ok: false,
      response: json(
        { ok: false, error: "Missing DISCORD_ROLE_SYNC_SECRET env var" },
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

type CombineKind = "users" | "publicStories" | "approvals";

function parseNumItems(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return 200;
  return Math.max(1, Math.min(500, value));
}

function parseKind(value: unknown): CombineKind | null {
  if (value === "users" || value === "publicStories" || value === "approvals") {
    return value;
  }
  return null;
}

export const setContributorWriteByDiscordAccountId = httpAction(
  async (ctx, req) => {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const auth = await requireDiscordSyncSecret(req);
    if (!auth.ok) return auth.response;

    const parsed = auth.body as {
      discordAccountId?: unknown;
      write?: unknown;
    };

    if (typeof parsed.discordAccountId !== "string") {
      return json(
        { ok: false, error: "discordAccountId must be a string" },
        400,
      );
    }
    if (typeof parsed.write !== "boolean" && parsed.write !== null) {
      return json({ ok: false, error: "write must be a boolean or null" }, 400);
    }

    const account = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "account",
      where: [
        { field: "providerId", value: "discord" },
        { field: "accountId", value: parsed.discordAccountId },
      ],
    })) as { userId?: string | null } | null;

    if (!account?.userId) {
      return json({ ok: true, linked: false });
    }

    const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "_id", value: account.userId }],
    })) as {
      _id?: string;
      userId?: string | null;
      name?: string | null;
      role?: string | null;
    } | null;

    if (!user?._id) {
      return json({ ok: true, linked: false });
    }

    const currentRole: Role =
      user.role === "admin" || user.role === "contributor" ? user.role : "user";
    let nextRole: Role = currentRole;
    if (typeof parsed.write === "boolean") {
      if (parsed.write && currentRole === "user") nextRole = "contributor";
      if (!parsed.write && currentRole === "contributor") nextRole = "user";

      if (nextRole !== currentRole) {
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: "user",
            where: [{ field: "_id", value: user._id }],
            update: { role: nextRole },
          },
        });
      }
    }

    const legacyId = Number.parseInt(user.userId ?? "", 10);
    return json({
      ok: true,
      linked: true,
      updated: nextRole !== currentRole,
      user: {
        id: Number.isFinite(legacyId) ? legacyId : null,
        name: user.name ?? "",
        role: nextRole,
      },
    });
  },
);

export const getDiscordCombineData = httpAction(async (ctx, req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const auth = await requireDiscordSyncSecret(req);
  if (!auth.ok) return auth.response;

  const body = auth.body as {
    kind?: unknown;
    cursor?: unknown;
    numItems?: unknown;
    sinceDate?: unknown;
  };

  const kind = parseKind(body.kind);
  if (!kind) {
    return json(
      {
        ok: false,
        error: "kind must be one of users, publicStories, or approvals",
      },
      400,
    );
  }

  const paginationOpts = {
    cursor: typeof body.cursor === "string" ? body.cursor : null,
    numItems: parseNumItems(body.numItems),
  };

  if (kind === "users") {
    const users = await ctx.runQuery(
      internal.discordData.getContributorDiscordLinks,
      {},
    );
    return json({ ok: true, users });
  }

  if (kind === "publicStories") {
    const page = await ctx.runQuery(
      internal.discordData.getPublicStoryIdsPage,
      {
        paginationOpts,
      },
    );
    return json({ ok: true, ...page });
  }

  if (
    body.sinceDate !== undefined &&
    (typeof body.sinceDate !== "number" || !Number.isInteger(body.sinceDate))
  ) {
    return json({ ok: false, error: "sinceDate must be an integer" }, 400);
  }

  const page = await ctx.runQuery(internal.discordData.getApprovalPage, {
    paginationOpts,
    sinceDate: typeof body.sinceDate === "number" ? body.sinceDate : undefined,
  });
  return json({ ok: true, ...page });
});
