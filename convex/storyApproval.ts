import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  requireContributorOrAdmin,
  requireSessionLegacyUserId,
} from "./lib/authorization";

const storyApprovalInputValidator = {
  legacyStoryId: v.number(),
  date: v.optional(v.number()),
  legacyApprovalId: v.optional(v.number()),
};

async function getUserNamesByLegacyIds(ctx: MutationCtx, legacyUserIds: number[]) {
  const uniqueIds = Array.from(new Set(legacyUserIds.filter(Number.isFinite)));
  if (uniqueIds.length === 0) return new Map<number, string>();

  const response = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "user",
    where: [{ field: "userId", operator: "in", value: uniqueIds.map(String) }],
    paginationOpts: { cursor: null, numItems: uniqueIds.length + 10 },
  })) as {
    page: Array<{ userId?: string | null; name?: string | null }>;
  };

  const map = new Map<number, string>();
  for (const user of response.page) {
    const legacyId = Number.parseInt(user.userId ?? "", 10);
    if (!Number.isFinite(legacyId) || !user.name) continue;
    map.set(legacyId, user.name);
  }
  return map;
}

async function recomputeCourseContributors(
  ctx: MutationCtx,
  courseId: Id<"courses">,
): Promise<{ contributors: string[]; contributors_past: string[] }> {
  const courseStories = await ctx.db
    .query("stories")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();

  const latestApprovalByUser = new Map<number, number>();
  for (const story of courseStories) {
    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();
    for (const approval of approvals) {
      if (typeof approval.legacyUserId !== "number") continue;
      const existing = latestApprovalByUser.get(approval.legacyUserId) ?? 0;
      if (approval.date > existing) {
        latestApprovalByUser.set(approval.legacyUserId, approval.date);
      }
    }
  }

  const namesByUserId = await getUserNamesByLegacyIds(
    ctx,
    Array.from(latestApprovalByUser.keys()),
  );
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const ranked = Array.from(latestApprovalByUser.entries())
    .map(([legacyUserId, latestDate]) => ({
      latestDate,
      name: namesByUserId.get(legacyUserId) ?? "Unknown",
      active: latestDate > cutoffMs,
    }))
    .sort((a, b) => b.latestDate - a.latestDate);

  return {
    contributors: ranked.filter((row) => row.active).map((row) => row.name),
    contributors_past: ranked.filter((row) => !row.active).map((row) => row.name),
  };
}

export const upsertStoryApproval = mutation({
  args: storyApprovalInputValidator,
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("story_approval"),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const identity = (await ctx.auth.getUserIdentity()) as
      | { name?: string | null }
      | null;
    const actorName = identity?.name?.trim() || `user_${legacyUserId}`;
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      throw new Error(`Missing story for legacy id ${args.legacyStoryId}`);
    }

    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", story._id).eq("legacyUserId", legacyUserId),
      )
      .unique();

    const doc = {
      storyId: story._id,
      legacyUserId,
      date: args.date ?? Date.now(),
      legacyId: args.legacyApprovalId,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("story_approval", doc);
    return { inserted: true, docId };
  },
});

export const deleteStoryApproval = mutation({
  args: {
    legacyStoryId: v.number(),
  },
  returns: v.object({
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      return { deleted: false };
    }

    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", story._id).eq("legacyUserId", legacyUserId),
      )
      .unique();
    if (!existing) return { deleted: false };

    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const deleteStoryApprovalByLegacyId = mutation({
  args: {
    legacyApprovalId: v.number(),
  },
  returns: v.object({
    deleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyApprovalId))
      .unique();
    if (!existing) return { deleted: false };
    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const toggleStoryApproval = mutation({
  args: {
    legacyStoryId: v.number(),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    count: v.number(),
    story_status: v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
    finished_in_set: v.number(),
    action: v.union(v.literal("added"), v.literal("deleted")),
    published: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const identity = (await ctx.auth.getUserIdentity()) as
      | { name?: string | null }
      | null;
    const actorName = identity?.name?.trim() || `user_${legacyUserId}`;

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story || typeof story.legacyId !== "number") {
      throw new Error(`Story ${args.legacyStoryId} not found`);
    }

    const existing = await ctx.db
      .query("story_approval")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", story._id).eq("legacyUserId", legacyUserId),
      )
      .unique();

    let action: "added" | "deleted";
    if (existing) {
      await ctx.db.delete(existing._id);
      action = "deleted";
    } else {
      await ctx.db.insert("story_approval", {
        storyId: story._id,
        legacyUserId,
        date: Date.now(),
      });
      action = "added";
    }

    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();
    const count = approvals.length;
    const story_status: "draft" | "feedback" | "finished" =
      count === 0 ? "draft" : count === 1 ? "feedback" : "finished";

    await ctx.db.patch(story._id, {
      status: story_status,
      approvalCount: count,
    });

    const storiesInCourse = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", story.courseId))
      .collect();

    const finishedStoriesInSet = storiesInCourse.filter(
      (row) =>
        row.set_id === story.set_id &&
        row.status === "finished" &&
        !row.deleted,
    );
    const finished_in_set = finishedStoriesInSet.length;

    const published: number[] = [];
    let datePublishedMs: number | null = null;
    if (finished_in_set >= 4) {
      datePublishedMs = Date.now();
      for (const row of finishedStoriesInSet) {
        if (row.public) continue;
        await ctx.db.patch(row._id, {
          public: true,
          date_published: datePublishedMs,
        });
        if (typeof row.legacyId === "number") {
          published.push(row.legacyId);
        }
      }
    }

    let courseCount: number | null = null;
    if (published.length > 0) {
      courseCount = storiesInCourse.filter((row) => row.public && !row.deleted).length;
      await ctx.db.patch(story.courseId, {
        count: courseCount,
      });
    }

    const { contributors, contributors_past } = await recomputeCourseContributors(
      ctx,
      story.courseId,
    );
    await ctx.db.patch(story.courseId, {
      contributors,
      contributors_past,
    });

    const operationKey =
      args.operationKey ??
      `story_approval:${story.legacyId}:user:${legacyUserId}:toggle:${Date.now()}`;
    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorStoryApprovalToggle, {
      storyId: story.legacyId,
      legacyUserId,
      action,
      storyStatus: story_status,
      approvalCount: count,
      finishedInSet: finished_in_set,
      publishedStoryIds: published,
      datePublishedMs,
      courseId: story.courseId,
      courseCount,
      contributors,
      contributorsPast: contributors_past,
      operationKey,
    });

    await ctx.scheduler.runAfter(0, internal.editorSideEffects.onStoryApprovalToggled, {
      operationKey,
      storyId: story.legacyId,
      action,
      count,
      storyStatus: story_status,
      finishedInSet: finished_in_set,
      publishedCount: published.length,
      actorName,
      actorLegacyUserId: legacyUserId,
    });

    return {
      count,
      story_status,
      finished_in_set,
      action,
      published,
    };
  },
});

export const getApprovalCountByStory = query({
  args: {
    legacyStoryId: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) return 0;
    const approvals = await ctx.db
      .query("story_approval")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .collect();
    return approvals.length;
  },
});
