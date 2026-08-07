/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { MAX_PINNED_COURSES } from "./coursePins";
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

  test("rejects pin changes from signed-out users", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.coursePins.setCurrentUserCoursePin, {
        courseLegacyId: 42,
        pinned: true,
      }),
    ).rejects.toThrow("Unauthorized");
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

  test("allows 20 pins and rejects another without hiding existing pins", async () => {
    const t = convexTest(schema, modules);
    for (let legacyId = 1; legacyId <= MAX_PINNED_COURSES + 1; legacyId += 1) {
      await insertCourse(t, legacyId);
    }
    const asUser = t.withIdentity({ userId: "7" });

    for (let legacyId = 1; legacyId <= MAX_PINNED_COURSES; legacyId += 1) {
      await asUser.mutation(api.coursePins.setCurrentUserCoursePin, {
        courseLegacyId: legacyId,
        pinned: true,
      });
    }

    await expect(
      asUser.mutation(api.coursePins.setCurrentUserCoursePin, {
        courseLegacyId: MAX_PINNED_COURSES + 1,
        pinned: true,
      }),
    ).rejects.toThrow(`You can pin up to ${MAX_PINNED_COURSES} courses`);
    const visiblePins = await asUser.query(
      api.coursePins.listCurrentUserPins,
      {},
    );
    expect([...visiblePins].sort((a, b) => a - b)).toEqual(
      Array.from({ length: MAX_PINNED_COURSES }, (_, index) => index + 1),
    );
  });

  test("persists supplied and fallback operation keys on new pins", async () => {
    const t = convexTest(schema, modules);
    const firstCourseId = await insertCourse(t, 42);
    const secondCourseId = await insertCourse(t, 43);
    const asUser = t.withIdentity({ userId: "7" });

    await asUser.mutation(api.coursePins.setCurrentUserCoursePin, {
      courseLegacyId: 42,
      pinned: true,
      operationKey: "coursePin:42:true:test",
    });
    await asUser.mutation(api.coursePins.setCurrentUserCoursePin, {
      courseLegacyId: 43,
      pinned: true,
    });

    const pins = await t.run(async (ctx) =>
      ctx.db.query("user_pinned_courses").collect(),
    );
    expect(pins.find((pin) => pin.courseId === firstCourseId)).toMatchObject({
      operationKey: "coursePin:42:true:test",
    });
    expect(
      pins.find((pin) => pin.courseId === secondCourseId)?.operationKey,
    ).toMatch(/^coursePin:43:true:\d+$/);
  });
});
