import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setStory = mutation({
  args: {
    legacyStoryId: v.optional(v.number()),
    duo_id: v.string(),
    name: v.string(),
    image: v.string(),
    set_id: v.number(),
    set_index: v.number(),
    legacyCourseId: v.number(),
    text: v.string(),
    json: v.any(),
    todo_count: v.number(),
    author_change: v.number(),
    change_date: v.string(),
    operationKey: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.number(),
      name: v.string(),
      course_id: v.number(),
      text: v.string(),
      todo_count: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyCourseId))
      .unique();
    if (!course) {
      throw new Error(`Course ${args.legacyCourseId} not found`);
    }

    const storyById =
      args.legacyStoryId !== undefined
        ? await ctx.db
            .query("stories")
            .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId!))
            .unique()
        : null;

    const storyByDuoId =
      !storyById && args.duo_id
        ? (
            await ctx.db
            .query("stories")
            .withIndex("by_duo_id_course", (q) =>
              q.eq("duo_id", args.duo_id).eq("courseId", course._id),
            )
            .collect()
          )[0] ?? null
        : null;

    const story = storyById ?? storyByDuoId;
    if (!story || story.legacyId === undefined) return null;

    const image = args.image
      ? await ctx.db
          .query("images")
          .withIndex("by_id_value", (q) => q.eq("legacyId", args.image))
          .unique()
      : null;

    const changeDateMillis = Date.parse(args.change_date);
    const operationKey =
      args.operationKey ?? `story:${story.legacyId}:set_story:${Date.now()}`;

    await ctx.db.patch(story._id, {
      duo_id: args.duo_id,
      name: args.name,
      imageId: image?._id,
      change_date: Number.isFinite(changeDateMillis)
        ? changeDateMillis
        : Date.now(),
      authorChangeId: args.author_change,
      set_id: args.set_id,
      set_index: args.set_index,
      courseId: course._id,
      todo_count: args.todo_count,
    });

    const existingContent = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .unique();

    if (existingContent) {
      await ctx.db.patch(existingContent._id, {
        text: args.text,
        json: args.json,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("story_content", {
        storyId: story._id,
        text: args.text,
        json: args.json,
        lastUpdated: Date.now(),
      });
    }

    const storiesInCourse = await ctx.db
      .query("stories")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();
    const courseTodoCount = storiesInCourse.reduce(
      (acc, row) => acc + (row.todo_count ?? 0),
      0,
    );
    await ctx.db.patch(course._id, { todo_count: courseTodoCount });

    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorStorySet, {
      storyId: story.legacyId,
      duo_id: args.duo_id,
      name: args.name,
      image: args.image,
      change_date: args.change_date,
      author_change: args.author_change,
      set_id: args.set_id,
      set_index: args.set_index,
      course_id: args.legacyCourseId,
      text: args.text,
      json: args.json,
      todo_count: args.todo_count,
      operationKey,
    });

    return {
      id: story.legacyId,
      name: args.name,
      course_id: args.legacyCourseId,
      text: args.text,
      todo_count: args.todo_count,
    };
  },
});

export const deleteStory = mutation({
  args: {
    legacyStoryId: v.number(),
    operationKey: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.number(),
      name: v.string(),
      course_id: v.number(),
      text: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story || story.legacyId === undefined) return null;

    const [course, content] = await Promise.all([
      ctx.db.get(story.courseId),
      ctx.db
        .query("story_content")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .unique(),
    ]);

    if (!course) {
      throw new Error(`Course missing for story ${args.legacyStoryId}`);
    }

    await ctx.db.patch(story._id, {
      deleted: true,
      public: false,
    });

    const operationKey = args.operationKey ?? `story:${story.legacyId}:delete:${Date.now()}`;
    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorStoryDelete, {
      storyId: story.legacyId,
      operationKey,
    });

    return {
      id: story.legacyId,
      name: story.name,
      course_id: course.legacyId,
      text: content?.text ?? "",
    };
  },
});

export const importStory = mutation({
  args: {
    sourceLegacyStoryId: v.number(),
    targetLegacyCourseId: v.number(),
    authorLegacyUserId: v.number(),
    operationKey: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.object({ id: v.number(), course_id: v.number(), text: v.string(), name: v.string() })),
  handler: async (ctx, args) => {
    const [sourceStory, targetCourse] = await Promise.all([
      ctx.db
        .query("stories")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.sourceLegacyStoryId))
        .unique(),
      ctx.db
        .query("courses")
        .withIndex("by_id_value", (q) => q.eq("legacyId", args.targetLegacyCourseId))
        .unique(),
    ]);

    if (!sourceStory || !targetCourse) return null;

    const sourceContent = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", sourceStory._id))
      .unique();
    if (!sourceContent) return null;

    const last = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id")
      .order("desc")
      .take(1);
    const newLegacyId = Math.max(1, Number(last[0]?.legacyId ?? 0) + 1);

    const newStoryId = await ctx.db.insert("stories", {
      legacyId: newLegacyId,
      duo_id: sourceStory.duo_id,
      name: sourceStory.name,
      set_id: sourceStory.set_id,
      set_index: sourceStory.set_index,
      authorId: args.authorLegacyUserId,
      public: false,
      imageId: sourceStory.imageId,
      courseId: targetCourse._id,
      status: "draft",
      approvalCount: 0,
      deleted: false,
      todo_count: 0,
    });

    await ctx.db.insert("story_content", {
      storyId: newStoryId,
      text: sourceContent.text,
      json: sourceContent.json,
      lastUpdated: Date.now(),
    });

    const imageLegacyId =
      sourceStory.imageId ? (await ctx.db.get(sourceStory.imageId))?.legacyId ?? "" : "";

    const operationKey =
      args.operationKey ??
      `story:${newLegacyId}:import:${args.targetLegacyCourseId}:${Date.now()}`;

    await ctx.scheduler.runAfter(0, internal.postgresMirror.mirrorStoryImport, {
      storyId: newLegacyId,
      duo_id: sourceStory.duo_id ?? "",
      name: sourceStory.name,
      image: imageLegacyId,
      set_id: sourceStory.set_id ?? 0,
      set_index: sourceStory.set_index ?? 0,
      author: args.authorLegacyUserId,
      course_id: args.targetLegacyCourseId,
      text: sourceContent.text,
      json: sourceContent.json,
      operationKey,
    });

    return {
      id: newLegacyId,
      course_id: args.targetLegacyCourseId,
      text: sourceContent.text,
      name: sourceStory.name,
    };
  },
});
