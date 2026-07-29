import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  getSessionLegacyUserId,
  requireContributorOrAdmin,
} from "./lib/authorization";

const ANONYMOUS_ID_PATTERN = /^[a-zA-Z0-9_-]{16,100}$/;

const learnerInterestValidator = v.union(
  v.object({
    interested: v.boolean(),
    completedAllAtSignal: v.boolean(),
    totalCount: v.number(),
  }),
  v.null(),
);

const editorInterestValidator = v.union(
  v.object({
    totalCount: v.number(),
    completedAllCount: v.number(),
    lastSignalAt: v.union(v.number(), v.null()),
  }),
  v.null(),
);

function anonymousSupporterKey(anonymousId: string) {
  if (!ANONYMOUS_ID_PATTERN.test(anonymousId)) {
    throw new Error("Invalid anonymous supporter identifier.");
  }
  return `anonymous:${anonymousId}`;
}

async function getSupporterKeys(
  ctx: Parameters<typeof getSessionLegacyUserId>[0],
  anonymousId: string,
) {
  const anonymousKey = anonymousSupporterKey(anonymousId);
  const legacyUserId = await getSessionLegacyUserId(ctx);
  return {
    anonymousKey,
    legacyUserId,
    primaryKey:
      typeof legacyUserId === "number" ? `user:${legacyUserId}` : anonymousKey,
  };
}

async function getCourseByShort(
  ctx: Parameters<typeof getSessionLegacyUserId>[0],
  courseShort: string,
) {
  return await ctx.db
    .query("courses")
    .withIndex("by_short", (q) => q.eq("short", courseShort))
    .unique();
}

async function getSignal(
  ctx: Parameters<typeof getSessionLegacyUserId>[0],
  courseId: Id<"courses">,
  supporterKey: string,
) {
  return await ctx.db
    .query("course_interest_signals")
    .withIndex("by_course_id_and_supporter_key", (q) =>
      q.eq("courseId", courseId).eq("supporterKey", supporterKey),
    )
    .unique();
}

async function hasCompletedAllPublishedStories(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  legacyUserId: number | null,
  publishedStoryCount: number,
) {
  if (legacyUserId === null || publishedStoryCount === 0) return false;

  const completionRows = await ctx.db
    .query("story_done_state")
    .withIndex("by_user_and_course", (q) =>
      q.eq("legacyUserId", legacyUserId).eq("courseId", courseId),
    )
    .collect();
  return (
    new Set(completionRows.map((row) => row.storyId)).size >=
    publishedStoryCount
  );
}

async function getStats(
  ctx: Parameters<typeof getSessionLegacyUserId>[0],
  courseId: Id<"courses">,
) {
  return await ctx.db
    .query("course_interest_stats")
    .withIndex("by_course_id", (q) => q.eq("courseId", courseId))
    .unique();
}

