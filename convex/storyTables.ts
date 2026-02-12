import { mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

const storyValidator = {
  legacyId: v.number(),
  duo_id: v.optional(v.string()),
  name: v.string(),
  set_id: v.optional(v.number()),
  set_index: v.optional(v.number()),
  // Temporary migration compatibility with pre-existing rows.
  // TODO(post-migration): tighten to one type after author identity normalization.
  authorId: v.optional(v.union(v.number(), v.string())),
  authorChangeId: v.optional(v.union(v.number(), v.string())),
  date: v.optional(v.number()),
  change_date: v.optional(v.number()),
  date_published: v.optional(v.number()),
  public: v.boolean(),
  legacyImageId: v.optional(v.string()),
  legacyCourseId: v.number(),
  status: v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
  approvalCount: v.optional(v.number()),
  deleted: v.boolean(),
  todo_count: v.number(),
};

const storyContentValidator = {
  legacyStoryId: v.number(),
  text: v.string(),
  json: v.any(),
  lastUpdated: v.number(),
};

export const upsertStory = mutation({
  args: {
    story: v.object(storyValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("stories"),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) =>
        q.eq("legacyId", args.story.legacyCourseId),
      )
      .unique();
    if (!course) {
      throw new Error(
        `Missing course for legacy id ${args.story.legacyCourseId}`,
      );
    }

    const image = args.story.legacyImageId
      ? await ctx.db
          .query("images")
          .withIndex("by_id_value", (q) =>
            q.eq("legacyId", args.story.legacyImageId!),
          )
          .unique()
      : null;

    const existing = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.story.legacyId))
      .unique();

    const doc = {
      legacyId: args.story.legacyId,
      duo_id: args.story.duo_id,
      name: args.story.name,
      set_id: args.story.set_id,
      set_index: args.story.set_index,
      authorId: args.story.authorId,
      authorChangeId: args.story.authorChangeId,
      date: args.story.date,
      change_date: args.story.change_date,
      date_published: args.story.date_published,
      public: args.story.public,
      imageId: image?._id,
      courseId: course._id,
      status: args.story.status,
      approvalCount: args.story.approvalCount ?? existing?.approvalCount ?? 0,
      deleted: args.story.deleted,
      todo_count: args.story.todo_count,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("stories", doc);
    return { inserted: true, docId };
  },
});

export const upsertStoryContent = mutation({
  args: {
    storyContent: v.object(storyContentValidator),
    operationKey: v.optional(v.string()),
  },
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("story_content"),
  }),
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) =>
        q.eq("legacyId", args.storyContent.legacyStoryId),
      )
      .unique();
    if (!story) {
      throw new Error(
        `Missing story for legacy id ${args.storyContent.legacyStoryId}`,
      );
    }

    const existing = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .unique();

    const doc = {
      storyId: story._id,
      text: args.storyContent.text,
      json: args.storyContent.json,
      lastUpdated: args.storyContent.lastUpdated,
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
      return { inserted: false, docId: existing._id };
    }

    const docId = await ctx.db.insert("story_content", doc);
    return { inserted: true, docId };
  },
});

export const stripStoryHeavyFieldsBatch = mutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    updated: v.number(),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("stories")
      .order("asc")
      .paginate(args.paginationOpts);

    let updated = 0;
    for (const row of page.page) {
      if (!("text" in row) && !("json" in row)) continue;
      const { _id, _creationTime, text, json, ...rest } = row as any;
      await ctx.db.replace(_id, rest);
      updated += 1;
    }

    return {
      updated,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
