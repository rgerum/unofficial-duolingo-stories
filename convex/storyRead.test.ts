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

describe("getStoryByLegacyId per-story character names", () => {
  async function seedStoryWithCharacters(t: ReturnType<typeof convexTest>) {
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
        official: false,
      });
      const storyId = await ctx.db.insert("stories", {
        legacyId: 10,
        duo_id: "es-en-la-cena",
        name: "Dinner with the Director",
        set_id: 1,
        set_index: 1,
        public: true,
        courseId,
        status: "finished",
        deleted: false,
        todo_count: 0,
      });
      await ctx.db.insert("story_public_content", {
        storyId,
        json: {
          elements: [
            { type: "HEADER", learningLanguageTitleContent: { text: "t" } },
            {
              type: "LINE",
              line: {
                type: "CHARACTER",
                characterId: 988,
                characterName: "La Madre de Juan",
                content: { text: "hola" },
              },
            },
            {
              type: "LINE",
              line: {
                type: "CHARACTER",
                characterId: 6,
                characterName: "Álex",
                content: { text: "buenos días" },
              },
            },
            {
              type: "LINE",
              line: { type: "PROSE", content: { text: "narración" } },
            },
          ],
        },
        lastUpdated: 0,
      });
      const overriddenAvatarId = await ctx.db.insert("avatars", {
        legacyId: 988,
        link: "avatar-988.svg",
      });
      const fallbackAvatarId = await ctx.db.insert("avatars", {
        legacyId: 6,
        link: "avatar-6.svg",
      });
      await ctx.db.insert("avatar_mappings", {
        avatarId: overriddenAvatarId,
        languageId: learningLanguageId,
        name: "La Madre de Juan",
        speaker: "",
        storyNames: {
          "es-en-la-cena": "Paula",
          "es-en-otra-historia": "Elsa",
        },
      });
      await ctx.db.insert("avatar_mappings", {
        avatarId: fallbackAvatarId,
        languageId: learningLanguageId,
        name: "Álex",
        speaker: "",
      });
    });
  }

  test("replaces characterName from storyNames matching the story duo_id", async () => {
    const t = convexTest(schema, modules);
    await seedStoryWithCharacters(t);

    const story = await t.query(api.storyRead.getStoryByLegacyId, {
      storyId: 10,
    });

    const characterNames = story?.elements
      .filter((element: { type: string }) => element.type === "LINE")
      .map(
        (element: { line: { characterName?: string } }) =>
          element.line.characterName ?? null,
      );
    // 988 gets its per-story name for this duo_id, 6 keeps the canonical
    // name baked into the JSON, prose lines stay untouched.
    expect(characterNames).toEqual(["Paula", "Álex", null]);
  });

  test("setAvatarStoryName updates and removes entries seen by readers", async () => {
    const t = convexTest(schema, modules);
    await seedStoryWithCharacters(t);
    const contributor = t.withIdentity({ role: "contributor" });

    await contributor.mutation(api.languageWrite.setAvatarStoryName, {
      legacyLanguageId: 1,
      legacyAvatarId: 6,
      duoId: "es-en-la-cena",
      name: "Leonardo",
    });
    let story = await t.query(api.storyRead.getStoryByLegacyId, {
      storyId: 10,
    });
    expect(story?.elements[2].line.characterName).toBe("Leonardo");

    await contributor.mutation(api.languageWrite.setAvatarStoryName, {
      legacyLanguageId: 1,
      legacyAvatarId: 6,
      duoId: "es-en-la-cena",
      name: null,
    });
    story = await t.query(api.storyRead.getStoryByLegacyId, { storyId: 10 });
    expect(story?.elements[2].line.characterName).toBe("Álex");
  });

  test("setAvatarStoryName rejects anonymous callers", async () => {
    const t = convexTest(schema, modules);
    await seedStoryWithCharacters(t);

    await expect(
      t.mutation(api.languageWrite.setAvatarStoryName, {
        legacyLanguageId: 1,
        legacyAvatarId: 6,
        duoId: "es-en-la-cena",
        name: "Leonardo",
      }),
    ).rejects.toThrow("Unauthorized");
  });
});

