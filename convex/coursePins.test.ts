/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function insertCourse(
  t: ReturnType<typeof convexTest>,
  legacyId: number,
) {
  return await t.run(async (ctx) => {
    const languageId = await ctx.db.insert("languages", {
      legacyId,
      name: `Language ${legacyId}`,
      short: `l${legacyId}`,
      public: true,
      rtl: false,
    });
    return await ctx.db.insert("courses", {
      legacyId,
      learningLanguageId: languageId,
      fromLanguageId: languageId,
      learning_language_name: `Language ${legacyId}`,
      from_language_name: `Language ${legacyId}`,
      official: false,
      public: true,
      contributors: [],
      contributors_past: [],
      tags: [],
    });
  });
}

describe("course pins", () => {
  test("lists no pins for signed-out users", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.coursePins.listCurrentUserPins, {}),
    ).resolves.toEqual([]);
  });

  test("pins and unpins a course for the current user", async () => {
    const t = convexTest(schema, modules);
    await insertCourse(t, 42);
    const asUser = t.withIdentity({ userId: "7" });

    await asUser.mutation(api.coursePins.setCurrentUserCoursePin, {
      courseLegacyId: 42,
      pinned: true,
    });
    await expect(
      asUser.query(api.coursePins.listCurrentUserPins, {}),
    ).resolves.toEqual([42]);

    await asUser.mutation(api.coursePins.setCurrentUserCoursePin, {
      courseLegacyId: 42,
      pinned: false,
    });
    await expect(
      asUser.query(api.coursePins.listCurrentUserPins, {}),
    ).resolves.toEqual([]);
  });

  test("keeps pins private to each user and makes repeat toggles idempotent", async () => {
    const t = convexTest(schema, modules);
    await insertCourse(t, 42);
    const firstUser = t.withIdentity({ userId: "7" });
    const secondUser = t.withIdentity({ userId: "8" });

    await firstUser.mutation(api.coursePins.setCurrentUserCoursePin, {
      courseLegacyId: 42,
      pinned: true,
    });
    await firstUser.mutation(api.coursePins.setCurrentUserCoursePin, {
      courseLegacyId: 42,
      pinned: true,
    });

    await expect(
      firstUser.query(api.coursePins.listCurrentUserPins, {}),
    ).resolves.toEqual([42]);
    await expect(
      secondUser.query(api.coursePins.listCurrentUserPins, {}),
    ).resolves.toEqual([]);
  });
});
