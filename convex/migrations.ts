/**
 * Migration mutations for importing data from PostgreSQL
 * These are internal mutations used only during migration
 */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Languages
// ============================================

export const importLanguage = mutation({
  args: {
    legacyId: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.optional(v.number()),
    flag_file: v.optional(v.string()),
    speaker: v.optional(v.string()),
    default_text: v.optional(v.string()),
    tts_replace: v.optional(v.string()),
    public: v.optional(v.boolean()),
    rtl: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if already imported
    const existing = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        name: args.name,
        short: args.short,
        flag: args.flag?.toString(),
        flag_file: args.flag_file ?? undefined,
        speaker: args.speaker ?? undefined,
        default_text: args.default_text ?? undefined,
        tts_replace: args.tts_replace ?? undefined,
        public: args.public ?? false,
        rtl: args.rtl ?? false,
      });
      return { id: existing._id, action: "updated" };
    }

    // Insert new record
    const id = await ctx.db.insert("languages", {
      legacyId: args.legacyId,
      name: args.name,
      short: args.short,
      flag: args.flag?.toString(),
      flag_file: args.flag_file ?? undefined,
      speaker: args.speaker ?? undefined,
      default_text: args.default_text ?? undefined,
      tts_replace: args.tts_replace ?? undefined,
      public: args.public ?? false,
      rtl: args.rtl ?? false,
    });

    return { id, action: "inserted" };
  },
});

// ============================================
// Images
// ============================================

export const importImage = mutation({
  args: {
    legacyId: v.string(), // image IDs are varchar in PostgreSQL
    active: v.optional(v.string()),
    gilded: v.optional(v.string()),
    locked: v.optional(v.string()),
    active_lip: v.optional(v.string()),
    gilded_lip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already imported
    const existing = await ctx.db
      .query("images")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        active: args.active,
        gilded: args.gilded,
        locked: args.locked,
        active_lip: args.active_lip,
        gilded_lip: args.gilded_lip,
      });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("images", {
      legacyId: args.legacyId,
      active: args.active,
      gilded: args.gilded,
      locked: args.locked,
      active_lip: args.active_lip,
      gilded_lip: args.gilded_lip,
    });

    return { id, action: "inserted" };
  },
});

// ============================================
// Avatars
// ============================================

export const importAvatar = mutation({
  args: {
    legacyId: v.number(),
    link: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("avatars")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        link: args.link,
        name: args.name,
      });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("avatars", {
      legacyId: args.legacyId,
      link: args.link,
      name: args.name,
    });

    return { id, action: "inserted" };
  },
});

// ============================================
// Speakers
// ============================================

export const importSpeaker = mutation({
  args: {
    legacyId: v.number(),
    languageLegacyId: v.number(),
    speaker: v.string(),
    gender: v.optional(v.union(v.literal("MALE"), v.literal("FEMALE"))),
    type: v.optional(v.union(v.literal("NORMAL"), v.literal("NEURAL"))),
    service: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Look up the language by legacy ID
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) {
      throw new Error(
        `Language with legacy ID ${args.languageLegacyId} not found. Import languages first.`,
      );
    }

    const existing = await ctx.db
      .query("speakers")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        languageId: language._id,
        speaker: args.speaker,
        gender: args.gender,
        type: args.type,
        service: args.service,
      });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("speakers", {
      legacyId: args.legacyId,
      languageId: language._id,
      speaker: args.speaker,
      gender: args.gender,
      type: args.type,
      service: args.service,
    });

    return { id, action: "inserted" };
  },
});

// ============================================
// Courses
// ============================================

