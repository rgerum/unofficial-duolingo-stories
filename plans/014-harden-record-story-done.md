# Plan 014: Validate recordStoryDone inputs and make progress import idempotent

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 54df8979..HEAD -- convex/storyDone.ts app-mobile/app/auth.tsx app-mobile/src/storage.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 003 touches other queries in the same file — execute this one before or after, not concurrently)
- **Category**: security
- **Planned at**: commit `54df8979`, 2026-07-09

## Why this matters

`recordStoryDone` is a public Convex mutation that intentionally accepts anonymous **Story Completions** (the signed-out web reader records them: `src/app/(stories)/story/[story_id]/page.tsx:96-100`), but it currently trusts a client-supplied `time` without bounds and inserts unconditionally. Two concrete consequences: (1) any caller can backfill or future-date completion rows, polluting per-user activity ordering (`course_activity.lastDoneAt` drives course sorting and "next story" logic); (2) the mobile app's local-progress import (`app-mobile/app/auth.tsx:118-137`) replays `recordStoryDone` per story and only clears local storage after the whole loop, so a mid-loop network failure means the next import re-records the already-synced stories as duplicate raw rows. Clamping `time` and making the insert idempotent per (user, story, time) fixes both without changing the anonymous-completion product behavior.

## Current state

- `convex/storyDone.ts:40-90` — `recordStoryDone`:
  ```ts
  handler: async (ctx, args) => {
    const legacyUserId = await getSessionLegacyUserId(ctx);   // :47 — nullable by design
    const story = await ctx.db.query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();                                              // :49-52
    if (!story) { throw new Error(`Missing story for legacy id ${args.legacyStoryId}`); }
    const doneAt = args.time ?? Date.now();                   // :57 — client time, unbounded
    const docId = await ctx.db.insert("story_done", {         // :58 — unconditional insert
      storyId: story._id,
      legacyUserId: legacyUserId ?? undefined,
      time: doneAt,
    });
    if (typeof legacyUserId === "number") { /* :64-86 upserts story_done_state + course_activity */ }
    return { inserted: true, docId };                         // :88 — `inserted` is always true today
  }
  ```
  Note the return validator (lines 42-45) already declares `inserted: v.boolean()` — the idempotent path can return `inserted: false` without changing the signature.
- `convex/schema.ts:191-199` — `story_done` table already has index `by_user_and_story` on `["legacyUserId", "storyId"]` — exactly what the dedup check needs. No schema change required.
- Callers of `recordStoryDone` (all must keep working):
  - `src/app/(stories)/story/[story_id]/page.tsx:97` (anonymous, server action, sends `time: Date.now()`) and `:106` (authenticated, same shape).
  - `app-mobile/app/story/[id].tsx:127` — signed-in mobile completion, sends no `time`.
  - `app-mobile/app/auth.tsx:128-131` — the import loop, sends stored historical `time` values (these are legitimately in the past — see decision 1).
- `app-mobile/app/auth.tsx:118-137` — the import flow:
  ```ts
  const importLocalProgress = React.useCallback(async () => {
    const localDoneStories = await getAllDoneStories();
    if (localDoneStories.length === 0) return;
    const shouldImport = await askToImportLocalProgress(localDoneStories.length);
    if (!shouldImport) return;
    for (const story of localDoneStories) {
      await recordStoryDone({ legacyStoryId: story.storyId, time: story.time });
    }
    await clearAllProgress();          // :133 — only after the whole loop
    ...
  ```
- `app-mobile/src/storage.ts` — local progress store: `markStoryDone` (line 96), `getAllDoneStories` (line 155), `clearAllProgress` (line 175). There is currently **no per-story removal function** — you will add one.
- Domain vocabulary (CONTEXT.md): a **Story Completion** is the learner-side record that a user completed a story; use that term in comments/messages.
- Repo rules: read `convex/_generated/ai/guidelines.md` before editing Convex code; run `pnpm exec convex codegen` after changing Convex functions.

### Design decisions (made by the advisor — follow them)

1. **Clamp, don't reject, `time`**: `doneAt = Math.min(args.time ?? Date.now(), Date.now())` — future timestamps are floored to server now. Past timestamps stay allowed (the mobile import legitimately replays history; anonymous rows only feed aggregate counts). Do not require auth — anonymous completions are a product feature.
2. **Idempotency for signed-in users only**: when `legacyUserId` is a number, check `by_user_and_story` for an existing row with the same `storyId` and identical `time` (after clamping). If found, skip the insert and return `{ inserted: false, docId: existing._id }` — but still run the `story_done_state`/`course_activity` upserts (they are idempotent by construction and keep aggregates fresh). Identical `(user, story, time)` only ever comes from a replay; genuine re-reads produce a new `time`. Anonymous rows (`legacyUserId` undefined) are not deduped — they have no owner key.
3. **Per-item clearing on mobile import**: add `removeDoneStory(storyId: number)` to `app-mobile/src/storage.ts` (same storage mechanism as `markStoryDone`/`clearAllProgress` — read those two functions and mirror their AsyncStorage access pattern exactly), and in the import loop clear each story right after its successful `recordStoryDone`. Keep the final `clearAllProgress()` as a cheap sweep for anything left. A mid-loop failure then leaves only the un-synced remainder locally.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|----------------------------------|---------------------|
| Codegen | `pnpm exec convex codegen` | exit 0 |
| Typecheck (web) | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Typecheck (mobile) | `pnpm --dir app-mobile typecheck` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `convex/storyDone.ts` (the `recordStoryDone` handler only)
- `convex/_generated/**` (via codegen only)
- `app-mobile/app/auth.tsx` (import loop)
- `app-mobile/src/storage.ts` (add `removeDoneStory`)

