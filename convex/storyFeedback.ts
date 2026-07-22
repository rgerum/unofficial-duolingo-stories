import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdmin, requireContributorOrAdmin } from "./lib/authorization";
import {
  type FeedbackStatus,
  feedbackStatuses,
  feedbackStatusValidator,
} from "./storyFeedbackStatus";

const feedbackCategoryValidator = v.union(
  v.literal("Text"),
  v.literal("Translation hints"),
  v.literal("Audio"),
  v.literal("Other"),
);

const feedbackSourceValidator = v.union(
  v.literal("web"),
  v.literal("android"),
  v.literal("ios"),
);

const feedbackReportValidator = v.object({
  _id: v.id("story_feedback_reports"),
  _creationTime: v.number(),
  operationKey: v.optional(v.string()),
  storyId: v.number(),
  storyTitle: v.string(),
  courseShort: v.string(),
  line: v.optional(v.number()),
  lineText: v.optional(v.string()),
  lineElement: v.optional(v.any()),
  source: v.optional(feedbackSourceValidator),
  category: feedbackCategoryValidator,
  comment: v.string(),
  userId: v.union(v.string(), v.null()),
  userName: v.union(v.string(), v.null()),
  userEmail: v.union(v.string(), v.null()),
  status: feedbackStatusValidator,
  createdAt: v.number(),
});

type CourseDoc = Doc<"courses">;
type StoryContentDoc = Doc<"story_content">;

export type FeedbackRejectionCode =
  | "FEEDBACK_BLOCKED"
  | "FEEDBACK_DISABLED"
  | "FEEDBACK_UNAVAILABLE"
  | "INVALID_COMMENT"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "SIGN_IN_REQUIRED"
  | "STORY_REPORT_LIMIT";

function rejectFeedback(code: FeedbackRejectionCode, reason: string): never {
  throw new ConvexError({ code, reason });
}

function normalizeOptionalLineText(value: string | undefined) {
  const text = value?.replace(/\r\n?/g, "\n").trim();
  if (!text) return undefined;
  if (text.length > 500) {
    rejectFeedback("INVALID_REQUEST", "Line text is too long");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    rejectFeedback(
      "INVALID_REQUEST",
      "Line text contains unsupported characters",
    );
  }
  return text;
}

function normalizeDerivedLineText(value: string | undefined) {
  const text = value?.replace(/\r\n?/g, "\n").trim();
  if (!text) return undefined;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    return undefined;
  }
  return text.length > 500 ? text.slice(0, 500) : text;
}

function getCourseShort(course: CourseDoc) {
  return course.short?.trim() || `${course.legacyId}`;
}

