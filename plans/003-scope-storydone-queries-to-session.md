# Plan 003: Derive storyDone progress queries from the session instead of caller-supplied user IDs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- convex/storyDone.ts "src/app/(stories)/learn/page.tsx"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

Two public Convex queries in `convex/storyDone.ts` accept an arbitrary `legacyUserId` argument and return that user's progress data with no ownership check (IDOR): any caller can read any user's story-completion history and last-active course. The data is low-sensitivity (course/story completion, not PII), but it's private-by-expectation behavior data, and the fix is mechanical: one query has **zero callers** and can be deleted; the other is only ever called with the session user's own ID and should derive it from the session — a pattern that already exists in the same file (`getDoneStoryIdsForCurrentUserInCourse`).

## Current state

- `convex/storyDone.ts:81-100` — `getDoneStoryIdsForCourse = query({ args: { legacyCourseId: v.number(), legacyUserId: v.number() }, ... })`. Looks up the course by `legacyId`, then calls the internal helper `getDoneStoryIdsForCourseIdAndUser(ctx, course._id, args.legacyUserId)`. **No callers anywhere in `src/` or `convex/`** (verified at planning time with `grep -rn "getDoneStoryIdsForCourse\b" src/ convex/`).
- `convex/storyDone.ts:102-120` — `getDoneStoryIdsForCurrentUserInCourse` — the session-scoped sibling. It calls `const legacyUserId = await getSessionLegacyUserId(ctx); if (!legacyUserId) return [];` and then the same helper. **This is the pattern to copy.**
- `convex/storyDone.ts:171-192` — `getLastDoneCourseShortForLegacyUser = query({ args: { legacyUserId: v.number() }, returns: v.union(v.string(), v.null()), ... })`. Reads the 20 most recent `course_activity` rows for the given user via index `by_user_and_last_done_at` and returns the first course `short`.
- Its only caller: `src/app/(stories)/learn/page.tsx:21-27` — a server component that already resolves the current user (`const user = await getUser();`) and passes the user's **own** ID:
  ```ts
  const lastCourseShort = await fetchQuery(
    api.storyDone.getLastDoneCourseShortForLegacyUser,
    { legacyUserId: user.userId },
  );
  ```
  `fetchQuery` here is the unauthenticated helper from `convex/nextjs` — it must become an authenticated call once the query derives the user from the session.
- Authenticated server-side query helper: `src/lib/auth-server.ts` exports `fetchAuthQuery`. Exemplar: `src/lib/userInterface.ts:55` — `await fetchAuthQuery(api.auth.getCurrentUser)`.
- `convex/lib/authorization.ts:52` — `getSessionLegacyUserId(ctx)` returns the session's legacy numeric user ID or `null`.
- Repo rule: read `convex/_generated/ai/guidelines.md` before editing Convex code; run `pnpm exec convex codegen` after changing Convex functions.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Typecheck | `pnpm typecheck`                 | exit 0              |
| Lint      | `pnpm lint`                      | exit 0              |
| Codegen   | `pnpm exec convex codegen`       | exit 0              |
| Tests     | `pnpm test`                      | all pass            |

## Scope

**In scope** (the only files you should modify):
- `convex/storyDone.ts`
- `src/app/(stories)/learn/page.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `getDoneStoryIdsForCurrentUserInCourse` and all other functions in `storyDone.ts` — already session-scoped.
- `convex/lib/authorization.ts` — no changes needed.
- Anything under `convex/_generated/` except via `pnpm exec convex codegen`.

## Git workflow

- Branch: `advisor/003-scope-storydone-to-session`
- Commit style: short imperative subject, e.g. `Scope story progress queries to the session user`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Re-confirm getDoneStoryIdsForCourse is unused, then delete it

Run `grep -rn "getDoneStoryIdsForCourse\b" src/ convex/ --include="*.ts*" | grep -v _generated | grep -v "convex/storyDone.ts"`.

- Expected: no output. If there IS a caller, STOP and report it (the plan's premise is stale).
- Then delete the entire `getDoneStoryIdsForCourse` export (`convex/storyDone.ts:81-100`). Keep the shared helper `getDoneStoryIdsForCourseIdAndUser` (line ~125) — it has other callers.

**Verify**: `pnpm typecheck` → exit 0; `pnpm exec convex codegen` → exit 0.

### Step 2: Convert getLastDoneCourseShortForLegacyUser to session-derived

Replace the query (currently at `convex/storyDone.ts:171-192`) with a session-scoped version, renamed to make the contract explicit:

```ts
export const getLastDoneCourseShortForCurrentUser = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const legacyUserId = await getSessionLegacyUserId(ctx);
    if (legacyUserId === null) return null;

    const activityRows = await ctx.db
      .query("course_activity")
      .withIndex("by_user_and_last_done_at", (q) =>
        q.eq("legacyUserId", legacyUserId),
      )
      .order("desc")
      .take(20);

    for (const row of activityRows) {
      const course = await ctx.db.get(row.courseId);
      if (!course?.short) continue;
      return course.short;
    }
    return null;
  },
});
```

(`getSessionLegacyUserId` is already imported at `convex/storyDone.ts:5`.)

**Verify**: `pnpm exec convex codegen` → exit 0; `pnpm typecheck` → currently FAILS with an error in `src/app/(stories)/learn/page.tsx` referencing the old name — that confirms the rename propagated; fix in Step 3.

### Step 3: Update the caller in learn/page.tsx

In `src/app/(stories)/learn/page.tsx`:

- Replace the `fetchQuery` import from `convex/nextjs` with `import { fetchAuthQuery } from "@/lib/auth-server";` (remove the `fetchQuery` import if now unused).
- Inside the existing `if (user?.userId)` block, replace the call with:
  ```ts
  const lastCourseShort = await fetchAuthQuery(
    api.storyDone.getLastDoneCourseShortForCurrentUser,
  );
  ```

**Verify**: `pnpm typecheck` → exit 0; `grep -rn "getLastDoneCourseShortForLegacyUser" src/ convex/ | grep -v _generated` → no matches.

### Step 4: Full verification

`pnpm run format && pnpm lint && pnpm typecheck && pnpm test`

**Verify**: all exit 0.

## Test plan

- If plan 006 (Convex test harness) has landed: add to the harness a test that `getLastDoneCourseShortForCurrentUser` returns `null` without an identity and returns the seeded course `short` with an identity whose `userId` matches seeded `course_activity`. Model after the harness's session-identity tests.
- Otherwise: typecheck + the grep gates above; manual check is visiting `/learn` while signed in (redirects to the last active course) and signed out (renders the Welcome page).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "getDoneStoryIdsForCourse\b" convex/ src/ | grep -v _generated | grep -v CourseIdAndUser` → no matches
- [ ] `grep -rn "legacyUserId: v.number()" convex/storyDone.ts` → no matches inside public `query` args (mutations/internal helpers excluded)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all exit 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 finds a live caller of `getDoneStoryIdsForCourse`.
- `fetchAuthQuery` in `learn/page.tsx` throws or returns `null` for a signed-in user during manual verification (would indicate the server-side token forwarding doesn't work in this route — the fix would need a different auth bridge, which is an advisor decision).
- Any other file appears to need modification.

## Maintenance notes

- Convention to enforce in review going forward: public Convex queries must not accept user IDs as arguments to read private data — derive from `ctx.auth` (see `getSessionLegacyUserId`). The remaining `legacyUserId` args in `storyDone.ts` mutations/internal functions are written via session and are fine.
- Deferred (minor perf, noted in audit): the sequential `ctx.db.get` loop over `activityRows` usually exits on the first row; not worth batching now.
