import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "./auth";
import schema from "./schema";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {
    id: v.id("user"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("user", args.id);
  },
});

export const searchUsersById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user")
      .withIndex("userId", (q) => q.eq("userId", args.id))
      .collect();
  },
});

export const searchUsersByEmailPrefix = query({
  args: {
    role: v.optional(v.string()),
    limit: v.number(),
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return [];
    let query = await ctx.db
      .query("user")
      .withSearchIndex("search_email", (q) => q.search("email", search));
    if (args.role)
      query = query.filter((q) => q.eq(q.field("role"), args.role));
    return query.take(args.limit);
  },
});

export const searchUsersByUsernamePrefix = query({
  args: {
    role: v.optional(v.string()),
    limit: v.number(),
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return [];
    let query = await ctx.db
      .query("user")
      .withSearchIndex("search_username", (q) => q.search("username", search));
    if (args.role)
      query = query.filter((q) => q.eq(q.field("role"), args.role));
    return query.take(args.limit);
  },
});

export const searchUsersAll = query({
  args: {
    role: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.role) {
      return await ctx.db
        .query("user")
        .withIndex("role", (q) => q.eq("role", args.role))
        .order("desc")
        .take(args.limit);
    }
    return await ctx.db.query("user").order("desc").take(args.limit);
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