export const importCourse = mutation({
  args: {
    legacyId: v.number(),
    short: v.string(),
    learningLanguageLegacyId: v.number(),
    fromLanguageLegacyId: v.number(),
    public: v.optional(v.boolean()),
    official: v.optional(v.boolean()),
    name: v.optional(v.string()),
    about: v.optional(v.string()),
    conlang: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    count: v.optional(v.number()),
    learning_language_name: v.optional(v.string()),
    from_language_name: v.optional(v.string()),
    contributors: v.optional(v.array(v.string())),
    contributors_past: v.optional(v.array(v.string())),
    todo_count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Look up languages by legacy IDs
    const learningLanguage = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) =>
        q.eq("legacyId", args.learningLanguageLegacyId),
      )
      .first();

    const fromLanguage = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) =>
        q.eq("legacyId", args.fromLanguageLegacyId),
      )
      .first();

    if (!learningLanguage || !fromLanguage) {
      throw new Error(
        `Languages not found. Learning: ${args.learningLanguageLegacyId}, From: ${args.fromLanguageLegacyId}`,
      );
    }

    const existing = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    const courseData = {
      short: args.short,
      learningLanguageId: learningLanguage._id,
      fromLanguageId: fromLanguage._id,
      public: args.public ?? false,
      official: args.official ?? false,
      name: args.name,
      about: args.about,
      conlang: args.conlang ?? false,
      tags: args.tags,
      count: args.count,
      learning_language_name: args.learning_language_name,
      from_language_name: args.from_language_name,
      contributors: args.contributors ?? [],
      contributors_past: args.contributors_past ?? [],
      todo_count: args.todo_count ?? 0,
    };

    if (existing) {
      await ctx.db.patch(existing._id, courseData);
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("courses", {
      ...courseData,
      legacyId: args.legacyId,
    });

    return { id, action: "inserted" };
  },
});

// ============================================
// Localizations
// ============================================

export const importLocalization = mutation({
  args: {
    languageLegacyId: v.number(),
    tag: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.languageLegacyId))
      .first();

    if (!language) {
      throw new Error(
        `Language with legacy ID ${args.languageLegacyId} not found.`,
      );
    }

    const existing = await ctx.db
      .query("localizations")
      .withIndex("by_language_tag", (q) =>
        q.eq("languageId", language._id).eq("tag", args.tag),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { text: args.text });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("localizations", {
      languageId: language._id,
      tag: args.tag,
      text: args.text,
    });

    return { id, action: "inserted" };
  },
});

// ============================================
// Query helpers for migration verification
// ============================================

export const getMigrationStats = query({
  args: {},
  handler: async (ctx) => {
    const languages = await ctx.db.query("languages").collect();
    const images = await ctx.db.query("images").collect();
    const avatars = await ctx.db.query("avatars").collect();
    const speakers = await ctx.db.query("speakers").collect();
    const courses = await ctx.db.query("courses").collect();
    const localizations = await ctx.db.query("localizations").collect();

    return {
      languages: languages.length,
      images: images.length,
      avatars: avatars.length,
      speakers: speakers.length,
      courses: courses.length,
      localizations: localizations.length,
    };
  },
});

export const getLanguageIdMap = query({
  args: {},
  handler: async (ctx) => {
    const languages = await ctx.db.query("languages").collect();
    return languages.map((l) => ({ legacyId: l.legacyId, convexId: l._id }));
  },
});

// ============================================
// Users
// ============================================

export const importUser = mutation({
  args: {
    legacyId: v.number(),
    name: v.optional(v.string()),
    email: v.string(),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string()),
    password: v.optional(v.string()),
    regdate: v.optional(v.number()),
    role: v.optional(v.boolean()),
    admin: v.optional(v.boolean()),
    activated: v.optional(v.boolean()),
    activation_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    const userData = {
      name: args.name,
      email: args.email,
      emailVerified: args.emailVerified,
      image: args.image,
      password: args.password,
      regdate: args.regdate,
      role: args.role ?? false,
      admin: args.admin ?? false,
      activated: args.activated ?? false,
      activation_link: args.activation_link,
    };

    if (existing) {
      await ctx.db.patch(existing._id, userData);
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("users", {
      ...userData,
      legacyId: args.legacyId,
    });

    return { id, action: "inserted" };
  },
});

const userSchema = v.object({
  legacyId: v.number(),
  name: v.optional(v.string()),
  email: v.string(),
  emailVerified: v.optional(v.number()),
  image: v.optional(v.string()),
  password: v.optional(v.string()),
  regdate: v.optional(v.number()),
  role: v.optional(v.boolean()),
  admin: v.optional(v.boolean()),
  activated: v.optional(v.boolean()),
  activation_link: v.optional(v.string()),
});