function parseStoryJson(storyContent: StoryContentDoc | null) {
  if (!storyContent) return null;
  if (typeof storyContent.json === "string") {
    try {
      return JSON.parse(storyContent.json) as unknown;
    } catch {
      return null;
    }
  }
  return storyContent.json as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getLineTextFromElement(element: Record<string, unknown>) {
  const line = element.line;
  if (!isRecord(line)) return undefined;
  const content = line.content;
  if (!isRecord(content) || typeof content.text !== "string") return undefined;

  const speaker =
    line.type === "CHARACTER"
      ? typeof line.characterName === "string"
        ? line.characterName
        : typeof line.characterId === "string" ||
            typeof line.characterId === "number"
          ? `${line.characterId}`
          : ""
      : "";

  return speaker ? `${speaker}: ${content.text}` : content.text;
}

function editorLineMatches(
  element: Record<string, unknown>,
  lineNumber: number,
) {
  const editor = element.editor;
  if (!isRecord(editor)) return false;
  return (
    editor.block_start_no === lineNumber ||
    editor.start_no === lineNumber ||
    editor.active_no === lineNumber
  );
}

function trackingLineMatches(
  element: Record<string, unknown>,
  lineIndex: number,
) {
  const trackingProperties = element.trackingProperties;
  return (
    isRecord(trackingProperties) && trackingProperties.line_index === lineIndex
  );
}

function getEditorLineFromElement(element: Record<string, unknown>) {
  const editor = element.editor;
  if (!isRecord(editor)) return undefined;
  for (const key of ["block_start_no", "start_no", "active_no"]) {
    const value = editor[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

function getLineSnapshotFromStoryJson(
  storyJson: unknown,
  lineNumber?: number,
  lineIndex?: number,
) {
  if (lineNumber === undefined && lineIndex === undefined) return undefined;
  if (!isRecord(storyJson) || !Array.isArray(storyJson.elements)) {
    return undefined;
  }

  const element = storyJson.elements.find(
    (candidate) =>
      isRecord(candidate) &&
      candidate.type === "LINE" &&
      (lineNumber !== undefined
        ? editorLineMatches(candidate, lineNumber)
        : lineIndex !== undefined && trackingLineMatches(candidate, lineIndex)),
  );
  if (!isRecord(element)) return undefined;

  const serialized = JSON.stringify(element);
  if (serialized.length > 50000) return undefined;
  return JSON.parse(serialized) as unknown;
}

function getStatusDelta(status: FeedbackStatus, delta: number) {
  return {
    openCount: status === "open" ? delta : 0,
    reviewedCount: status === "reviewed" ? delta : 0,
  };
}

async function applyCourseFeedbackStatsDelta(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  courseShort: string,
  openDelta: number,
  reviewedDelta: number,
) {
  if (openDelta === 0 && reviewedDelta === 0) return;

  const now = Date.now();
  const existing = await ctx.db
    .query("course_feedback_stats")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .unique();

  if (!existing) {
    await ctx.db.insert("course_feedback_stats", {
      courseId,
      courseShort,
      openCount: Math.max(0, openDelta),
      reviewedCount: Math.max(0, reviewedDelta),
      updatedAt: now,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    courseShort,
    openCount: Math.max(0, existing.openCount + openDelta),
    reviewedCount: Math.max(0, existing.reviewedCount + reviewedDelta),
    updatedAt: now,
  });
}

async function getStoryCourseAndContent(
  ctx: MutationCtx,
  legacyStoryId: number,
) {
  const story = await ctx.db
    .query("stories")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyStoryId))
    .unique();
  if (!story) {
    rejectFeedback("FEEDBACK_UNAVAILABLE", "Unknown story");
  }

  const [course, storyContent] = await Promise.all([
    ctx.db.get(story.courseId),
    ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .unique(),
  ]);
  if (!course) {
    rejectFeedback("FEEDBACK_UNAVAILABLE", "Unknown course");
  }

  return { story, course, storyContent };
}

export const submitStoryFeedback = mutation({
  args: {
    storyId: v.number(),
    operationKey: v.string(),
    // TODO(remove after 2026-07-20): deprecated; derived server-side.
    storyTitle: v.optional(v.string()),
    // TODO(remove after 2026-07-20): deprecated; derived server-side.
    courseShort: v.optional(v.string()),
    line: v.optional(v.number()),
    // Public story content omits editor metadata, so mobile identifies the
    // active source element by its public tracking index instead.
    lineIndex: v.optional(v.number()),
    lineText: v.optional(v.string()),
    // Optional while previously released clients age out.
    source: v.optional(feedbackSourceValidator),
    // TODO(remove after 2026-07-20): deprecated; ignored for trust safety.
    lineElement: v.optional(v.any()),
    category: feedbackCategoryValidator,
    comment: v.string(),
  },
  returns: v.object({
    reportId: v.id("story_feedback_reports"),
  }),
  handler: async (ctx, args) => {
    const operationKey = args.operationKey.trim();
    if (!operationKey) {
      rejectFeedback("INVALID_REQUEST", "Operation key is required");
    }
    if (operationKey.length > 200) {
      rejectFeedback("INVALID_REQUEST", "Operation key is too long");
    }

    const comment = args.comment.trim();
    if (!comment) {
      rejectFeedback("INVALID_COMMENT", "Comment is required");
    }
    if (comment.length > 2000) {
      rejectFeedback("INVALID_COMMENT", "Comment is too long");
    }

    if (args.storyTitle !== undefined && args.storyTitle.length > 200) {
      rejectFeedback("INVALID_REQUEST", "Story title is too long");
    }
    if (args.courseShort !== undefined && args.courseShort.length > 20) {
      rejectFeedback("INVALID_REQUEST", "Course short is too long");
    }

    const submittedLineText = normalizeOptionalLineText(args.lineText);
    if (
      args.line !== undefined &&
      (!Number.isSafeInteger(args.line) || args.line < 0)
    ) {
      rejectFeedback("INVALID_REQUEST", "Line must be a non-negative integer");
    }
    if (
      args.lineIndex !== undefined &&
      (!Number.isSafeInteger(args.lineIndex) || args.lineIndex < 0)
    ) {
      rejectFeedback(
        "INVALID_REQUEST",
        "Line index must be a non-negative integer",
      );
    }
    if (args.lineElement !== undefined) {
      const serializedLineElement = JSON.stringify(args.lineElement);
      if (serializedLineElement.length > 20000) {
        rejectFeedback("INVALID_REQUEST", "Line preview is too large");
      }
    }

    const existingReport = await ctx.db
      .query("story_feedback_reports")
      .withIndex("by_operation_key", (q) => q.eq("operationKey", operationKey))
      .unique();
    if (existingReport) {
      return { reportId: existingReport._id };
    }

    const { story, course, storyContent } = await getStoryCourseAndContent(
      ctx,
      args.storyId,
    );

    const openReports = await ctx.db
      .query("story_feedback_reports")
      .withIndex("by_story_and_status", (q) =>
        q.eq("storyId", args.storyId).eq("status", "open"),
      )
      .take(25);
    if (openReports.length >= 25) {
      rejectFeedback(
        "STORY_REPORT_LIMIT",
        "This story already has many open reports. Please try again later.",
      );
    }

    const identity = (await ctx.auth.getUserIdentity()) as {
      tokenIdentifier?: string | null;
      name?: string | null;
      email?: string | null;
    } | null;

    const storyJson = parseStoryJson(storyContent);
    const lineElement = getLineSnapshotFromStoryJson(
      storyJson,
      args.line,
      args.lineIndex,
    );
    const line =
      args.line ??
      (isRecord(lineElement)
        ? getEditorLineFromElement(lineElement)
        : undefined);
    const derivedLineText = isRecord(lineElement)
      ? getLineTextFromElement(lineElement)
      : undefined;
    const lineText =
      derivedLineText !== undefined
        ? normalizeDerivedLineText(derivedLineText)
        : submittedLineText;
    const storyTitle = story.name;
    const courseShort = getCourseShort(course);

    const reportId = await ctx.db.insert("story_feedback_reports", {
      operationKey,
      storyId: args.storyId,
      storyTitle,
      courseShort,
      ...(line !== undefined ? { line } : {}),
      ...(lineText ? { lineText } : {}),
      ...(lineElement !== undefined ? { lineElement } : {}),
      ...(args.source !== undefined ? { source: args.source } : {}),
      category: args.category,
      comment,
      userId: identity?.tokenIdentifier ?? null,
      userName: identity?.name?.trim() || null,
      userEmail: identity?.email?.trim() || null,
      status: "open",
      createdAt: Date.now(),
    });

    await applyCourseFeedbackStatsDelta(ctx, story.courseId, courseShort, 1, 0);

    return { reportId };
  },
});

export const listStoryFeedbackReports = query({
  args: {
    status: feedbackStatusValidator,
    courseShort: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(feedbackReportValidator),
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    const courseShort = args.courseShort;
    if (courseShort !== undefined) {
      return await ctx.db
        .query("story_feedback_reports")
        .withIndex("by_course_short_status_created_at", (q) =>
          q.eq("courseShort", courseShort).eq("status", args.status),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("story_feedback_reports")
      .withIndex("by_status_and_created_at", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const updateStoryFeedbackStatus = mutation({
  args: {
    reportId: v.id("story_feedback_reports"),
    status: feedbackStatusValidator,
  },
  returns: feedbackReportValidator,
  handler: async (ctx, args) => {
    await requireContributorOrAdmin(ctx);

    const existing = await ctx.db.get(args.reportId);
    if (!existing) {
      throw new Error("Feedback report not found");
    }

    const { story, course } = await getStoryCourseAndContent(
      ctx,
      existing.storyId,
    );
    const courseShort = getCourseShort(course);

    await ctx.db.patch(args.reportId, {
      status: args.status,
      storyTitle: story.name,
      courseShort,
    });

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Feedback report not found");
    }

    const previousDelta = getStatusDelta(existing.status, -1);
    const nextDelta = getStatusDelta(args.status, 1);
    await applyCourseFeedbackStatsDelta(
      ctx,
      story.courseId,
      courseShort,
      previousDelta.openCount + nextDelta.openCount,
      previousDelta.reviewedCount + nextDelta.reviewedCount,
    );

    return report;
  },
});

export const recomputeCourseFeedbackStats = mutation({
  args: {
    courseCursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    coursesUpdated: v.number(),
    reportsCounted: v.number(),
    nextCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
    const coursePage = await ctx.db
      .query("courses")
      .paginate({ cursor: args.courseCursor ?? null, numItems: limit });

    let coursesUpdated = 0;
    let reportsCounted = 0;

    for (const course of coursePage.page) {
      const courseShort = getCourseShort(course);
      let openCount = 0;
      let reviewedCount = 0;

      const stories = ctx.db
        .query("stories")
        .withIndex("by_course", (q) => q.eq("courseId", course._id));

      for await (const story of stories) {
        const legacyStoryId = story.legacyId;
        if (legacyStoryId === undefined) continue;

        for (const status of feedbackStatuses) {
          const reports = ctx.db
            .query("story_feedback_reports")
            .withIndex("by_story_and_status", (q) =>
              q.eq("storyId", legacyStoryId).eq("status", status),
            );

          for await (const report of reports) {
            if (
              report.courseShort !== courseShort ||
              report.storyTitle !== story.name
            ) {
              await ctx.db.patch(report._id, {
                courseShort,
                storyTitle: story.name,
              });
            }

            if (status === "open") {
              openCount += 1;
              reportsCounted += 1;
            } else if (status === "reviewed") {
              reviewedCount += 1;
              reportsCounted += 1;
            }
          }
        }
      }

      const current = await ctx.db
        .query("course_feedback_stats")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .unique();
      const now = Date.now();
      if (!current) {
        await ctx.db.insert("course_feedback_stats", {
          courseId: course._id,
          courseShort,
          openCount,
          reviewedCount,
          updatedAt: now,
        });
        coursesUpdated += 1;
        continue;
      }

      await ctx.db.patch(current._id, {
        courseShort,
        openCount,
        reviewedCount,
        updatedAt: now,
      });
      coursesUpdated += 1;
    }

    return {
      coursesUpdated,
      reportsCounted,
      nextCursor: coursePage.isDone ? null : coursePage.continueCursor,
      isDone: coursePage.isDone,
    };
  },
});
