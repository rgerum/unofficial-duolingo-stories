import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "./auth";
import schema from "./schema";
import { query } from "./_generated/server";
import { v } from "convex/values";

const activatedFilterValidator = v.union(
  v.literal("all"),
  v.literal("yes"),
  v.literal("no"),
);
const roleFilterValidator = v.union(
  v.literal("all"),
  v.literal("user"),
  v.literal("contributor"),
  v.literal("admin"),
);

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
    activatedFilter: activatedFilterValidator,
    roleFilter: roleFilterValidator,
    id: v.string(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("user")
      .withIndex("userId", (q) => q.eq("userId", args.id));
    if (args.roleFilter === "admin") {
      query = query.filter((q) => q.eq(q.field("role"), "admin"));
    } else if (args.roleFilter === "contributor") {
      query = query.filter((q) => q.eq(q.field("role"), "contributor"));
    } else if (args.roleFilter === "user") {
      query = query.filter((q) =>
        q.and(
          q.neq(q.field("role"), "admin"),
          q.neq(q.field("role"), "contributor"),
        ),
      );
    }
    if (args.activatedFilter === "yes") {
      query = query.filter((q) => q.eq(q.field("emailVerified"), true));
    } else if (args.activatedFilter === "no") {
      query = query.filter((q) => q.eq(q.field("emailVerified"), false));
    }
    return query.take(1);
  },
});

export const searchUsersByEmailPrefix = query({
  args: {
    activatedFilter: activatedFilterValidator,
    roleFilter: roleFilterValidator,
    limit: v.number(),
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return [];
    let query = ctx.db.query("user").withSearchIndex("search_email", (q) => {
      let built = q.search("email", search);
      if (args.roleFilter === "admin" || args.roleFilter === "contributor") {
        built = built.eq("role", args.roleFilter);
      }
      if (args.activatedFilter === "yes") {
        built = built.eq("emailVerified", true);
      } else if (args.activatedFilter === "no") {
        built = built.eq("emailVerified", false);
      }
      return built;
    });
    if (args.roleFilter === "user") {
      query = query.filter((q) =>
        q.and(
          q.neq(q.field("role"), "admin"),
          q.neq(q.field("role"), "contributor"),
        ),
      );
    }
    return query.take(args.limit);
  },
});

export const searchUsersByUsernamePrefix = query({
  args: {
    activatedFilter: activatedFilterValidator,
    roleFilter: roleFilterValidator,
    limit: v.number(),
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.prefix.trim();
    if (search.length === 0) return [];
    let query = ctx.db.query("user").withSearchIndex("search_username", (q) => {
      let built = q.search("username", search);
      if (args.roleFilter === "admin" || args.roleFilter === "contributor") {
        built = built.eq("role", args.roleFilter);
      }
      if (args.activatedFilter === "yes") {
        built = built.eq("emailVerified", true);
      } else if (args.activatedFilter === "no") {
        built = built.eq("emailVerified", false);
      }
      return built;
    });
    if (args.roleFilter === "user") {
      query = query.filter((q) =>
        q.and(
          q.neq(q.field("role"), "admin"),
          q.neq(q.field("role"), "contributor"),
        ),
      );
    }
    return query.take(args.limit);
  },
});

export const searchUsersAll = query({
  args: {
    activatedFilter: activatedFilterValidator,
    roleFilter: roleFilterValidator,
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.roleFilter === "admin" || args.roleFilter === "contributor") {
      let query = ctx.db
        .query("user")
        .withIndex("role", (q) => q.eq("role", args.roleFilter))
        .order("desc");
      if (args.activatedFilter === "yes") {
        query = query.filter((q) => q.eq(q.field("emailVerified"), true));
      } else if (args.activatedFilter === "no") {
        query = query.filter((q) => q.eq(q.field("emailVerified"), false));
      }
      return query.take(args.limit);
    }
    let query = ctx.db.query("user").order("desc");
    if (args.roleFilter === "user") {
      query = query.filter((q) =>
        q.and(
          q.neq(q.field("role"), "admin"),
          q.neq(q.field("role"), "contributor"),
        ),
      );
    }
    if (args.activatedFilter === "yes") {
      query = query.filter((q) => q.eq(q.field("emailVerified"), true));
    } else if (args.activatedFilter === "no") {
      query = query.filter((q) => q.eq(q.field("emailVerified"), false));
    }
    return query.take(args.limit);
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
