import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_SITE_URL =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  process.env.CONVEX_SITE_URL ??
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL;
const DISCORD_AVATAR_SYNC_SECRET = process.env.DISCORD_AVATAR_SYNC_SECRET;
const TOTAL_LIMIT = parseOptionalNumber(process.env.DISCORD_AVATAR_SYNC_LIMIT);
const BATCH_SIZE = parsePositiveNumber(
  process.env.DISCORD_AVATAR_SYNC_BATCH_SIZE,
  25,
);
const BATCH_DELAY_MS = parsePositiveNumber(
  process.env.DISCORD_AVATAR_SYNC_BATCH_DELAY_MS,
  0,
);
const DRY_RUN = parseBooleanEnv(process.env.DISCORD_AVATAR_SYNC_DRY_RUN, false);

if (!CONVEX_SITE_URL) {
  console.error(
    "Error: NEXT_PUBLIC_CONVEX_SITE_URL/CONVEX_SITE_URL/CONVEX_URL is not set.",
  );
  process.exit(1);
}

if (!DISCORD_AVATAR_SYNC_SECRET) {
  console.error("Error: DISCORD_AVATAR_SYNC_SECRET is not set.");
  process.exit(1);
}

type BackfillResult = {
  processed: number;
  updatedUsers: number;
  updatedAccounts: number;
  skipped: number;
  nextCursor: string | null;
  isDone: boolean;
  errors: Array<{
    accountId: string | null;
    userId: string | null;
    message: string;
  }>;
};

function parseOptionalNumber(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    console.error("Error: DISCORD_AVATAR_SYNC_LIMIT must be a valid number.");
    process.exit(1);
  }
  return parsed;
}

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

async function runBatch(
  baseUrl: string,
  cursor: string | null,
  batchSize: number,
) {
  const response = await fetch(`${baseUrl}/admin/backfill-discord-avatars`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: DISCORD_AVATAR_SYNC_SECRET,
      batchSize,
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
  let updatedUsersTotal = 0;
  let updatedAccountsTotal = 0;
  let skippedTotal = 0;
  const errors: BackfillResult["errors"] = [];
  let batchNumber = 0;

  while (true) {
    const remaining =
      typeof TOTAL_LIMIT === "number" ? TOTAL_LIMIT - processedTotal : undefined;
    if (remaining !== undefined && remaining <= 0) break;

    const currentBatchSize =
      remaining !== undefined ? Math.min(BATCH_SIZE, remaining) : BATCH_SIZE;
    batchNumber += 1;

    console.log(
      `Running batch ${batchNumber} (size=${currentBatchSize}, cursor=${cursor ?? "start"})...`,
    );

    const result = await runBatch(baseUrl, cursor, currentBatchSize);
    processedTotal += result.processed;
    updatedUsersTotal += result.updatedUsers;
    updatedAccountsTotal += result.updatedAccounts;
    skippedTotal += result.skipped;
    errors.push(...result.errors);

    console.log(
      `Batch ${batchNumber} complete: processed=${result.processed}, updatedUsers=${result.updatedUsers}, updatedAccounts=${result.updatedAccounts}, skipped=${result.skipped}, errors=${result.errors.length}`,
    );

    if (
      result.isDone ||
      !result.nextCursor ||
      result.processed === 0 ||
      (remaining !== undefined &&
        typeof TOTAL_LIMIT === "number" &&
        processedTotal >= TOTAL_LIMIT)
    ) {
      break;
    }

    cursor = result.nextCursor;
    if (BATCH_DELAY_MS > 0) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("Discord avatar backfill completed.");
  console.log(
    JSON.stringify(
      {
        processed: processedTotal,
        updatedUsers: updatedUsersTotal,
        updatedAccounts: updatedAccountsTotal,
        skipped: skippedTotal,
        errors,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Discord avatar backfill failed.");
  console.error(error);
  process.exit(1);
});
