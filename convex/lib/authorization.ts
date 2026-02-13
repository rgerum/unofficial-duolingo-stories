import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = MutationCtx | QueryCtx;

type RoleIdentity = {
  userId?: string | number | null;
  role?: string | null;
} | null;

async function getIdentity(ctx: AuthCtx) {
  return (await ctx.auth.getUserIdentity()) as RoleIdentity;
}

async function getRole(ctx: AuthCtx) {
  const identity = await getIdentity(ctx);
  return identity?.role ?? null;
}

export async function requireAdmin(ctx: AuthCtx) {
  const role = await getRole(ctx);
  if (role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function requireContributorOrAdmin(ctx: AuthCtx) {
  const role = await getRole(ctx);
  if (role !== "contributor" && role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function requireSessionLegacyUserId(ctx: AuthCtx) {
  const identity = await getIdentity(ctx);
  const rawUserId = identity?.userId;
  const legacyUserId =
    typeof rawUserId === "number"
      ? rawUserId
      : Number.parseInt(String(rawUserId ?? ""), 10);

  if (!Number.isFinite(legacyUserId)) {
    throw new Error("Unauthorized");
  }

  return legacyUserId;
}

export async function getSessionLegacyUserId(ctx: AuthCtx) {
  const identity = await getIdentity(ctx);
  const rawUserId = identity?.userId;
  const legacyUserId =
    typeof rawUserId === "number"
      ? rawUserId
      : Number.parseInt(String(rawUserId ?? ""), 10);
  return Number.isFinite(legacyUserId) ? legacyUserId : null;
}
