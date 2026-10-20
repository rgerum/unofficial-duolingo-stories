/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("getRoleSyncChangeMarker", () => {
  test("tracks the newest approval by insertion, including revokes", async () => {
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
      // Future-dated: must not mask the approval inserted after it.
      const olderId = await ctx.db.insert("story_approval", {
        storyId,
        legacyUserId: 1,
        date: 9_999_999_999_999,
      });
      const newerId = await ctx.db.insert("story_approval", {
        storyId,
        legacyUserId: 2,
        date: 1000,
      });
      return { olderId, newerId };
    });

    const marker = await t.query(
      internal.discordData.getRoleSyncChangeMarker,
      {},
    );
    expect(marker.startsWith(`${newerId}:`)).toBe(true);

    await t.run(async (ctx) => ctx.db.delete(newerId));
    const afterRevoke = await t.query(
      internal.discordData.getRoleSyncChangeMarker,
      {},
    );
    expect(afterRevoke.startsWith(`${olderId}:`)).toBe(true);
  });
});
