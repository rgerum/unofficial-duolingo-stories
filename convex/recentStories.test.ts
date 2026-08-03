/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("getRecentPublishedStories", () => {
  test("returns newest public stories from public courses", async () => {
    const t = convexTest(schema, modules);
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
        legacyId: "image-1",
        active: "active.svg",
        gilded: "gilded.svg",
        locked: "locked.svg",
        active_lip: "aabbcc",
        gilded_lip: "ddeeff",
      });
      const publicCourseId = await ctx.db.insert("courses", {
        legacyId: 10,
        short: "es-en",
        name: "Español",
        learningLanguageId,
        fromLanguageId,
        public: true,
        official: false,
      });
      const hiddenCourseId = await ctx.db.insert("courses", {
        legacyId: 11,
        short: "hidden",
        learningLanguageId,
        fromLanguageId,
        public: false,
        official: false,
      });

      const insertStory = async ({
        legacyId,
        name,
        datePublished,
        courseId = publicCourseId,
        isPublic = true,
        deleted = false,
      }: {
        legacyId: number;
        name: string;
        datePublished?: number;
        courseId?: typeof publicCourseId;
        isPublic?: boolean;
        deleted?: boolean;
      }) => {
        await ctx.db.insert("stories", {
          legacyId,
          name,
          date_published: datePublished,
          public: isPublic,
          deleted,
          imageId,
          courseId,
          status: "finished",
          todo_count: 0,
        });
      };

      await insertStory({ legacyId: 1, name: "Older", datePublished: 100 });
      await insertStory({ legacyId: 2, name: "Newest", datePublished: 300 });
      await insertStory({ legacyId: 3, name: "Middle", datePublished: 200 });
      await insertStory({
        legacyId: 4,
        name: "Draft",
        datePublished: 400,
        isPublic: false,
      });
      await insertStory({
        legacyId: 5,
        name: "Deleted",
        datePublished: 500,
        deleted: true,
      });
      await insertStory({
        legacyId: 6,
        name: "Hidden course",
        datePublished: 600,
        courseId: hiddenCourseId,
      });
      await insertStory({ legacyId: 7, name: "Missing date" });
    });

    const result = await t.query(
      api.recentStories.getRecentPublishedStories,
      {},
    );

    expect(result.map((story) => story.name)).toEqual([
      "Newest",
      "Middle",
      "Older",
    ]);
    expect(result[0]).toMatchObject({
      id: 2,
      datePublished: 300,
      image: "image-1",
      active: "active.svg",
      activeLip: "aabbcc",
      course: {
        short: "es-en",
        name: "Español",
        learningLanguageName: "Spanish",
        fromLanguageName: "English",
      },
    });
  });
});
