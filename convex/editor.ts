import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================
// Queries for Editor
// ============================================

/**
 * Get all languages for editor lookup
 */
export const getLanguageList = query({
  args: {},
  handler: async (ctx) => {
    const languages = await ctx.db.query("languages").collect();
    const lookUp: Record<string | number, {
      id: number;
      short: string;
      flag: number | null;
      flag_file: string | null;
    }> = {};

    for (const lang of languages) {
      const data = {
        id: lang.legacyId ?? 0,
        short: lang.short,
        flag: null,
        flag_file: lang.flag_file ?? null,
      };
      lookUp[lang.short] = data;
      lookUp[lang.legacyId ?? 0] = data;
    }

    return lookUp;
  },
});

/**
 * Get all courses for editor
 */
export const getCourseList = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const languages = await ctx.db.query("languages").collect();
    const langMap = new Map(languages.map((l) => [l._id, l]));

    return courses
      .map((c) => {
        const learningLang = langMap.get(c.learningLanguageId);
        const fromLang = langMap.get(c.fromLanguageId);
        return {
          id: c.legacyId ?? 0,
          short: c.short ?? null,
          about: c.about ?? null,
          official: c.official ?? false,
          count: c.count ?? 0,
          public: c.public ?? false,
          from_language: fromLang?.legacyId ?? 0,
          from_language_name: fromLang?.name ?? "",
          learning_language: learningLang?.legacyId ?? 0,
          learning_language_name: learningLang?.name ?? "",
          contributors: c.contributors ?? [],
          contributors_past: c.contributors_past ?? [],
          todo_count: c.todo_count ?? 0,
        };
      })
      .sort((a, b) => b.count - a.count);
  },
});

/**
 * Get a single course by ID or short name
 */
export const getCourse = query({
  args: { id: v.union(v.string(), v.number()) },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("courses").collect();
    const languages = await ctx.db.query("languages").collect();
    const langMap = new Map(languages.map((l) => [l._id, l]));

    for (const c of courses) {
      if (c.legacyId === args.id || c.short === args.id) {
        const learningLang = langMap.get(c.learningLanguageId);
        const fromLang = langMap.get(c.fromLanguageId);
        return {
          id: c.legacyId ?? 0,
          short: c.short ?? null,
          about: c.about ?? null,
          official: c.official ?? false,
          count: c.count ?? 0,
          public: c.public ?? false,
          from_language: fromLang?.legacyId ?? 0,
          from_language_name: fromLang?.name ?? "",
          learning_language: learningLang?.legacyId ?? 0,
          learning_language_name: learningLang?.name ?? "",
          contributors: c.contributors ?? [],
          contributors_past: c.contributors_past ?? [],
          todo_count: c.todo_count ?? 0,
        };
      }
    }
    return null;
  },
});

/**
 * Get stories for editor grouped by course
 * DEPRECATED: Use getStoriesForCourseEditor instead to avoid loading all data
 * This query is kept for backward compatibility but should not be used
 */
export const getStoryList = query({
  args: {},
  handler: async (ctx) => {
    // This query loads too much data and will fail with "Too many bytes read" error
    // Use getStoriesForCourseEditor with a specific course ID instead
    throw new Error(
      "getStoryList is deprecated due to memory limits. Use getStoriesForCourseEditor per course instead."
    );
  },
});

/**
 * Get stories for a specific course in the editor
 * Optimized to only load metadata (no content) - fast even for 1000+ stories!
 * Content (text/json) is loaded separately only when editing a specific story
 */
