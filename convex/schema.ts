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
});
