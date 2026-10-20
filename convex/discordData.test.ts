/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("getRoleSyncChangeMarker", () => {
  test("tracks the newest approval, including revokes", async () => {
    const t = convexTest(schema, modules);
    expect(
      await t.query(internal.discordData.getRoleSyncChangeMarker, {}),
    ).toBe("none");

    const { olderId, newerId } = await t.run(async (ctx) => {
      const languageId = await ctx.db.insert("languages", {
        legacyId: 1,
        name: "Spanish",
        short: "es",
        public: true,
        rtl: false,
      });
      const courseId = await ctx.db.insert("courses", {
        legacyId: 100,
        short: "es-es",
        learningLanguageId: languageId,
        fromLanguageId: languageId,
        public: true,
        official: false,
      });
      const storyId = await ctx.db.insert("stories", {
        legacyId: 10,
        name: "Story",
        public: false,
        deleted: false,
        courseId,
        status: "finished",
        todo_count: 0,
      });
      const olderId = await ctx.db.insert("story_approval", {
        storyId,
        legacyUserId: 1,
        date: 1000,
      });
      const newerId = await ctx.db.insert("story_approval", {
        storyId,
        legacyUserId: 2,
        date: 2000,
      });
      return { olderId, newerId };
    });

    expect(
      await t.query(internal.discordData.getRoleSyncChangeMarker, {}),
    ).toBe(`${newerId}:2000`);

    await t.run(async (ctx) => ctx.db.delete(newerId));
    expect(
      await t.query(internal.discordData.getRoleSyncChangeMarker, {}),
    ).toBe(`${olderId}:1000`);
  });
});