export const getStoriesForCourseEditor = query({
  args: {
    courseLegacyId: v.number(),
  },
  handler: async (ctx, args) => {
    // Find course by legacy ID
    const course = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.courseLegacyId))
      .first();

    if (!course) return [];

    // Get ALL stories for this course - now fast because no text/json fields!
    // Each story is ~1KB instead of ~150KB
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();

    // Collect unique user IDs from these stories only
    const userIds = new Set<string>();
    for (const story of stories) {
      if (story.authorId) userIds.add(story.authorId);
      if (story.authorChangeId) userIds.add(story.authorChangeId);
    }

    // Load only the users who authored these stories
    const users = await Promise.all(
      Array.from(userIds).map((id) => ctx.db.get(id as Id<"users">))
    );
    const userMap = new Map(
      users.filter((u): u is NonNullable<typeof u> => u !== null).map((u) => [u._id, u])
    );

    // Get approvals only for these specific stories
    const approvalsByStory = new Map<string, number[]>();
    for (const story of stories) {
      const storyApprovals = await ctx.db
        .query("story_approvals")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect();

      if (storyApprovals.length > 0) {
        const approvalUserIds: number[] = [];
        for (const approval of storyApprovals) {
          const user = userMap.get(approval.userId);
          if (user?.legacyId) {
            approvalUserIds.push(user.legacyId);
          }
        }
        if (approvalUserIds.length > 0) {
          approvalsByStory.set(story._id, approvalUserIds);
        }
      }
    }

    // Collect unique image IDs from these stories only
    const imageIds = new Set<Id<"images">>();
    for (const story of stories) {
      if (story.imageId) imageIds.add(story.imageId);
    }

    // Load only the images for these stories
    const images = await Promise.all(
      Array.from(imageIds).map((id) => ctx.db.get(id))
    );
    const imageMap = new Map(
      images.filter((i): i is NonNullable<typeof i> => i !== null).map((i) => [i._id, i])
    );

    // Build the story list with metadata
    const storyList = stories.map((story) => {
      const author = story.authorId ? userMap.get(story.authorId) : null;
      const authorChange = story.authorChangeId ? userMap.get(story.authorChangeId) : null;
      const image = story.imageId ? imageMap.get(story.imageId) : null;
      const storyApprovals = approvalsByStory.get(story._id) ?? [];

      return {
        id: story.legacyId ?? 0,
        name: story.name,
        course_id: args.courseLegacyId,
        image: image?.legacyId ?? "",
        set_id: story.set_id ?? 0,
        set_index: story.set_index ?? 0,
        date: story.date ?? 0,
        change_date: story.change_date ?? 0,
        status: story.status ?? "draft",
        public: story.public ?? false,
        todo_count: story.todo_count ?? 0,
        approvals: storyApprovals.length > 0 ? storyApprovals : null,
        author: author?.name ?? "",
        author_change: authorChange?.name ?? null,
      };
    });

    // Sort by set_id and set_index
    storyList.sort((a, b) => {
      if (a.set_id !== b.set_id) return a.set_id - b.set_id;
      return a.set_index - b.set_index;
    });

    return storyList;
  },
});

/**
 * Get stories for a specific course
 * DEPRECATED: Use getStoriesForCourseEditor instead
 * The old implementation loaded ALL users/approvals/images which caused memory issues
 */
export const getStoriesForCourse = query({
  args: { courseLegacyId: v.number() },
  handler: async (ctx, args) => {
    throw new Error(
      "getStoriesForCourse is deprecated. Use getStoriesForCourseEditor instead for better performance."
    );
  },
});

/**
 * Get story data for the editor
 * Loads content from story_content table
 */
export const getStoryForEditor = query({
  args: { storyLegacyId: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
      .first();

    if (!story) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return null;

    const learningLang = await ctx.db.get(course.learningLanguageId);
    const fromLang = await ctx.db.get(course.fromLanguageId);

    // Load content from story_content table
    const content = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .first();

    return {
      id: story.legacyId ?? 0,
      official: course.official ?? false,
      course_id: course.legacyId ?? 0,
      duo_id: story.duo_id ?? "",
      image: story.imageId ? (await ctx.db.get(story.imageId))?.legacyId ?? "" : "",
      name: story.name,
      set_id: story.set_id ?? 0,
      set_index: story.set_index ?? 0,
      text: content?.text ?? "",
      short: course.short,
      learning_language: learningLang?.legacyId ?? 0,
      from_language: fromLang?.legacyId ?? 0,
    };
  },
});

/**
 * Get avatar names for a language
 */
export const getAvatarNames = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    // Find language by legacy ID
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) return {};

    // Get all avatars
    const avatars = await ctx.db.query("avatars").collect();

    // Get avatar mappings for this language
    const mappings = await ctx.db
      .query("avatar_mappings")
      .withIndex("by_language", (q) => q.eq("languageId", language._id))
      .collect();

    const mappingByAvatar = new Map(mappings.map((m) => [m.avatarId, m]));

    // Return array instead of object to avoid Convex's 1024 field limit
    const result: Array<{
      id: number;
      avatar_id: number;
      language_id: number;
      name: string;
      link: string;
      speaker: string;
    }> = [];

    for (const avatar of avatars) {
      const mapping = mappingByAvatar.get(avatar._id);
      result.push({
        id: mapping ? 0 : 0, // mapping ID not needed
        avatar_id: avatar.legacyId ?? 0,
        language_id: args.languageLegacyId,
        name: mapping?.name ?? avatar.name ?? "",
        link: avatar.link ?? "",
        speaker: mapping?.speaker ?? "",
      });
    }

    return result;
  },
});

