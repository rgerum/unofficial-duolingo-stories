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

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptions);
