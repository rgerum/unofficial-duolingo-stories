import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

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

type LegacyUser = {
  email: string | null;
  admin: boolean | null;
  role: boolean | null;
};

async function syncRoles() {
  const rows: LegacyUser[] = await sql`
    SELECT email, admin, role
    FROM users
    WHERE email IS NOT NULL
  `;

  const payload = rows
    .map((row) => {
      if (!row.email) return null;
      let desiredRole: string | null = null;
      if (row.admin) desiredRole = "admin";
      else if (row.role) desiredRole = "contributor";
      return desiredRole
        ? { email: row.email.toLowerCase(), role: desiredRole }
        : null;
    })
    .filter((v): v is { email: string; role: string } => Boolean(v));

  const batchSize = 500;
  let updated = 0;
  let skippedMissing = 0;
  let skippedSame = 0;
  let errors: Array<{ email: string; message: string }> = [];

  for (let i = 0; i < payload.length; i += batchSize) {
    const batch = payload.slice(i, i + batchSize);
    const result = await client.action(
      (anyApi as any).roles.setBetterAuthRolesBatch,
      {
        users: batch,
      },
    );
    updated += result.updated;
    skippedMissing += result.skippedMissing;
    skippedSame += result.skippedSame;
    if (result.errors?.length) errors = errors.concat(result.errors);
    console.log(
      `Batch ${Math.floor(i / batchSize) + 1}: updated ${result.updated}, skippedMissing ${result.skippedMissing}, skippedSame ${result.skippedSame}`,
    );
  }

  console.log("\n✅ Role sync complete\n");
  console.log("Updated:", updated);
  console.log("Skipped (missing user):", skippedMissing);
  console.log("Skipped (same role):", skippedSame);
  if (errors.length) {
    console.log("Errors:", errors.length);
    for (const err of errors) {
      console.log(`- ${err.email}: ${err.message}`);
    }
  }
}

syncRoles()
  .catch((error) => {
    console.error("\n❌ Error syncing roles:", error);
  })
  .finally(async () => {
    await sql.end();
  });
