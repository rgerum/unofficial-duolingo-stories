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
const MAX_LEGACY_SIGNALS_PER_COURSE = 500;

type ReadCtx = QueryCtx | MutationCtx;
type InterestSignal = Doc<"course_interest_signals">;
type InterestStats = Doc<"course_interest_stats">;
type SupporterKind = "browser" | "account";

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

type NormalizedStats = {
  document: InterestStats | null;
  browserCount: number;
  authenticatedCount: number;
  completedAllCount: number;
  browserWindowStartedAt: number;
  browserAddsInWindow: number;
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

function getSignalKind(signal: InterestSignal): SupporterKind {
  return (
    signal.supporterKind ??
    (signal.supporterKey.startsWith("user:") ? "account" : "browser")
  );
}

function getSignalCompletedAllAt(signal: InterestSignal) {
  return (
    signal.completedAllAvailableStoriesAt ??
    (signal.completedAllAtSignal ? signal.createdAt : undefined)
  );
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

async function getNormalizedStats(
  ctx: ReadCtx,
  courseId: Id<"courses">,
): Promise<NormalizedStats> {
  const document = await getStats(ctx, courseId);
  if (
    document &&
    document.browserCount !== undefined &&
    document.authenticatedCount !== undefined &&
    document.browserWindowStartedAt !== undefined &&
    document.browserAddsInWindow !== undefined
  ) {
    return {
      document,
      browserCount: document.browserCount,
      authenticatedCount: document.authenticatedCount,
      completedAllCount: document.completedAllCount,
      browserWindowStartedAt: document.browserWindowStartedAt,
      browserAddsInWindow: document.browserAddsInWindow,
    };
  }

  const signals = await ctx.db
    .query("course_interest_signals")
    .withIndex("by_course_id", (q) => q.eq("courseId", courseId))
    .take(MAX_LEGACY_SIGNALS_PER_COURSE + 1);
  if (signals.length > MAX_LEGACY_SIGNALS_PER_COURSE) {
    throw new Error(
      `Course ${courseId} has too many legacy interest signals to normalize.`,
    );
  }

  let browserCount = 0;
  let authenticatedCount = 0;
  let completedAllCount = 0;
  for (const signal of signals) {
    if (getSignalKind(signal) === "account") authenticatedCount += 1;
    else browserCount += 1;
    if (getSignalCompletedAllAt(signal) !== undefined) completedAllCount += 1;
  }

  return {
    document,
    browserCount,
    authenticatedCount,
    completedAllCount,
    browserWindowStartedAt: document?.updatedAt ?? Date.now(),
    browserAddsInWindow: 0,
  };
}

function assertBrowserSignalAllowance(stats: NormalizedStats, now: number) {
  if (
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
  const stats = await getNormalizedStats(ctx, courseId);
  const existing = stats.document;
  const now = Date.now();
  if (options.consumeBrowserAllowance) {
    assertBrowserSignalAllowance(stats, now);
  }

  const windowExpired =
    now - stats.browserWindowStartedAt >= BROWSER_SIGNAL_WINDOW_MS;
  const browserWindowStartedAt = windowExpired
    ? now
    : stats.browserWindowStartedAt;
  const browserAddsInWindow = options.consumeBrowserAllowance
    ? windowExpired
      ? 1
      : stats.browserAddsInWindow + 1
    : stats.browserAddsInWindow;

  if (!existing) {
    await ctx.db.insert("course_interest_stats", {
      courseId,
      browserCount: Math.max(0, stats.browserCount + delta.browser),
      authenticatedCount: Math.max(
        0,
        stats.authenticatedCount + delta.authenticated,
      ),
      completedAllCount: Math.max(
        0,
        stats.completedAllCount + delta.completedAll,
      ),
      browserWindowStartedAt,
      browserAddsInWindow,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    browserCount: Math.max(0, stats.browserCount + delta.browser),
    authenticatedCount: Math.max(
      0,
      stats.authenticatedCount + delta.authenticated,
    ),
    completedAllCount: Math.max(
      0,
      stats.completedAllCount + delta.completedAll,
    ),
    browserWindowStartedAt,
    browserAddsInWindow,
    updatedAt: now,
  });
}

function signalStatsDelta(signal: InterestSignal, direction: 1 | -1) {
  return {
    browser: getSignalKind(signal) === "browser" ? direction : 0,
    authenticated: getSignalKind(signal) === "account" ? direction : 0,
    completedAll: getSignalCompletedAllAt(signal) !== undefined ? direction : 0,
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
  if (!signal || getSignalCompletedAllAt(signal) !== undefined) return;
  if (!(await hasCompletedAllVisibleStories(ctx, courseId, legacyUserId))) {
    return;
  }

  await applyStatsDelta(ctx, courseId, {
    browser: 0,
    authenticated: 0,
    completedAll: 1,
  });
  await ctx.db.patch(signal._id, {
    completedAllAvailableStoriesAt: Date.now(),
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
        signal !== null && getSignalCompletedAllAt(signal) !== undefined,
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
        await applyStatsDelta(ctx, course._id, signalStatsDelta(signal, -1));
        await ctx.db.delete(signal._id);
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
        getSignalCompletedAllAt(primarySignal) === undefined
      ) {
        await applyStatsDelta(ctx, course._id, {
          browser: 0,
          authenticated: 0,
          completedAll: 1,
        });
        await ctx.db.patch(primarySignal._id, {
          completedAllAvailableStoriesAt: now,
        });
      }
      if (anonymousSignal) {
        await applyStatsDelta(
          ctx,
          course._id,
          signalStatsDelta(anonymousSignal, -1),
        );
        await ctx.db.delete(anonymousSignal._id);
      }
    } else if (anonymousSignal) {
      const alreadyQualified =
        getSignalCompletedAllAt(anonymousSignal) !== undefined;
      await applyStatsDelta(ctx, course._id, {
        browser: -1,
        authenticated: 1,
        completedAll: completedAllAvailableStories && !alreadyQualified ? 1 : 0,
      });
      await ctx.db.patch(anonymousSignal._id, {
        supporterKey: keys.primaryKey,
        supporterKind: keys.primaryKind,
        completedAllAvailableStoriesAt:
          getSignalCompletedAllAt(anonymousSignal) ??
          (completedAllAvailableStories ? now : undefined),
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
        (primarySignal !== null &&
          getSignalCompletedAllAt(primarySignal) !== undefined) ||
        (anonymousSignal !== null &&
          getSignalCompletedAllAt(anonymousSignal) !== undefined),
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
    const stats = await getNormalizedStats(ctx, course._id);
    return {
      browserCount: stats.browserCount,
      authenticatedCount: stats.authenticatedCount,
      completedAllCount: stats.completedAllCount,
    };
  },
});
