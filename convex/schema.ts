import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  languages: defineTable({
    legacyId: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.optional(v.union(v.number(), v.string())),
    flag_file: v.optional(v.string()),
    speaker: v.optional(v.string()),
    default_text: v.optional(v.string()),
    tts_replace: v.optional(v.string()),
    public: v.boolean(),
    rtl: v.boolean(),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
    // Backward compatibility for previously mirrored docs.
    mirror_updated_at: v.optional(v.number()),
    last_operation_key: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_short", ["short"])
    .index("by_last_operation_key", ["lastOperationKey"]),

  images: defineTable({
    legacyId: v.string(),
    active: v.string(),
    gilded: v.string(),
    locked: v.string(),
    active_lip: v.string(),
    gilded_lip: v.string(),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
    // Backward compatibility for previously mirrored docs.
    mirror_updated_at: v.optional(v.number()),
    last_operation_key: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_last_operation_key", ["lastOperationKey"]),

  avatars: defineTable({
    legacyId: v.number(),
    link: v.string(),
    name: v.optional(v.string()),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
    // Backward compatibility for previously mirrored docs.
    mirror_updated_at: v.optional(v.number()),
    last_operation_key: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_last_operation_key", ["lastOperationKey"]),

  speakers: defineTable({
    legacyId: v.optional(v.number()),
    languageId: v.id("languages"),
    speaker: v.string(),
    gender: v.string(),
    type: v.string(),
    service: v.string(),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_speaker", ["speaker"])
    .index("by_language_id", ["languageId"]),

  localizations: defineTable({
    legacyId: v.optional(v.number()),
    languageId: v.id("languages"),
    tag: v.string(),
    text: v.string(),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_language_id_and_tag", ["languageId", "tag"]),

  courses: defineTable({
    legacyId: v.number(),
    short: v.optional(v.string()),
    learningLanguageId: v.id("languages"),
    fromLanguageId: v.id("languages"),
    public: v.boolean(),
    official: v.boolean(),
    name: v.optional(v.string()),
    about: v.optional(v.string()),
    conlang: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    count: v.optional(v.number()),
    // Legacy denormalized fields kept only for Postgres-compat migration.
    // TODO(postgres-sunset): remove these once all readers use joined language docs.
    learning_language_name: v.optional(v.string()),
    from_language_name: v.optional(v.string()),
    contributors: v.optional(v.array(v.string())),
    contributors_past: v.optional(v.array(v.string())),
    todo_count: v.optional(v.number()),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_short", ["short"])
    .index("by_public", ["public"]),

  avatar_mappings: defineTable({
    legacyId: v.optional(v.number()),
    avatarId: v.id("avatars"),
    languageId: v.id("languages"),
    name: v.optional(v.string()),
    speaker: v.optional(v.string()),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_avatar_id_and_language_id", ["avatarId", "languageId"])
    .index("by_language_id", ["languageId"]),

  stories: defineTable({
    duo_id: v.optional(v.string()),
    name: v.string(),
    set_id: v.optional(v.number()),
    set_index: v.optional(v.number()),
    // Temporary migration compatibility:
    // some existing Convex rows stored auth component user IDs (string),
    // while mirrored Postgres rows use legacy numeric user IDs.
    // TODO(post-migration): normalize to a single author identity type.
    authorId: v.optional(v.union(v.number(), v.string())),
    authorChangeId: v.optional(v.union(v.number(), v.string())),
    date: v.optional(v.number()),
    change_date: v.optional(v.number()),
    date_published: v.optional(v.number()),
    public: v.boolean(),
    imageId: v.optional(v.id("images")),
    courseId: v.id("courses"),
    status: v.union(
      v.literal("draft"),
      v.literal("feedback"),
      v.literal("finished"),
    ),
    approvalCount: v.optional(v.number()),
    deleted: v.boolean(),
    todo_count: v.number(),
    legacyId: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_duo_id_course", ["duo_id", "courseId"])
    .index("by_status", ["status"])
    .index("by_public", ["public", "deleted"])
    .index("by_set", ["courseId", "set_id", "set_index"])
    .index("by_course_public_deleted_set", [
      "courseId",
      "public",
      "deleted",
      "set_id",
      "set_index",
    ])
    .index("by_legacy_id", ["legacyId"]),

  story_content: defineTable({
    storyId: v.id("stories"),
    text: v.string(),
    json: v.any(),
    lastUpdated: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_updated", ["lastUpdated"]),

  story_done: defineTable({
    storyId: v.id("stories"),
    legacyUserId: v.optional(v.number()),
    time: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_user", ["legacyUserId"])
    .index("by_user_and_story", ["legacyUserId", "storyId"])
    .index("by_user_time", ["legacyUserId", "time"]),

  story_done_state: defineTable({
    storyId: v.id("stories"),
    courseId: v.id("courses"),
    legacyStoryId: v.number(),
    legacyCourseId: v.number(),
    legacyUserId: v.number(),
    lastDoneAt: v.number(),
  })
    .index("by_user_and_story", ["legacyUserId", "storyId"])
    .index("by_user_and_course", ["legacyUserId", "courseId"])
    .index("by_user_and_last_done_at", ["legacyUserId", "lastDoneAt"]),

  course_activity: defineTable({
    courseId: v.id("courses"),
    legacyCourseId: v.number(),
    legacyUserId: v.number(),
    lastDoneAt: v.number(),
  })
    .index("by_user_and_course", ["legacyUserId", "courseId"])
    .index("by_user_and_last_done_at", ["legacyUserId", "lastDoneAt"]),

  story_approval: defineTable({
    storyId: v.id("stories"),
    legacyUserId: v.optional(v.number()),
    date: v.number(),
    legacyId: v.optional(v.number()),
  })
    .index("by_story", ["storyId"])
    .index("by_user", ["legacyUserId"])
    .index("by_story_and_user", ["storyId", "legacyUserId"])
    .index("by_legacy_id", ["legacyId"]),
});
