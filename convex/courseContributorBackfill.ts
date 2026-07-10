// Operator-run maintenance backfill. This is an internal function (not an HTTP
// route) so it is not reachable from the public internet. Run a single batch
// with:
//
//   pnpm exec convex run courseContributorBackfill:backfillCourseContributorDetailsBatchInternal '{"dryRun": true}'
//
// then repeat, passing the returned `nextCursor` as `{"cursor": "..."}` until
// `isDone` is true. The `pnpm run backfill:course-contributors` script drives
// this loop automatically.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  getRankedCourseContributors,
  partitionCourseContributors,
} from "./lib/courseContributors";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;

function normalizeBatchSize(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(value)));
}

const backfillResultValidator = v.object({
  processed: v.number(),
  updatedCourses: v.number(),
  nextCursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
  errors: v.array(
    v.object({
      courseId: v.number(),
      message: v.string(),
    }),
  ),
});

export const backfillCourseContributorDetailsBatchInternal = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
    dryRun: v.optional(v.boolean()),
  },
  returns: backfillResultValidator,
  handler: async (ctx, args) => {
    const batchSize = normalizeBatchSize(args.batchSize);
    const page = await ctx.db.query("courses").paginate({
      cursor: args.cursor ?? null,
      numItems: batchSize,
    });

    let updatedCourses = 0;
    const errors: Array<{ courseId: number; message: string }> = [];

    for (const course of page.page) {
      try {
        const contributorLists = partitionCourseContributors(
          await getRankedCourseContributors(ctx, course._id),
        );

        if (!args.dryRun) {
          await ctx.db.patch(course._id, {
            contributors: contributorLists.contributors.map((row) => row.name),
            contributors_past: contributorLists.contributors_past.map(
              (row) => row.name,
            ),
            contributorDetails: contributorLists.contributors,
            contributorDetailsPast: contributorLists.contributors_past,
          });
        }

        updatedCourses += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          courseId: course.legacyId,
          message,
        });
      }
    }

    return {
      processed: page.page.length,
      updatedCourses,
      nextCursor: page.continueCursor,
      isDone: page.isDone,
      errors,
    };
  },
});
