/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type FeedbackArgs = {
  storyId: number;
  storyTitle: string;
  courseShort: string;
  line?: number;
  lineText?: string;
  lineElement?: unknown;
  category: "Text" | "Translation hints" | "Audio" | "Other";
  comment: string;
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
    return { courseId, storyId };
  });
}

function feedbackArgs(overrides: Partial<FeedbackArgs> = {}): FeedbackArgs {
  return {
    storyId: 10,
    storyTitle: "Story",
    courseShort: "es-en",
    category: "Text" as const,
    comment: "There is a typo.",
    ...overrides,
  };
}

describe("submitStoryFeedback", () => {
  test.each([
    ["comment", { comment: `${"x".repeat(2001)}` }, "Comment is too long"],
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
  ])("%s length cap rejects oversized values", async (_field, overrides, error) => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expect(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs(overrides),
      ),
    ).rejects.toThrow(error);
  });

  test("unknown story rejects before inserting a report", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expect(
      t.mutation(
        api.storyFeedback.submitStoryFeedback,
        feedbackArgs({ storyId: 999 }),
      ),
    ).rejects.toThrow("Unknown story");

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

    await expect(
      t.mutation(api.storyFeedback.submitStoryFeedback, feedbackArgs()),
    ).rejects.toThrow(
      "This story already has many open reports. Please try again later.",
    );
  });

  test("stores line preview data for review rendering", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    const lineElement = {
      type: "LINE",
      line: {
        type: "PROSE",
        content: {
          text: "Hola",
          hintMap: [{ hintIndex: 0, rangeFrom: 0, rangeTo: 3 }],
          hints: ["Hello"],
        },
      },
      trackingProperties: { line_index: 1 },
      lang: "es",
      editor: { block_start_no: 12 },
    };

    await t.mutation(
      api.storyFeedback.submitStoryFeedback,
      feedbackArgs({ line: 12, lineElement }),
    );

    await t.run(async (ctx) => {
      const [report] = await ctx.db.query("story_feedback_reports").collect();
      expect(report.line).toBe(12);
      expect(report.lineElement).toEqual(lineElement);
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