export const importUsersBatch = mutation({
  args: { users: v.array(userSchema) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const user of args.users) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", user.legacyId))
        .first();

      const userData = {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        password: user.password,
        regdate: user.regdate,
        role: user.role ?? false,
        admin: user.admin ?? false,
        activated: user.activated ?? false,
        activation_link: user.activation_link,
      };

      if (existing) {
        await ctx.db.patch(existing._id, userData);
        updated++;
      } else {
        await ctx.db.insert("users", { ...userData, legacyId: user.legacyId });
        inserted++;
      }
    }

    return { inserted, updated };
  },
});

// ============================================
// Stories
// ============================================

export const importStory = mutation({
  args: {
    legacyId: v.number(),
    duo_id: v.optional(v.string()),
    name: v.string(),
    set_id: v.optional(v.number()),
    set_index: v.optional(v.number()),
    authorLegacyId: v.optional(v.number()),
    authorChangeLegacyId: v.optional(v.number()),
    date: v.optional(v.number()),
    change_date: v.optional(v.number()),
    date_published: v.optional(v.number()),
    text: v.optional(v.string()),
    public: v.optional(v.boolean()),
    imageLegacyId: v.optional(v.string()),
    courseLegacyId: v.number(),
    json: v.optional(v.any()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
    ),
    deleted: v.optional(v.boolean()),
    todo_count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Look up course by legacy ID
    const course = await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.courseLegacyId))
      .first();

    if (!course) {
      throw new Error(
        `Course with legacy ID ${args.courseLegacyId} not found.`,
      );
    }

    // Look up author if provided
    let authorId = undefined;
    if (args.authorLegacyId) {
      const author = await ctx.db
        .query("users")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.authorLegacyId))
        .first();
      authorId = author?._id;
    }

    // Look up author_change if provided
    let authorChangeId = undefined;
    if (args.authorChangeLegacyId) {
      const authorChange = await ctx.db
        .query("users")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", args.authorChangeLegacyId),
        )
        .first();
      authorChangeId = authorChange?._id;
    }

    // Look up image if provided
    let imageId = undefined;
    if (args.imageLegacyId) {
      const image = await ctx.db
        .query("images")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.imageLegacyId))
        .first();
      imageId = image?._id;
    }

    const existing = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();

    const storyData = {
      duo_id: args.duo_id,
      name: args.name,
      set_id: args.set_id,
      set_index: args.set_index,
      authorId,
      authorChangeId,
      date: args.date,
      change_date: args.change_date,
      date_published: args.date_published,
      text: args.text,
      public: args.public ?? false,
      imageId,
      courseId: course._id,
      json: args.json,
      status: args.status ?? "draft",
      deleted: args.deleted ?? false,
      todo_count: args.todo_count ?? 0,
    };

    if (existing) {
      await ctx.db.patch(existing._id, storyData);
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("stories", {
      ...storyData,
      legacyId: args.legacyId,
    });

    return { id, action: "inserted" };
  },
});

const storySchema = v.object({
  legacyId: v.number(),
  duo_id: v.optional(v.string()),
  name: v.string(),
  set_id: v.optional(v.number()),
  set_index: v.optional(v.number()),
  authorLegacyId: v.optional(v.number()),
  authorChangeLegacyId: v.optional(v.number()),
  date: v.optional(v.number()),
  change_date: v.optional(v.number()),
  date_published: v.optional(v.number()),
  text: v.optional(v.string()),
  public: v.optional(v.boolean()),
  imageLegacyId: v.optional(v.string()),
  courseLegacyId: v.number(),
  json: v.optional(v.any()),
  status: v.optional(
    v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
  ),
  deleted: v.optional(v.boolean()),
  todo_count: v.optional(v.number()),
});

