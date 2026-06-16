# Plan 008: Harden the shared-secret HTTP endpoints (Discord sync + admin backfills)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- convex/http.ts convex/discordBot.ts convex/discordAvatarSync.ts convex/courseContributorBackfill.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security (investigate + small hardening)
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

Five Convex HTTP endpoints are protected only by a shared secret in the request body: three Discord-bot routes (`/discord/set-contributor-write` can change user roles — privilege escalation if the secret leaks) and two admin backfills (`/admin/backfill-discord-avatars`, `/admin/backfill-course-contributors`). The shared-secret pattern itself is acceptable for a trusted bot calling in from outside, but three things deserve tightening: the role-changing endpoint has no audit trail; the backfill endpoints don't need to be HTTP-reachable at all (they can run as internal functions via `npx convex run`); and nothing verifies the production secrets are strong (the audit could only see local dev values). This is mostly verification work with two small code changes.

## Current state

- `convex/http.ts:14-38` — routes registered:
  - POST `/discord/set-contributor-write` → `setContributorWriteByDiscordAccountId`
  - POST `/discord/combine-data` → `getDiscordCombineData`
  - POST `/discord/set-stories-role-status` → `setStoriesRoleSyncStatus`
  - POST `/admin/backfill-discord-avatars` → `backfillDiscordUserImagesHandler` (from `discordAvatarSync.ts`)
  - POST `/admin/backfill-course-contributors` → `backfillCourseContributorDetailsHttp` (from `courseContributorBackfill.ts`)
- `convex/discordBot.ts:83-117` — `setContributorWriteByDiscordAccountId`: checks method, then `requireDiscordSyncSecret(req)` (compares a `secret` field in the JSON body against `process.env.DISCORD_ROLE_SYNC_SECRET`), validates `discordAccountId` (string) and `write` (boolean|null), resolves the better-auth account, then updates the user's role via `ctx.runMutation`. **No logging of who/what changed.**
- `convex/courseContributorBackfill.ts:27-61` — `requireCourseContributorBackfillSecret`: same body-secret pattern against `COURSE_CONTRIBUTOR_BACKFILL_SECRET`; returns 500 if env var missing, 401 on mismatch (`parsed.secret !== expectedSecret`, plain string comparison).
- `convex/discordAvatarSync.ts` — `backfillDiscordUserImagesHttp` with the same pattern against `DISCORD_AVATAR_SYNC_SECRET`.
- The Discord bot itself lives out-of-repo (`discord_roles/` dir holds related material); the bot calls these HTTP endpoints. The backfills are operator-run maintenance tasks.
- Convex convention: internal functions (`internalMutation` / `internalAction`) are not publicly callable and can be invoked by an operator with `pnpm exec convex run`. Repo rule: read `convex/_generated/ai/guidelines.md` before editing Convex code.

## Commands you will need

| Purpose          | Command                                  | Expected on success |
|------------------|------------------------------------------|---------------------|
| Typecheck        | `pnpm typecheck`                         | exit 0              |
| Lint             | `pnpm lint`                              | exit 0              |
| Codegen          | `pnpm exec convex codegen`               | exit 0              |
| List env names   | `pnpm exec convex env list`              | prints env VAR NAMES (values shown — do not paste output anywhere) |

## Scope

**In scope**:
- `convex/http.ts` (remove the two `/admin/backfill-*` routes)
- `convex/courseContributorBackfill.ts`, `convex/discordAvatarSync.ts` (expose the backfills as internal functions; remove HTTP wrappers)
- `convex/discordBot.ts` (add an audit log line on role change)
- A report back to the maintainer on secret strength (no values in any file)

**Out of scope** (do NOT touch):
- The three `/discord/*` routes' shared-secret mechanism itself — the bot depends on it; replacing it with signatures is a coordinated change with the out-of-repo bot.
- `convex/discordRoleSync.ts`, `convex/discordData.ts` internals.
- Any secret VALUE — never write one into a file, commit message, or report.

## Git workflow

