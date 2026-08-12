/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const contributorIdentity = { role: "contributor", userId: "5" } as const;

async function seedStoryPageData(t: ReturnType<typeof convexTest>) {
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
      name: "Draft Story",
      set_id: 1,
      set_index: 1,
      public: false,
      courseId,
      status: "draft",
      deleted: false,
      todo_count: 0,
    });
    await ctx.db.insert("story_content", {
      storyId,
      text: "SECRET EDITOR SOURCE TEXT",
      json: {},
      lastUpdated: Date.now(),
    });
  });
}

async function seedCourseImport(t: ReturnType<typeof convexTest>) {
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
    const toCourseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: "es-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
    });
    const fromCourseId = await ctx.db.insert("courses", {
      legacyId: 200,
      short: "es-de",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: false,
    });
    void toCourseId;
    await ctx.db.insert("stories", {
      legacyId: 30,
      duo_id: "import-duo-30",
      name: "Importable Story",
      set_id: 1,
      set_index: 1,
      public: true,
      courseId: fromCourseId,
      status: "finished",
      deleted: false,
      todo_count: 0,
    });
  });
}

describe("getEditorStoryPageData guard", () => {
  test("unauthenticated caller gets null and no source text", async () => {
    const t = convexTest(schema, modules);
    await seedStoryPageData(t);

    const result = await t.query(api.editorRead.getEditorStoryPageData, {
      storyId: 10,
    });

    expect(result).toBeNull();
  });

  test("contributor caller receives the full editor source text", async () => {
    const t = convexTest(schema, modules);
    await seedStoryPageData(t);

    const result = await t
      .withIdentity(contributorIdentity)
      .query(api.editorRead.getEditorStoryPageData, { storyId: 10 });

    expect(result).not.toBeNull();
    expect(result?.story_data.text).toBe("SECRET EDITOR SOURCE TEXT");
  });
});

describe("getEditorCourseImport guard", () => {
  test("unauthenticated caller gets an empty list (no import rows)", async () => {
    const t = convexTest(schema, modules);
    await seedCourseImport(t);

    const result = await t.query(api.editorRead.getEditorCourseImport, {
      courseLegacyId: 100,
      fromLegacyId: 200,
    });

    expect(result).toEqual([]);
  });

  test("contributor caller receives the import inventory", async () => {
    const t = convexTest(schema, modules);
    await seedCourseImport(t);

    const result = await t
      .withIdentity(contributorIdentity)
      .query(api.editorRead.getEditorCourseImport, {
        courseLegacyId: 100,
        fromLegacyId: 200,
      });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 30, name: "Importable Story" });
  });
});