export const importStoriesBatch = mutation({
  args: { stories: v.array(storySchema) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    // Pre-fetch courses and images (small tables)
    const courses = await ctx.db.query("courses").collect();
    const courseMap = new Map(courses.map((c) => [c.legacyId, c._id]));

    const images = await ctx.db.query("images").collect();
    const imageMap = new Map(images.map((i) => [i.legacyId, i._id]));

    for (const story of args.stories) {
      const courseId = courseMap.get(story.courseLegacyId);
      if (!courseId) {
        failed++;
        continue;
      }

      // Look up users by legacy ID (per item to avoid memory issues)
      let authorId = undefined;
      if (story.authorLegacyId) {
        const author = await ctx.db
          .query("users")
          .withIndex("by_legacy_id", (q) =>
            q.eq("legacyId", story.authorLegacyId),
          )
          .first();
        authorId = author?._id;
      }

      let authorChangeId = undefined;
      if (story.authorChangeLegacyId) {
        const authorChange = await ctx.db
          .query("users")
          .withIndex("by_legacy_id", (q) =>
            q.eq("legacyId", story.authorChangeLegacyId),
          )
          .first();
        authorChangeId = authorChange?._id;
      }

      const imageId = story.imageLegacyId
        ? imageMap.get(story.imageLegacyId)
        : undefined;

      const existing = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", story.legacyId))
        .first();

      const storyData = {
        duo_id: story.duo_id,
        name: story.name,
        set_id: story.set_id,
        set_index: story.set_index,
        authorId,
        authorChangeId,
        date: story.date,
        change_date: story.change_date,
        date_published: story.date_published,
        text: story.text,
        public: story.public ?? false,
        imageId,
        courseId,
        json: story.json,
        status: story.status ?? "draft",
        deleted: story.deleted ?? false,
        todo_count: story.todo_count ?? 0,
      };

      if (existing) {
        await ctx.db.patch(existing._id, storyData);
        updated++;
      } else {
        await ctx.db.insert("stories", {
          ...storyData,
          legacyId: story.legacyId,
        });
        inserted++;
      }
    }

    return { inserted, updated, failed };
  },
});

// ============================================
// Story Completions
// ============================================

export const importStoryCompletion = mutation({
  args: {
    userLegacyId: v.number(),
    storyLegacyId: v.number(),
    time: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
      .first();

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
      .first();

    if (!user || !story) {
      return { action: "skipped", reason: "user or story not found" };
    }

    // Check if already exists
    const existing = await ctx.db
      .query("story_completions")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", user._id).eq("storyId", story._id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { time: args.time });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("story_completions", {
      userId: user._id,
      storyId: story._id,
      time: args.time,
    });

    return { id, action: "inserted" };
  },
});

const completionSchema = v.object({
  userLegacyId: v.optional(v.number()), // Optional for anonymous completions
  storyLegacyId: v.number(),
  time: v.number(),
});

export const importStoryCompletionsBatch = mutation({
  args: { completions: v.array(completionSchema) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const completion of args.completions) {
      // Look up story by legacy ID (required)
      const story = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", completion.storyLegacyId),
        )
        .first();

      if (!story) {
        skipped++;
        continue;
      }

      // Look up user by legacy ID (optional - can be anonymous)
      let userId = undefined;
      if (completion.userLegacyId) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_legacy_id", (q) =>
            q.eq("legacyId", completion.userLegacyId),
          )
          .first();
        userId = user?._id;
      }

      // For anonymous completions, check by story only
      // For logged-in users, check by user+story
      let existing;
      if (userId) {
        existing = await ctx.db
          .query("story_completions")
          .withIndex("by_user_story", (q) =>
            q.eq("userId", userId).eq("storyId", story._id),
          )
          .first();
      }
      // Note: We don't dedupe anonymous completions - each is a separate record

      if (existing) {
        await ctx.db.patch(existing._id, { time: completion.time });
        updated++;
      } else {
        await ctx.db.insert("story_completions", {
          userId,
          storyId: story._id,
          time: completion.time,
        });
        inserted++;
      }
    }

    return { inserted, updated, skipped };
  },
});

// ============================================
// Story Approvals
// ============================================

