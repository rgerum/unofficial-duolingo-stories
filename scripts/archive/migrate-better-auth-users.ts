/**
 * Migrate legacy Postgres users into Better Auth using a precomputed
 * username collision map in-memory for speed.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not set");
  process.exit(1);
}

if (!POSTGRES_URL) {
  console.error("❌ Error: POSTGRES_URL/DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
  max: 5,
  ssl: { rejectUnauthorized: false },
});
const client = new ConvexHttpClient(CONVEX_URL);

function normalizeUsername(input: string): string {
  const lower = input.trim().toLowerCase();
  const cleaned = lower.replace(/[^a-z0-9_-]/g, "_");
  if (cleaned.length >= 3) return cleaned;
  return `${cleaned || "user"}_${Math.random().toString(36).slice(2, 6)}`;
}

type LegacyUser = {
  id: number;
  name: string;
  email: string;
  image: string | null;
  emailVerified: Date | null;
  regdate: Date | null;
  password: string | null;
};

type LegacyAccount = {
  id: number;
  userId: number;
  type: string | null;
  provider: string | null;
  providerAccountId: string | null;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  password: string | null;
  createdat: Date | null;
  updatedat: Date | null;
};

function normalizeExpiresAt(expiresAt: number | null): number | null {
  if (!expiresAt) return null;
  // If value looks like seconds since epoch, convert to ms.
  if (expiresAt < 1_000_000_000_000) {
    return expiresAt * 1000;
  }
  return expiresAt;
}

async function migrateUsers() {
  const startId = process.env.MIGRATE_START_ID
    ? Number(process.env.MIGRATE_START_ID)
    : 0;
  const startDate = process.env.MIGRATE_START_DATE
    ? new Date(process.env.MIGRATE_START_DATE)
    : null;
  const maxUsers = process.env.MIGRATE_MAX_USERS
    ? Number(process.env.MIGRATE_MAX_USERS)
    : undefined;
  const debugLegacyId = process.env.MIGRATE_DEBUG_LEGACY_ID
    ? Number(process.env.MIGRATE_DEBUG_LEGACY_ID)
    : undefined;
  const clearAuth = process.env.MIGRATE_CLEAR_AUTH === "1";
  const fastPath = process.env.MIGRATE_FAST_PATH === "1" || clearAuth;
  const migrateAccounts = process.env.MIGRATE_ACCOUNTS !== "0";
  const verbose = process.env.MIGRATE_VERBOSE === "1";
  const pageSize = process.env.MIGRATE_PAGE_SIZE
    ? Number(process.env.MIGRATE_PAGE_SIZE)
    : 500;
  const loadBatchSize = process.env.MIGRATE_LOAD_BATCH
    ? Number(process.env.MIGRATE_LOAD_BATCH)
    : 2000;
  const concurrency = process.env.MIGRATE_CONCURRENCY
    ? Number(process.env.MIGRATE_CONCURRENCY)
    : 2;

  console.log(
    `Starting migration at legacy id ${startId} ${startDate ? `(since ${startDate.toISOString()})` : ""} ${maxUsers ? `(max ${maxUsers} users)` : ""}`,
  );
  console.log(
    `Settings: pageSize=${pageSize} loadBatchSize=${loadBatchSize} concurrency=${concurrency} verbose=${verbose} migrateAccounts=${migrateAccounts}`,
  );
  if (fastPath) {
    console.log("Fast path enabled: skipping existence lookups.");
  }

  if (clearAuth) {
    console.log("Clearing Better Auth data before migration...");
    await client.action(api.authMigration.clearBetterAuthData, {
      confirm: true,
    });
  }

  let lastId = startId;
  let total = 0;
  let created = 0;
  let skipped = 0;
  let missingPassword = 0;
  let skippedDuplicateEmail = 0;
  let errors: any[] = [];
  const seenEmails = new Set<string>();
  let debugEmail: string | null = null;

  const legacyUsers: LegacyUser[] = [];

  while (true) {
    const rows: LegacyUser[] = startDate
      ? await sql`
      SELECT id, name, email, image, "emailVerified", regdate, password
      FROM users
      WHERE id > ${lastId} AND regdate >= ${startDate}
      ORDER BY id
      LIMIT ${loadBatchSize}
    `
      : await sql`
      SELECT id, name, email, image, "emailVerified", regdate, password
      FROM users
      WHERE id > ${lastId}
      ORDER BY id
      LIMIT ${loadBatchSize}
    `;
    if (rows.length === 0) break;
    if (maxUsers !== undefined && total >= maxUsers) break;

    const remaining =
      maxUsers !== undefined ? Math.max(maxUsers - total, 0) : rows.length;
    const batchRows = maxUsers !== undefined ? rows.slice(0, remaining) : rows;
    if (batchRows.length === 0) break;

    legacyUsers.push(...batchRows);
    total += batchRows.length;

    lastId = rows[rows.length - 1]!.id;
    if (maxUsers !== undefined && total >= maxUsers) break;
    if (rows.length < loadBatchSize) break;
  }

  const collisionCounts = new Map<string, number>();
  for (const row of legacyUsers) {
    if (!row.email) {
      continue;
    }
    const norm = normalizeUsername(row.name || row.email.split("@")[0] || "");
    collisionCounts.set(norm, (collisionCounts.get(norm) || 0) + 1);
  }

  const payload = legacyUsers
    .filter((row) => row.email && row.email.trim().length > 0)
    .filter((row) => {
      const email = row.email.toLowerCase();
      if (seenEmails.has(email)) {
        skippedDuplicateEmail += 1;
        return false;
      }
      seenEmails.add(email);
      return true;
    })
    .map((row) => {
      const base = normalizeUsername(row.name || row.email.split("@")[0] || "");
      const collision = (collisionCounts.get(base) || 0) > 1;
      const username = collision ? `${base}_${row.id}` : base;
      const createdAt = row.regdate ? row.regdate.getTime() : Date.now();
      if (debugLegacyId && row.id === debugLegacyId) {
        const hash = row.password ?? "";
        const prefix = hash.slice(0, 4);
        debugEmail = row.email.toLowerCase();
        console.log(
          `Debug legacyId ${row.id}: email=${row.email}, password=${row.password ? "present" : "missing"}, hashPrefix=${prefix}, hashLength=${hash.length}`,
        );
      }
      return {
        legacyId: row.id,
        email: row.email.toLowerCase(),
        name: row.name || row.email,
        username,
        displayUsername: row.name || row.email,
        image: row.image,
        emailVerified: Boolean(row.emailVerified),
        createdAt,
        password: row.password ?? undefined,
      };
    });

  const batches: Array<typeof payload> = [];
  for (let i = 0; i < payload.length; i += pageSize) {
    batches.push(payload.slice(i, i + pageSize));
  }

  let completedBatches = 0;
  const totalBatches = batches.length;
  let nextBatchIndex = 0;

  const workerCount = Math.max(1, Math.min(concurrency, totalBatches || 1));
  const workers = Array.from({ length: workerCount }, (_, workerId) => {
    return (async () => {
      while (true) {
        const batchIndex = nextBatchIndex++;
        if (batchIndex >= totalBatches) {
          break;
        }
        const batchPayload = batches[batchIndex]!;
        const result = await client.action(
          api.authMigration.importBetterAuthUsersBatch,
          { users: batchPayload, verbose, fastPath },
        );

        created += result.created;
        skipped += result.skipped;
        missingPassword += result.missingPassword;
        const accountsCreated = result.accountsCreated ?? 0;
        const accountsFailed = result.accountsFailed ?? 0;
        if (result.errors?.length) {
          errors = errors.concat(result.errors);
        }

        completedBatches += 1;
        console.log(
          `Batch ${completedBatches}/${totalBatches}: scanned ${batchPayload.length}, created ${result.created}, skipped ${result.skipped}, missing passwords ${result.missingPassword}, accounts created ${accountsCreated}, accounts failed ${accountsFailed}`,
        );
      }
    })();
  });

  await Promise.all(workers);

  console.log("\n✅ Migration complete\n");
  console.log("Total legacy users scanned:", total);
  console.log("Created Better Auth users:", created);
  console.log("Skipped (already exists):", skipped);
  console.log("Skipped (duplicate email):", skippedDuplicateEmail);
  console.log("Missing password hashes:", missingPassword);
  if (debugEmail) {
    const debugResult = await client.action(
      api.authMigration.debugBetterAuthAccount,
      { email: debugEmail },
    );
    console.log("Debug Better Auth account:", debugResult);
  }
  if (errors.length) {
    console.log("Errors:", errors.length);
    for (const err of errors) {
      console.log(
        `- ${err.step} ${err.email ?? "unknown"} (legacyId: ${err.legacyId ?? "n/a"}): ${err.message}`,
      );
    }
  }

  if (!migrateAccounts) {
    return;
  }

  console.log("\n➡️  Migrating social accounts\n");
  let accountsLastId = 0;
  let accountsTotal = 0;
  let accountsCreated = 0;
  let accountsSkipped = 0;
  let accountsMissingUser = 0;
  let accountsErrors: any[] = [];
  const accountPayload: Array<{
    legacyAccountId: number;
    legacyUserId: number;
    providerId: string;
    providerAccountId: string | null;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
    idToken?: string;
    sessionState?: string;
    createdAt: number;
    updatedAt: number;
    accountType?: string;
  }> = [];

  while (true) {
    const rows: LegacyAccount[] = startDate
      ? await sql`
      SELECT id, "userId", type, provider, "providerAccountId", refresh_token,
             access_token, expires_at, token_type, scope, id_token,
             session_state, password, createdat, updatedat
      FROM accounts
      WHERE id > ${accountsLastId}
        AND (createdat >= ${startDate} OR updatedat >= ${startDate})
      ORDER BY id
      LIMIT ${loadBatchSize}
    `
      : await sql`
      SELECT id, "userId", type, provider, "providerAccountId", refresh_token,
             access_token, expires_at, token_type, scope, id_token,
             session_state, password, createdat, updatedat
      FROM accounts
      WHERE id > ${accountsLastId}
      ORDER BY id
      LIMIT ${loadBatchSize}
    `;
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!row.provider) {
        continue;
      }
      if (row.provider === "credentials") {
        continue;
      }
      const createdAt = row.createdat ? row.createdat.getTime() : Date.now();
      const updatedAt = row.updatedat ? row.updatedat.getTime() : createdAt;
      const expiresAt = normalizeExpiresAt(row.expires_at);
      accountPayload.push({
        legacyAccountId: row.id,
        legacyUserId: row.userId,
        providerId: row.provider,
        providerAccountId: row.providerAccountId,
        accessToken: row.access_token ?? undefined,
        refreshToken: row.refresh_token ?? undefined,
        expiresAt: expiresAt ?? undefined,
        tokenType: row.token_type ?? undefined,
        scope: row.scope ?? undefined,
        idToken: row.id_token ?? undefined,
        sessionState: row.session_state ?? undefined,
        createdAt,
        updatedAt,
        accountType: row.type ?? undefined,
      });
    }

    accountsLastId = rows[rows.length - 1]!.id;
    if (rows.length < loadBatchSize) break;
  }

  const accountBatches: Array<typeof accountPayload> = [];
  for (let i = 0; i < accountPayload.length; i += pageSize) {
    accountBatches.push(accountPayload.slice(i, i + pageSize));
  }

  let accountsCompleted = 0;
  const totalAccountBatches = accountBatches.length;
  let nextAccountBatchIndex = 0;
  const accountWorkerCount = Math.max(
    1,
    Math.min(concurrency, totalAccountBatches || 1),
  );
  const accountWorkers = Array.from({ length: accountWorkerCount }, () => {
    return (async () => {
      while (true) {
        const batchIndex = nextAccountBatchIndex++;
        if (batchIndex >= totalAccountBatches) break;
        const batchPayload = accountBatches[batchIndex]!;
        const result = await client.action(
          api.authMigration.importBetterAuthAccountsBatch,
          { accounts: batchPayload, verbose, fastPath },
        );
        accountsTotal += batchPayload.length;
        accountsCreated += result.created;
        accountsSkipped += result.skipped;
        accountsMissingUser += result.missingUser;
        if (result.errors?.length) {
          accountsErrors = accountsErrors.concat(result.errors);
        }
        accountsCompleted += 1;
        console.log(
          `Account batch ${accountsCompleted}/${totalAccountBatches}: scanned ${batchPayload.length}, created ${result.created}, skipped ${result.skipped}, missing users ${result.missingUser}`,
        );
      }
    })();
  });

  await Promise.all(accountWorkers);

  console.log("\n✅ Social account migration complete\n");
  console.log("Total accounts scanned:", accountsTotal);
  console.log("Created accounts:", accountsCreated);
  console.log("Skipped accounts:", accountsSkipped);
  console.log("Missing users:", accountsMissingUser);
  if (accountsErrors.length) {
    console.log("Account errors:", accountsErrors.length);
    for (const err of accountsErrors) {
      console.log(
        `- ${err.step} ${err.providerId ?? "unknown"} (legacyUserId: ${err.legacyUserId ?? "n/a"}): ${err.message}`,
      );
    }
  }
}

migrateUsers()
  .catch((error) => {
    console.error("\n❌ Error migrating users:", error);
  })
  .finally(async () => {
    await sql.end();
  });

/*
MIGRATE_PAGE_SIZE=1000 \
MIGRATE_LOAD_BATCH=5000 \
MIGRATE_CONCURRENCY=4 \
MIGRATE_START_DATE=2026-02-03T00:00:00Z \
pnpm exec tsx scripts/archive/migrate-better-auth-users.ts

*/
