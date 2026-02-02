import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================
// Queries
// ============================================

/**
 * Get a story by ID
 */
export const get = query({
  args: { id: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a story with full details (course, languages, image)
 */
export const getWithDetails = query({
  args: { id: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.id);
    if (!story) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return { story, course: null, learningLanguage: null, fromLanguage: null, image: null };

    const [learningLanguage, fromLanguage, image] = await Promise.all([
      ctx.db.get(course.learningLanguageId),
      ctx.db.get(course.fromLanguageId),
      story.imageId ? ctx.db.get(story.imageId) : null,
    ]);

    return {
      story,
      course,
      learningLanguage,
      fromLanguage,
      image,
    };
  },
});

/**
 * Get all stories for a course
 */
export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();
  },
});

/**
 * Get all public stories for a course
 */
export const listPublicByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return stories.filter((s) => s.public === true && s.deleted !== true);
  },
});

/**
 * Get stories by set for a course
 */
export const listBySet = query({
  args: { courseId: v.id("courses"), setId: v.number() },
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_set", (q) =>
        q.eq("courseId", args.courseId).eq("set_id", args.setId)
      )
      .collect();

    return stories
      .filter((s) => s.deleted !== true)
      .sort((a, b) => (a.set_index ?? 0) - (b.set_index ?? 0));
  },
});

/**
 * Get a story by legacy PostgreSQL ID (for migration)
 */
export const getByLegacyId = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();
  },
});

/**
 * Get story approval count
 */
export const getApprovalCount = query({
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
 * Get story approvals with user details
 */
export const getApprovals = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    const approvalsWithUsers = await Promise.all(
      approvals.map(async (approval) => {
        const user = await ctx.db.get(approval.userId);
        return {
          ...approval,
          user,
        };
      })
    );

    return approvalsWithUsers;
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Create a new story
 * Creates both story metadata and content in separate tables
 */
export const create = mutation({
  args: {
    name: v.string(),
    courseId: v.id("courses"),
    duo_id: v.optional(v.string()),
    set_id: v.optional(v.number()),
    set_index: v.optional(v.number()),
    authorId: v.optional(v.id("users")),
    text: v.optional(v.string()),
    imageId: v.optional(v.id("images")),
    json: v.optional(v.any()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished"))
    ),
  },
  handler: async (ctx, args) => {
    const { text, json, ...storyData } = args;

    // Create story metadata
    const storyId = await ctx.db.insert("stories", {
      ...storyData,
      date: Date.now(),
      change_date: Date.now(),
      public: false,
      deleted: false,
      status: args.status ?? "draft",
    });

    // Create story content
    await ctx.db.insert("story_content", {
      storyId,
      text: text ?? "",
      json: json ?? null,
      lastUpdated: Date.now(),
    });

    return storyId;
  },
});

/**
 * Update a story
 * Updates both story metadata and content tables
 */
export const update = mutation({
  args: {
    id: v.id("stories"),
    name: v.optional(v.string()),
    text: v.optional(v.string()),
    json: v.optional(v.any()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished"))
    ),
    public: v.optional(v.boolean()),
    authorChangeId: v.optional(v.id("users")),
    imageId: v.optional(v.id("images")),
    set_id: v.optional(v.number()),
    set_index: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, text, json, ...metadataUpdates } = args;

    // Update story metadata
    await ctx.db.patch(id, {
      ...metadataUpdates,
      change_date: Date.now(),
    });

    // Update story content if text or json provided
    if (text !== undefined || json !== undefined) {
      const content = await ctx.db
        .query("story_content")
        .withIndex("by_story", (q) => q.eq("storyId", id))
        .first();

      const contentUpdates: any = { lastUpdated: Date.now() };
      if (text !== undefined) contentUpdates.text = text;
      if (json !== undefined) contentUpdates.json = json;

      if (content) {
        await ctx.db.patch(content._id, contentUpdates);
      } else {
        // Create content if it doesn't exist
        await ctx.db.insert("story_content", {
          storyId: id,
          text: text ?? "",
          json: json ?? null,
          lastUpdated: Date.now(),
        });
      }
    }

    return id;
  },
});

/**
 * Soft delete a story
 */
export const softDelete = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      deleted: true,
      public: false,
      change_date: Date.now(),
    });
  },
});

/**
 * Hard delete a story (also deletes completions, approvals, and content)
 */
export const hardDelete = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, args) => {
    // Delete story completions
    const completions = await ctx.db
      .query("story_completions")
      .withIndex("by_story", (q) => q.eq("storyId", args.id))
      .collect();
    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    // Delete story approvals
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", args.id))
      .collect();
    for (const approval of approvals) {
      await ctx.db.delete(approval._id);
    }

    // Delete story content
    const content = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", args.id))
      .first();
    if (content) {
      await ctx.db.delete(content._id);
    }

    // Delete the story
    await ctx.db.delete(args.id);
  },
});

