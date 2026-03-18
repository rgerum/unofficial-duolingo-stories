import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_SITE_URL =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  process.env.CONVEX_SITE_URL ??
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL;
const COURSE_CONTRIBUTOR_BACKFILL_SECRET =
  process.env.COURSE_CONTRIBUTOR_BACKFILL_SECRET;
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

if (!CONVEX_SITE_URL) {
  console.error(
    "Error: NEXT_PUBLIC_CONVEX_SITE_URL/CONVEX_SITE_URL/CONVEX_URL is not set.",
  );
  process.exit(1);
}

if (!COURSE_CONTRIBUTOR_BACKFILL_SECRET) {
  console.error("Error: COURSE_CONTRIBUTOR_BACKFILL_SECRET is not set.");
  process.exit(1);
}

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

async function runBatch(baseUrl: string, cursor: string | null) {
  const response = await fetch(`${baseUrl}/admin/backfill-course-contributors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: COURSE_CONTRIBUTOR_BACKFILL_SECRET,
      batchSize: BATCH_SIZE,
      cursor,
      dryRun: DRY_RUN,
    }),
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new Error(
      `Backfill request failed with ${response.status}: ${JSON.stringify(parsed)}`,
    );
  }

  return parsed as BackfillResult;
}

async function main() {
  const baseUrl = String(CONVEX_SITE_URL).replace(/\/+$/, "");
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

    const result = await runBatch(baseUrl, cursor);
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
