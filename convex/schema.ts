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
    avatarId: v.id("avatars"),
    languageId: v.id("languages"),
    name: v.optional(v.string()),
    speaker: v.optional(v.string()),
  }).index("by_avatar_id_and_language_id", ["avatarId", "languageId"]),
});