/**
 * Get import list - stories from one course that can be imported to another
 */
export const getCourseImport = query({
  args: { courseLegacyId: v.number(), fromCourseLegacyId: v.number() },
  handler: async (ctx, args) => {
    // Find both courses
    const targetCourse = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.courseLegacyId))
      .first();

    const sourceCourse = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.fromCourseLegacyId))
      .first();

    if (!targetCourse || !sourceCourse) return [];

    // Get stories from source course
    const sourceStories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", sourceCourse._id))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();

    // Get stories from target course to check for copies
    const targetStories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", targetCourse._id))
      .collect();

    const targetDuoIds = new Set(targetStories.map((s) => s.duo_id).filter(Boolean));

    // Get images
    const images = await ctx.db.query("images").collect();
    const imageMap = new Map(images.map((i) => [i._id, i]));

    return sourceStories
      .map((story) => {
        const image = story.imageId ? imageMap.get(story.imageId) : null;
        const copies = story.duo_id && targetDuoIds.has(story.duo_id) ? 1 : 0;

        return {
          id: story.legacyId ?? 0,
          set_id: story.set_id ?? 0,
          set_index: story.set_index ?? 0,
          name: story.name,
          image_done: image?.gilded ?? "",
          image: image?.active ?? "",
          copies: String(copies),
        };
      })
      .sort((a, b) => {
        if (a.set_id !== b.set_id) return a.set_id - b.set_id;
        return a.set_index - b.set_index;
      });
  },
});

// ============================================
// Mutations for Editor
// ============================================

/**
 * Update a story (save from editor)
 */
export const updateStory = mutation({
  args: {
    storyLegacyId: v.optional(v.number()),
    duo_id: v.string(),
    name: v.string(),
    image: v.string(),
    set_id: v.number(),
    set_index: v.number(),
    courseLegacyId: v.number(),
    text: v.string(),
    json: v.any(),
    todo_count: v.number(),
    userLegacyId: v.number(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
      .first();

    // Find course
    const course = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.courseLegacyId))
      .first();

    if (!course) {
      throw new Error(`Course with legacy ID ${args.courseLegacyId} not found`);
    }

    // Find image by legacy ID
    let imageId: Id<"images"> | undefined;
    if (args.image) {
      const image = await ctx.db
        .query("images")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.image))
        .first();
      imageId = image?._id;
    }

    // Find or create story
    let story;
    if (args.storyLegacyId) {
      story = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
        .first();
    }

    if (!story) {
      // Try to find by duo_id and course
      story = await ctx.db
        .query("stories")
        .withIndex("by_duo_id_course", (q) =>
          q.eq("duo_id", args.duo_id).eq("courseId", course._id)
        )
        .first();
    }

    if (!story) {
      throw new Error("Story not found");
    }

    // Update the story metadata
    await ctx.db.patch(story._id, {
      duo_id: args.duo_id,
      name: args.name,
      imageId,
      set_id: args.set_id,
      set_index: args.set_index,
      todo_count: args.todo_count,
      change_date: Date.now(),
      authorChangeId: user?._id,
    });

    // Update story content in separate table
    const existingContent = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .first();

    if (existingContent) {
      await ctx.db.patch(existingContent._id, {
        text: args.text,
        json: args.json,
        lastUpdated: Date.now(),
      });
    } else {
      // Create content if it doesn't exist
      await ctx.db.insert("story_content", {
        storyId: story._id,
        text: args.text,
        json: args.json,
        lastUpdated: Date.now(),
      });
    }

    // Update course todo_count
    const courseStories = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();

    const totalTodoCount = courseStories.reduce(
      (sum, s) => sum + (s.todo_count ?? 0),
      0
    );

    await ctx.db.patch(course._id, { todo_count: totalTodoCount });

    return { success: true, storyId: story.legacyId };
  },
});

/**
 * Soft delete a story
 */
