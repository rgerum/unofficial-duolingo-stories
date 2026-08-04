/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { createConvexTest } from "../test/convexTestHarness";

describe("course vocabulary", () => {
  test("is restricted to admins", async () => {
    const t = createConvexTest();
    const args = { short: "da-en" };

    await expect(
      t.query(api.vocabulary.getCourseVocabularySourceForAdmin, args),
    ).rejects.toThrow("Unauthorized");
    await expect(
      t
        .withIdentity({ role: "contributor" })
        .query(api.vocabulary.getCourseVocabularySourceForAdmin, args),
    ).rejects.toThrow("Unauthorized");

    await expect(
      t
        .withIdentity({ role: "admin" })
        .query(api.vocabulary.getCourseVocabularySourceForAdmin, args),
    ).resolves.toBeNull();
  });
});
