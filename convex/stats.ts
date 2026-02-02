import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Queries
// ============================================

/**
 * Get pre-aggregated monthly statistics
 */
export const getMonthlyStats = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    // Get all stats for this month
    const stats = await ctx.db
      .query("monthly_stats")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("month", args.month)
      )
      .collect();

    // Get global stats
    const globalStats = await ctx.db
      .query("monthly_stats_global")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("month", args.month)
      )
      .first();

    // Get all courses and languages for display
    const courses = await ctx.db.query("courses").collect();
    const languages = await ctx.db.query("languages").collect();

    const languageMap = new Map(languages.map((l) => [l._id, l]));

    const coursesData = courses.map((c) => {
      const learningLang = languageMap.get(c.learningLanguageId);
      const fromLang = languageMap.get(c.fromLanguageId);
      return {
        id: c.legacyId ?? 0,
        learning_language: learningLang?.legacyId ?? 0,
        from_language: fromLang?.legacyId ?? 0,
        public: c.public ?? false,
      };
    });

    const languagesData = languages.map((l) => ({
      id: l.legacyId ?? 0,
      name: l.name,
      short: l.short,
      flag: null,
      flag_file: l.flag_file ?? null,
      speaker: l.speaker ?? null,
      default_text: l.default_text ?? null,
      tts_replace: l.tts_replace ?? null,
      public: l.public ?? false,
      rtl: l.rtl ?? false,
    }));

    // Convert stats to the expected format
    type StatsKey = "storiesPublished" | "storiesRead" | "activeUsersCount" | "activeStoriesCount";
    const toSortedArray = (
      statsArray: typeof stats,
      key: StatsKey
    ): { course_id: number; count: number }[] =>
      statsArray
        .map((s) => ({
          course_id: s.courseLegacyId,
          count: s[key],
        }))
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count);

    return {
      year: args.year,
      month: args.month,
      stories_published: toSortedArray(stats, "storiesPublished"),
      stories_read: toSortedArray(stats, "storiesRead"),
      active_users: toSortedArray(stats, "activeUsersCount"),
      active_users_count: globalStats?.totalActiveUsers ?? 0,
      active_stories: toSortedArray(stats, "activeStoriesCount"),
      courses: coursesData,
      languages: languagesData,
    };
  },
});

/**
 * Check if stats exist for a given month
 */
export const hasStatsForMonth = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("monthly_stats")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("month", args.month)
      )
      .first();
    return stats !== null;
  },
});

// ============================================
// Mutations for incremental updates
// ============================================

/**
 * Record a story completion in the monthly stats
 * Called when a user completes a story
 */
export const recordCompletion = mutation({
  args: {
    storyId: v.id("stories"),
    userId: v.optional(v.id("users")),
    completionTime: v.number(),
  },
  handler: async (ctx, args) => {
    const date = new Date(args.completionTime);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Get story to find course
    const story = await ctx.db.get(args.storyId);
    if (!story) return;

    const course = await ctx.db.get(story.courseId);
    if (!course) return;

    const courseLegacyId = course.legacyId ?? 0;
    const storyIdStr = args.storyId;
    const userIdStr = args.userId ?? "";

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
  },
});

/**
 * Record a story publication in the monthly stats
 * Called when a story is published
 */
export const recordPublication = mutation({
  args: {
    storyId: v.id("stories"),
    publicationTime: v.number(),
  },
  handler: async (ctx, args) => {
    const date = new Date(args.publicationTime);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const story = await ctx.db.get(args.storyId);
    if (!story) return;

    const course = await ctx.db.get(story.courseId);
    if (!course) return;

    const courseLegacyId = course.legacyId ?? 0;

    let stats = await ctx.db
      .query("monthly_stats")
      .withIndex("by_year_month_course", (q) =>
        q.eq("year", year).eq("month", month).eq("courseLegacyId", courseLegacyId)
      )
      .first();

    if (!stats) {
      await ctx.db.insert("monthly_stats", {
        year,
        month,
        courseLegacyId,
        storiesPublished: 1,
        storiesRead: 0,
        activeUsersCount: 0,
        activeStoriesCount: 0,
        activeUserIds: [],
        activeStoryIds: [],
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.patch(stats._id, {
        storiesPublished: stats.storiesPublished + 1,
        lastUpdated: Date.now(),
      });
    }
  },
});

// ============================================
// Mutations for backfill
// ============================================

/**
 * Import pre-calculated stats for a month (used during backfill)
 */
export const importMonthlyStats = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    courseLegacyId: v.number(),
    storiesPublished: v.number(),
    storiesRead: v.number(),
    activeUsersCount: v.number(),
    activeStoriesCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if exists
    const existing = await ctx.db
      .query("monthly_stats")
      .withIndex("by_year_month_course", (q) =>
        q
          .eq("year", args.year)
          .eq("month", args.month)
          .eq("courseLegacyId", args.courseLegacyId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        storiesPublished: args.storiesPublished,
        storiesRead: args.storiesRead,
        activeUsersCount: args.activeUsersCount,
        activeStoriesCount: args.activeStoriesCount,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("monthly_stats", {
        year: args.year,
        month: args.month,
        courseLegacyId: args.courseLegacyId,
        storiesPublished: args.storiesPublished,
        storiesRead: args.storiesRead,
        activeUsersCount: args.activeUsersCount,
        activeStoriesCount: args.activeStoriesCount,
        activeUserIds: [], // Not tracking individual IDs during backfill
        activeStoryIds: [],
        lastUpdated: Date.now(),
      });
    }
  },
});

/**
 * Import global stats for a month (used during backfill)
 */
export const importGlobalStats = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    totalActiveUsers: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("monthly_stats_global")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("month", args.month)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalActiveUsers: args.totalActiveUsers,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("monthly_stats_global", {
        year: args.year,
        month: args.month,
        totalActiveUsers: args.totalActiveUsers,
        activeUserIds: [], // Not tracking individual IDs during backfill
        lastUpdated: Date.now(),
      });
    }
  },
});
