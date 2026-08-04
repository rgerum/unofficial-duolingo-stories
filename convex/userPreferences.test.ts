/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("user preferences", () => {
  test("asks for story approval confirmation by default", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ userId: "7" });

    await expect(
      asUser.query(api.userPreferences.getCurrentStoryPreferences, {}),
    ).resolves.toMatchObject({
      confirmStoryApprovals: true,
      hideStoryQuestions: false,
    });
  });

  test("updates one preference without overwriting the other", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ userId: "7" });

    await asUser.mutation(api.userPreferences.setCurrentStoryPreferences, {
      hideStoryQuestions: true,
    });
    await asUser.mutation(api.userPreferences.setCurrentStoryPreferences, {
      confirmStoryApprovals: false,
    });

    await expect(
      asUser.query(api.userPreferences.getCurrentStoryPreferences, {}),
    ).resolves.toMatchObject({
      confirmStoryApprovals: false,
      hideStoryQuestions: true,
    });
  });
});
