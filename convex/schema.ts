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
    // Temporary migration compatibility for pre-existing story docs missing `text`.
    // TODO(post-migration): make required again after backfill normalization.
    text: v.optional(v.string()),
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
    learning_language_name: v.optional(v.string()),
    from_language_name: v.optional(v.string()),
    contributors: v.optional(v.array(v.string())),
    contributors_past: v.optional(v.array(v.string())),
    todo_count: v.optional(v.number()),
    mirrorUpdatedAt: v.optional(v.number()),
    lastOperationKey: v.optional(v.string()),
  })
    .index("by_id_value", ["legacyId"])
    .index("by_short", ["short"]),

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
    .index("by_avatar_id_and_language_id", ["avatarId", "languageId"]),

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
    // Temporary migration compatibility for pre-existing story docs missing `text`.
    // TODO(post-migration): make required again after backfill normalization.
    text: v.optional(v.string()),
    public: v.boolean(),
    imageId: v.optional(v.id("images")),
    courseId: v.id("courses"),
    json: v.optional(v.any()),
    status: v.union(
      v.literal("draft"), v.literal("feedback"), v.literal("finished"),
    ),
    deleted: v.boolean(),
    todo_count: v.number(),
    legacyId: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_duo_id_course", ["duo_id", "courseId"])
    .index("by_status", ["status"])
    .index("by_public", ["public", "deleted"])
    .index("by_set", ["courseId", "set_id", "set_index"])
    .index("by_legacy_id", ["legacyId"]),

  story_content: defineTable({
    storyId: v.id("stories"),
    text: v.string(),
    json: v.any(),
    lastUpdated: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_updated", ["lastUpdated"]),
});