async function updateStats(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  changes: { total: number; completedAll: number },
  lastSignalAt?: number,
) {
  const existing = await getStats(ctx, courseId);
  const now = Date.now();
  if (!existing) {
    await ctx.db.insert("course_interest_stats", {
      courseId,
      totalCount: Math.max(0, changes.total),
      completedAllCount: Math.max(0, changes.completedAll),
      lastSignalAt: lastSignalAt ?? null,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    totalCount: Math.max(0, existing.totalCount + changes.total),
    completedAllCount: Math.max(
      0,
      existing.completedAllCount + changes.completedAll,
    ),
    lastSignalAt: lastSignalAt ?? existing.lastSignalAt,
    updatedAt: now,
  });
}

export const getForLearner = query({
  args: {
    courseShort: v.string(),
    anonymousId: v.string(),
  },
  returns: learnerInterestValidator,
  handler: async (ctx, args) => {
    const course = await getCourseByShort(ctx, args.courseShort);
    if (!course?.public) return null;

    const keys = await getSupporterKeys(ctx, args.anonymousId);
    const primarySignal = await getSignal(ctx, course._id, keys.primaryKey);
    const anonymousSignal =
      keys.primaryKey === keys.anonymousKey
        ? null
        : await getSignal(ctx, course._id, keys.anonymousKey);
    const signal = primarySignal ?? anonymousSignal;
    const stats = await getStats(ctx, course._id);

    return {
      interested: signal !== null,
      completedAllAtSignal: signal?.completedAllAtSignal ?? false,
      totalCount: stats?.totalCount ?? 0,
    };
  },
});

export const setForLearner = mutation({
  args: {
    courseShort: v.string(),
    anonymousId: v.string(),
    interested: v.boolean(),
  },
  returns: v.object({
    interested: v.boolean(),
    completedAllAtSignal: v.boolean(),
    totalCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const course = await getCourseByShort(ctx, args.courseShort);
    if (!course?.public) throw new Error("Course not found.");

    const keys = await getSupporterKeys(ctx, args.anonymousId);
    const primarySignal = await getSignal(ctx, course._id, keys.primaryKey);
    const anonymousSignal =
      keys.primaryKey === keys.anonymousKey
        ? null
        : await getSignal(ctx, course._id, keys.anonymousKey);
    const existingSignals = [primarySignal, anonymousSignal].filter(
      (signal) => signal !== null,
    );

    if (!args.interested) {
      for (const signal of existingSignals) {
        await ctx.db.delete(signal._id);
      }
      if (existingSignals.length > 0) {
        await updateStats(ctx, course._id, {
          total: -existingSignals.length,
          completedAll: -existingSignals.filter(
            (signal) => signal.completedAllAtSignal,
          ).length,
        });
      }
      const stats = await getStats(ctx, course._id);
      return {
        interested: false,
        completedAllAtSignal: false,
        totalCount: stats?.totalCount ?? 0,
      };
    }

    const completedAllAtSignal = await hasCompletedAllPublishedStories(
      ctx,
      course._id,
      keys.legacyUserId,
      course.count ?? 0,
    );
    const now = Date.now();

    if (primarySignal) {
      if (completedAllAtSignal && !primarySignal.completedAllAtSignal) {
        await ctx.db.patch(primarySignal._id, { completedAllAtSignal: true });
        await updateStats(ctx, course._id, { total: 0, completedAll: 1 }, now);
      }
      if (anonymousSignal) {
        await ctx.db.delete(anonymousSignal._id);
        await updateStats(ctx, course._id, {
          total: -1,
          completedAll: anonymousSignal.completedAllAtSignal ? -1 : 0,
        });
      }
    } else if (anonymousSignal) {
      const wasCompleted = anonymousSignal.completedAllAtSignal;
      await ctx.db.patch(anonymousSignal._id, {
        supporterKey: keys.primaryKey,
        legacyUserId: keys.legacyUserId ?? undefined,
        completedAllAtSignal: wasCompleted || completedAllAtSignal,
      });
      if (completedAllAtSignal && !wasCompleted) {
        await updateStats(ctx, course._id, { total: 0, completedAll: 1 }, now);
      }
    } else {
      await ctx.db.insert("course_interest_signals", {
        courseId: course._id,
        supporterKey: keys.primaryKey,
        legacyUserId: keys.legacyUserId ?? undefined,
        completedAllAtSignal,
        createdAt: now,
      });
      await updateStats(
        ctx,
        course._id,
        { total: 1, completedAll: completedAllAtSignal ? 1 : 0 },
        now,
      );
    }

    const stats = await getStats(ctx, course._id);
    return {
      interested: true,
      completedAllAtSignal:
        completedAllAtSignal ||
        primarySignal?.completedAllAtSignal === true ||
        anonymousSignal?.completedAllAtSignal === true,
      totalCount: stats?.totalCount ?? 0,
    };
  },
});

export const getForEditor = query({
  args: {
    courseIdentifier: v.string(),
  },
  returns: editorInterestValidator,
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);
    const course = await getCourseByShort(ctx, args.courseIdentifier);
    if (!course) return null;
    const stats = await getStats(ctx, course._id);
    return {
      totalCount: stats?.totalCount ?? 0,
      completedAllCount: stats?.completedAllCount ?? 0,
      lastSignalAt: stats?.lastSignalAt ?? null,
    };
  },
});
