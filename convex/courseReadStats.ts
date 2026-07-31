import { TableAggregate } from "@convex-dev/aggregate";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { isContributorOrAdmin, requireAdmin } from "./lib/authorization";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 90;
const MAX_DAYS = 180;

function storyDoneCourseId(doc: Doc<"story_done">): Id<"courses"> {
  if (!doc.courseId) throw new Error(`story_done ${doc._id} has no courseId`);
  return doc.courseId;
}

const storyReadsByCourse = new TableAggregate<{
  Namespace: Id<"courses">;
  Key: number;
  DataModel: DataModel;
  TableName: "story_done";
}>(components.storyReadsByCourse, {
  namespace: storyDoneCourseId,
  sortKey: (doc) => doc.time,
});

const readersByCourse = new TableAggregate<{
  Namespace: Id<"courses">;
  Key: number;
  DataModel: DataModel;
  TableName: "course_readers";
}>(components.readersByCourse, {
  namespace: (doc) => doc.courseId,
  sortKey: (doc) => doc.firstReadAt,
});

export async function recordCourseReadStats(
  ctx: MutationCtx,
  completion: Doc<"story_done">,
) {
  await storyReadsByCourse.insertIfDoesNotExist(ctx, completion);
  if (completion.legacyUserId === undefined) return;

  const existing = await ctx.db
    .query("course_readers")
    .withIndex("by_course_id_and_legacy_user_id", (q) =>
      q
        .eq("courseId", storyDoneCourseId(completion))
        .eq("legacyUserId", completion.legacyUserId!),
    )
    .unique();

  if (!existing) {
    const id = await ctx.db.insert("course_readers", {
      courseId: storyDoneCourseId(completion),
      legacyUserId: completion.legacyUserId,
      firstReadAt: completion.time,
      lastReadAt: completion.time,
    });
    const reader = await ctx.db.get(id);
    if (!reader) throw new Error("Course reader was not persisted");
    await readersByCourse.insertIfDoesNotExist(ctx, reader);
    return;
  }

  const firstReadAt = Math.min(existing.firstReadAt, completion.time);
  const lastReadAt = Math.max(existing.lastReadAt, completion.time);
  if (
    firstReadAt === existing.firstReadAt &&
    lastReadAt === existing.lastReadAt
  ) {
    await readersByCourse.insertIfDoesNotExist(ctx, existing);
    return;
  }

  await ctx.db.patch(existing._id, { firstReadAt, lastReadAt });
  const updated = await ctx.db.get(existing._id);
  if (!updated) throw new Error("Course reader disappeared during update");
  await readersByCourse.replaceOrInsert(ctx, existing, updated);
}

const chartPointValidator = v.object({
  date: v.string(),
  storyReads: v.number(),
  newReaders: v.number(),
  totalReaders: v.number(),
});

export const getForEditor = query({
  args: {
    courseIdentifier: v.string(),
    days: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      points: v.array(chartPointValidator),
      totalStoryReads: v.number(),
      totalReaders: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (!(await isContributorOrAdmin(ctx))) return null;
    const course = /^\d+$/.test(args.courseIdentifier)
      ? await ctx.db
          .query("courses")
          .withIndex("by_id_value", (q) =>
            q.eq("legacyId", Number(args.courseIdentifier)),
          )
          .unique()
      : await ctx.db
          .query("courses")
          .withIndex("by_short", (q) => q.eq("short", args.courseIdentifier))
          .unique();
    if (!course) return null;

    const days = Math.max(
      1,
      Math.min(MAX_DAYS, Math.floor(args.days ?? DEFAULT_DAYS)),
    );
    const todayStart = Math.floor(Date.now() / DAY_MS) * DAY_MS;
    const start = todayStart - (days - 1) * DAY_MS;
    const buckets = Array.from({ length: days }, (_, index) => {
      const lower = start + index * DAY_MS;
      return { lower, upper: lower + DAY_MS };
    });
    const bounds = buckets.map(({ lower, upper }) => ({
      namespace: course._id,
      bounds: {
        lower: { key: lower, inclusive: true },
        upper: { key: upper, inclusive: false },
      },
    }));

    const [storyReads, newReaders, readersBeforeStart, totalStoryReads] =
      await Promise.all([
        storyReadsByCourse.countBatch(ctx, bounds),
        readersByCourse.countBatch(ctx, bounds),
        readersByCourse.count(ctx, {
          namespace: course._id,
          bounds: { upper: { key: start, inclusive: false } },
        }),
        storyReadsByCourse.count(ctx, { namespace: course._id }),
      ]);

    let totalReaders = readersBeforeStart;
    const points = buckets.map(({ lower }, index) => {
      totalReaders += newReaders[index] ?? 0;
      return {
        date: new Date(lower).toISOString().slice(0, 10),
        storyReads: storyReads[index] ?? 0,
        newReaders: newReaders[index] ?? 0,
        totalReaders,
      };
    });

    return { points, totalStoryReads, totalReaders };
  },
});

export const backfill = mutation({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    processed: v.number(),
    skipped: v.number(),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("story_done").paginate(args.paginationOpts);

    let skipped = 0;
    for (const completion of page.page) {
      let current = completion;
      if (!current.courseId) {
        const story = await ctx.db.get(current.storyId);
        if (!story) {
          skipped += 1;
          continue;
        }
        await ctx.db.patch(current._id, { courseId: story.courseId });
        current = { ...current, courseId: story.courseId };
      }
      await recordCourseReadStats(ctx, current);
    }

    return {
      processed: page.page.length,
      skipped,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});
