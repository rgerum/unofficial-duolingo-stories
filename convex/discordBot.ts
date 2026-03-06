import { httpAction } from "./_generated/server";
import { components, internal } from "./_generated/api";

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

  const combineData = await ctx.runQuery(
    internal.discordData.getCombineData,
    {},
  );

  return json({
    ok: true,
    ...combineData,
  });
});