export const deleteStory = mutation({
  args: { storyLegacyId: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
      .first();

    if (!story) {
      throw new Error(`Story with legacy ID ${args.storyLegacyId} not found`);
    }

    await ctx.db.patch(story._id, {
      deleted: true,
      public: false,
      change_date: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Toggle approval for a story
 */
export const toggleApproval = mutation({
  args: {
    storyLegacyId: v.number(),
    userLegacyId: v.number(),
  },
  handler: async (ctx, args) => {
    // Find story
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
      .first();

    if (!story) {
      throw new Error(`Story with legacy ID ${args.storyLegacyId} not found`);
    }

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
      .first();

    if (!user) {
      throw new Error(`User with legacy ID ${args.userLegacyId} not found`);
    }

    // Check if approval exists
    const existing = await ctx.db
      .query("story_approvals")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", user._id).eq("storyId", story._id)
      )
      .first();

    let action: "added" | "deleted";
    if (existing) {
      await ctx.db.delete(existing._id);
      action = "deleted";
    } else {
      await ctx.db.insert("story_approvals", {
        storyId: story._id,
        userId: user._id,
        date: Date.now(),
      });
      action = "added";
    }

    // Count approvals
    const approvals = await ctx.db
      .query("story_approvals")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();

    const count = approvals.length;

    // Update story status based on approval count
    let status: "draft" | "feedback" | "finished" = "draft";
    if (count === 1) status = "feedback";
    if (count >= 2) status = "finished";

    await ctx.db.patch(story._id, { status });

    // Check if set should be published (4+ finished stories)
    const setStories = await ctx.db
      .query("stories")
      .withIndex("by_set", (q) =>
        q.eq("courseId", story.courseId).eq("set_id", story.set_id ?? 0)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "finished"),
          q.neq(q.field("deleted"), true)
        )
      )
      .collect();

    const published: number[] = [];
    if (setStories.length >= 4) {
      const publicationTime = Date.now();
      for (const s of setStories) {
        if (!s.public) {
          await ctx.db.patch(s._id, {
            public: true,
            date_published: publicationTime,
          });
          if (s.legacyId) published.push(s.legacyId);

          // Update stats for publication
          const course = await ctx.db.get(s.courseId);
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
      }

      // Update course count
      if (published.length > 0) {
        const course = await ctx.db.get(story.courseId);
        if (course) {
          const publicStories = await ctx.db
            .query("stories")
            .withIndex("by_course", (q) => q.eq("courseId", story.courseId))
            .filter((q) =>
              q.and(
                q.eq(q.field("public"), true),
                q.neq(q.field("deleted"), true)
              )
            )
            .collect();

          await ctx.db.patch(course._id, { count: publicStories.length });
        }
      }
    }

    return {
      count,
      story_status: status,
      finished_in_set: setStories.length,
      action,
      published,
    };
  },
});

/**
 * Import a story from another course
 */
export const importStory = mutation({
  args: {
    sourceStoryLegacyId: v.number(),
    targetCourseLegacyId: v.number(),
    userLegacyId: v.number(),
  },
  handler: async (ctx, args) => {
    // Find source story
    const sourceStory = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.sourceStoryLegacyId))
      .first();

    if (!sourceStory) {
      throw new Error(`Source story with legacy ID ${args.sourceStoryLegacyId} not found`);
    }

    // Find target course
    const targetCourse = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.targetCourseLegacyId))
      .first();

    if (!targetCourse) {
      throw new Error(`Target course with legacy ID ${args.targetCourseLegacyId} not found`);
    }

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
      .first();

    // Check if story already exists in target course
    const existing = await ctx.db
      .query("stories")
      .withIndex("by_duo_id_course", (q) =>
        q.eq("duo_id", sourceStory.duo_id ?? "").eq("courseId", targetCourse._id)
      )
      .first();

    if (existing) {
      return { success: false, error: "Story already exists in target course", newLegacyId: 0 };
    }

    // Generate a new legacy ID (find max + 1)
    const allStories = await ctx.db.query("stories").collect();
    const maxLegacyId = allStories.reduce(
      (max, s) => Math.max(max, s.legacyId ?? 0),
      0
    );
    const newLegacyId = maxLegacyId + 1;

    // Get source story content
    const sourceContent = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", sourceStory._id))
      .first();

    // Create new story metadata
    const newStoryId = await ctx.db.insert("stories", {
      legacyId: newLegacyId,
      duo_id: sourceStory.duo_id,
      name: sourceStory.name,
      set_id: sourceStory.set_id,
      set_index: sourceStory.set_index,
      courseId: targetCourse._id,
      imageId: sourceStory.imageId,
      status: "draft",
      public: false,
      deleted: false,
      date: Date.now(),
      change_date: Date.now(),
      authorId: user?._id,
    });

    // Create story content
    await ctx.db.insert("story_content", {
      storyId: newStoryId,
      text: sourceContent?.text ?? "",
      json: sourceContent?.json ?? null,
      lastUpdated: Date.now(),
    });

    return { success: true, newStoryId, newLegacyId };
  },
});

