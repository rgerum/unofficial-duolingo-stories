import { authComponent } from "./betterAuth/auth";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";

const authClientApi = authComponent.clientApi();
export const getAuthUser = authClientApi.getAuthUser;

async function requireContributorOrAdmin(ctx: any) {
  const identity = (await ctx.auth.getUserIdentity()) as
    | { role?: string | null }
    | null;
  const role = identity?.role ?? null;
  if (role !== "contributor" && role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return {
      ...identity,
      role: identity.role ?? "user",
    };
  },
});

export const getLinkedProvidersForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = (await ctx.auth.getUserIdentity()) as
      | { email?: string | null }
      | null;
    const email = identity?.email?.toLowerCase();
    if (!email) return [] as string[];

    const authUser = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "email", value: email }],
    });

    if (!authUser?._id) return [] as string[];

    const accounts = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "account",
      where: [{ field: "userId", value: authUser._id }],
      paginationOpts: { cursor: null, numItems: 100 },
    });

    const providers = (accounts.page as Array<{ providerId?: string | null }>)
      .map((account) => account.providerId)
      .filter((provider): provider is string => Boolean(provider));

    return Array.from(new Set(providers));
  },
});

export const getUserNamesByLegacyIds = query({
  args: {
    legacyIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    const uniqueIds = Array.from(new Set(args.legacyIds));
    if (!uniqueIds.length) return [] as Array<{ legacyId: number; name: string }>;

    const userIds = uniqueIds.map((id) => String(id));
    const users = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      where: [{ field: "userId", operator: "in", value: userIds }],
      paginationOpts: { cursor: null, numItems: userIds.length + 10 },
    });

    return (users.page as Array<{ userId?: string | null; name?: string | null }>)
      .map((user) => {
        const legacyId = Number.parseInt(user.userId ?? "", 10);
        if (!Number.isFinite(legacyId) || !user.name) return null;
        return { legacyId, name: user.name };
      })
      .filter((row): row is { legacyId: number; name: string } => row !== null);
  },
});
