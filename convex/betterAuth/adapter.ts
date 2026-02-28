import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "./auth";
import schema from "./schema";
import { query } from "./_generated/server";
import { v } from "convex/values";

const adminFilterValidator = v.union(
  v.literal("all"),
  v.literal("yes"),
  v.literal("no"),
);

type FilterValue = "all" | "yes" | "no";

function matchesRoleAndAdminFilters(
  role: string | null | undefined,
  roleFilter: FilterValue,
  adminFilter: FilterValue,
): boolean {
  const normalizedRole = role ?? null;
  if (adminFilter === "yes") return normalizedRole === "admin";
  if (roleFilter === "yes") {
    if (adminFilter === "no") return normalizedRole === "contributor";
    return normalizedRole === "contributor" || normalizedRole === "admin";
  }
  if (roleFilter === "no") {
    return normalizedRole !== "contributor" && normalizedRole !== "admin";
  }
  if (adminFilter === "no") return normalizedRole !== "admin";
  return true;
}

function matchesActivatedFilter(value: unknown, filter: FilterValue): boolean {
  if (filter === "all") return true;
  const activated = Boolean(value);
  return filter === "yes" ? activated : !activated;
}

const SEARCH_FETCH_CAP = 1000;

export const get = query({
  args: {
    id: v.id("user"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("user", args.id);
  },
});

export const searchUsersByEmailPrefix = query({
  args: {
    prefix: v.string(),
    offset: v.number(),
    limit: v.number(),
    activatedFilter: adminFilterValidator,
    roleFilter: adminFilterValidator,
    adminFilter: adminFilterValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return { page: [], hasMore: false };

    const offset = Math.max(0, Math.floor(args.offset));
    const limit = Math.max(1, Math.min(200, Math.floor(args.limit)));
    const fetchLimit = Math.min(SEARCH_FETCH_CAP, offset + limit + 200);
    const searchRows = await ctx.db
      .query("user")
      .withSearchIndex("search_email", (q) => {
        let built = q.search("email", search);
        if (args.adminFilter === "yes") {
          built = built.eq("role", "admin");
        } else if (args.roleFilter === "yes" && args.adminFilter === "no") {
          built = built.eq("role", "contributor");
        }
        if (args.activatedFilter === "yes") {
          built = built.eq("emailVerified", true);
        } else if (args.activatedFilter === "no") {
          built = built.eq("emailVerified", false);
        }
        return built;
      })
      .take(fetchLimit);

    const filtered = searchRows.filter(
      (user) =>
        matchesRoleAndAdminFilters(
          user.role,
          args.roleFilter,
          args.adminFilter,
        ) && matchesActivatedFilter(user.emailVerified, args.activatedFilter),
    );
    const page = filtered.slice(offset, offset + limit);
    const hasMore =
      filtered.length > offset + limit || searchRows.length === fetchLimit;

    return { page, hasMore };
  },
});

export const searchUsersByUsernamePrefix = query({
  args: {
    prefix: v.string(),
    offset: v.number(),
    limit: v.number(),
    activatedFilter: adminFilterValidator,
    roleFilter: adminFilterValidator,
    adminFilter: adminFilterValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return { page: [], hasMore: false };

    const offset = Math.max(0, Math.floor(args.offset));
    const limit = Math.max(1, Math.min(200, Math.floor(args.limit)));
    const fetchLimit = Math.min(SEARCH_FETCH_CAP, offset + limit + 200);
    const searchRows = await ctx.db
      .query("user")
      .withSearchIndex("search_username", (q) => {
        let built = q.search("username", search);
        if (args.adminFilter === "yes") {
          built = built.eq("role", "admin");
        } else if (args.roleFilter === "yes" && args.adminFilter === "no") {
          built = built.eq("role", "contributor");
        }
        if (args.activatedFilter === "yes") {
          built = built.eq("emailVerified", true);
        } else if (args.activatedFilter === "no") {
          built = built.eq("emailVerified", false);
        }
        return built;
      })
      .take(fetchLimit);

    const filtered = searchRows.filter(
      (user) =>
        matchesRoleAndAdminFilters(
          user.role,
          args.roleFilter,
          args.adminFilter,
        ) && matchesActivatedFilter(user.emailVerified, args.activatedFilter),
    );
    const page = filtered.slice(offset, offset + limit);
    const hasMore =
      filtered.length > offset + limit || searchRows.length === fetchLimit;

    return { page, hasMore };
  },
});

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptions);
