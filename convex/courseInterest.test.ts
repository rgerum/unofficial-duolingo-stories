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
      status: "finished",
      todo_count: 0,
    });
    const secondStoryId = await ctx.db.insert("stories", {
      legacyId: 11,
      name: "Second",
      public: true,
      deleted: false,
      courseId,
      status: "finished",
      todo_count: 0,
    });
    return { courseId, firstStoryId, secondStoryId };
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
      completedAllAtSignal: false,
      totalCount: 0,
    });

    expect(
      await t.mutation(api.courseInterest.setForLearner, {
        ...args,
        interested: true,
      }),
    ).toEqual({
      interested: true,
      completedAllAtSignal: false,
      totalCount: 1,
    });
    expect(
      await t.mutation(api.courseInterest.setForLearner, {
        ...args,
        interested: true,
      }),
    ).toMatchObject({ totalCount: 1 });

    expect(
      await t.mutation(api.courseInterest.setForLearner, {
        ...args,
        interested: false,
      }),
    ).toEqual({
      interested: false,
      completedAllAtSignal: false,
      totalCount: 0,
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
      completedAllAtSignal: true,
      totalCount: 1,
    });

    const editor = t.withIdentity({ userId: "8", role: "contributor" });
    expect(
      await editor.query(api.courseInterest.getForEditor, {
        courseIdentifier: "cy-en",
      }),
    ).toMatchObject({
      totalCount: 1,
      completedAllCount: 1,
    });
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
    ).toMatchObject({ totalCount: 1 });

    const signals = await t.run(async (ctx) => {
      return await ctx.db.query("course_interest_signals").collect();
    });
    expect(signals).toHaveLength(1);
    expect(signals[0]?.supporterKey).toBe("user:7");
  });
});