- Branch: `advisor/008-harden-secret-endpoints`
- Commit style: short imperative subject, e.g. `Move backfills off HTTP to internal functions`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Verify how the backfills are invoked

Search for any caller of the backfill HTTP routes: `grep -rn "backfill-discord-avatars\|backfill-course-contributors" . --include="*.ts" --include="*.tsx" --include="*.py" --include="*.md" --include="*.yml" --include="*.yaml" -l | grep -v node_modules | grep -v plans/`.

- Expected: matches only in `convex/http.ts` and possibly docs/scripts that an operator runs by hand. If a deployed system (e.g. the Discord bot, a cron, a GitHub Action) calls these URLs, STOP and report — removing the routes would break it.

**Verify**: caller inventory documented in your final report.

### Step 2: Convert backfills to internal functions

In `courseContributorBackfill.ts` and `discordAvatarSync.ts`: the HTTP handlers wrap an inner mutation/action. Re-expose that inner logic as an `internalMutation`/`internalAction` (it may already be one — read the files; if so, just delete the HTTP wrapper and its `requireXSecret` helper). Remove the two route registrations from `convex/http.ts` and the now-unused imports.

Operator invocation becomes: `pnpm exec convex run courseContributorBackfill:<internalFnName> '{...args}'` — document the exact command in a comment at the top of each file.

**Verify**: `pnpm exec convex codegen && pnpm typecheck && pnpm lint` → exit 0; `grep -n "backfill" convex/http.ts` → no matches.

### Step 3: Add an audit log to the role-change endpoint

In `setContributorWriteByDiscordAccountId` (`convex/discordBot.ts:83+`), immediately before the role-updating `ctx.runMutation`, add a structured log:

```ts
console.log("discord-role-sync: contributor write change", {
  discordAccountId: parsed.discordAccountId,
  write: parsed.write,
});
```

(Convex retains function logs; this creates a minimal audit trail without schema changes.)

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: Verify production secret strength (report only)

Run `pnpm exec convex env list` against the production deployment (needs operator credentials — if unavailable, mark this step BLOCKED in the report rather than guessing). For each of `DISCORD_ROLE_SYNC_SECRET`, and the backfill secrets if still present: check length ≥ 32 chars and that it isn't a placeholder-looking phrase. **Report PASS/FAIL per variable name only — never the value.** Recommend rotation for any FAIL (generate with `openssl rand -hex 32`).

**Verify**: report lists each secret name with PASS/FAIL/BLOCKED.

### Step 5: Full verification

`pnpm run format && pnpm lint && pnpm typecheck && pnpm test`

**Verify**: all exit 0.

## Test plan

- If plan 006's harness is available: add a test that the converted backfill internal function is not present in the public `api` object (import `api` from `convex/_generated/api` and assert the function lives under `internal.*` only — or simply rely on codegen: public route removal is verified by the `grep` gate).
- Otherwise: the grep + typecheck gates above.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "backfill" convex/http.ts` → no matches
- [ ] `grep -rn "requireCourseContributorBackfillSecret\|DISCORD_AVATAR_SYNC_SECRET" convex/` → no matches (helpers and their env vars gone)
- [ ] Role-change audit log present: `grep -n "discord-role-sync: contributor write change" convex/discordBot.ts` → 1 match
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all exit 0
- [ ] Secret-strength report delivered (names + PASS/FAIL only)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 finds an automated caller of the backfill URLs.
- The backfill inner logic is structured so that converting to an internal function requires rewriting its batching/scheduling (more than moving code) — report the structure you found.
- You cannot determine which deployment `convex env list` is pointed at — never run env commands against an unknown deployment.
- Anything would require pasting a secret value anywhere.

## Maintenance notes

- The `/discord/*` shared-secret routes remain; if the Discord bot is ever rewritten, switch to per-request HMAC signatures (sign the body with a key, verify with a timing-safe compare) at that time.
- New maintenance/backfill tasks should default to `internal*` functions + `convex run`, not HTTP routes.
- Deferred: timing-safe comparison for the remaining Discord secret check (theoretical over-network risk; revisit with the bot rewrite).
