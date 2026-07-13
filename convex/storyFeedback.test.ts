/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function expectFeedbackRejection(
  request: Promise<unknown>,
  code: string,
  reason: string,
) {
  const rejection = await request.then(
    () => null,
    (error: unknown) => error,
  );
  expect(rejection).toBeInstanceOf(ConvexError);
  expect(
    (rejection as ConvexError<{ code: string; reason: string }>).data,
  ).toEqual({ code, reason });
}

type FeedbackArgs = {
  storyId: number;
  operationKey: string;
  storyTitle?: string;
  courseShort?: string;
  line?: number;
  lineIndex?: number;
  lineText?: string;
  lineElement?: unknown;
  category: "Text" | "Translation hints" | "Audio" | "Other";
  comment: string;
};

const parsedLineElement = {
  type: "LINE",
  line: {
    type: "PROSE",
    content: {
      text: "Hola",
      hintMap: [{ hintIndex: 0, rangeFrom: 0, rangeTo: 3 }],
      hints: ["Hello"],
      audio: {
        ssml: {
          text: "Hola",
          speaker: "es",
          id: 1,
          inser_index: 0,
        },
        url: "story-line.mp3",
        keypoints: [{ rangeEnd: 4, audioStart: 120 }],
      },
    },
  },
  trackingProperties: { line_index: 1 },
  lang: "es",
  editor: { block_start_no: 12 },
};

async function seedCourseWithStory(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const learningLanguageId = await ctx.db.insert("languages", {
      legacyId: 1,
      name: "Spanish",
      short: "es",
      public: true,
      rtl: false,
    });
    const fromLanguageId = await ctx.db.insert("languages", {
      legacyId: 2,
      name: "English",
      short: "en",
      public: true,
      rtl: false,
    });
    const courseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: "es-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
    });
    const storyId = await ctx.db.insert("stories", {
      legacyId: 10,
      duo_id: "story-duo-10",
      name: "Story",
      set_id: 1,
      set_index: 1,
      public: true,
      courseId,
      status: "finished",
      deleted: false,
      todo_count: 0,
    });
    await ctx.db.insert("story_content", {
      storyId,
      text: "[Story]\nHola",
      json: { elements: [parsedLineElement] },
      lastUpdated: 1,
    });
    return { courseId, storyId };
  });
}

function feedbackArgs(overrides: Partial<FeedbackArgs> = {}): FeedbackArgs {
  return {
    storyId: 10,
    operationKey: "feedback-operation-key",
    category: "Text" as const,
    comment: "There is a typo.",
    ...overrides,
  };
}