/**
 * Get image by legacy ID
 */
export const getImage = query({
  args: { imageLegacyId: v.string() },
  handler: async (ctx, args) => {
    const image = await ctx.db
      .query("images")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.imageLegacyId))
      .first();

    if (!image) return null;

    return {
      id: image.legacyId ?? "",
      active: image.active ?? "",
      gilded: image.gilded ?? "",
      locked: image.locked ?? "",
      active_lip: image.active_lip ?? "",
      gilded_lip: image.gilded_lip ?? "",
    };
  },
});

/**
 * Get language by legacy ID
 */
export const getLanguage = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) return null;

    return {
      id: language.legacyId ?? 0,
      name: language.name,
      short: language.short,
      flag: null, // Let Flag component compute from short/iso code
      flag_file: language.flag_file ?? null,
      speaker: language.speaker ?? null,
      default_text: language.default_text ?? null,
      tts_replace: language.tts_replace ?? null,
      public: language.public ?? false,
      rtl: language.rtl ?? false,
    };
  },
});

/**
 * Get language by ID or short code, optionally with course data
 */
export const getLanguageWithCourse = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const isNumeric = /^\d+$/.test(args.id);

    if (isNumeric) {
      // Look up by legacy ID
      const language = await ctx.db
        .query("languages")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", parseInt(args.id)))
        .first();

      if (!language) return null;

      return {
        language: {
          id: language.legacyId ?? 0,
          name: language.name,
          short: language.short,
          flag: 0,
          flag_file: language.flag_file ?? null,
          speaker: language.speaker ?? null,
          default_text: language.default_text ?? "",
          tts_replace: language.tts_replace ?? null,
          public: language.public ?? false,
          rtl: language.rtl ?? false,
        },
        course: null,
        fromLanguage: null,
      };
    }

    // Check if it's a course short code
    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.id))
      .first();

    if (course) {
      const learningLang = await ctx.db.get(course.learningLanguageId);
      const fromLang = await ctx.db.get(course.fromLanguageId);

      if (!learningLang) return null;

      return {
        language: {
          id: learningLang.legacyId ?? 0,
          name: learningLang.name,
          short: learningLang.short,
          flag: 0,
          flag_file: learningLang.flag_file ?? null,
          speaker: learningLang.speaker ?? null,
          default_text: learningLang.default_text ?? "",
          tts_replace: learningLang.tts_replace ?? null,
          public: learningLang.public ?? false,
          rtl: learningLang.rtl ?? false,
        },
        course: {
          learning_language: learningLang.legacyId ?? 0,
          from_language: fromLang?.legacyId ?? 0,
          short: course.short,
        },
        fromLanguage: fromLang ? {
          id: fromLang.legacyId ?? 0,
          name: fromLang.name,
          short: fromLang.short,
          flag: 0,
          flag_file: fromLang.flag_file ?? null,
          speaker: fromLang.speaker ?? null,
          default_text: fromLang.default_text ?? "",
          tts_replace: fromLang.tts_replace ?? null,
          public: fromLang.public ?? false,
          rtl: fromLang.rtl ?? false,
        } : null,
      };
    }

    // Look up by short code
    const language = await ctx.db
      .query("languages")
      .withIndex("by_short", (q) => q.eq("short", args.id))
      .first();

    if (!language) return null;

    return {
      language: {
        id: language.legacyId ?? 0,
        name: language.name,
        short: language.short,
        flag: 0,
        flag_file: language.flag_file ?? null,
        speaker: language.speaker ?? null,
        default_text: language.default_text ?? "",
        tts_replace: language.tts_replace ?? null,
        public: language.public ?? false,
        rtl: language.rtl ?? false,
      },
      course: null,
      fromLanguage: null,
    };
  },
});

/**
 * Get speakers for a language
 */
export const getSpeakers = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    // Find language by legacy ID
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) return [];

    const speakers = await ctx.db
      .query("speakers")
      .withIndex("by_language", (q) => q.eq("languageId", language._id))
      .collect();

    return speakers.map((s) => ({
      id: s.legacyId ?? 0,
      language_id: args.languageLegacyId,
      speaker: s.speaker,
      gender: s.gender ?? "MALE",
      type: s.type ?? "NORMAL",
      service: s.service ?? "",
    }));
  },
});

/**
 * Get avatar names for language editor (includes all avatars with language-specific overrides)
 */
