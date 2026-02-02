import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Queries
// ============================================

/**
 * Get all completions for a user
 */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("story_completions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get completions for a user in a specific course
 */
export const listByUserAndCourse = query({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    // Get all stories in the course
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const storyIds = new Set(stories.map((s) => s._id));

    // Get user's completions
    const completions = await ctx.db
      .query("story_completions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter to only completions for stories in this course
    return completions.filter((c) => storyIds.has(c.storyId));
  },
});

/**
 * Check if a user has completed a specific story
 */
export const hasCompleted = query({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const completion = await ctx.db
      .query("story_completions")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();
    return completion !== null;
  },
});

/**
 * Get completion count for a story
 */
export const getCountByStory = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("story_completions")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();
    return completions.length;
  },
});

/**
 * Get completed story IDs for a user (useful for UI)
 */
export const getCompletedStoryIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("story_completions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return completions.map((c) => c.storyId);
  },
});

/**
 * Get completed story legacy IDs for a user in a course (by legacy user ID and course short)
 * Returns a Record<number, boolean> mapping legacy story IDs to true
 */
export const getCompletedByUserAndCourse = query({
  args: {
    userLegacyId: v.optional(v.number()),
    courseShort: v.string(),
  },
  handler: async (ctx, args) => {
    const result: Record<number, boolean> = {};

    if (!args.userLegacyId) {
      return result;
    }

    // Find user by legacy ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
      .first();

    if (!user) {
      return result;
    }

    // Find course by short name
    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.courseShort))
      .first();

    if (!course) {
      return result;
    }

    // Get all stories in the course
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();

    const storyIdToLegacyId = new Map(
      stories.map((s) => [s._id, s.legacyId])
    );
    const storyIds = new Set(stories.map((s) => s._id));

    // Get user's completions
    const completions = await ctx.db
      .query("story_completions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter to only completions for stories in this course
    for (const completion of completions) {
      if (storyIds.has(completion.storyId)) {
        const legacyId = storyIdToLegacyId.get(completion.storyId);
        if (legacyId) {
          result[legacyId] = true;
        }
      }
    }

    return result;
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Mark a story as completed
 */
export const markComplete = mutation({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    // Check if already completed
    const existing = await ctx.db
      .query("story_completions")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();

    if (existing) {
      // Update the timestamp
      await ctx.db.patch(existing._id, { time: Date.now() });
      return existing._id;
    }

    const completionTime = Date.now();

    // Create new completion
    const completionId = await ctx.db.insert("story_completions", {
      userId: args.userId,
      storyId: args.storyId,
      time: completionTime,
    });

    // Update pre-aggregated stats
    const story = await ctx.db.get(args.storyId);
    if (story) {
      await updateMonthlyStats(ctx, story, args.userId, completionTime);
    }

    return completionId;
  },
});

/**
 * Remove a completion (if user wants to replay)
 */
export const removeCompletion = mutation({
  args: { userId: v.id("users"), storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const completion = await ctx.db
      .query("story_completions")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", args.userId).eq("storyId", args.storyId)
      )
      .first();

    if (completion) {
      await ctx.db.delete(completion._id);
    }
  },
});

/**
 * Mark a story as completed using legacy IDs
 * Supports both authenticated and anonymous users
 */
export const markCompleteByLegacyId = mutation({
  args: {
    storyLegacyId: v.number(),
    userLegacyId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Look up story by legacy ID
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
      .first();

    if (!story) {
      throw new Error(`Story with legacy ID ${args.storyLegacyId} not found`);
    }

    // Look up user if provided
    let userId = undefined;
    if (args.userLegacyId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
        .first();
      userId = user?._id;
    }

    // For authenticated users, check if already completed
    if (userId) {
      const existing = await ctx.db
        .query("story_completions")
        .withIndex("by_user_story", (q) =>
          q.eq("userId", userId).eq("storyId", story._id)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { time: Date.now() });
        return {
          completionId: existing._id,
          storyId: story._id,
          courseId: story.courseId,
        };
      }
    }

    const completionTime = Date.now();

    // Create new completion
    const completionId = await ctx.db.insert("story_completions", {
      userId,
      storyId: story._id,
      time: completionTime,
    });

    // Update pre-aggregated stats
    await updateMonthlyStats(ctx, story, userId, completionTime);

    return {
      completionId,
      storyId: story._id,
      courseId: story.courseId,
    };
  },
});

// ============================================
// Helper function for stats
// ============================================

import { Id, Doc } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

async function updateMonthlyStats(
  ctx: MutationCtx,
  story: Doc<"stories">,
  userId: Id<"users"> | undefined,
  completionTime: number
) {
  const date = new Date(completionTime);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // Get course to find legacy ID
  const course = await ctx.db.get(story.courseId);
  if (!course) return;

  const courseLegacyId = course.legacyId ?? 0;
  const storyIdStr = story._id;
  const userIdStr = userId ?? "";

  // Get or create monthly stats for this course
  let stats = await ctx.db
    .query("monthly_stats")
    .withIndex("by_year_month_course", (q) =>
      q.eq("year", year).eq("month", month).eq("courseLegacyId", courseLegacyId)
    )
    .first();

  if (!stats) {
    // Create new stats record
    await ctx.db.insert("monthly_stats", {
      year,
      month,
      courseLegacyId,
      storiesPublished: 0,
      storiesRead: 1,
      activeUsersCount: userIdStr ? 1 : 0,
      activeStoriesCount: 1,
      activeUserIds: userIdStr ? [userIdStr] : [],
      activeStoryIds: [storyIdStr],
      lastUpdated: Date.now(),
    });
  } else {
    // Update existing stats
    const newActiveUserIds = [...stats.activeUserIds];
    const newActiveStoryIds = [...stats.activeStoryIds];
    let activeUsersCount = stats.activeUsersCount;
    let activeStoriesCount = stats.activeStoriesCount;

    // Add user if not already counted
    if (userIdStr && !newActiveUserIds.includes(userIdStr)) {
      newActiveUserIds.push(userIdStr);
      activeUsersCount++;
    }

    // Add story if not already counted
    if (!newActiveStoryIds.includes(storyIdStr)) {
      newActiveStoryIds.push(storyIdStr);
      activeStoriesCount++;
    }

    await ctx.db.patch(stats._id, {
      storiesRead: stats.storiesRead + 1,
      activeUsersCount,
      activeStoriesCount,
      activeUserIds: newActiveUserIds,
      activeStoryIds: newActiveStoryIds,
      lastUpdated: Date.now(),
    });
  }

  // Update global stats
  if (userIdStr) {
    let globalStats = await ctx.db
      .query("monthly_stats_global")
      .withIndex("by_year_month", (q) =>
        q.eq("year", year).eq("month", month)
      )
      .first();

    if (!globalStats) {
      await ctx.db.insert("monthly_stats_global", {
        year,
        month,
        totalActiveUsers: 1,
        activeUserIds: [userIdStr],
        lastUpdated: Date.now(),
      });
    } else if (!globalStats.activeUserIds.includes(userIdStr)) {
      await ctx.db.patch(globalStats._id, {
        totalActiveUsers: globalStats.totalActiveUsers + 1,
        activeUserIds: [...globalStats.activeUserIds, userIdStr],
        lastUpdated: Date.now(),
      });
    }
  }
}
