/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("getRecentPublishedStorySets", () => {
  test("groups published stories into newest-first course and set events", async () => {
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
      const courseId = await ctx.db.insert("courses", {
        legacyId: 10,
        short: "es-en",
        name: "Cuentos de la comunidad",
        learningLanguageId,
        fromLanguageId,
        public: true,
        official: false,
      });

      const publishedStories = Array.from({ length: 8 }, (_, index) => ({
        legacyId: index + 1,
        name: `Set ${index < 4 ? 1 : 2} story ${(index % 4) + 1}`,
        setId: index < 4 ? 1 : 2,
        published: index < 4 ? 100 : 300,
      }));
      for (const story of publishedStories) {
        await ctx.db.insert("stories", {
          legacyId: story.legacyId,
          name: story.name,
          set_id: story.setId,
          set_index: story.legacyId,
          date_published: story.published,
          public: true,
          deleted: false,
          imageId,
          courseId,
          status: "finished",
          todo_count: 0,
        });
      }
      await ctx.db.insert("stories", {
        legacyId: 20,
        name: "Created but unpublished",
        set_id: 3,
        set_index: 1,
        public: false,
        deleted: false,
        imageId,
        courseId,
        status: "draft",
        todo_count: 0,
      });
    });

    const result = await t.query(
      api.recentStories.getRecentPublishedStorySets,
      {},
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      datePublished: 300,
      setId: 2,
      course: {
        courseSlug: "es-en",
        seriesTitle: "Cuentos de la comunidad",
        learningLanguageName: "Spanish",
        fromLanguageName: "English",
      },
      stories: [
        { id: 5, title: "Set 2 story 1" },
        { id: 6, title: "Set 2 story 2" },
        { id: 7, title: "Set 2 story 3" },
        { id: 8, title: "Set 2 story 4" },
      ],
    });
    expect(result[1]?.stories.map((story) => story.title)).toEqual([
      "Set 1 story 1",
      "Set 1 story 2",
      "Set 1 story 3",
      "Set 1 story 4",
    ]);
  });

  test("caps results at the 20 newest valid public sets", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const learningLanguageId = await ctx.db.insert("languages", {
        legacyId: 10,
        name: "Spanish",
        short: "es",
        public: true,
        rtl: false,
      });
      const fromLanguageId = await ctx.db.insert("languages", {
        legacyId: 11,
        name: "English",
        short: "en",
        public: true,
        rtl: false,
      });
      const imageId = await ctx.db.insert("images", {
        legacyId: "valid-image",
        active: "active.svg",
        gilded: "gilded.svg",
        locked: "locked.svg",
        active_lip: "aabbcc",
        gilded_lip: "ddeeff",
      });
      const validCourseId = await ctx.db.insert("courses", {
        legacyId: 20,
        short: "es-en",
        learningLanguageId,
        fromLanguageId,
        public: true,
        official: false,
      });
      const privateCourseId = await ctx.db.insert("courses", {
        legacyId: 21,
        short: "private",
        learningLanguageId,
        fromLanguageId,
        public: false,
        official: false,
      });
      const shortlessCourseId = await ctx.db.insert("courses", {
        legacyId: 22,
        learningLanguageId,
        fromLanguageId,
        public: true,
        official: false,
      });

      for (let setId = 1; setId <= 23; setId += 1) {
        await ctx.db.insert("stories", {
          legacyId: 100 + setId,
          name: `Valid set ${setId}`,
          set_id: setId,
          set_index: 1,
          date_published: setId,
          public: true,
          deleted: false,
          imageId,
          courseId: validCourseId,
          status: "finished",
          todo_count: 0,
        });
      }

      const invalidStories = [
        { legacyId: 201, courseId: privateCourseId, imageId },
        { legacyId: 202, courseId: shortlessCourseId, imageId },
        { legacyId: undefined, courseId: validCourseId, imageId },
        { legacyId: 204, courseId: validCourseId, imageId: undefined },
      ];
      for (const [index, story] of invalidStories.entries()) {
        await ctx.db.insert("stories", {
          legacyId: story.legacyId,
          name: `Invalid story ${index}`,
          set_id: 100 + index,
          set_index: 1,
          date_published: 1_000 + index,
          public: true,
          deleted: false,
          imageId: story.imageId,
          courseId: story.courseId,
          status: "finished",
          todo_count: 0,
        });
      }
    });

    const result = await t.query(
      api.recentStories.getRecentPublishedStorySets,
      {},
    );

    expect(result).toHaveLength(20);
    expect(result.map((set) => set.setId)).toEqual(
      Array.from({ length: 20 }, (_, index) => 23 - index),
    );
    expect(
      result.flatMap((set) => set.stories).map((story) => story.title),
    ).not.toContain(expect.stringContaining("Invalid story"));
  });
});