describe("setAvatarDetails", () => {
  test("sets and clears canonical name and gender", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("avatars", { legacyId: 988, link: "avatar.svg" });
    });
    const contributor = t.withIdentity({ role: "contributor" });

    const result = await contributor.mutation(
      api.languageWrite.setAvatarDetails,
      { legacyAvatarId: 988, name: "Paula", gender: "female" },
    );
    expect(result).toEqual({ avatar_id: 988, name: "Paula", gender: "female" });

    // Omitted fields stay untouched, null clears.
    const cleared = await contributor.mutation(
      api.languageWrite.setAvatarDetails,
      { legacyAvatarId: 988, gender: null },
    );
    expect(cleared).toEqual({ avatar_id: 988, name: "Paula", gender: null });
  });

  test("rejects anonymous callers", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("avatars", { legacyId: 988, link: "avatar.svg" });
    });

    await expect(
      t.mutation(api.languageWrite.setAvatarDetails, {
        legacyAvatarId: 988,
        gender: "female",
      }),
    ).rejects.toThrow("Unauthorized");
  });
});

describe("setAvatarStoryName without an existing mapping", () => {
  test("creates the mapping, keeps canonical name visible, trims duoId", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("languages", {
        legacyId: 1,
        name: "Spanish",
        short: "es",
        public: true,
        rtl: false,
      });
      await ctx.db.insert("avatars", {
        legacyId: 526,
        link: "avatar-526.svg",
        name: "waiter",
        gender: "male",
      });
    });
    const contributor = t.withIdentity({ role: "contributor" });

    const result = await contributor.mutation(
      api.languageWrite.setAvatarStoryName,
      {
        legacyLanguageId: 1,
        legacyAvatarId: 526,
        duoId: " es-en-la-cena ",
        name: "Federico",
      },
    );
    expect(result.duo_id).toBe("es-en-la-cena");
    expect(result.storyNames).toEqual({ "es-en-la-cena": "Federico" });

    // The mapping created to hold storyNames must not blank the editor
    // display: the canonical avatar name stays the fallback.
    const rows = await contributor.query(
      api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
      { languageLegacyId: 1 },
    );
    const row = rows.find((r: { avatar_id: number }) => r.avatar_id === 526);
    expect(row?.name).toBe("waiter");
    expect(row?.storyNames).toEqual({ "es-en-la-cena": "Federico" });
    expect(row?.gender).toBe("male");
    // Unmerged variants: nothing set for this language, canonical name and
    // per-story names (any language) surface separately for the editor UI.
    expect(row?.language_name).toBeNull();
    expect(row?.canonical_name).toBe("waiter");
    expect(row?.story_name_suggestions).toEqual(["Federico"]);

    const removed = await contributor.mutation(
      api.languageWrite.setAvatarStoryName,
      {
        legacyLanguageId: 1,
        legacyAvatarId: 526,
        duoId: "es-en-la-cena",
        name: null,
      },
    );
    expect(removed.storyNames).toEqual({});
  });
});

describe("story name suggestions", () => {
  test("dedupes across languages and caps at four", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const spanishId = await ctx.db.insert("languages", {
        legacyId: 1,
        name: "Spanish",
        short: "es",
        public: true,
        rtl: false,
      });
      const portugueseId = await ctx.db.insert("languages", {
        legacyId: 2,
        name: "Portuguese",
        short: "pt",
        public: true,
        rtl: false,
      });
      const avatarId = await ctx.db.insert("avatars", {
        legacyId: 988,
        link: "avatar-988.svg",
      });
      // First mapping contributes one name; the second holds a duplicate of
      // it plus four more (five unique names in total across languages).
      await ctx.db.insert("avatar_mappings", {
        avatarId,
        languageId: spanishId,
        name: "",
        speaker: "",
        storyNames: { "duo-x": "Federico" },
      });
      await ctx.db.insert("avatar_mappings", {
        avatarId,
        languageId: portugueseId,
        name: "",
        speaker: "",
        storyNames: {
          "duo-a": "Paula",
          "duo-b": "Federico",
          "duo-c": "Elsa",
          "duo-d": "Janet",
          "duo-e": "Nadia",
        },
      });
    });
    const contributor = t.withIdentity({ role: "contributor" });

    const rows = await contributor.query(
      api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
      { languageLegacyId: 1 },
    );
    const row = rows.find((r: { avatar_id: number }) => r.avatar_id === 988);

    const suggestions = row?.story_name_suggestions ?? [];
    // Duplicates removed, capped at four of the five unique names.
    expect(suggestions).toHaveLength(4);
    expect(new Set(suggestions).size).toBe(4);
    expect(suggestions).toContain("Federico");
    for (const name of suggestions) {
      expect(["Federico", "Paula", "Elsa", "Janet", "Nadia"]).toContain(name);
    }
  });
});