describe("submitStoryFeedback", () => {
  test.each([
    [
      "storyTitle",
      { storyTitle: `${"x".repeat(201)}` },
      "Story title is too long",
    ],
    [
      "courseShort",
      { courseShort: `${"x".repeat(21)}` },
      "Course short is too long",
    ],
    ["lineText", { lineText: `${"x".repeat(501)}` }, "Line text is too long"],
    [
      "lineElement",
      { lineElement: { text: `${"x".repeat(20001)}` } },
      "Line preview is too large",
    ],
    [
      "operationKey",
      { operationKey: `${"x".repeat(201)}` },
      "Operation key is too long",
    ],
  ])("%s length cap rejects oversized values", async (_field, overrides, error) => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expectFeedbackRejection(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs(overrides),
      ),
      "INVALID_REQUEST",
      error,
    );
  });

  test("comment validation returns a correctable rejection", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expectFeedbackRejection(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs({ comment: "x".repeat(2001) }),
      ),
      "INVALID_COMMENT",
      "Comment is too long",
    );
  });

  test("unknown story rejects before inserting a report", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expectFeedbackRejection(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs({ storyId: 999 }),
      ),
      "FEEDBACK_UNAVAILABLE",
      "Unknown story",
    );

    await t.run(async (ctx) => {
      const reports = await ctx.db.query("story_feedback_reports").collect();
      expect(reports).toHaveLength(0);
    });
  });

  test("a story with 25 open reports rejects another open report", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.run(async (ctx) => {
      for (let i = 0; i < 25; i += 1) {
        await ctx.db.insert("story_feedback_reports", {
          storyId: 10,
          storyTitle: "Story",
          courseShort: "es-en",
          category: "Text",
          comment: `Open report ${i}`,
          userId: null,
          userName: null,
          userEmail: null,
          status: "open",
          createdAt: i,
        });
      }
    });

    await expectFeedbackRejection(
      t.mutation(api.storyFeedback.submitStoryFeedback, feedbackArgs()),
      "STORY_REPORT_LIMIT",
      "This story already has many open reports. Please try again later.",
    );
  });

  test("derives course, title, and line preview data for review rendering", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.mutation(
      api.storyFeedback.submitStoryFeedback,
      feedbackArgs({
        storyTitle: "Spoofed title",
        courseShort: "fr-en",
        line: 12,
        lineText: "Spoofed line",
        lineElement: { type: "LINE", bogus: true },
      }),
    );

    await t.run(async (ctx) => {
      const [report] = await ctx.db.query("story_feedback_reports").collect();
      expect(report.operationKey).toBe("feedback-operation-key");
      expect(report.storyTitle).toBe("Story");
      expect(report.courseShort).toBe("es-en");
      expect(report.line).toBe(12);
      expect(report.lineText).toBe("Hola");
      expect(report.lineElement).toEqual(parsedLineElement);
    });
  });

  test("uses operation keys to make repeated submissions idempotent", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    const first = await t.mutation(
      api.storyFeedback.submitStoryFeedback,
      feedbackArgs({ operationKey: "feedback:retry:1" }),
    );
    const second = await t.mutation(
      api.storyFeedback.submitStoryFeedback,
      feedbackArgs({
        operationKey: "feedback:retry:1",
        comment: "Retried after success",
      }),
    );

    expect(second.reportId).toBe(first.reportId);
    await t.run(async (ctx) => {
      const reports = await ctx.db.query("story_feedback_reports").collect();
      const [stats] = await ctx.db.query("course_feedback_stats").collect();
      expect(reports).toHaveLength(1);
      expect(stats.openCount).toBe(1);
      expect(stats.reviewedCount).toBe(0);
    });
  });

  test("derives the canonical editor line from a public tracking index", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.mutation(
      api.storyFeedback.submitStoryFeedback,
      feedbackArgs({ lineIndex: 1, lineText: "Spoofed line" }),
    );

    await t.run(async (ctx) => {
      const report = await ctx.db.query("story_feedback_reports").unique();
      expect(report).not.toBeNull();
      if (!report) return;
      expect(report.line).toBe(12);
      expect(report.lineText).toBe("Hola");
      expect(report.lineElement).toEqual(parsedLineElement);
    });
  });

  test("rejects an invalid public tracking index", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expectFeedbackRejection(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs({ lineIndex: -1 }),
      ),
      "INVALID_REQUEST",
      "Line index must be a non-negative integer",
    );
  });

  test("rejects an invalid editor line", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expectFeedbackRejection(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs({ line: -1 }),
      ),
      "INVALID_REQUEST",
      "Line must be a non-negative integer",
    );
  });

  test("stores sanitized text fallback when no line number is available", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.mutation(
      api.storyFeedback.submitStoryFeedback,
      feedbackArgs({ lineText: "  Seen text\r\nsecond line  " }),
    );

    await t.run(async (ctx) => {
      const [report] = await ctx.db.query("story_feedback_reports").collect();
      expect(report.line).toBeUndefined();
      expect(report.lineText).toBe("Seen text\nsecond line");
      expect(report.lineElement).toBeUndefined();
    });
  });
});

