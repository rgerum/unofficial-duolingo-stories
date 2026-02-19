# Postgres Mirror Sunset Checklist

This checklist is for the final backup and shutdown of the legacy Postgres mirror.

## 1) Confirm mirror writes are disabled

- Deploy code that no longer schedules `internal.postgresMirror.*` actions.
- Watch Convex logs for at least one normal edit/publish flow and verify no mirror actions are invoked.

## 2) Take a final backup

Set the connection string for the Postgres instance you are decommissioning:

```bash
export LEGACY_POSTGRES_URL='postgresql://<user>:<password>@<host>/<db>?sslmode=require'
```

Or run the one-shot script:

```bash
LEGACY_POSTGRES_URL='postgresql://<user>:<password>@<host>/<db>?sslmode=require' \
  scripts/final-backup-and-sunset-postgres.sh
```

Create timestamped dump files:

```bash
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p sql_dump
pg_dump "$LEGACY_POSTGRES_URL" --format=custom --file "sql_dump/duostories-final-${STAMP}.dump"
pg_dump "$LEGACY_POSTGRES_URL" --format=plain --no-owner --no-privileges --file "sql_dump/duostories-final-${STAMP}.sql"
```

Optional role/global backup:

```bash
pg_dumpall "$LEGACY_POSTGRES_URL" --globals-only > "sql_dump/duostories-final-${STAMP}-globals.sql"
```

## 3) Verify backup integrity

```bash
pg_restore --list "sql_dump/duostories-final-${STAMP}.dump" | head -n 20
shasum -a 256 "sql_dump/duostories-final-${STAMP}.dump" "sql_dump/duostories-final-${STAMP}.sql"
```

Store dump files and checksums in durable storage before shutdown.

## 4) Remove runtime dependencies

- Remove `POSTGRES_URL2` from Convex env.
- Remove any Postgres mirror env var from Vercel project settings.
- Keep only env vars still needed by Convex + Better Auth component.

## 5) Shutdown infrastructure

- Disable or delete the Neon project/branch used for mirroring.
- Remove any related paid add-ons/integrations in Vercel/Neon.
- Keep the final dumps and checksums for rollback/audit needs.

After cutover, run `docs/architecture/postgres-post-cutover-verification.md`.
