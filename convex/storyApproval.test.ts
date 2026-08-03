/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import betterAuthSchema from "./betterAuth/schema";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const betterAuthModules = import.meta.glob("./betterAuth/**/*.ts");

async function seedCourseWithStory(t: ReturnType<typeof convexTest>) {
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
      duo_id: "story-duo-10",
      name: "Story",
      set_id: 1,
      set_index: 1,
      public: false,
      courseId,
      status: "draft",
      deleted: false,
      approvalCount: 0,
      todo_count: 0,
    });
    return { courseId, storyId };
  });
}

const contributor = { role: "contributor", userId: "5" };

describe("upsertStoryApproval", () => {
  test("role 'user' is rejected with Unauthorized", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);
    const asUser = t.withIdentity({ role: "user", userId: "5" });

    await expect(
      asUser.mutation(api.storyApproval.upsertStoryApproval, {
        legacyStoryId: 10,
      }),
    ).rejects.toThrow("Unauthorized");
  });

  test("contributor creates a story_approval row", async () => {
    const t = convexTest(schema, modules);
    const { storyId } = await seedCourseWithStory(t);
    const asContributor = t.withIdentity(contributor);

    const result = await asContributor.mutation(
      api.storyApproval.upsertStoryApproval,
      { legacyStoryId: 10, date: 4242 },
    );
    expect(result.inserted).toBe(true);

    await t.run(async (ctx) => {
      const approvals = await ctx.db
        .query("story_approval")
        .withIndex("by_story", (q) => q.eq("storyId", storyId as Id<"stories">))
        .collect();
      expect(approvals).toHaveLength(1);
      expect(approvals[0]?.legacyUserId).toBe(5);
      expect(approvals[0]?.date).toBe(4242);
    });
  });

  test("unknown legacyStoryId rejects with Missing story", async () => {
    const t = convexTest(schema, modules);
    await seedCourseWithStory(t);
    const asContributor = t.withIdentity(contributor);

    await expect(
      asContributor.mutation(api.storyApproval.upsertStoryApproval, {
        legacyStoryId: 999,
      }),
    ).rejects.toThrow("Missing story for legacy id 999");
  });
});

describe("toggleStoryApproval", () => {
  test("first toggle adds an approval and moves the story to 'feedback'", async () => {
    const t = convexTest(schema, modules);
    // toggleStoryApproval recomputes course contributors, which reads the
    // better-auth component's adapter; register it so the query resolves
    // (the component tables stay empty, so no contributor rows are produced).
    t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
    const { storyId } = await seedCourseWithStory(t);
    const asContributor = t.withIdentity(contributor);

    const result = await asContributor.mutation(
      api.storyApproval.toggleStoryApproval,
      { legacyStoryId: 10 },
    );

    expect(result.action).toBe("added");
    expect(result.count).toBe(1);
    // 0 approvals -> "draft", 1 -> "feedback", 2+ -> "finished".
    expect(result.story_status).toBe("feedback");

    await t.run(async (ctx) => {
      const story = await ctx.db.get(storyId as Id<"stories">);
      expect(story?.status).toBe("feedback");
      expect(story?.approvalCount).toBe(1);
    });
  });

  test.each([
    { coursePublic: true, expectedAnnouncements: 1 },
    { coursePublic: false, expectedAnnouncements: 0 },
  ])(
    "schedules a set announcement only when course public is $coursePublic",
    async ({ coursePublic, expectedAnnouncements }) => {
      const t = convexTest(schema, modules);
      t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
      const { courseId, storyId } = await seedCourseWithStory(t);

      await t.run(async (ctx) => {
        await ctx.db.patch(courseId as Id<"courses">, {
          public: coursePublic,
        });
        await ctx.db.patch(storyId as Id<"stories">, {
          status: "feedback",
          approvalCount: 1,
        });
        await ctx.db.insert("story_approval", {
          storyId: storyId as Id<"stories">,
          legacyUserId: 6,
          date: Date.now(),
        });
        for (let index = 2; index <= 4; index += 1) {
          await ctx.db.insert("stories", {
            legacyId: 9 + index,
            name: `Story ${index}`,
            set_id: 1,
            set_index: index,
            public: false,
            courseId: courseId as Id<"courses">,
            status: "finished",
            deleted: false,
            approvalCount: 2,
            todo_count: 0,
          });
        }
      });

      const result = await t
        .withIdentity(contributor)
        .mutation(api.storyApproval.toggleStoryApproval, {
          legacyStoryId: 10,
        });
      expect(result.published).toHaveLength(4);

      const announcementCount = await t.run(async (ctx) => {
        const scheduled = await ctx.db.system
          .query("_scheduled_functions")
          .collect();
        return scheduled.filter(
          (row) =>
            row.name === "discordAnnouncements:postPublicationAnnouncement",
        ).length;
      });
      expect(announcementCount).toBe(expectedAnnouncements);
    },
  );
});
