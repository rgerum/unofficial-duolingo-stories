/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedCourseWithStory(
  t: ReturnType<typeof convexTest>,
  isPublic: boolean,
  opts: { deleted?: boolean; coursePublic?: boolean } = {},
) {
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
    const imageId = await ctx.db.insert("images", {
      legacyId: "story-image",
      active: "active.png",
      gilded: "gilded.png",
      locked: "locked.png",
      active_lip: "active-lip.png",
      gilded_lip: "gilded-lip.png",
    });
    const courseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: "es-en",
      learningLanguageId,
      fromLanguageId,
      public: opts.coursePublic ?? true,
      official: false,
    });
    await ctx.db.insert("stories", {
      legacyId: isPublic ? 10 : 11,
      duo_id: "story-duo-" + (isPublic ? 10 : 11),
      name: isPublic ? "Public Story" : "Draft Story",
      set_id: 1,
      set_index: 1,
      public: isPublic,
      imageId,
      courseId,
      status: isPublic ? "finished" : "draft",
      deleted: opts.deleted ?? false,
      todo_count: 0,
    });
  });
}

describe("getStoryMetaByLegacyId", () => {
  test("returns public true for public stories", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, true);

    const meta = await t.query(api.storyRead.getStoryMetaByLegacyId, {
      storyId: 10,
    });

    if (!meta || "deleted" in meta) throw new Error("expected story meta");
    expect(meta.public).toBe(true);
    expect(meta).toMatchObject({
      from_language_name: "Public Story",
      image: "story-image",
      from_language_long: "English",
      learning_language_long: "Spanish",
    });
  });

  test("returns public false for non-public stories", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, false);

    const meta = await t.query(api.storyRead.getStoryMetaByLegacyId, {
      storyId: 11,
    });

    if (!meta || "deleted" in meta) throw new Error("expected story meta");
    expect(meta.public).toBe(false);
    expect(meta).toMatchObject({
      from_language_name: "Draft Story",
      image: "story-image",
      from_language_long: "English",
      learning_language_long: "Spanish",
    });
  });

  test("returns redirect info for deleted stories in public courses", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, true, { deleted: true });

    const meta = await t.query(api.storyRead.getStoryMetaByLegacyId, {
      storyId: 10,
    });

    expect(meta).toEqual({
      deleted: true,
      courseShort: "es-en",
      coursePublic: true,
    });
  });

  test("returns redirect info with coursePublic false for deleted stories in private courses", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, true, { deleted: true, coursePublic: false });

    const meta = await t.query(api.storyRead.getStoryMetaByLegacyId, {
      storyId: 10,
    });

    expect(meta).toEqual({
      deleted: true,
      courseShort: "es-en",
      coursePublic: false,
    });
  });

  test("returns null for unknown legacy ids", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, true);

    const meta = await t.query(api.storyRead.getStoryMetaByLegacyId, {
      storyId: 999,
    });

    expect(meta).toBeNull();
  });
});
