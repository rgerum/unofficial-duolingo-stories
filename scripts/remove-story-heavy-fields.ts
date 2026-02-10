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
const BATCH_SIZE = Number(process.env.STORY_STRIP_BATCH_SIZE ?? "200");

async function main() {
  let cursor: string | null = null;
  let totalUpdated = 0;

  for (;;) {
    const result: {
      updated: number;
      isDone: boolean;
      continueCursor: string;
    } = await client.mutation((api as any).storyTables.stripStoryHeavyFieldsBatch, {
      paginationOpts: {
        cursor,
        numItems: BATCH_SIZE,
      },
    });

    totalUpdated += result.updated;
    console.log(
      `Batch updated=${result.updated}, totalUpdated=${totalUpdated}, isDone=${result.isDone}`,
    );

    if (result.isDone) break;
    cursor = result.continueCursor;
  }

  console.log("Story heavy field cleanup complete.");
  console.log(
    "Next step: remove `text` and `json` from convex/schema.ts stories table and run convex deploy.",
  );
}

main().catch((error) => {
  console.error("Story heavy field cleanup failed", error);
  process.exitCode = 1;
});
