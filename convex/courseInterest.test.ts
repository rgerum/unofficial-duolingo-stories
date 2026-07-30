/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedCourse(t: ReturnType<typeof convexTest>) {
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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

  test("limits bursts of new browser signals for one course", async () => {
    const t = convexTest(schema, modules);
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

  test("reads and removes documents created by the first release", async () => {
    const t = convexTest(schema, modules);
    const { courseId } = await seedCourse(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("course_interest_signals", {
        courseId,
        supporterKey: "anonymous:browser_supporter_123456",
        completedAllAtSignal: false,
        createdAt: 1_785_358_460_280,
      });
      await ctx.db.insert("course_interest_signals", {
        courseId,
        supporterKey: "anonymous:another_browser_123456",
        completedAllAtSignal: false,
        createdAt: 1_785_358_460_281,
      });
      await ctx.db.insert("course_interest_stats", {
        courseId,
        totalCount: 2,
        completedAllCount: 0,
        lastSignalAt: 1_785_358_460_280,
        updatedAt: 1_785_358_460_280,
      });
    });

    const learnerArgs = {
      courseShort: "cy-en",
      anonymousId: "browser_supporter_123456",
    };
    expect(
      await t.query(api.courseInterest.getForLearner, learnerArgs),
    ).toEqual({
      interested: true,
      completedAllAvailableStories: false,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toEqual({
      authenticatedCount: 0,
      browserCount: 2,
      completedAllCount: 0,
    });

    await t.mutation(api.courseInterest.setForLearner, {
      ...learnerArgs,
      interested: false,
    });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toEqual({
      authenticatedCount: 0,
      browserCount: 1,
      completedAllCount: 0,
    });
  });

  test("preserves legacy signed-in and completion-qualified evidence", async () => {
    const t = convexTest(schema, modules);
    const { courseId } = await seedCourse(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("course_interest_signals", {
        courseId,
        supporterKey: "user:7",
        completedAllAtSignal: true,
        createdAt: 1_785_358_460_280,
      });
      await ctx.db.insert("course_interest_stats", {
        courseId,
        totalCount: 1,
        completedAllCount: 1,
        lastSignalAt: 1_785_358_460_280,
        updatedAt: 1_785_358_460_280,
      });
    });

    const learner = t.withIdentity({ userId: "7", role: "user" });
    expect(
      await learner.query(api.courseInterest.getForLearner, {
        courseShort: "cy-en",
        anonymousId: "another_browser_123456",
      }),
    ).toEqual({
      interested: true,
      completedAllAvailableStories: true,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toEqual({
      authenticatedCount: 1,
      browserCount: 0,
      completedAllCount: 1,
    });
  });
});
