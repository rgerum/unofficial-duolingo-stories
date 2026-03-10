import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const syncStatusValidator = v.union(
  v.literal("assigned"),
  v.literal("up_to_date"),
  v.literal("no_milestone"),
  v.literal("not_linked"),
  v.literal("member_not_found"),
  v.literal("error"),
);

const storiesRoleSnapshotValidator = v.object({
  legacyUserId: v.number(),
  discordAccountId: v.union(v.string(), v.null()),
  eligibleStoriesCount: v.union(v.number(), v.null()),
  assignedStoriesCount: v.union(v.number(), v.null()),
  syncStatus: syncStatusValidator,
  lastSyncedAt: v.number(),
  lastError: v.union(v.string(), v.null()),
});

export const replaceStoriesRoleSyncSnapshots = internalMutation({
  args: {
    snapshots: v.array(storiesRoleSnapshotValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingRows = await ctx.db
      .query("discord_stories_role_sync")
      .collect();
    const existingByLegacyUserId = new Map(
      existingRows.map((row) => [row.legacyUserId, row]),
    );

    for (const snapshot of args.snapshots) {
      const existing = existingByLegacyUserId.get(snapshot.legacyUserId);

      if (existing) {
        await ctx.db.patch(existing._id, snapshot);
        continue;
      }

      await ctx.db.insert("discord_stories_role_sync", snapshot);
    }

    return null;
  },
});
