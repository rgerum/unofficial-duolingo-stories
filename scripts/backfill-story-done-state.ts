import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const BATCH_SIZE = Number(process.env.STORY_DONE_BACKFILL_BATCH_SIZE ?? "200");
const DRY_RUN = process.env.STORY_DONE_BACKFILL_DRY_RUN === "1";
const API_KEY = process.env.STORY_DONE_BACKFILL_API_KEY;

if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL is not set");
  process.exit(1);
}

if (!Number.isFinite(BATCH_SIZE) || BATCH_SIZE <= 0) {
  console.error("Error: STORY_DONE_BACKFILL_BATCH_SIZE must be a positive number");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

type BackfillBatchResult = {
  processed: number;
  continueCursor: string | null;
  isDone: boolean;
};

async function main() {
  let cursor: string | null = null;
  let batches = 0;
  let totalProcessed = 0;

  for (;;) {
    const result: BackfillBatchResult = await client.mutation(
      api.storyDone.backfillDoneStateFromLogBatch,
      {
        paginationOpts: {
          numItems: BATCH_SIZE,
          cursor,
        },
        dryRun: DRY_RUN,
        apiKey: API_KEY,
      },
    );

    batches += 1;
    totalProcessed += result.processed;
    console.log(
      `batch=${batches} processed=${result.processed} total=${totalProcessed} done=${result.isDone}`,
    );

    cursor = result.continueCursor;
    if (result.isDone) break;
  }

  console.log(
    `Backfill complete. batches=${batches} totalProcessed=${totalProcessed} dryRun=${DRY_RUN ? "yes" : "no"}`,
  );
}

main().catch((error) => {
  console.error("Backfill failed", error);
  process.exitCode = 1;
});
