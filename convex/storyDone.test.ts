/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

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

describe("recordStoryDone", () => {
  test("anonymous completion inserts story_done without a user and no course_activity", async () => {
    const t = convexTest(schema, modules);
    const { storyId } = await seedCourseWithStory(t);

    const result = await t.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 10,
      time: 1234,
    });
    expect(result.inserted).toBe(true);

    await t.run(async (ctx) => {
      const doneRows = await ctx.db
        .query("story_done")
        .withIndex("by_story", (q) => q.eq("storyId", storyId as Id<"stories">))
        .collect();
      expect(doneRows).toHaveLength(1);
      expect(doneRows[0]?.legacyUserId).toBeUndefined();
      expect(doneRows[0]?.time).toBe(1234);

      const activity = await ctx.db.query("course_activity").collect();
      expect(activity).toHaveLength(0);
      const doneState = await ctx.db.query("story_done_state").collect();
      expect(doneState).toHaveLength(0);
    });
  });

  test("authenticated completion also creates story_done_state and course_activity", async () => {
    const t = convexTest(schema, modules);
    const { storyId } = await seedCourseWithStory(t);
    const asUser = t.withIdentity({ userId: "7" });

    const result = await asUser.mutation(api.storyDone.recordStoryDone, {
      legacyStoryId: 10,
      time: 5678,
    });
    expect(result.inserted).toBe(true);

    await t.run(async (ctx) => {
      const doneRows = await ctx.db
        .query("story_done")
        .withIndex("by_story", (q) => q.eq("storyId", storyId as Id<"stories">))
        .collect();
      expect(doneRows).toHaveLength(1);
      expect(doneRows[0]?.legacyUserId).toBe(7);

      const doneState = await ctx.db
        .query("story_done_state")
        .withIndex("by_user_and_story", (q) =>
          q.eq("legacyUserId", 7).eq("storyId", storyId as Id<"stories">),
        )
        .collect();
      expect(doneState).toHaveLength(1);
      expect(doneState[0]?.legacyStoryId).toBe(10);
      expect(doneState[0]?.legacyCourseId).toBe(100);
      expect(doneState[0]?.lastDoneAt).toBe(5678);

      const activity = await ctx.db
        .query("course_activity")
        .withIndex("by_user_and_last_done_at", (q) => q.eq("legacyUserId", 7))
        .collect();
      expect(activity).toHaveLength(1);
      expect(activity[0]?.legacyCourseId).toBe(100);
    });
  });

  test("unknown legacyStoryId rejects with Missing story", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);

    await expect(
      t.mutation(api.storyDone.recordStoryDone, { legacyStoryId: 999 }),
    ).rejects.toThrow("Missing story for legacy id 999");
  });
});
