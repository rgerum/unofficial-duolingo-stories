import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // Authentication Tables
  // ============================================

  users: defineTable({
    // Core auth fields
    name: v.optional(v.string()),
    email: v.string(),
    emailVerified: v.optional(v.number()), // timestamp
    image: v.optional(v.string()),
    password: v.optional(v.string()),

    // Custom fields from legacy schema
    regdate: v.optional(v.number()),
    role: v.optional(v.boolean()), // editor role
    admin: v.optional(v.boolean()),
    activated: v.optional(v.boolean()),
    activation_link: v.optional(v.string()),

    // Legacy ID for migration
    legacyId: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_legacy_id", ["legacyId"]),

  accounts: defineTable({
    userId: v.id("users"),
    type: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider", "providerAccountId"]),

  sessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    expires: v.number(),
  })
    .index("by_token", ["sessionToken"])
    .index("by_user", ["userId"]),

  verification_tokens: defineTable({
    identifier: v.string(),
    token: v.string(),
    expires: v.number(),
  }).index("by_identifier_token", ["identifier", "token"]),

  // ============================================
  // Language & Course Tables
  // ============================================

  languages: defineTable({
    name: v.string(),
    short: v.string(), // unique identifier (e.g., "en", "es")
    flag: v.optional(v.string()),
    flag_file: v.optional(v.string()),
    speaker: v.optional(v.string()),
    default_text: v.optional(v.string()),
    tts_replace: v.optional(v.string()),
    public: v.optional(v.boolean()),
    rtl: v.optional(v.boolean()), // right-to-left

    legacyId: v.optional(v.number()),
  })
    .index("by_short", ["short"])
    .index("by_legacy_id", ["legacyId"]),

  courses: defineTable({
    short: v.string(), // unique identifier (e.g., "es-en")
    learningLanguageId: v.id("languages"),
    fromLanguageId: v.id("languages"),
    public: v.optional(v.boolean()),
    official: v.optional(v.boolean()),
    name: v.optional(v.string()),
    about: v.optional(v.string()),
    conlang: v.optional(v.boolean()), // constructed language
    tags: v.optional(v.array(v.string())),
    count: v.optional(v.number()), // published story count
    learning_language_name: v.optional(v.string()),
    from_language_name: v.optional(v.string()),
    contributors: v.optional(v.array(v.string())),
    contributors_past: v.optional(v.array(v.string())),
    todo_count: v.optional(v.number()),

    legacyId: v.optional(v.number()),
  })
    .index("by_short", ["short"])
    .index("by_languages", ["learningLanguageId", "fromLanguageId"])
    .index("by_public", ["public"])
    .index("by_legacy_id", ["legacyId"]),

  // ============================================
  // Story Tables
  // ============================================

  images: defineTable({
    active: v.optional(v.string()),
    gilded: v.optional(v.string()),
    locked: v.optional(v.string()),
    active_lip: v.optional(v.string()),
    gilded_lip: v.optional(v.string()),

    legacyId: v.optional(v.string()), // varchar in PostgreSQL
  }).index("by_legacy_id", ["legacyId"]),

  stories: defineTable({
    duo_id: v.optional(v.string()), // original Duolingo story ID
    name: v.string(),
    set_id: v.optional(v.number()),
    set_index: v.optional(v.number()),
    authorId: v.optional(v.id("users")),
    authorChangeId: v.optional(v.id("users")),
    date: v.optional(v.number()),
    change_date: v.optional(v.number()),
    date_published: v.optional(v.number()),
    text: v.optional(v.string()), // DEPRECATED - kept for existing data, use story_content table
    public: v.optional(v.boolean()),
    imageId: v.optional(v.id("images")),
    courseId: v.id("courses"),
    json: v.optional(v.any()), // DEPRECATED - kept for existing data, use story_content table
    status: v.optional(
      v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished"))
    ),
    deleted: v.optional(v.boolean()),
    todo_count: v.optional(v.number()),

    legacyId: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_duo_id_course", ["duo_id", "courseId"])
    .index("by_status", ["status"])
    .index("by_public", ["public", "deleted"])
    .index("by_set", ["courseId", "set_id", "set_index"])
    .index("by_legacy_id", ["legacyId"]),

  // Story content - separated from metadata for performance
  // Stores the large text and json fields separately so list queries don't need to load them
  story_content: defineTable({
    storyId: v.id("stories"),
    text: v.string(), // plain text version of the story
    json: v.any(), // story content as JSON
    lastUpdated: v.number(), // timestamp of last content update
  })
    .index("by_story", ["storyId"])
    .index("by_updated", ["lastUpdated"]),

  story_completions: defineTable({
    userId: v.optional(v.id("users")), // Optional for anonymous completions
    storyId: v.id("stories"),
    time: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_story", ["storyId"])
    .index("by_user_story", ["userId", "storyId"]),

  story_approvals: defineTable({
    storyId: v.id("stories"),
    userId: v.id("users"),
    date: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_user_story", ["userId", "storyId"]),

  // ============================================
  // Avatar & Speaker Tables
  // ============================================

  avatars: defineTable({
    link: v.optional(v.string()),
    name: v.optional(v.string()),

    legacyId: v.optional(v.number()),
  }).index("by_legacy_id", ["legacyId"]),

  avatar_mappings: defineTable({
    avatarId: v.id("avatars"),
    languageId: v.id("languages"),
    name: v.optional(v.string()),
    speaker: v.optional(v.string()),
  })
    .index("by_avatar_language", ["avatarId", "languageId"])
    .index("by_language", ["languageId"]),

  speakers: defineTable({
    languageId: v.id("languages"),
    speaker: v.string(), // unique speaker identifier
    gender: v.optional(v.union(v.literal("MALE"), v.literal("FEMALE"))),
    type: v.optional(v.union(v.literal("NORMAL"), v.literal("NEURAL"))),
    service: v.optional(v.string()), // TTS service provider

    legacyId: v.optional(v.number()),
  })
    .index("by_speaker", ["speaker"])
    .index("by_language", ["languageId"])
    .index("by_legacy_id", ["legacyId"]),

  // ============================================
  // Localization Table
  // ============================================

  localizations: defineTable({
    languageId: v.id("languages"),
    tag: v.string(), // localization key
    text: v.string(), // translated text
  })
    .index("by_language", ["languageId"])
    .index("by_language_tag", ["languageId", "tag"]),

  // ============================================
  // Pre-aggregated Stats Tables
  // ============================================

  monthly_stats: defineTable({
    year: v.number(),
    month: v.number(),
    courseLegacyId: v.number(), // Using legacy ID for compatibility
    storiesPublished: v.number(),
    storiesRead: v.number(),
    activeUsersCount: v.number(),
    activeStoriesCount: v.number(),
    // Store arrays of IDs for deduplication during incremental updates
    activeUserIds: v.array(v.string()), // Store as strings to handle both Convex IDs and legacy IDs
    activeStoryIds: v.array(v.string()),
    lastUpdated: v.number(),
  })
    .index("by_year_month", ["year", "month"])
    .index("by_year_month_course", ["year", "month", "courseLegacyId"]),

  // Global monthly stats (total unique users across all courses)
  monthly_stats_global: defineTable({
    year: v.number(),
    month: v.number(),
    totalActiveUsers: v.number(),
    activeUserIds: v.array(v.string()),
    lastUpdated: v.number(),
  }).index("by_year_month", ["year", "month"]),
});
