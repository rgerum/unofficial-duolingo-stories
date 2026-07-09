# Plan 015: Make account deletion actually delete the user's data

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 54df8979..HEAD -- convex/account.ts convex/schema.ts app-mobile/app/(tabs)/profile.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `54df8979`, 2026-07-09

## Why this matters

The mobile app's delete-account flow tells the **Learner** it "permanently deletes your Duostories account… cannot be undone" (`app-mobile/app/(tabs)/profile.tsx:107,121-142`), but `convex/account.ts:deleteCurrentUser` deletes only the Better Auth `user` record. Everything keyed by the user's `legacyUserId` survives indefinitely: **Story Completion** history (`story_done`), progress state (`story_done_state`), course activity (`course_activity`), story preferences (`user_preferences`), Discord role-sync rows (`discord_stories_role_sync`), and the PII captured on feedback reports (`story_feedback_reports.userId/userName/userEmail`). It is also unverified whether the direct adapter `deleteOne` removes the user's `session`/`account` (OAuth link) rows. This is a broken user promise and a GDPR-erasure gap, and if a `legacyUserId` were ever reissued, a new account would inherit a stranger's history.

## Current state

- `convex/account.ts` (29 lines, whole file):
  ```ts
  export const deleteCurrentUser = mutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
      const legacyUserId = await requireSessionLegacyUserId(ctx);      // :10
      const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [{ field: "userId", operator: "eq", value: String(legacyUserId) }],
      })) as { _id?: string | null } | null;                           // :11-14
      if (!user?._id) { throw new Error("Account not found."); }
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, { // :20-25
        input: { model: "user", where: [{ field: "_id", value: user._id }] },
      });
      return null;
    },
  });
  ```
- Tables keyed by the user (from `convex/schema.ts`), with the index to use for each:
  | Table | Key field | Index to use | Action |
  |---|---|---|---|
  | `story_done` (:191) | `legacyUserId` (optional) | `by_user` | delete rows |
  | `story_done_state` (:201) | `legacyUserId` | `by_user_and_story` (prefix query on `legacyUserId`) | delete rows |
  | `course_activity` (:213) | `legacyUserId` | `by_user_and_course` (prefix query) | delete rows |
  | `user_preferences` (:222) | `tokenIdentifier` (+ optional `legacyUserId`) | `by_token_identifier` | delete rows |
  | `discord_stories_role_sync` (:270) | `legacyUserId` | `by_legacy_user_id` | delete rows |
  | `story_feedback_reports` (:241) | `userId` (token identifier string) | `by_user_id` | **anonymize** (see decision 2) |
  | `story_approval` (:229) | `legacyUserId` (optional) | `by_user` | **keep** (see decision 3) |
- Index prefix-query convention: an index on `["legacyUserId", "courseId"]` can be queried with only the first field — exemplar in the same file family, `convex/storyDone.ts:155-160`:
  ```ts
  ctx.db.query("story_done_state")
    .withIndex("by_user_and_course", (q) => q.eq("legacyUserId", legacyUserId).eq("courseId", course._id))
  ```
  (drop the second `.eq` for a prefix scan). A delete-loop exemplar lives in `convex/storyDone.ts:deleteCurrentUserCourseProgress` (lines 136-178) — collect rows on the index, `ctx.db.delete(row._id)` per row, count them. **Match that pattern.**
- `user_preferences` and `story_feedback_reports` are keyed by the auth `tokenIdentifier` (string), not `legacyUserId`. The current handler resolves identity only via `requireSessionLegacyUserId`; you will also need the raw identity: `const identity = await ctx.auth.getUserIdentity()` — its `tokenIdentifier`/`subject` is what `user_preferences.by_token_identifier` stores. **Verify which field is actually written** by reading the writer of `user_preferences` (grep `user_preferences` in `convex/` and read the insert) before choosing.
- Better Auth internals: the adapter exposes `findOne`/`deleteOne` (used above) and — verify — `deleteMany`. Session/account rows live in the Better Auth component's own tables, reachable only through `components.betterAuth.adapter.*`. The web app maps Better Auth tables to custom names (`user_better_auth`, `session_better_auth` — see `src/auth.ts`), but through the adapter you address them by model name (`"session"`, `"account"`).
- Repo rules: read `convex/_generated/ai/guidelines.md` before editing Convex code; run `pnpm exec convex codegen` after changes. Mutations are transactions — every delete in this handler commits atomically or not at all, which is exactly what we want.

### Design decisions (made by the advisor — follow them)

1. **Order: app data first, auth record last.** If anything throws, the transaction rolls back as a unit, but keep the auth `deleteOne` as the final statement anyway — it makes the intent readable and keeps the guard (`requireSessionLegacyUserId`) meaningful throughout.
2. **Anonymize feedback reports, don't delete them**: patch matching `story_feedback_reports` rows (index `by_user_id` on the token identifier) to `{ userId: null, userName: null, userEmail: null }`. The report content is community moderation data about a story, not about the user; stripping attribution satisfies erasure while keeping the moderation queue intact.
3. **Keep `story_approval` rows and contributor attribution** (maintainer-confirmed 2026-07-09): approvals are editorial workflow records — deleting them would retroactively obscure **Story Status** history (it becomes unclear why a story is **Published** if the **Approvals** that made it **Finished** vanish), breaking the editor flow. They reference only a numeric `legacyUserId` with no name/email. Leave them, and likewise leave the contributor-name attribution embedded in `courses.contributorDetails` (see `courseContributorDetailsValidator`, `convex/schema.ts:4-9`). This is settled — do not scrub either, and do not flag it as an open question.
4. **Delete sessions/accounts via the adapter, defensively**: after deleting the user model row, attempt `deleteMany` for models `"session"` and `"account"` where their user-reference field matches `user._id`. First **verify the adapter API and the field name** (read `node_modules/@convex-dev/better-auth`'s adapter typings and one of the component's own usages). If `deleteOne(user)` already cascades (check by reading the component source), skip this step and say so in your report.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|----------------------------------|---------------------|
| Codegen | `pnpm exec convex codegen` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Local Convex (manual check) | `pnpm exec convex dev` (background) + exercise deletion with the `user`/`test` account | rows gone |

