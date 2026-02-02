import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Queries
// ============================================

/**
 * Get all approvals for a story
 */
export const listByStory = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();
  },
});

/**
 * Check if a user has approved a story
 */
export const hasApproved = query({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const approval = await ctx.db
      .query("story_approvals")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();
    return approval !== null;
  },
});

/**
 * Get approval count for a story
 */
export const getCount = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();
    return approvals.length;
  },
});

/**
 * Get approvals with user details for a story
 */
export const listByStoryWithUsers = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    return await Promise.all(
      approvals.map(async (approval) => ({
        ...approval,
        user: await ctx.db.get(approval.userId),
      }))
    );
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Toggle approval for a story (add if not exists, remove if exists)
 * Returns the new approval status and updates story status based on approval count
 */
export const toggle = mutation({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("story_approvals")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();

    let isApproved: boolean;

    if (existing) {
      // Remove approval
      await ctx.db.delete(existing._id);
      isApproved = false;
    } else {
      // Add approval
      await ctx.db.insert("story_approvals", {
        userId: args.userId,
        storyId: args.storyId,
        date: Date.now(),
      });
      isApproved = true;
    }

    // Update story status based on approval count
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    const approvalCount = approvals.length;
    let newStatus: "draft" | "feedback" | "finished";

    if (approvalCount >= 2) {
      newStatus = "finished";
    } else if (approvalCount >= 1) {
      newStatus = "feedback";
    } else {
      newStatus = "draft";
    }

    await ctx.db.patch(args.storyId, {
      status: newStatus,
      change_date: Date.now(),
    });

    return { isApproved, approvalCount, newStatus };
  },
});

/**
 * Add an approval for a story
 */
export const approve = mutation({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    // Check if already approved
    const existing = await ctx.db
      .query("story_approvals")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("story_approvals", {
      userId: args.userId,
      storyId: args.storyId,
      date: Date.now(),
    });
  },
});

/**
 * Remove an approval from a story
 */
export const unapprove = mutation({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const approval = await ctx.db
      .query("story_approvals")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();

    if (approval) {
      await ctx.db.delete(approval._id);
    }
  },
});

/**
 * Remove all approvals for a story (admin action)
 */
export const removeAll = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    for (const approval of approvals) {
      await ctx.db.delete(approval._id);
    }

    // Reset story status to draft
    await ctx.db.patch(args.storyId, {
      status: "draft",
      change_date: Date.now(),
    });
  },
});
