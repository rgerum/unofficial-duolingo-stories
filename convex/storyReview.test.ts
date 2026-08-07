/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("resolves the earliest set containing an unpublished story", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    const learningLanguageId = await ctx.db.insert("languages", {
      legacyId: 1,
      name: "Nahuatl",
      short: "nhe",
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
      legacyId: 10,
      short: "nhe-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
    });

    for (const story of [
      { legacyId: 11, setId: 1, setIndex: 1, public: true, deleted: false },
      { legacyId: 21, setId: 2, setIndex: 1, public: true, deleted: false },
      { legacyId: 22, setId: 2, setIndex: 2, public: false, deleted: false },
      { legacyId: 23, setId: 2, setIndex: 3, public: false, deleted: true },
      { legacyId: 31, setId: 3, setIndex: 1, public: false, deleted: false },
    ]) {
      await ctx.db.insert("stories", {
        legacyId: story.legacyId,
        name: `Story ${story.legacyId}`,
        set_id: story.setId,
        set_index: story.setIndex,
        public: story.public,
        deleted: story.deleted,
        courseId,
        status: "finished",
        todo_count: 0,
      });
    }
    await ctx.db.insert("stories", {
      legacyId: 99,
      name: "Unassigned draft",
      public: false,
      deleted: false,
      courseId,
      status: "draft",
      todo_count: 0,
    });
  });

  const result = await t.query(internal.storyReview.getNextUnpublishedSet, {
    courseShort: "nhe-en",
  });

  expect(result).toEqual({
    courseShort: "nhe-en",
    setId: 2,
    storyIds: [21, 22],
  });
});

test("returns null when a course has no unpublished stories", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    const learningLanguageId = await ctx.db.insert("languages", {
      legacyId: 1,
      name: "Nahuatl",
      short: "nhe",
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
      legacyId: 10,
      short: "nhe-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
    });
    await ctx.db.insert("stories", {
      legacyId: 11,
      name: "Published story",
      set_id: 1,
      set_index: 1,
      public: true,
      deleted: false,
      courseId,
      status: "finished",
      todo_count: 0,
    });
  });

  const result = await t.query(internal.storyReview.getNextUnpublishedSet, {
    courseShort: "nhe-en",
  });

  expect(result).toBeNull();
});
