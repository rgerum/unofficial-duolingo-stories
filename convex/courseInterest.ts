import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  getSessionLegacyUserId,
  requireContributorOrAdmin,
} from "./lib/authorization";
import { listPublicCourseStories } from "./lib/publicCourseStories";

const ANONYMOUS_ID_PATTERN = /^[a-zA-Z0-9_-]{16,100}$/;
const BROWSER_SIGNAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_BROWSER_SIGNALS_PER_COURSE_PER_WINDOW = 30;
const MAX_COMPLETION_ROWS_PER_COURSE = 500;

type ReadCtx = QueryCtx | MutationCtx;
type InterestSignal = Doc<"course_interest_signals">;

const learnerInterestValidator = v.union(
  v.object({
    interested: v.boolean(),
    completedAllAvailableStories: v.boolean(),
  }),
  v.null(),
);

const editorInterestValidator = v.union(
  v.object({
    browserCount: v.number(),
    authenticatedCount: v.number(),
    completedAllCount: v.number(),
  }),
  v.null(),
);

type SupporterKeys = {
  anonymousKey: string;
  legacyUserId: number | null;
  primaryKey: string;
  primaryKind: "browser" | "account";
};

type StatsDelta = {
  browser: number;
  authenticated: number;
  completedAll: number;
};

function anonymousSupporterKey(anonymousId: string) {
  if (!ANONYMOUS_ID_PATTERN.test(anonymousId)) {
    throw new Error("Invalid anonymous supporter identifier.");
  }
  return `anonymous:${anonymousId}`;
}

function accountSupporterKey(legacyUserId: number) {
  return `user:${legacyUserId}`;
}

async function getSupporterKeys(
  ctx: ReadCtx,
  anonymousId: string,
): Promise<SupporterKeys> {
  const anonymousKey = anonymousSupporterKey(anonymousId);
  const legacyUserId = await getSessionLegacyUserId(ctx);
  return {
    anonymousKey,
    legacyUserId,
    primaryKey:
      typeof legacyUserId === "number"
        ? accountSupporterKey(legacyUserId)
        : anonymousKey,
    primaryKind: typeof legacyUserId === "number" ? "account" : "browser",
  };
}

async function getCourseByShort(ctx: ReadCtx, courseShort: string) {
  return await ctx.db
    .query("courses")
    .withIndex("by_short", (q) => q.eq("short", courseShort))
    .unique();
}

