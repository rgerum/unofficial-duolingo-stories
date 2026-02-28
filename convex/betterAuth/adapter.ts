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

export const searchUsersByEmailPrefix = query({
  args: {
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return [];

    return await ctx.db
      .query("user")
      .withSearchIndex("search_email", (q) => q.search("email", search))
      .collect();
  },
});

export const searchUsersByUsernamePrefix = query({
  args: {
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return [];

    return await ctx.db
      .query("user")
      .withSearchIndex("search_username", (q) => q.search("username", search))
      .collect();
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
