/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// Characterizes the public course listing, which shares its story filter with
// `api.storyCrossLinks.getStoryCrossLinks` via `listPublicCourseStories`.
async function seedCourse(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
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
    const imageId = await ctx.db.insert("images", {
      legacyId: "img-1",
      active: "active.svg",
      gilded: "gilded.svg",
      locked: "locked.svg",
      active_lip: "active_lip.svg",
      gilded_lip: "gilded_lip.svg",
    });
    const publicCourseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: "es-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
      count: 3,
    });
    await ctx.db.insert("courses", {
      legacyId: 101,
      short: "de-en",
      learningLanguageId,
      fromLanguageId,
      public: false,
      official: false,
    });

    const stories = [
      { legacyId: 13, name: "Set two", set_id: 2, set_index: 1 },
      { legacyId: 11, name: "Second", set_id: 1, set_index: 2 },
      { legacyId: 10, name: "First", set_id: 1, set_index: 1 },
    ];
    for (const story of stories) {
      await ctx.db.insert("stories", {
        ...story,
        public: true,
        deleted: false,
        imageId,
        courseId: publicCourseId,
        status: "finished",
        todo_count: 0,
      });
    }
    // None of these may show up in the listing.
    await ctx.db.insert("stories", {
      legacyId: 20,
      name: "Draft",
      set_id: 1,
      set_index: 3,
      public: false,
      deleted: false,
      imageId,
      courseId: publicCourseId,
      status: "draft",
      todo_count: 0,
    });
    await ctx.db.insert("stories", {
      legacyId: 21,
      name: "Deleted",
      set_id: 1,
      set_index: 4,
      public: true,
      deleted: true,
      imageId,
      courseId: publicCourseId,
      status: "finished",
      todo_count: 0,
    });
    await ctx.db.insert("stories", {
      legacyId: 22,
      name: "No illustration",
      set_id: 1,
      set_index: 5,
      public: true,
      deleted: false,
      courseId: publicCourseId,
      status: "finished",
      todo_count: 0,
    });
  });
}

describe("getPublicCoursePageData", () => {
  test("lists only publicly linkable stories, sorted by set order", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t);

    const result = await t.query(api.landing.getPublicCoursePageData, {
      short: "es-en",
    });

    expect(result?.stories.map((story) => story.id)).toEqual([10, 11, 13]);
    expect(result?.stories.map((story) => story.name)).toEqual([
      "First",
      "Second",
      "Set two",
    ]);
    expect(result?.stories[0]).toMatchObject({
      course_id: 100,
      image: "img-1",
      set_id: 1,
      set_index: 1,
      active: "active.svg",
      gilded: "gilded.svg",
      active_lip: "active_lip.svg",
      gilded_lip: "gilded_lip.svg",
    });
    expect(result?.learning_language_name).toBe("Spanish");
  });

  test("returns null for a non-public or unknown course", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t);

    expect(
      await t.query(api.landing.getPublicCoursePageData, { short: "de-en" }),
    ).toBeNull();
    expect(
      await t.query(api.landing.getPublicCoursePageData, { short: "xx-yy" }),
    ).toBeNull();
  });
});