async function getSignal(
  ctx: ReadCtx,
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

async function getSupporterSignals(
  ctx: ReadCtx,
  courseId: Id<"courses">,
  keys: SupporterKeys,
) {
  const primarySignal = await getSignal(ctx, courseId, keys.primaryKey);
  const anonymousSignal =
    keys.primaryKey === keys.anonymousKey
      ? null
      : await getSignal(ctx, courseId, keys.anonymousKey);
  return { anonymousSignal, primarySignal };
}

async function hasCompletedAllVisibleStories(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  legacyUserId: number | null,
) {
  if (legacyUserId === null) return false;

  const visibleStories = await listPublicCourseStories(ctx, courseId);
  if (visibleStories.length === 0) return false;

  const completionRows = await ctx.db
    .query("story_done_state")
    .withIndex("by_user_and_course", (q) =>
      q.eq("legacyUserId", legacyUserId).eq("courseId", courseId),
    )
    .take(MAX_COMPLETION_ROWS_PER_COURSE + 1);
  if (completionRows.length > MAX_COMPLETION_ROWS_PER_COURSE) return false;

  const completedStoryIds = new Set(completionRows.map((row) => row.storyId));
  return visibleStories.every(({ story }) => completedStoryIds.has(story._id));
}

async function getStats(ctx: ReadCtx, courseId: Id<"courses">) {
  return await ctx.db
    .query("course_interest_stats")
    .withIndex("by_course_id", (q) => q.eq("courseId", courseId))
    .unique();
}

function assertBrowserSignalAllowance(
  stats: Doc<"course_interest_stats"> | null,
  now: number,
) {
  if (
    stats &&
    now - stats.browserWindowStartedAt < BROWSER_SIGNAL_WINDOW_MS &&
    stats.browserAddsInWindow >= MAX_BROWSER_SIGNALS_PER_COURSE_PER_WINDOW
  ) {
    throw new Error(
      "Too many new interest signals for this course. Please try again later.",
    );
  }
}

async function applyStatsDelta(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  delta: StatsDelta,
  options: { consumeBrowserAllowance?: boolean } = {},
) {
  const existing = await getStats(ctx, courseId);
  const now = Date.now();
  if (options.consumeBrowserAllowance) {
    assertBrowserSignalAllowance(existing, now);
  }

  const windowExpired =
    !existing ||
    now - existing.browserWindowStartedAt >= BROWSER_SIGNAL_WINDOW_MS;
  const browserWindowStartedAt = windowExpired
    ? now
    : existing.browserWindowStartedAt;
  const browserAddsInWindow = options.consumeBrowserAllowance
    ? windowExpired
      ? 1
      : (existing?.browserAddsInWindow ?? 0) + 1
    : (existing?.browserAddsInWindow ?? 0);

  if (!existing) {
    await ctx.db.insert("course_interest_stats", {
      courseId,
      browserCount: Math.max(0, delta.browser),
      authenticatedCount: Math.max(0, delta.authenticated),
      completedAllCount: Math.max(0, delta.completedAll),
      browserWindowStartedAt,
      browserAddsInWindow,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    browserCount: Math.max(0, existing.browserCount + delta.browser),
    authenticatedCount: Math.max(
      0,
      existing.authenticatedCount + delta.authenticated,
    ),
    completedAllCount: Math.max(
      0,
      existing.completedAllCount + delta.completedAll,
    ),
    browserWindowStartedAt,
    browserAddsInWindow,
    updatedAt: now,
  });
}

function signalStatsDelta(signal: InterestSignal, direction: 1 | -1) {
  return {
    browser: signal.supporterKind === "browser" ? direction : 0,
    authenticated: signal.supporterKind === "account" ? direction : 0,
    completedAll: signal.completedAllAvailableStoriesAt ? direction : 0,
  };
}

export async function maybeQualifyCourseInterestSignal(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  legacyUserId: number,
) {
  const signal = await getSignal(
    ctx,
    courseId,
    accountSupporterKey(legacyUserId),
  );
  if (!signal || signal.completedAllAvailableStoriesAt) return;
  if (!(await hasCompletedAllVisibleStories(ctx, courseId, legacyUserId))) {
    return;
  }

  await ctx.db.patch(signal._id, {
    completedAllAvailableStoriesAt: Date.now(),
  });
  await applyStatsDelta(ctx, courseId, {
    browser: 0,
    authenticated: 0,
    completedAll: 1,
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
    const { anonymousSignal, primarySignal } = await getSupporterSignals(
      ctx,
      course._id,
      keys,
    );
    const signal = primarySignal ?? anonymousSignal;
    return {
      interested: signal !== null,
      completedAllAvailableStories:
        signal?.completedAllAvailableStoriesAt !== undefined,
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
    completedAllAvailableStories: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const course = await getCourseByShort(ctx, args.courseShort);
    if (!course?.public) throw new Error("Course not found.");

    const keys = await getSupporterKeys(ctx, args.anonymousId);
    const { anonymousSignal, primarySignal } = await getSupporterSignals(
      ctx,
      course._id,
      keys,
    );
    const existingSignals = [primarySignal, anonymousSignal].filter(
      (signal): signal is InterestSignal => signal !== null,
    );

    if (!args.interested) {
      for (const signal of existingSignals) {
        await ctx.db.delete(signal._id);
        await applyStatsDelta(ctx, course._id, signalStatsDelta(signal, -1));
      }
      return {
        interested: false,
        completedAllAvailableStories: false,
      };
    }

    const completedAllAvailableStories =
      keys.primaryKind === "account" &&
      (await hasCompletedAllVisibleStories(ctx, course._id, keys.legacyUserId));
    const now = Date.now();

    if (primarySignal) {
      if (
        completedAllAvailableStories &&
        !primarySignal.completedAllAvailableStoriesAt
      ) {
        await ctx.db.patch(primarySignal._id, {
          completedAllAvailableStoriesAt: now,
        });
        await applyStatsDelta(ctx, course._id, {
          browser: 0,
          authenticated: 0,
          completedAll: 1,
        });
      }
      if (anonymousSignal) {
        await ctx.db.delete(anonymousSignal._id);
        await applyStatsDelta(
          ctx,
          course._id,
          signalStatsDelta(anonymousSignal, -1),
        );
      }
    } else if (anonymousSignal) {
      const alreadyQualified =
        anonymousSignal.completedAllAvailableStoriesAt !== undefined;
      await ctx.db.patch(anonymousSignal._id, {
        supporterKey: keys.primaryKey,
        supporterKind: keys.primaryKind,
        completedAllAvailableStoriesAt:
          alreadyQualified || completedAllAvailableStories ? now : undefined,
      });
      await applyStatsDelta(ctx, course._id, {
        browser: -1,
        authenticated: 1,
        completedAll: completedAllAvailableStories && !alreadyQualified ? 1 : 0,
      });
    } else {
      await applyStatsDelta(
        ctx,
        course._id,
        {
          browser: keys.primaryKind === "browser" ? 1 : 0,
          authenticated: keys.primaryKind === "account" ? 1 : 0,
          completedAll: completedAllAvailableStories ? 1 : 0,
        },
        { consumeBrowserAllowance: keys.primaryKind === "browser" },
      );
      await ctx.db.insert("course_interest_signals", {
        courseId: course._id,
        supporterKey: keys.primaryKey,
        supporterKind: keys.primaryKind,
        completedAllAvailableStoriesAt: completedAllAvailableStories
          ? now
          : undefined,
        createdAt: now,
      });
    }

    return {
      interested: true,
      completedAllAvailableStories:
        completedAllAvailableStories ||
        primarySignal?.completedAllAvailableStoriesAt !== undefined ||
        anonymousSignal?.completedAllAvailableStoriesAt !== undefined,
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
      browserCount: stats?.browserCount ?? 0,
      authenticatedCount: stats?.authenticatedCount ?? 0,
      completedAllCount: stats?.completedAllCount ?? 0,
    };
  },
});
