/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { createConvexTest } from "../test/convexTestHarness";

async function seedCourse(t: ReturnType<typeof createConvexTest>) {
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
      duo_id: "story-10",
      name: "A story",
      public: true,
      courseId,
      status: "finished",
      deleted: false,
      todo_count: 0,
    });
    return { courseId, storyId };
  });
}

describe("course read stats", () => {
  test("counts completions while deduplicating signed-in learners", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    const now = Date.now();
    const learner = t.withIdentity({ userId: "7" });

    await learner.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 10,
      time: now - 1_000,
    });
    await learner.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 10,
      time: now,
    });
    await t.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 10,
      time: now,
    });

    const stats = await t
      .withIdentity({ role: "contributor" })
      .query(api.courseReadStats.getForEditor, {
        courseIdentifier: "es-en",
        days: 30,
      });
    expect(stats?.totalStoryReads).toBe(3);
    expect(stats?.totalReaders).toBe(1);
    expect(
      stats?.points.reduce((sum, point) => sum + point.storyReads, 0),
    ).toBe(3);
  });

  test("backfills legacy completions idempotently", async () => {
    const t = createConvexTest();
    const { courseId, storyId } = await seedCourse(t);
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("story_done", {
        storyId,
        legacyUserId: 7,
        time: now,
      });
    });

    const admin = t.withIdentity({ role: "admin" });
    for (let run = 0; run < 2; run += 1) {
      const result = await admin.mutation(api.courseReadStats.backfill, {
        paginationOpts: { cursor: null, numItems: 10 },
      });
      expect(result.isDone).toBe(true);
      expect(result.skipped).toBe(0);
    }

    await t.run(async (ctx) => {
      const [completion] = await ctx.db.query("story_done").collect();
      expect(completion?.courseId).toBe(courseId);
      expect(await ctx.db.query("course_readers").collect()).toHaveLength(1);
    });
    const stats = await admin.query(api.courseReadStats.getForEditor, {
      courseIdentifier: "es-en",
    });
    expect(stats?.totalStoryReads).toBe(1);
    expect(stats?.totalReaders).toBe(1);
  });

  test("restricts editor stats and clamps the requested period", async () => {
    const t = createConvexTest();
    await seedCourse(t);

    expect(
      await t.query(api.courseReadStats.getForEditor, {
        courseIdentifier: "es-en",
      }),
    ).toBeNull();

    const stats = await t
      .withIdentity({ role: "contributor" })
      .query(api.courseReadStats.getForEditor, {
        courseIdentifier: "es-en",
        days: 1_000,
      });
    expect(stats?.points).toHaveLength(180);
  });

  test("reports completions whose story no longer exists", async () => {
    const t = createConvexTest();
    const { storyId } = await seedCourse(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(storyId);
      await ctx.db.insert("story_done", {
        storyId,
        time: Date.now(),
      });
    });

    const result = await t
      .withIdentity({ role: "admin" })
      .mutation(api.courseReadStats.backfill, {
        paginationOpts: { cursor: null, numItems: 10 },
      });
    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
