import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL is not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
const PAGE_SIZE = Number(process.env.STORY_APPROVAL_COUNT_BACKFILL_PAGE_SIZE ?? "200");

async function main() {
  let cursor: string | null = null;
  let totalUpdated = 0;
  let totalPages = 0;

  for (;;) {
    const result = (await client.mutation(
      api.storyTables.backfillStoryApprovalCountsBatch,
      {
        paginationOpts: {
          numItems: PAGE_SIZE,
          cursor,
        },
      },
    )) as {
      updated: number;
      isDone: boolean;
      continueCursor: string;
    };

    totalPages += 1;
    totalUpdated += result.updated;
    cursor = result.continueCursor;

    console.log(
      `Processed page ${totalPages}, updated=${result.updated}, totalUpdated=${totalUpdated}`,
    );

    if (result.isDone) break;
  }

  console.log(
    `Backfill complete. pages=${totalPages}, storiesUpdated=${totalUpdated}`,
  );
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exitCode = 1;
});