/**
 * Publish a story (set public and date_published)
 */
export const publish = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, args) => {
    const publicationTime = Date.now();

    await ctx.db.patch(args.id, {
      public: true,
      date_published: publicationTime,
      status: "finished",
      change_date: publicationTime,
    });

    // Update pre-aggregated stats
    const story = await ctx.db.get(args.id);
    if (story) {
      const course = await ctx.db.get(story.courseId);
      if (course) {
        const date = new Date(publicationTime);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
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
      }
    }
  },
});

/**
 * Unpublish a story
 */
export const unpublish = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      public: false,
      change_date: Date.now(),
    });
  },
});

/**
 * Get a story for reading by legacy ID with full course/language details
 * This replaces the PostgreSQL query in getStory.ts
 * Loads content from story_content table
 */
export const getForReading = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (!story) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return null;

    const fromLanguage = await ctx.db.get(course.fromLanguageId);
    const learningLanguage = await ctx.db.get(course.learningLanguageId);

    if (!fromLanguage || !learningLanguage) return null;

    // Load story content from story_content table
    const content = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .first();

    return {
      id: story.legacyId ?? 0,
      convexId: story._id,
      course_id: course.legacyId ?? 0,
      courseConvexId: course._id,
      json: content?.json ?? null,
      name: story.name,
      imageId: story.imageId,

      from_language: fromLanguage.short,
      from_language_id: fromLanguage.legacyId ?? 0,
      from_language_long: fromLanguage.name,
      from_language_rtl: fromLanguage.rtl ?? false,
      from_language_name: story.name,

      learning_language: learningLanguage.short,
      learning_language_long: learningLanguage.name,
      learning_language_rtl: learningLanguage.rtl ?? false,

      course_short: learningLanguage.short + "-" + fromLanguage.short,
    };
  },
});

/**
 * Get public stories for a course grouped by sets with image data
 * Used by the course page to display story list
 */
export const getPublicStoriesByCourseShort = query({
  args: { courseShort: v.string() },
  handler: async (ctx, args) => {
    // Find the course by short name
    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.courseShort))
      .first();

    if (!course) return null;

    // Get all public stories for this course
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();

    const publicStories = stories.filter(
      (s) => s.public === true && s.deleted !== true
    );

    // Sort by set_id and set_index
    publicStories.sort((a, b) => {
      if ((a.set_id ?? 0) !== (b.set_id ?? 0)) {
        return (a.set_id ?? 0) - (b.set_id ?? 0);
      }
      return (a.set_index ?? 0) - (b.set_index ?? 0);
    });

    // Fetch all images in parallel
    const imageIds = new Set(
      publicStories.map((s) => s.imageId).filter(Boolean)
    );
    const images = await Promise.all(
      Array.from(imageIds).map((id) => ctx.db.get(id!))
    );
    const imageMap = new Map(images.filter(Boolean).map((img) => [img!._id, img]));

    // Group by set_id and add image data
    const result: Record<
      string,
      Array<{
        id: number;
        name: string;
        course_id: number;
        image: string;
        set_id: number;
        set_index: number;
        active: string;
        gilded: string;
        active_lip: string;
        gilded_lip: string;
      }>
    > = {};

    for (const story of publicStories) {
      const setId = String(story.set_id ?? 0);
      if (!result[setId]) {
        result[setId] = [];
      }

      const image = story.imageId ? imageMap.get(story.imageId) : null;

      result[setId].push({
        id: story.legacyId ?? 0,
        name: story.name,
        course_id: course.legacyId ?? 0,
        image: image?.legacyId ?? "",
        set_id: story.set_id ?? 0,
        set_index: story.set_index ?? 0,
        active: image?.active ?? "",
        gilded: image?.gilded ?? "",
        active_lip: image?.active_lip ?? "",
        gilded_lip: image?.gilded_lip ?? "",
      });
    }

    return result;
  },
});

/**
 * Get story metadata for SEO/OpenGraph
 */
export const getMetadata = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (!story) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return null;

    const fromLanguage = await ctx.db.get(course.fromLanguageId);
    const learningLanguage = await ctx.db.get(course.learningLanguageId);

    // Get image legacy ID if exists
    let imageLegacyId: string | undefined;
    if (story.imageId) {
      const image = await ctx.db.get(story.imageId);
      imageLegacyId = image?.legacyId;
    }

    return {
      from_language_name: story.name,
      from_language_long: fromLanguage?.name ?? "",
      learning_language_long: learningLanguage?.name ?? "",
      image: imageLegacyId,
    };
  },
});
