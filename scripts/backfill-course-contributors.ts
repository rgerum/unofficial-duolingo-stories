import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// The backfill is an internal Convex mutation (no HTTP route / shared secret).
// This script drives it batch-by-batch via `pnpm exec convex run`, following
// the returned cursor until the whole `courses` table has been processed.
const INTERNAL_FUNCTION =
  "courseContributorBackfill:backfillCourseContributorDetailsBatchInternal";
const BATCH_SIZE = parsePositiveNumber(
  process.env.COURSE_CONTRIBUTOR_BACKFILL_BATCH_SIZE,
  10,
);
const BATCH_DELAY_MS = parsePositiveNumber(
  process.env.COURSE_CONTRIBUTOR_BACKFILL_BATCH_DELAY_MS,
  0,
);
const DRY_RUN = parseBooleanEnv(
  process.env.COURSE_CONTRIBUTOR_BACKFILL_DRY_RUN,
  false,
);

type BackfillResult = {
  processed: number;
  updatedCourses: number;
  nextCursor: string | null;
  isDone: boolean;
  errors: Array<{
    courseId: number;
    message: string;
  }>;
};

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error("Error: batch values must be positive numbers.");
    process.exit(1);
  }
  return Math.floor(parsed);
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJson(stdout: string): unknown {
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error(`Could not parse convex run output:\n${stdout}`);
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function runBatch(cursor: string | null): BackfillResult {
  const args = { batchSize: BATCH_SIZE, cursor, dryRun: DRY_RUN };
  const stdout = execFileSync(
    "pnpm",
    ["exec", "convex", "run", INTERNAL_FUNCTION, JSON.stringify(args)],
    { encoding: "utf8" },
  );
  return extractJson(stdout) as BackfillResult;
}

async function main() {
  let cursor: string | null = null;
  let processedTotal = 0;
  let updatedCoursesTotal = 0;
  const errors: BackfillResult["errors"] = [];
  let batchNumber = 0;

  while (true) {
    batchNumber += 1;
    console.log(
      `Running batch ${batchNumber} (size=${BATCH_SIZE}, cursor=${cursor ?? "start"})...`,
    );

    const result = runBatch(cursor);
    processedTotal += result.processed;
    updatedCoursesTotal += result.updatedCourses;
    errors.push(...result.errors);

    console.log(
      `Batch ${batchNumber} complete: processed=${result.processed}, updatedCourses=${result.updatedCourses}, errors=${result.errors.length}`,
    );

    if (result.isDone || !result.nextCursor || result.processed === 0) {
      break;
    }

    cursor = result.nextCursor;
    if (BATCH_DELAY_MS > 0) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("Course contributor backfill completed.");
  console.log(
    JSON.stringify(
      {
        processed: processedTotal,
        updatedCourses: updatedCoursesTotal,
        errors,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Course contributor backfill failed.");
  console.error(error);
  process.exit(1);
});