export const importStoryApproval = mutation({
  args: {
    userLegacyId: v.number(),
    storyLegacyId: v.number(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.userLegacyId))
      .first();

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyLegacyId))
      .first();

    if (!user || !story) {
      return { action: "skipped", reason: "user or story not found" };
    }

    // Check if already exists
    const existing = await ctx.db
      .query("story_approvals")
      .withIndex("by_user_story", (q) =>
        q.eq("userId", user._id).eq("storyId", story._id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { date: args.date });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("story_approvals", {
      userId: user._id,
      storyId: story._id,
      date: args.date,
    });

    return { id, action: "inserted" };
  },
});

const approvalSchema = v.object({
  userLegacyId: v.number(),
  storyLegacyId: v.number(),
  date: v.number(),
});

export const importStoryApprovalsBatch = mutation({
  args: { approvals: v.array(approvalSchema) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const approval of args.approvals) {
      // Look up user and story by legacy ID
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", approval.userLegacyId),
        )
        .first();

      const story = await ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", approval.storyLegacyId),
        )
        .first();

      if (!user || !story) {
        skipped++;
        continue;
      }

      const existing = await ctx.db
        .query("story_approvals")
        .withIndex("by_user_story", (q) =>
          q.eq("userId", user._id).eq("storyId", story._id),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { date: approval.date });
        updated++;
      } else {
        await ctx.db.insert("story_approvals", {
          userId: user._id,
          storyId: story._id,
          date: approval.date,
        });
        inserted++;
      }
    }

    return { inserted, updated, skipped };
  },
});

// ============================================
// Extended Stats
// ============================================

// Helper to count documents in a table using pagination
async function countTable(ctx: any, tableName: string): Promise<number> {
  let count = 0;
  let isDone = false;
  let cursor: string | null = null;
  const pageSize = 1000;

  while (!isDone) {
    let result: any;
    if (cursor) {
      result = await ctx.db
        .query(tableName)
        .paginate({ cursor, numItems: pageSize });
    } else {
      result = await ctx.db.query(tableName).paginate({ numItems: pageSize });
    }

    count += result.page.length;
    isDone = result.isDone;
    cursor = result.continueCursor;
  }

  return count;
}

export const getFullMigrationStats = query({
  args: {},
  handler: async (ctx) => {
    // Count small tables directly (these are fine to collect)
    const languages = await ctx.db.query("languages").collect();
    const images = await ctx.db.query("images").collect();
    const avatars = await ctx.db.query("avatars").collect();
    const speakers = await ctx.db.query("speakers").collect();
    const courses = await ctx.db.query("courses").collect();

    // Count large tables using pagination
    const users = await countTable(ctx, "users");
    const stories = await countTable(ctx, "stories");
    const localizations = await countTable(ctx, "localizations");
    const storyCompletions = await countTable(ctx, "story_completions");
    const storyApprovals = await countTable(ctx, "story_approvals");

    return {
      languages: languages.length,
      images: images.length,
      avatars: avatars.length,
      speakers: speakers.length,
      courses: courses.length,
      localizations: localizations,
      users: users,
      stories: stories,
      story_completions: storyCompletions,
      story_approvals: storyApprovals,
    };
  },
});

// ============================================
// Story Content Migration
// ============================================

/**
 * Migrate story content (text and json fields) from stories table to story_content table
 * This is a batched migration that can be run multiple times until all stories are migrated
 */

