import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Queries
// ============================================

/**
 * Get a user by ID
 */
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a user by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Get a user by name
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

/**
 * Get a user by legacy PostgreSQL ID (for migration)
 */
export const getByLegacyId = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();
  },
});

/**
 * List all users (admin only - should add auth check)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Get user's OAuth accounts
 */
export const getAccounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Check if user is an admin
 */
export const isAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.admin === true;
  },
});

/**
 * Check if user is an editor
 */
export const isEditor = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.role === true || user?.admin === true;
  },
});

/**
 * Get user profile data by legacy ID including linked OAuth providers
 */
export const getProfileByLegacyId = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (!user) return null;

    // Get linked OAuth accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const providersBase = ["facebook", "github", "google", "discord"];
    const providerLinked: Record<string, boolean> = {};
    for (const p of providersBase) {
      providerLinked[p] = false;
    }

    const providers: string[] = [];
    for (const account of accounts) {
      providers.push(account.provider);
      providerLinked[account.provider] = true;
    }

    const role: string[] = [];
    if (user.admin) role.push("Admin");
    if (user.role) role.push("Contributor");

    return {
      providers,
      name: user.name ?? "",
      email: user.email,
      role,
      provider_linked: providerLinked,
    };
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Set user role (admin action)
 */
export const setRole = mutation({
  args: {
    id: v.id("users"),
    role: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { role: args.role });
  },
});

/**
 * Set user admin status (admin action)
 */
export const setAdmin = mutation({
  args: {
    id: v.id("users"),
    admin: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { admin: args.admin });
  },
});

/**
 * Activate a user account
 */
export const activate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      activated: true,
      emailVerified: Date.now(),
    });
  },
});

/**
 * Delete a user and their associated data
 */
export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    // Delete accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete story completions
    const completions = await ctx.db
      .query("story_completions")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();
    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    // Note: Story approvals are kept for history, but userId reference will be invalid
    // Could also delete these if needed

    // Delete the user
    await ctx.db.delete(args.id);
  },
});
