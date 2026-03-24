# Postgres Sunset Post-Cutover Verification

Run this after you remove mirror env vars and shut down Neon.

## 1) Smoke test key write paths

Execute at least one action in each area:

- Editor story save
- Editor story delete
- Story import
- Story approval toggle
- Admin language update
- Admin course update
- Localization save
- Language default text / TTS replace / avatar speaker

Expected: writes succeed and UI reflects updated Convex data.

## 2) Watch Convex logs for errors

Check logs during the smoke test window:

- No `internal.postgresMirror.*` scheduled actions
- No errors about `POSTGRES_URL2`
- No new failed scheduler jobs related to mirror actions

Expected: only normal mutation + `editorSideEffects` jobs appear.

## 3) Confirm auth and session flows

- Sign in/out still works
- Password reset/email verification flows still work (if enabled)
- Admin and contributor role checks still enforce permissions

Expected: unchanged behavior from pre-cutover.

## 4) Confirm background side effects

From one or two write events, verify:

- GitHub side effects (if configured) still run
- PostHog events (if configured) still emit

Expected: side effects continue independently from Postgres mirror.

## 5) Cost and dependency checks

- Neon usage is zero or project is deleted
- Vercel env no longer contains mirror Postgres vars
- No operational alerting references the legacy Postgres mirror

Expected: mirror stack is fully decommissioned with no hidden dependency.

## 6) Rollback readiness

- Final dump files + checksum file are stored off-machine
- Restore dry-run command is documented in your ops notes

Expected: you can restore the final mirror snapshot if ever needed.
