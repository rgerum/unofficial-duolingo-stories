/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// The authorization guards (requireContributorOrAdmin / requireSessionLegacyUserId)
// are plain helpers taking a ctx, so we exercise them through a real mutation
// (setStory) that calls them first. A caller who clears the guard proceeds far
// enough to hit the "Course ... not found" error, which proves the guard admitted them.
const minimalSetStoryArgs = {
  duo_id: "d1",
  name: "n",
  image: "",
  set_id: 1,
  set_index: 1,
  legacyCourseId: 999,
  text: "",
  json: {},
  todo_count: 0,
  change_date: new Date().toISOString(),
};

describe("authorization guards (via setStory)", () => {
  test("unauthenticated caller is rejected with Unauthorized", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.storyWrite.setStory, minimalSetStoryArgs),
    ).rejects.toThrow("Unauthorized");
  });

  test("role 'user' is rejected with Unauthorized", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ role: "user", userId: "5" });
    await expect(
      asUser.mutation(api.storyWrite.setStory, minimalSetStoryArgs),
    ).rejects.toThrow("Unauthorized");
  });

  test("role 'contributor' clears the guard (fails later on missing course)", async () => {
    const t = convexTest(schema, modules);
    const asContributor = t.withIdentity({ role: "contributor", userId: "5" });
    await expect(
      asContributor.mutation(api.storyWrite.setStory, minimalSetStoryArgs),
    ).rejects.toThrow("Course 999 not found");
  });

  test("contributor with a non-numeric userId is rejected with Unauthorized", async () => {
    const t = convexTest(schema, modules);
    // requireSessionLegacyUserId runs after requireContributorOrAdmin and
    // rejects identities whose userId does not parse to a positive integer.
    const asContributor = t.withIdentity({
      role: "contributor",
      userId: "not-a-number",
    });
    await expect(
      asContributor.mutation(api.storyWrite.setStory, minimalSetStoryArgs),
    ).rejects.toThrow("Unauthorized");
  });
});
