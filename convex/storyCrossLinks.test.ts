/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { selectStoryCrossLinks } from "./lib/storyCrossLinks";

const modules = import.meta.glob("./**/*.ts");

type SeedStory = {
  legacyId: number;
  name: string;
  set_id: number;
  set_index: number;
  public?: boolean;
  deleted?: boolean;
  withImage?: boolean;
};

async function seedCourse(
  t: ReturnType<typeof convexTest>,
  stories: SeedStory[],
  options: { coursePublic?: boolean; courseShort?: string } = {},
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
      legacyId: "img-1",
      active: "active.svg",
      gilded: "gilded.svg",
      locked: "locked.svg",
      active_lip: "active_lip.svg",
      gilded_lip: "gilded_lip.svg",
    });
    const courseId = await ctx.db.insert("courses", {
      legacyId: 100,
      short: options.courseShort ?? "es-en",
      learningLanguageId,
      fromLanguageId,
      public: options.coursePublic ?? true,
      official: false,
    });
    for (const story of stories) {
      await ctx.db.insert("stories", {
        legacyId: story.legacyId,
        name: story.name,
        set_id: story.set_id,
        set_index: story.set_index,
        public: story.public ?? true,
        deleted: story.deleted ?? false,
        imageId: story.withImage === false ? undefined : imageId,
        courseId,
        status: "finished",
        todo_count: 0,
      });
    }
    return { courseId: courseId as Id<"courses"> };
  });
}

const linearCourse: SeedStory[] = [
  { legacyId: 10, name: "One", set_id: 1, set_index: 1 },
  { legacyId: 11, name: "Two", set_id: 1, set_index: 2 },
  { legacyId: 12, name: "Three", set_id: 1, set_index: 3 },
  { legacyId: 13, name: "Four", set_id: 2, set_index: 1 },
  { legacyId: 14, name: "Five", set_id: 2, set_index: 2 },
];

describe("getStoryCrossLinks", () => {
  test("links the previous and next story by set ordering", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t, linearCourse);

    const result = await t.query(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: 12,
    });

    expect(result?.previous).toEqual({ id: 11, name: "Two" });
    expect(result?.next).toEqual({ id: 13, name: "Four" });
    expect(result?.course.short).toBe("es-en");
    expect(result?.course.learning_language_name).toBe("Spanish");
  });

  test("omits the previous link on the first story and the next link on the last", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t, linearCourse);

    const first = await t.query(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: 10,
    });
    expect(first?.previous).toBeNull();
    expect(first?.next).toEqual({ id: 11, name: "Two" });

    const last = await t.query(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: 14,
    });
    expect(last?.previous).toEqual({ id: 13, name: "Four" });
    expect(last?.next).toBeNull();
  });

  test("never links to unpublished, deleted or illustration-less stories", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t, [
      { legacyId: 10, name: "One", set_id: 1, set_index: 1 },
      { legacyId: 11, name: "Draft", set_id: 1, set_index: 2, public: false },
      { legacyId: 12, name: "Current", set_id: 1, set_index: 3 },
      { legacyId: 13, name: "Deleted", set_id: 1, set_index: 4, deleted: true },
      {
        legacyId: 14,
        name: "No image",
        set_id: 1,
        set_index: 5,
        withImage: false,
      },
      { legacyId: 15, name: "Visible", set_id: 1, set_index: 6 },
    ]);

    const result = await t.query(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: 12,
    });

    expect(result?.previous).toEqual({ id: 10, name: "One" });
    expect(result?.next).toEqual({ id: 15, name: "Visible" });
  });

  test("returns null for a story in a non-public course", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t, linearCourse, { coursePublic: false });

    const result = await t.query(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: 12,
    });
    expect(result).toBeNull();
  });

  test("returns null for a deleted or unknown story", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t, [
      { legacyId: 10, name: "One", set_id: 1, set_index: 1 },
      { legacyId: 11, name: "Gone", set_id: 1, set_index: 2, deleted: true },
    ]);

    expect(
      await t.query(api.storyCrossLinks.getStoryCrossLinks, { storyId: 11 }),
    ).toBeNull();
    expect(
      await t.query(api.storyCrossLinks.getStoryCrossLinks, { storyId: 999 }),
    ).toBeNull();
  });

  test("still offers neighbours for an unpublished story of a public course", async () => {
    const t = convexTest(schema, modules);
    await seedCourse(t, [
      { legacyId: 10, name: "One", set_id: 1, set_index: 1 },
      { legacyId: 11, name: "Hidden", set_id: 1, set_index: 2, public: false },
      { legacyId: 12, name: "Three", set_id: 1, set_index: 3 },
    ]);

    const result = await t.query(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: 11,
    });
    expect(result?.previous).toEqual({ id: 10, name: "One" });
    expect(result?.next).toEqual({ id: 12, name: "Three" });
  });
});

describe("selectStoryCrossLinks", () => {
  const candidates = [
    { id: 1, name: "a", set_id: 1, set_index: 1 },
    { id: 2, name: "b", set_id: 1, set_index: 2 },
    { id: 3, name: "c", set_id: 1, set_index: 3 },
    { id: 4, name: "d", set_id: 1, set_index: 4 },
    { id: 5, name: "e", set_id: 1, set_index: 5 },
    { id: 6, name: "f", set_id: 1, set_index: 6 },
    { id: 7, name: "g", set_id: 2, set_index: 1 },
    { id: 8, name: "h", set_id: 2, set_index: 2 },
    { id: 9, name: "i", set_id: 2, set_index: 3 },
  ];

  test("picks neighbours across set boundaries", () => {
    const { previous, next } = selectStoryCrossLinks(candidates, {
      id: 6,
      name: "f",
      set_id: 1,
      set_index: 6,
    });

    expect(previous?.id).toBe(5);
    expect(next?.id).toBe(7);
  });

  test("returns empty links for a course with a single story", () => {
    const only = [{ id: 1, name: "a", set_id: 1, set_index: 1 }];
    expect(selectStoryCrossLinks(only, only[0])).toEqual({
      previous: null,
      next: null,
    });
  });
});