export const getAvatarNamesForEditor = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    // Find language by legacy ID
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) return [];

    // Get all avatars (excluding invalid ones)
    const avatars = await ctx.db.query("avatars").collect();
    const validAvatars = avatars.filter((a) => a.link !== "[object Object]");

    // Get avatar mappings for this language
    const mappings = await ctx.db
      .query("avatar_mappings")
      .withIndex("by_language", (q) => q.eq("languageId", language._id))
      .collect();

    const mappingByAvatar = new Map(mappings.map((m) => [m.avatarId, m]));

    return validAvatars.map((avatar) => {
      const mapping = mappingByAvatar.get(avatar._id);
      return {
        id: mapping ? 1 : null, // Just indicate if mapping exists
        avatar_id: avatar.legacyId ?? 0,
        language_id: mapping ? args.languageLegacyId : null,
        name: mapping?.name ?? avatar.name ?? null,
        link: avatar.link ?? "",
        speaker: mapping?.speaker ?? null,
      };
    }).sort((a, b) => a.avatar_id - b.avatar_id);
  },
});

/**
 * Update language TTS replace setting
 */
export const updateLanguageTtsReplace = mutation({
  args: {
    languageLegacyId: v.number(),
    tts_replace: v.string(),
  },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) {
      throw new Error(`Language with legacy ID ${args.languageLegacyId} not found`);
    }

    await ctx.db.patch(language._id, { tts_replace: args.tts_replace });

    return { success: true };
  },
});

/**
 * Update language default text setting
 */
export const updateLanguageDefaultText = mutation({
  args: {
    languageLegacyId: v.number(),
    default_text: v.string(),
  },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) {
      throw new Error(`Language with legacy ID ${args.languageLegacyId} not found`);
    }

    await ctx.db.patch(language._id, { default_text: args.default_text });

    return { success: true };
  },
});

/**
 * Set avatar speaker (upsert avatar mapping)
 */
export const setAvatarSpeaker = mutation({
  args: {
    avatarLegacyId: v.number(),
    languageLegacyId: v.number(),
    name: v.string(),
    speaker: v.string(),
  },
  handler: async (ctx, args) => {
    // Find avatar by legacy ID
    const avatar = await ctx.db
      .query("avatars")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.avatarLegacyId))
      .first();

    if (!avatar) {
      throw new Error(`Avatar with legacy ID ${args.avatarLegacyId} not found`);
    }

    // Find language by legacy ID
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) {
      throw new Error(`Language with legacy ID ${args.languageLegacyId} not found`);
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("avatar_mappings")
      .withIndex("by_avatar_language", (q) =>
        q.eq("avatarId", avatar._id).eq("languageId", language._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        speaker: args.speaker,
      });
      return { success: true, id: existing._id };
    }

    const newId = await ctx.db.insert("avatar_mappings", {
      avatarId: avatar._id,
      languageId: language._id,
      name: args.name,
      speaker: args.speaker,
    });

    return { success: true, id: newId };
  },
});

/**
 * Get localizations for a language with English fallback
 */
export const getLocalizations = query({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    // Find English language (legacy ID 1)
    const englishLang = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", 1))
      .first();

    // Find target language
    const targetLang = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    // Get English localizations as base
    const englishLocalizations = englishLang
      ? await ctx.db
          .query("localizations")
          .withIndex("by_language", (q) => q.eq("languageId", englishLang._id))
          .collect()
      : [];

    // Get target language localizations
    const targetLocalizations = targetLang
      ? await ctx.db
          .query("localizations")
          .withIndex("by_language", (q) => q.eq("languageId", targetLang._id))
          .collect()
      : [];

    const targetByTag = new Map(targetLocalizations.map((l) => [l.tag, l.text]));

    return englishLocalizations.map((l) => ({
      tag: l.tag,
      text_en: l.text,
      text: targetByTag.get(l.tag) ?? null,
    }));
  },
});

/**
 * Set/update a localization
 */
export const setLocalization = mutation({
  args: {
    languageLegacyId: v.number(),
    tag: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Find language
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) {
      throw new Error(`Language with legacy ID ${args.languageLegacyId} not found`);
    }

    // Check if localization exists
    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language_tag", (q) =>
        q.eq("languageId", language._id).eq("tag", args.tag)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { text: args.text });
      return { success: true, id: existing._id };
    }

    const newId = await ctx.db.insert("localizations", {
      languageId: language._id,
      tag: args.tag,
      text: args.text,
    });

    return { success: true, id: newId };
  },
});
