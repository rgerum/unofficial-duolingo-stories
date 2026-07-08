/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type SeedOptions = {
  official?: boolean;
};

async function seedCourseWithStory(
  t: ReturnType<typeof convexTest>,
  options: SeedOptions = {},
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
    const courseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: "es-en",
      learningLanguageId,
      fromLanguageId,
      public: true,
      official: options.official ?? false,
      todo_count: 0,
    });
    // Two stories in the course so we can verify the course todo_count is the
    // sum across all stories after a save.
    const storyId = await ctx.db.insert("stories", {
      legacyId: 10,
      duo_id: "story-duo-10",
      name: "Original story",
      set_id: 1,
      set_index: 1,
      public: false,
      courseId,
      status: "draft",
      deleted: false,
      todo_count: 3,
    });
    await ctx.db.insert("stories", {
      legacyId: 11,
      duo_id: "story-duo-11",
      name: "Sibling story",
      set_id: 1,
      set_index: 2,
      public: false,
      courseId,
      status: "draft",
      deleted: false,
      todo_count: 5,
    });
    await ctx.db.insert("story_content", {
      storyId,
      text: "old text",
      json: { elements: [] },
      lastUpdated: 1,
    });
    return { courseId, storyId };
  });
}

const contributor = { role: "contributor", userId: "5" };
const admin = { role: "admin", userId: "5" };

function setStoryArgs(overrides: Record<string, unknown> = {}) {
  return {
    duo_id: "story-duo-10",
    name: "Updated story",
    image: "",
    set_id: 1,
    set_index: 1,
    legacyCourseId: 100,
    text: "new text",
    json: { elements: [{ type: "title" }] },
    todo_count: 7,
    change_date: new Date("2024-01-01T00:00:00.000Z").toISOString(),
    ...overrides,
  };
}

describe("setStory", () => {
  test("contributor updates an existing story found by legacyStoryId", async () => {
    const t = convexTest(schema, modules);
    const { courseId, storyId } = await seedCourseWithStory(t);
    const asContributor = t.withIdentity(contributor);

    const result = await asContributor.mutation(
      api.storyWrite.setStory,
      setStoryArgs({ legacyStoryId: 10, todo_count: 7 }),
    );

    expect(result).toEqual({
      id: 10,
      name: "Updated story",
      course_id: 100,
      text: "new text",
      todo_count: 7,
    });

    await t.run(async (ctx) => {
      const content = await ctx.db
        .query("story_content")
        .withIndex("by_story", (q) => q.eq("storyId", storyId))
        .unique();
      expect(content?.text).toBe("new text");

      const story = await ctx.db.get(storyId);
      expect(story?.name).toBe("Updated story");
      expect(story?.todo_count).toBe(7);

      // Course todo_count is recomputed as the sum over every story in the
      // course: the updated story (7) plus its sibling (5).
      const course = await ctx.db.get(courseId);
      expect(course?.todo_count).toBe(12);
    });
  });

  test("unknown legacyStoryId with no matching duo_id returns null and writes nothing", async () => {
    const t = convexTest(schema, modules);
    const { courseId } = await seedCourseWithStory(t);
    const asContributor = t.withIdentity(contributor);

    const result = await asContributor.mutation(
      api.storyWrite.setStory,
      setStoryArgs({ legacyStoryId: 999, duo_id: "no-such-duo-id" }),
    );

    expect(result).toBeNull();

    await t.run(async (ctx) => {
      // The course todo_count is untouched (still the seeded 0), proving the
      // recompute path did not run.
      const course = await ctx.db.get(courseId);
      expect(course?.todo_count).toBe(0);
    });
  });

  test("official course rejects a contributor overwrite", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, { official: true });
    const asContributor = t.withIdentity(contributor);

    await expect(
      asContributor.mutation(
        api.storyWrite.setStory,
        setStoryArgs({ legacyStoryId: 10 }),
      ),
    ).rejects.toThrow("Official stories cannot be overwritten.");
  });

  test("official course rejects an admin overwrite without explicit confirmation", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t, { official: true });
    const asAdmin = t.withIdentity(admin);

    await expect(
      asAdmin.mutation(
        api.storyWrite.setStory,
        setStoryArgs({ legacyStoryId: 10 }),
      ),
    ).rejects.toThrow(
      "Official story overwrite requires explicit confirmation.",
    );
  });

  test("official course allows an admin overwrite with explicit confirmation", async () => {
    const t = convexTest(schema, modules);
    const { storyId } = await seedCourseWithStory(t, { official: true });
    const asAdmin = t.withIdentity(admin);

    const result = await asAdmin.mutation(
      api.storyWrite.setStory,
      setStoryArgs({ legacyStoryId: 10, confirmOfficialOverwrite: true }),
    );

    expect(result).toMatchObject({ id: 10, name: "Updated story" });
    await t.run(async (ctx) => {
      const story = await ctx.db.get(storyId as Id<"stories">);
      expect(story?.name).toBe("Updated story");
    });
  });
});
