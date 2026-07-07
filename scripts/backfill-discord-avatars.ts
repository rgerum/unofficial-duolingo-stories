import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// The backfill is an internal Convex action (no HTTP route / shared secret).
// This script drives it batch-by-batch via `pnpm exec convex run`, following
// the returned cursor until every Discord account has been processed.
//
// Deployment target: `convex run` uses the deployment resolved from the
// environment (`CONVEX_DEPLOYMENT` in `.env.local`, typically your dev
// deployment). To run against production, set `CONVEX_TARGET=prod`, which
// appends `--prod` to every `convex run` invocation, e.g.:
//
//   CONVEX_TARGET=prod pnpm run backfill:discord-avatars
//
// Underlying invocation:
//   pnpm exec convex run [--prod] \
//     discordAvatarSync:backfillDiscordUserImagesInternal '{...}'
const INTERNAL_FUNCTION =
  "discordAvatarSync:backfillDiscordUserImagesInternal";
const CONVEX_RUN_FLAGS = resolveConvexRunFlags();
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

// Explicitly select the Convex deployment so operators never silently backfill
// the wrong one. Defaults to the environment-resolved (usually dev) deployment;
// set CONVEX_TARGET=prod to append `--prod`.
function resolveConvexRunFlags(): string[] {
  const target = process.env.CONVEX_TARGET?.trim().toLowerCase();
  if (target === undefined || target === "" || target === "dev") return [];
  if (target === "prod" || target === "production") return ["--prod"];
  console.error(
    `Error: unsupported CONVEX_TARGET "${process.env.CONVEX_TARGET}" (expected "dev" or "prod").`,
  );
  process.exit(1);
}

// Describe the deployment `convex run` will actually hit, so the startup log
// never claims "dev" while `CONVEX_DEPLOYMENT` silently points at prod. With
// `--prod` the target is production; otherwise it is whatever
// `CONVEX_DEPLOYMENT` resolves to (surfaced verbatim when known).
function describeConvexTarget(flags: string[]): string {
  if (flags.includes("--prod")) return "prod (--prod)";
  const deployment = process.env.CONVEX_DEPLOYMENT?.trim();
  if (deployment) {
    return `environment-resolved CONVEX_DEPLOYMENT="${deployment}"`;
  }
  return "environment-resolved deployment (CONVEX_DEPLOYMENT unset; set CONVEX_TARGET=prod for production)";
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

function runBatch(cursor: string | null, batchSize: number): BackfillResult {
  const args = { batchSize, cursor, dryRun: DRY_RUN };
  const stdout = execFileSync(
    "pnpm",
    [
      "exec",
      "convex",
      "run",
      ...CONVEX_RUN_FLAGS,
      INTERNAL_FUNCTION,
      JSON.stringify(args),
    ],
    { encoding: "utf8" },
  );
  return extractJson(stdout) as BackfillResult;
}

async function main() {
  let cursor: string | null = null;
  let processedTotal = 0;
  let updatedUsersTotal = 0;
  let updatedAccountsTotal = 0;
  let skippedTotal = 0;
  const errors: BackfillResult["errors"] = [];
  let batchNumber = 0;

  console.log(
    `Targeting Convex deployment: ${describeConvexTarget(CONVEX_RUN_FLAGS)}`,
  );

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

    const result = runBatch(cursor, currentBatchSize);
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