**Out of scope** (do NOT touch, even though they look related):
- Every other query/mutation in `convex/storyDone.ts` — plan 003 owns `getDoneStoryIdsForCourse` / `getLastDoneCourseShortForLegacyUser`.
- `convex/schema.ts` — the needed index already exists.
- The web callers in `src/app/(stories)/story/[story_id]/page.tsx` — their behavior is unchanged by the clamp.
- Offline queueing / persistence of signed-in completions (a separate investigate item in `plans/README.md`).

## Git workflow

- Branch: `advisor/014-harden-record-story-done`
- Commit style: short imperative subject, e.g. `Clamp completion timestamps and dedupe replayed imports`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Clamp the timestamp

In `recordStoryDone`, replace line 57's `const doneAt = args.time ?? Date.now();` with the clamp from design decision 1, with a one-line comment stating the constraint ("client clocks can lie; completions can never be in the future").

**Verify**: `pnpm exec convex codegen && pnpm typecheck` exit 0.

### Step 2: Dedupe signed-in replays

After resolving `story` and `doneAt`, when `typeof legacyUserId === "number"`: query `story_done` via `.withIndex("by_user_and_story", (q) => q.eq("legacyUserId", legacyUserId).eq("storyId", story._id))`, `.collect()` is unnecessary — use `.filter((q) => q.eq(q.field("time"), doneAt)).first()`. If a row exists, skip the insert, keep the upsert block, return `{ inserted: false, docId: existing._id }`.

**Verify**: `pnpm exec convex codegen && pnpm typecheck && pnpm lint` exit 0.

### Step 3: Add removeDoneStory to mobile storage

In `app-mobile/src/storage.ts`, add `export async function removeDoneStory(storyId: number): Promise<void>` that removes one story's completion from the same structure `getAllDoneStories` reads. Read `markStoryDone` (line 96) and `clearAllProgress` (line 175) first and mirror their key names and (de)serialization exactly.

**Verify**: `pnpm --dir app-mobile typecheck` exits 0.

### Step 4: Clear per-item in the import loop

In `app-mobile/app/auth.tsx`, inside the `for` loop (lines 127-132), call `await removeDoneStory(story.storyId)` immediately after the successful `await recordStoryDone(...)`. Keep `clearAllProgress()` after the loop. Add `removeDoneStory` to the import list and to the `useCallback` dependency array only if it isn't module-scoped (it is module-scoped — no dep change needed).

**Verify**: `pnpm --dir app-mobile typecheck` exits 0.

### Step 5: Full verification

**Verify**: `pnpm typecheck && pnpm lint && pnpm test` and `pnpm --dir app-mobile typecheck` all exit 0.

## Test plan

No Convex harness exists yet (plan 006). Record in `plans/README.md` that `convex/storyDone.test.ts` (already in plan 006's file list) must add: (a) future `time` is clamped to server now; (b) same signed-in `(user, story, time)` twice → second call returns `inserted: false` and no new row; (c) anonymous completion still inserts. `pnpm test` (web) and both typechecks are the executable gates for this plan.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "Math.min" convex/storyDone.ts` → match inside `recordStoryDone`
- [ ] `grep -n "inserted: false" convex/storyDone.ts` → match
- [ ] `grep -n "removeDoneStory" app-mobile/src/storage.ts app-mobile/app/auth.tsx` → both files match
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exit 0
- [ ] `pnpm --dir app-mobile typecheck` exits 0
- [ ] `git status` shows no modified files outside the in-scope list (plus `convex/_generated`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `recordStoryDone` excerpt doesn't match the live code (plan 003 or other work may have landed in the same file).
- `story_done`'s `by_user_and_story` index is missing from `convex/schema.ts` (drift — do not add it yourself without reporting).
- `app-mobile/src/storage.ts`'s storage layout makes single-item removal unsafe (e.g. completions are stored as an append-only log rather than a keyed map) — describe the layout and stop.
- Any web caller's behavior would change beyond the future-timestamp clamp.

## Maintenance notes

- If a "sync anonymous completions after sign-in" web feature is ever built (the mobile app already has one), it must send historical `time` values — the clamp deliberately allows the past.
- The dedupe is exact-match on `time`; if the import path ever starts re-deriving timestamps instead of replaying stored ones, replays will stop matching and duplicates return — the plan-006 test (b) is the tripwire.
- Reviewer: confirm the upsert block still runs on the deduped path (skipping it would let `course_activity.lastDoneAt` go stale on replay).
