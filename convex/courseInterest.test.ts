/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { createConvexTest } from "../test/convexTestHarness";

async function seedCourse(t: ReturnType<typeof createConvexTest>) {
  return await t.run(async (ctx) => {
    const learningLanguageId = await ctx.db.insert("languages", {
      legacyId: 1,
      name: "Welsh",
      short: "cy",
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
    const imageId = await ctx.db.insert("images", {
      legacyId: "welsh-interest",
      active: "active.svg",
      gilded: "gilded.svg",
      locked: "locked.svg",
      active_lip: "active-lip.svg",
      gilded_lip: "gilded-lip.svg",
    });
    const courseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: "cy-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
      count: 2,
    });
    const firstStoryId = await ctx.db.insert("stories", {
      legacyId: 10,
      name: "First",
      public: true,
      deleted: false,
      courseId,
      imageId,
      status: "finished",
      todo_count: 0,
    });
    const secondStoryId = await ctx.db.insert("stories", {
      legacyId: 11,
      name: "Second",
      public: true,
      deleted: false,
      courseId,
      imageId,
      status: "finished",
      todo_count: 0,
    });
    return { courseId, firstStoryId, secondStoryId, imageId };
  });
}

describe("course interest", () => {
  test("an anonymous learner can add and remove one signal", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    const args = {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
    };

    expect(await t.query(api.courseInterest.getForLearner, args)).toEqual({
      interested: false,
      completedAllAvailableStories: false,
    });

    expect(
      await t.mutation(api.courseInterest.setForLearner, {
        ...args,
        interested: true,
      }),
    ).toEqual({
      interested: true,
      completedAllAvailableStories: false,
    });
    expect(
      await t.mutation(api.courseInterest.setForLearner, {
        ...args,
        interested: true,
      }),
    ).toEqual({
      interested: true,
      completedAllAvailableStories: false,
    });

    expect(
      await t.mutation(api.courseInterest.setForLearner, {
        ...args,
        interested: false,
      }),
    ).toEqual({
      interested: false,
      completedAllAvailableStories: false,
    });
  });

  test("marks a signed-in signal when every story is complete", async () => {
    const t = createConvexTest();
    const { courseId, firstStoryId, secondStoryId } = await seedCourse(t);
    await t.run(async (ctx) => {
      for (const [storyId, legacyStoryId] of [
        [firstStoryId, 10],
        [secondStoryId, 11],
      ] as const) {
        await ctx.db.insert("story_done_state", {
          storyId,
          courseId,
          legacyStoryId,
          legacyCourseId: 100,
          legacyUserId: 7,
          lastDoneAt: Date.now(),
        });
      }
    });

    const learner = t.withIdentity({ userId: "7", role: "user" });
    const result = await learner.mutation(api.courseInterest.setForLearner, {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
      interested: true,
    });
    expect(result).toMatchObject({
      interested: true,
      completedAllAvailableStories: true,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toMatchObject({
      authenticatedCount: 1,
      browserCount: 0,
      completedAllCount: 1,
    });
  });

  test("does not substitute a deleted completion for a visible story", async () => {
    const t = createConvexTest();
    const { courseId, firstStoryId, imageId } = await seedCourse(t);
    const deletedStoryId = await t.run(async (ctx) => {
      return await ctx.db.insert("stories", {
        legacyId: 12,
        name: "Deleted",
        public: true,
        deleted: true,
        courseId,
        imageId,
        status: "finished",
        todo_count: 0,
      });
    });
    await t.run(async (ctx) => {
      for (const [storyId, legacyStoryId] of [
        [firstStoryId, 10],
        [deletedStoryId, 12],
      ] as const) {
        await ctx.db.insert("story_done_state", {
          storyId,
          courseId,
          legacyStoryId,
          legacyCourseId: 100,
          legacyUserId: 7,
          lastDoneAt: Date.now(),
        });
      }
    });

    const learner = t.withIdentity({ userId: "7", role: "user" });
    expect(
      await learner.mutation(api.courseInterest.setForLearner, {
        courseShort: "cy-en",
        anonymousId: "browser_supporter_123456",
        interested: true,
      }),
    ).toMatchObject({ completedAllAvailableStories: false });
  });

  test("upgrades an existing signal when the learner finishes the final story", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    const learner = t.withIdentity({ userId: "7", role: "user" });
    await learner.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 10,
    });
    await learner.mutation(api.courseInterest.setForLearner, {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
      interested: true,
    });

    await learner.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 11,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toMatchObject({
      authenticatedCount: 1,
      browserCount: 0,
      completedAllCount: 1,
    });
  });

  test("keeps qualification as a historical achievement after publication", async () => {
    const t = createConvexTest();
    const { courseId, firstStoryId, secondStoryId, imageId } =
      await seedCourse(t);
    await t.run(async (ctx) => {
      for (const [storyId, legacyStoryId] of [
        [firstStoryId, 10],
        [secondStoryId, 11],
      ] as const) {
        await ctx.db.insert("story_done_state", {
          storyId,
          courseId,
          legacyStoryId,
          legacyCourseId: 100,
          legacyUserId: 7,
          lastDoneAt: Date.now(),
        });
      }
    });
    const learner = t.withIdentity({ userId: "7", role: "user" });
    await learner.mutation(api.courseInterest.setForLearner, {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
      interested: true,
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("stories", {
        legacyId: 13,
        name: "Newly published",
        public: true,
        deleted: false,
        courseId,
        imageId,
        status: "finished",
        todo_count: 0,
      });
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toMatchObject({ completedAllCount: 1 });
  });

  test("merges a browser signal into the signed-in learner", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    const args = {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
      interested: true,
    };
    await t.mutation(api.courseInterest.setForLearner, args);

    const learner = t.withIdentity({ userId: "7", role: "user" });
    expect(
      await learner.mutation(api.courseInterest.setForLearner, args),
    ).toEqual({
      interested: true,
      completedAllAvailableStories: false,
    });

    const signals = await t.run(async (ctx) => {
      return await ctx.db.query("course_interest_signals").collect();
    });
    expect(signals).toHaveLength(1);
    expect(signals[0]?.supporterKey).toBe("user:7");
  });

  test("separates browser and authenticated evidence", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    await t.mutation(api.courseInterest.setForLearner, {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
      interested: true,
    });
    const learner = t.withIdentity({ userId: "7", role: "user" });
    await learner.mutation(api.courseInterest.setForLearner, {
      courseShort: "cy-en",
      anonymousId: "another_browser_123456",
      interested: true,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toMatchObject({
      authenticatedCount: 1,
      browserCount: 1,
      completedAllCount: 0,
    });
  });

  test("ranks courses by total learner interest for editors", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    await t.run(async (ctx) => {
      const learningLanguageId = await ctx.db.insert("languages", {
        legacyId: 3,
        name: "Gaelic",
        short: "gd",
        public: true,
        rtl: false,
      });
      const fromLanguage = await ctx.db
        .query("languages")
        .withIndex("by_short", (q) => q.eq("short", "en"))
        .unique();
      if (!fromLanguage) throw new Error("Missing seeded English language.");
      await ctx.db.insert("courses", {
        legacyId: 101,
        short: "gd-en",
        learningLanguageId,
        fromLanguageId: fromLanguage._id,
        public: true,
        official: false,
        count: 1,
      });
    });

    await t.mutation(api.courseInterest.setForLearner, {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
      interested: true,
    });
    await t.mutation(api.courseInterest.setForLearner, {
      courseShort: "gd-en",
      anonymousId: "another_browser_123456",
      interested: true,
    });
    const learner = t.withIdentity({ userId: "7", role: "user" });
    await learner.mutation(api.courseInterest.setForLearner, {
      courseShort: "gd-en",
      anonymousId: "signed_in_browser_123456",
      interested: true,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(await editor.query(api.courseInterest.listForEditor, {})).toEqual([
      {
        courseShort: "gd-en",
        learningLanguageId: expect.anything(),
        learningLanguageName: "Gaelic",
        fromLanguageShort: "en",
        public: true,
        storyCount: 1,
        totalCount: 2,
        completedAllCount: 0,
      },
      {
        courseShort: "cy-en",
        learningLanguageId: expect.anything(),
        learningLanguageName: "Welsh",
        fromLanguageShort: "en",
        public: true,
        storyCount: 2,
        totalCount: 1,
        completedAllCount: 0,
      },
    ]);
  });

  test("hides courses whose signals were all withdrawn", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    const args = {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
    };
    await t.mutation(api.courseInterest.setForLearner, {
      ...args,
      interested: true,
    });
    await t.mutation(api.courseInterest.setForLearner, {
      ...args,
      interested: false,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(await editor.query(api.courseInterest.listForEditor, {})).toEqual(
      [],
    );
  });

  test("rejects the interest ranking for non-contributors", async () => {
    const t = createConvexTest();
    await seedCourse(t);

    await expect(t.query(api.courseInterest.listForEditor, {})).rejects.toThrow(
      "Unauthorized",
    );
  });

  test("limits bursts of new browser signals for one course", async () => {
    const t = createConvexTest();
    await seedCourse(t);
    for (let index = 0; index < 30; index += 1) {
      await t.mutation(api.courseInterest.setForLearner, {
        courseShort: "cy-en",
        anonymousId: `browser_supporter_${String(index).padStart(6, "0")}`,
        interested: true,
      });
    }

    await expect(
      t.mutation(api.courseInterest.setForLearner, {
        courseShort: "cy-en",
        anonymousId: "browser_supporter_over_limit",
        interested: true,
      }),
    ).rejects.toThrow("Too many new interest signals");
  });
});