export const migrateStoriesToSeparateContent = mutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;

    // Get stories in batches
    const result = await ctx.db.query("stories").paginate({
      numItems: batchSize,
      cursor: args.cursor as any,
    });

    let migrated = 0;
    let skipped = 0;
    let updated = 0;

    for (const story of result.page) {
      // Check if content already exists
      const existing = await ctx.db
        .query("story_content")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .first();

      if (existing) {
        // Content already exists - check if it needs updating
        const needsUpdate =
          (story.text && existing.text !== story.text) ||
          (story.json &&
            JSON.stringify(existing.json) !== JSON.stringify(story.json));

        if (needsUpdate) {
          await ctx.db.patch(existing._id, {
            text: story.text ?? "",
            json: story.json ?? null,
            lastUpdated: story.change_date ?? Date.now(),
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      // Create content entry if story has text or json
      if (story.text || story.json) {
        await ctx.db.insert("story_content", {
          storyId: story._id,
          text: story.text ?? "",
          json: story.json ?? null,
          lastUpdated: story.change_date ?? Date.now(),
        });
        migrated++;
      } else {
        // Story has no content, create empty entry
        await ctx.db.insert("story_content", {
          storyId: story._id,
          text: "",
          json: null,
          lastUpdated: story.change_date ?? Date.now(),
        });
        migrated++;
      }
    }

    return {
      migrated,
      updated,
      skipped,
      hasMore: !result.isDone,
      continueCursor: result.continueCursor,
      totalProcessed: migrated + updated + skipped,
    };
  },
});

/**
 * Count how many stories still need migration
 */
export const countStoriesNeedingContentMigration = query({
  args: {},
  handler: async (ctx) => {
    const stories = await ctx.db.query("stories").take(1000);
    const contents = await ctx.db.query("story_content").collect();

    const contentByStory = new Map(contents.map((c) => [c.storyId, c]));

    let needsMigration = 0;
    let migrated = 0;

    for (const story of stories) {
      if (contentByStory.has(story._id)) {
        migrated++;
      } else {
        needsMigration++;
      }
    }

    return {
      total: stories.length,
      migrated,
      needsMigration,
    };
  },
});

/**
 * Remove old text and json fields from stories table
 * Run this AFTER content has been migrated to story_content table
 */
export const cleanupOldStoryContentFields = mutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;

    // Get stories in batches
    const result = await ctx.db.query("stories").paginate({
      numItems: batchSize,
      cursor: args.cursor as any,
    });

    let cleaned = 0;

    for (const story of result.page) {
      // Unconditionally rewrite the document without text/json fields
      // This ensures they are removed even if they're large
      await ctx.db.replace(story._id, {
        duo_id: story.duo_id,
        name: story.name,
        set_id: story.set_id,
        set_index: story.set_index,
        authorId: story.authorId,
        authorChangeId: story.authorChangeId,
        date: story.date,
        change_date: story.change_date,
        date_published: story.date_published,
        public: story.public,
        imageId: story.imageId,
        courseId: story.courseId,
        status: story.status,
        deleted: story.deleted,
        todo_count: story.todo_count,
        legacyId: story.legacyId,
        // text and json fields NOT included - they will be removed
      });
      cleaned++;
    }

    return {
      cleaned,
      hasMore: !result.isDone,
      continueCursor: result.continueCursor,
      totalProcessed: cleaned,
    };
  },
});

// Debug query to check table counts
export const checkTableCounts = query({
  args: {},
  handler: async (ctx) => {
    const avatars = await ctx.db.query("avatars").collect();
    const avatarMappings = await ctx.db.query("avatar_mappings").collect();
    const speakers = await ctx.db.query("speakers").collect();
    
    return {
      avatars: avatars.length,
      avatarMappings: avatarMappings.length,
      speakers: speakers.length,
      sampleMapping: avatarMappings[0] ?? null,
    };
  },
});

// ============================================
// Avatar Mappings
// ============================================

export const importAvatarMapping = mutation({
  args: {
    legacyAvatarId: v.number(),
    legacyLanguageId: v.number(),
    name: v.optional(v.string()),
    speaker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find avatar by legacy ID
    const avatar = await ctx.db
      .query("avatars")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyAvatarId))
      .first();

    if (!avatar) {
      throw new Error(`Avatar not found for legacy ID: ${args.legacyAvatarId}`);
    }

    // Find language by legacy ID
    const language = await ctx.db
      .query("languages")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyLanguageId))
      .first();

    if (!language) {
      throw new Error(`Language not found for legacy ID: ${args.legacyLanguageId}`);
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("avatar_mappings")
      .withIndex("by_avatar_language", (q) =>
        q.eq("avatarId", avatar._id).eq("languageId", language._id)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        name: args.name,
        speaker: args.speaker,
      });
      return { id: existing._id, updated: true };
    } else {
      // Create new
      const id = await ctx.db.insert("avatar_mappings", {
        avatarId: avatar._id,
        languageId: language._id,
        name: args.name,
        speaker: args.speaker,
      });
      return { id, updated: false };
    }
  },
});
