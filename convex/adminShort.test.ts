/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("admin language saves trim Short and reject invalid codes", async () => {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ role: "admin", userId: "1" });
  const fields = {
    name: "Pochutec",
    flag: 0,
    flag_file: " mexico.svg ",
    speaker: " voice ",
    rtl: false,
  };

  const language = await admin.mutation(api.adminWrite.createAdminLanguage, {
    ...fields,
    short: " xpo ",
  });
  expect(language).toMatchObject({
    short: "xpo",
    flag_file: "mexico.svg",
    speaker: "voice",
  });

  const updated = await admin.mutation(api.adminWrite.updateAdminLanguage, {
    ...fields,
    id: language.id,
    short: " xpo-Latn ",
  });
  expect(updated).toMatchObject({
    short: "xpo-Latn",
    flag_file: "mexico.svg",
    speaker: "voice",
  });

  for (const short of ["xp o", "xpó", "xpo/es", " "]) {
    await expect(
      admin.mutation(api.adminWrite.updateAdminLanguage, {
        ...fields,
        id: language.id,
        short,
      }),
    ).rejects.toThrow("Language Short");
  }
});

test("resaving a course repairs its Short when a language has outer whitespace", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    const learningLanguageId = await ctx.db.insert("languages", {
      legacyId: 1,
      name: "Pochutec",
      short: "  xpo",
      public: false,
      rtl: false,
    });
    const fromLanguageId = await ctx.db.insert("languages", {
      legacyId: 2,
      name: "Spanish",
      short: "es",
      public: true,
      rtl: false,
    });
    await ctx.db.insert("courses", {
      legacyId: 327,
      short: "  xpo-es",
      learningLanguageId,
      fromLanguageId,
      public: false,
      official: false,
    });
  });

  const admin = t.withIdentity({ role: "admin", userId: "1" });
  expect(
    await admin.query(api.editorRead.getEditorCourseByIdentifier, {
      identifier: "xpo-es",
    }),
  ).toBeNull();
  await admin.mutation(api.adminWrite.updateAdminCourse, {
    id: 327,
    learning_language: 1,
    from_language: 2,
  });
  expect(
    await admin.query(api.editorRead.getEditorCourseByIdentifier, {
      identifier: "xpo-es",
    }),
  ).toMatchObject({ id: 327, short: "xpo-es" });
  await expect(
    admin.mutation(api.adminWrite.createAdminCourse, {
      learning_language: 1,
      from_language: 2,
    }),
  ).rejects.toThrow("already in use");
});
