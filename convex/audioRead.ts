import { query } from "./_generated/server";
import { v } from "convex/values";

export const getSpeakerByName = query({
  args: {
    speaker: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.number(),
      speaker: v.string(),
      type: v.string(),
      gender: v.optional(v.string()),
      service: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("speakers")
      .withIndex("by_speaker", (q) => q.eq("speaker", args.speaker))
      .unique();
    if (!row) return null;

    return {
      id: row.legacyId ?? 0,
      speaker: row.speaker,
      type: row.type,
      gender: row.gender,
      service: row.service,
    };
  },
});