## Scope

**In scope** (the only files you should modify):
- `convex/account.ts`
- `convex/_generated/**` (via codegen only)

**Out of scope** (do NOT touch, even though they look related):
- `convex/schema.ts` — all needed indexes exist (table above).
- `app-mobile/app/(tabs)/profile.tsx` — the UI copy is accurate once the backend catches up.
- `story_approval` deletion and `courses.contributorDetails` scrubbing (decision 3 — maintainer call).
- Web-side account deletion UI (none exists today; adding one is a separate feature).

## Git workflow

- Branch: `advisor/015-complete-account-deletion`
- Commit style: short imperative subject, e.g. `Cascade user data deletion when an account is removed`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Investigate the two open bindings

(a) Find the writer of `user_preferences` (`grep -rn "user_preferences" convex/`) and confirm which identity field `by_token_identifier` stores. (b) Read the Better Auth adapter typings/usages for `deleteMany` and whether `deleteOne` on `"user"` cascades sessions/accounts (decision 4).

**Verify**: you can state, with `file:line` evidence, (a) the exact identity field, and (b) whether a session/account cleanup call is needed. If either cannot be established, STOP and report.

### Step 2: Implement the cascade

Rewrite `deleteCurrentUser`'s handler: resolve `legacyUserId` and `identity` → delete rows from `story_done`, `story_done_state`, `course_activity`, `discord_stories_role_sync` (per-table index loops, exemplar `deleteCurrentUserCourseProgress`) → delete `user_preferences` by token identifier → anonymize `story_feedback_reports` (decision 2) → delete the auth user (existing code) → session/account cleanup if Step 1(b) says it's needed. Return a summary object instead of `v.null()`: `{ deletedRows: v.number(), anonymizedReports: v.number() }` — callers: check both call sites (`grep -rn "deleteCurrentUser" src/ app-mobile/`) and confirm they ignore the return value (the mobile caller does — it awaits and signs out); if any caller destructures the old `null`, keep `returns: v.null()` instead and log the counts with `console.log`.

**Verify**: `pnpm exec convex codegen && pnpm typecheck && pnpm lint` exit 0.

### Step 3: Manual end-to-end check on the dev deployment

With `pnpm exec convex dev` running and the app served locally: sign in as the test user (`user`/`test` — test credential, per CLAUDE.md), complete one story, then run the deletion (either through the mobile app if available, or invoke the mutation directly: `pnpm exec convex run account:deleteCurrentUser` won't carry an identity — so drive it through the UI or a short authenticated script; if neither is feasible in your environment, run the mutation logic against seeded rows via the dashboard and report what you could and couldn't verify).

**Verify**: after deletion, the dashboard (or `pnpm exec convex run` helper queries) shows zero `story_done`/`story_done_state`/`course_activity`/`user_preferences` rows for that user, and any feedback reports it created show null identity fields.

### Step 4: Full verification

**Verify**: `pnpm typecheck && pnpm lint && pnpm test` exit 0.

## Test plan

No Convex harness yet (plan 006). Record in `plans/README.md` that `convex/` harness tests must add an `account.test.ts`: seed a user with rows in all six tables → run `deleteCurrentUser` → assert zero remaining keyed rows, anonymized feedback, and (if applicable) no session/account rows. The Step 3 manual check is this plan's acceptance evidence — report exactly what was verified.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "ctx.db.delete" convex/account.ts` ≥ 4 (one loop per app table)
- [ ] `grep -n "story_feedback_reports" convex/account.ts` → match (anonymization present)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exit 0
- [ ] Step 3 performed with observations reported (or explicitly reported as not feasible and why)
- [ ] `git status` shows no modified files outside the in-scope list (plus `convex/_generated`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 cannot establish the `user_preferences` identity field or the adapter cascade behavior with evidence.
- Any per-user table in the Current-state table is missing its listed index (schema drift).
- The cascade would need to touch `story_approval` or `courses.contributorDetails` to satisfy a test — that's decision-3 territory, not yours.
- A single mutation transaction hits Convex limits for a heavy user (many thousands of rows) — report; the fallback (batched `ctx.scheduler` continuation) changes the design and needs advisor review.

## Maintenance notes

- Every future table keyed by `legacyUserId` or `tokenIdentifier` must be added to this cascade — reviewer should leave a comment in `convex/account.ts` listing the covered tables so the next schema addition trips over it.
- Decided (maintainer, 2026-07-09): `story_approval` rows and `courses.contributorDetails` attribution are kept on deletion — editorial history must stay reconstructable (why a story is published). Remaining open decision in the index: whether the web app should gain a deletion UI.
- The transaction-size STOP condition is real: if any production user has >~4k progress rows, plan a batched variant before shipping.
