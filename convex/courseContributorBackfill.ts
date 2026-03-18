import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalMutation } from "./_generated/server";
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function requireCourseContributorBackfillSecret(req: Request) {
  const expectedSecret = process.env.COURSE_CONTRIBUTOR_BACKFILL_SECRET;
  if (!expectedSecret) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error: "Missing COURSE_CONTRIBUTOR_BACKFILL_SECRET env var",
        },
        500,
      ),
    } as const;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: json({ ok: false, error: "Invalid JSON body" }, 400),
    } as const;
  }

  const parsed = body as { secret?: unknown };
  if (parsed.secret !== expectedSecret) {
    return {
      ok: false,
      response: json({ ok: false, error: "Unauthorized" }, 401),
    } as const;
  }

  return { ok: true, body } as const;
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

export const backfillCourseContributorDetailsHttp = httpAction(
  async (ctx, req) => {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const auth = await requireCourseContributorBackfillSecret(req);
    if (!auth.ok) return auth.response;

    const body = auth.body as {
      batchSize?: unknown;
      cursor?: unknown;
      dryRun?: unknown;
    };

    if (body.batchSize !== undefined && typeof body.batchSize !== "number") {
      return json({ ok: false, error: "batchSize must be a number" }, 400);
    }
    if (
      body.cursor !== undefined &&
      body.cursor !== null &&
      typeof body.cursor !== "string"
    ) {
      return json({ ok: false, error: "cursor must be a string or null" }, 400);
    }
    if (body.dryRun !== undefined && typeof body.dryRun !== "boolean") {
      return json({ ok: false, error: "dryRun must be a boolean" }, 400);
    }

    const result = await ctx.runMutation(
      internal.courseContributorBackfill
        .backfillCourseContributorDetailsBatchInternal,
      {
        batchSize:
          typeof body.batchSize === "number" ? body.batchSize : undefined,
        cursor:
          typeof body.cursor === "string" || body.cursor === null
            ? body.cursor
            : undefined,
        dryRun: typeof body.dryRun === "boolean" ? body.dryRun : undefined,
      },
    );

    return json(result);
  },
);