describe("course feedback stats", () => {
  test("submit and status updates maintain unresolved course counts", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.mutation(api.storyFeedback.submitStoryFeedback, feedbackArgs());

    await t.run(async (ctx) => {
      const [stats] = await ctx.db.query("course_feedback_stats").collect();
      expect(stats.openCount).toBe(1);
      expect(stats.reviewedCount).toBe(0);
    });

    const asContributor = t.withIdentity({ role: "contributor", userId: "5" });
    const reportId = await t.run(async (ctx) => {
      const [report] = await ctx.db.query("story_feedback_reports").collect();
      return report._id;
    });

    await asContributor.mutation(api.storyFeedback.updateStoryFeedbackStatus, {
      reportId,
      status: "reviewed",
    });

    await t.run(async (ctx) => {
      const [stats] = await ctx.db.query("course_feedback_stats").collect();
      expect(stats.openCount).toBe(0);
      expect(stats.reviewedCount).toBe(1);
    });

    await asContributor.mutation(api.storyFeedback.updateStoryFeedbackStatus, {
      reportId,
      status: "resolved",
    });

    await t.run(async (ctx) => {
      const [stats] = await ctx.db.query("course_feedback_stats").collect();
      expect(stats.openCount).toBe(0);
      expect(stats.reviewedCount).toBe(0);
    });
  });

  test("admin recompute rebuilds stats from existing reports", async () => {
    const t = convexTest(schema, modules);
    const { courseId } = await seedCourseWithStory(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("story_feedback_reports", {
        storyId: 10,
        storyTitle: "Story",
        courseShort: "spoofed",
        category: "Text",
        comment: "Open",
        userId: null,
        userName: null,
        userEmail: null,
        status: "open",
        createdAt: 1,
      });
      await ctx.db.insert("story_feedback_reports", {
        storyId: 10,
        storyTitle: "Story",
        courseShort: "spoofed",
        category: "Text",
        comment: "Reviewed",
        userId: null,
        userName: null,
        userEmail: null,
        status: "reviewed",
        createdAt: 2,
      });
      await ctx.db.insert("story_feedback_reports", {
        storyId: 10,
        storyTitle: "Story",
        courseShort: "spoofed",
        category: "Text",
        comment: "Resolved",
        userId: null,
        userName: null,
        userEmail: null,
        status: "resolved",
        createdAt: 3,
      });
    });

    await expect(
      t
        .withIdentity({ role: "contributor", userId: "5" })
        .mutation(api.storyFeedback.recomputeCourseFeedbackStats, {}),
    ).rejects.toThrow("Unauthorized");

    const result = await t
      .withIdentity({ role: "admin", userId: "1" })
      .mutation(api.storyFeedback.recomputeCourseFeedbackStats, {});
    expect(result.reportsCounted).toBe(2);

    await t.run(async (ctx) => {
      const stats = await ctx.db
        .query("course_feedback_stats")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .unique();
      expect(stats?.courseShort).toBe("es-en");
      expect(stats?.openCount).toBe(1);
      expect(stats?.reviewedCount).toBe(1);

      const reports = await ctx.db.query("story_feedback_reports").collect();
      expect(reports.map((report) => report.courseShort)).toEqual([
        "es-en",
        "es-en",
        "es-en",
      ]);
    });
  });
});

describe("listStoryFeedbackReports", () => {
  test("requires contributor authorization", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.storyFeedback.listStoryFeedbackReports, {
        status: "open",
        paginationOpts: { numItems: 2, cursor: null },
      }),
    ).rejects.toThrow("Unauthorized");
  });

  test("paginates reports by status from newest to oldest", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.run(async (ctx) => {
      for (const createdAt of [100, 200, 300]) {
        await ctx.db.insert("story_feedback_reports", {
          storyId: 10,
          storyTitle: "Story",
          courseShort: "es-en",
          category: "Text",
          comment: `Report ${createdAt}`,
          userId: null,
          userName: null,
          userEmail: null,
          status: "open",
          createdAt,
        });
      }
      await ctx.db.insert("story_feedback_reports", {
        storyId: 10,
        storyTitle: "Story",
        courseShort: "es-en",
        category: "Text",
        comment: "Resolved report",
        userId: null,
        userName: null,
        userEmail: null,
        status: "resolved",
        createdAt: 400,
      });
    });

    const asContributor = t.withIdentity({ role: "contributor", userId: "5" });
    const firstPage = await asContributor.query(
      api.storyFeedback.listStoryFeedbackReports,
      {
        status: "open",
        paginationOpts: { numItems: 2, cursor: null },
      },
    );

    expect(firstPage.page.map((report) => report.comment)).toEqual([
      "Report 300",
      "Report 200",
    ]);
    expect(firstPage.isDone).toBe(false);

    const secondPage = await asContributor.query(
      api.storyFeedback.listStoryFeedbackReports,
      {
        status: "open",
        paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
      },
    );

    expect(secondPage.page.map((report) => report.comment)).toEqual([
      "Report 100",
    ]);
    expect(secondPage.isDone).toBe(true);
  });

  test("filters reports by course short", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await t.run(async (ctx) => {
      for (const [courseShort, createdAt] of [
        ["es-en", 100],
        ["fr-en", 200],
        ["es-en", 300],
      ] as const) {
        await ctx.db.insert("story_feedback_reports", {
          storyId: 10,
          storyTitle: "Story",
          courseShort,
          category: "Text",
          comment: `${courseShort} report ${createdAt}`,
          userId: null,
          userName: null,
          userEmail: null,
          status: "open",
          createdAt,
        });
      }
    });

    const asContributor = t.withIdentity({ role: "contributor", userId: "5" });
    const page = await asContributor.query(
      api.storyFeedback.listStoryFeedbackReports,
      {
        status: "open",
        courseShort: "es-en",
        paginationOpts: { numItems: 10, cursor: null },
      },
    );

    expect(page.page.map((report) => report.comment)).toEqual([
      "es-en report 300",
      "es-en report 100",
    ]);
  });
});
