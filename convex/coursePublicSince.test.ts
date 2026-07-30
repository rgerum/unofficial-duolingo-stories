/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// `publicSince` must record the most recent private→public transition across
// every write path that touches `courses.public` (admin update, admin create,
// and the legacy-mirror upsert, whose db.replace would otherwise drop it).

async function seedLanguages(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("languages", {
      legacyId: 1,
      name: "Spanish",
      short: "es",
      public: true,
      rtl: false,
    });
    await ctx.db.insert("languages", {
      legacyId: 2,
      name: "English",
      short: "en",
      public: true,
      rtl: false,
    });
  });
}

async function seedCourse(
  t: ReturnType<typeof convexTest>,
  { isPublic, publicSince }: { isPublic: boolean; publicSince?: number },
) {
  await t.run(async (ctx) => {
    const languages = await ctx.db.query("languages").collect();
    const learningLanguage = languages.find((l) => l.legacyId === 1);
    const fromLanguage = languages.find((l) => l.legacyId === 2);
    if (!learningLanguage || !fromLanguage)
      throw new Error("seed languages first");
    await ctx.db.insert("courses", {
      legacyId: 100,
      short: "es-en",
      learningLanguageId: learningLanguage._id,
      fromLanguageId: fromLanguage._id,
      public: isPublic,
      publicSince,
      official: false,
    });
  });
}

async function getCourse(t: ReturnType<typeof convexTest>, legacyId = 100) {
  return t.run(async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const course = courses.find((c) => c.legacyId === legacyId);
    if (!course) throw new Error(`course ${legacyId} not found`);
    return course;
  });
}

const asAdmin = (t: ReturnType<typeof convexTest>) =>
  t.withIdentity({ role: "admin", userId: "1" });

describe("updateAdminCourse publicSince", () => {
  test("stamps publicSince on private→public", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: false });

    const before = Date.now();
    const updated = await asAdmin(t).mutation(
      api.adminWrite.updateAdminCourse,
      {
        id: 100,
        learning_language: 1,
        from_language: 2,
        public: true,
      },
    );
    expect(updated.publicSince).toBeGreaterThanOrEqual(before);

    const course = await getCourse(t);
    expect(course.public).toBe(true);
    expect(course.publicSince).toBeGreaterThanOrEqual(before);
  });

  test("keeps publicSince when a public course is edited", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: true, publicSince: 12345 });

    const updated = await asAdmin(t).mutation(
      api.adminWrite.updateAdminCourse,
      {
        id: 100,
        learning_language: 1,
        from_language: 2,
        public: true,
        name: "Renamed",
      },
    );

    expect(updated.publicSince).toBe(12345);
    expect((await getCourse(t)).publicSince).toBe(12345);
  });

  test("keeps publicSince when unpublishing, restamps on republish", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: true, publicSince: 12345 });

    const unpublished = await asAdmin(t).mutation(
      api.adminWrite.updateAdminCourse,
      {
        id: 100,
        learning_language: 1,
        from_language: 2,
        public: false,
      },
    );
    expect(unpublished.publicSince).toBe(12345);
    expect((await getCourse(t)).publicSince).toBe(12345);

    const before = Date.now();
    const republished = await asAdmin(t).mutation(
      api.adminWrite.updateAdminCourse,
      {
        id: 100,
        learning_language: 1,
        from_language: 2,
        public: true,
      },
    );
    expect(republished.publicSince).toBeGreaterThanOrEqual(before);
    expect((await getCourse(t)).publicSince).toBeGreaterThanOrEqual(before);
  });
});

describe("createAdminCourse publicSince", () => {
  test("stamps when created public, leaves unset when private", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);

    const before = Date.now();
    const created = await asAdmin(t).mutation(
      api.adminWrite.createAdminCourse,
      {
        learning_language: 1,
        from_language: 2,
        public: true,
      },
    );
    expect(created.publicSince).toBeGreaterThanOrEqual(before);
    const publicCourse = await getCourse(t, created.id);
    expect(publicCourse.publicSince).toBeGreaterThanOrEqual(before);

    const createdPrivate = await asAdmin(t).mutation(
      api.adminWrite.createAdminCourse,
      { learning_language: 1, from_language: 2 },
    );
    expect(createdPrivate.publicSince).toBeUndefined();
    expect((await getCourse(t, createdPrivate.id)).publicSince).toBeUndefined();
  });
});

describe("lookupTables.upsertCourse publicSince", () => {
  const mirrorCourse = (isPublic: boolean) => ({
    legacyId: 100,
    short: "es-en",
    legacyLearningLanguageId: 1,
    legacyFromLanguageId: 2,
    public: isPublic,
    official: false,
  });

  test("preserves publicSince through db.replace when staying public", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: true, publicSince: 12345 });

    await asAdmin(t).mutation(api.lookupTables.upsertCourse, {
      course: mirrorCourse(true),
    });

    expect((await getCourse(t)).publicSince).toBe(12345);
  });

  test("stamps publicSince on a private→public mirror transition", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: false });

    const before = Date.now();
    await asAdmin(t).mutation(api.lookupTables.upsertCourse, {
      course: mirrorCourse(true),
    });

    expect((await getCourse(t)).publicSince).toBeGreaterThanOrEqual(before);
  });

  test("stamps publicSince when the mirror inserts a new public course", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);

    const before = Date.now();
    await asAdmin(t).mutation(api.lookupTables.upsertCourse, {
      course: mirrorCourse(true),
    });

    expect((await getCourse(t)).publicSince).toBeGreaterThanOrEqual(before);
  });
});

describe("getPublicCourseList publicSince", () => {
  test("exposes publicSince for public courses", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: true, publicSince: 12345 });

    const list = await t.query(api.landing.getPublicCourseList, {});
    expect(list).toHaveLength(1);
    expect(list[0].publicSince).toBe(12345);
  });
});

describe("backfillPublicSince", () => {
  test("fills only public courses missing a value; never overwrites", async () => {
    const t = convexTest(schema, modules);
    await seedLanguages(t);
    await seedCourse(t, { isPublic: true }); // es-en, no publicSince

    const result = await t.mutation(internal.adminWrite.backfillPublicSince, {
      entries: [
        { short: "es-en", publicSince: 1_600_000_000_000 },
        { short: "missing-xx", publicSince: 1 },
      ],
    });
    expect(result.updated).toEqual(["es-en"]);
    expect(result.skipped).toEqual(["missing-xx"]);
    expect((await getCourse(t)).publicSince).toBe(1_600_000_000_000);

    // Re-running must not overwrite the now-present value.
    const again = await t.mutation(internal.adminWrite.backfillPublicSince, {
      entries: [{ short: "es-en", publicSince: 42 }],
    });
    expect(again.updated).toEqual([]);
    expect(again.skipped).toEqual(["es-en"]);
    expect((await getCourse(t)).publicSince).toBe(1_600_000_000_000);
  });
});
