# Plan 013: Bound and validate the story-feedback intake; paginate the review queue

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 54df8979..HEAD -- convex/storyFeedback.ts convex/schema.ts src/components/StoryFeedback/ "src/app/editor/(course)/feedback/" src/app/editor/feedback/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `54df8979`, 2026-07-09

## Why this matters

`submitStoryFeedback` is a public Convex mutation callable by anonymous visitors (intentional — learners should be able to report problems without an account). But it currently accepts **unbounded** client strings (`comment`, `storyTitle`, `courseShort`, `lineText` — no max length), never verifies the story exists, and has no abuse dampener — any script can flood `story_feedback_reports` with megabyte-sized rows. Meanwhile the contributor review queue reads at most 100 reports per status with no pagination, so spam (or just organic volume) past 100 makes older reports silently unreachable. Together: an unauthenticated write path whose abuse directly disables the moderation surface built to consume it.

**Feedback** here is the learner-side problem report (see CONTEXT.md: "Story Feedback" reporting, distinct from the editorial "Feedback" story status). Keep the existing anonymous-submission behavior — that's a product decision, not a bug.

## Current state

- `convex/storyFeedback.ts` — the whole module (119 lines):
  - `submitStoryFeedback` (lines 35-78): public `mutation`; args `storyId: v.number(), storyTitle: v.string(), courseShort: v.string(), line: v.optional(v.number()), lineText: v.optional(v.string()), category, comment: v.string()`. Validation is only `comment.trim()` non-empty (lines 49-52). Identity fields are correctly derived server-side from `ctx.auth.getUserIdentity()` (lines 54-58, 69-71) — do not change that. It inserts without checking that `args.storyId` matches any story (lines 61-74).
  - `listStoryFeedbackReports` (lines 80-96): guarded by `requireContributorOrAdmin` (line 87); clamps `limit` to `[1,100]` and uses `.take(limit)` on index `by_status_and_created_at` — **no cursor**.
  - `updateStoryFeedbackStatus` (lines 98-118): guarded; patches status. Leave as is.
- `convex/schema.ts:241-258` — `story_feedback_reports` table; indexes: `by_course_short`, `by_category`, `by_user_id`, `by_status_and_created_at`. There is **no per-story index**.
- `convex/schema.ts:172` — `stories` table has `.index("by_legacy_id", ["legacyId"])`; `submitStoryFeedback`'s `storyId` arg is that legacy numeric id. Lookup exemplar (from `convex/storyDone.ts:49-52`):
  ```ts
  const story = await ctx.db
    .query("stories")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
    .unique();
  ```
- `src/components/StoryFeedback/StoryFeedback.tsx` — the learner-facing dialog on the public story page. `useMutation(api.storyFeedback.submitStoryFeedback)` at lines 53-54, called at line 133; the `<textarea>` at lines 183-191 has **no `maxLength`**.
- `src/app/editor/(course)/feedback/page_client.tsx` — the review queue client. Lines 20-23:
  ```ts
  const reports = useQuery(api.storyFeedback.listStoryFeedbackReports, {
    status,
    limit: 100,
  });
  ```
  Renders via `FeedbackReviewView` from `./feedback_review_view` (re-exported/shared with `src/app/editor/feedback/feedback_review_view.tsx`).
- Convex pagination convention: `paginationOptsValidator` from `convex/server`, `.paginate(args.paginationOpts)`, and `usePaginatedQuery` on the client. Before writing Convex code, read `convex/_generated/ai/guidelines.md` (repo rule) — it includes the pagination pattern.
- After changing Convex functions run `pnpm exec convex codegen` (repo rule).
- No rate-limiter component is installed (`@convex-dev/rate-limiter` absent from `package.json`). This plan uses a bounded per-story cap instead of installing new infrastructure (design decision below).

### Design decisions (made by the advisor — follow them)

1. **Server-side length caps**: reject `comment` > 2000 chars, `storyTitle` > 200, `courseShort` > 20, `lineText` > 500 (post-trim), with `throw new Error("...")` messages matching the existing "Comment is required" style. Mirror the comment cap client-side with `maxLength={2000}` on the textarea.
2. **Story must exist**: resolve `args.storyId` via the `by_legacy_id` index; throw `Error("Unknown story")` if absent. Use the resolved story's actual `title`/course to override nothing — keep storing the client-sent `storyTitle`/`courseShort` (they capture what the learner saw), but existence-check prevents junk targeting.
3. **Abuse dampener without new deps**: cap open reports per story — if the story already has ≥ 25 reports with status `"open"`, throw `Error("This story already has many open reports. Please try again later.")`. Requires a new index `by_story_and_status` on `["storyId", "status"]` in `convex/schema.ts` and a bounded read (`.take(25)`, compare length). This bounds both table growth per target and review-queue burial. (A real rate limiter keyed by identity/IP would need the `@convex-dev/rate-limiter` component — deliberately deferred; note it in your report.)
4. **Paginate the queue**: convert `listStoryFeedbackReports` to Convex pagination (`paginationOptsValidator` + `.paginate()`), keep the `requireContributorOrAdmin` guard, and switch `page_client.tsx` to `usePaginatedQuery` with an explicit "Load more" button (initial page 50). Follow the repo's existing UI idiom in that file — plain buttons/CSS-module classes, no new UI library.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|----------------------------------|---------------------|
| Install | `pnpm install` | exit 0 |
| Codegen | `pnpm exec convex codegen` | exit 0, regenerates `convex/_generated` |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Format | `pnpm format` | rewrites in place |

## Scope

**In scope** (the only files you should modify):
- `convex/storyFeedback.ts`
- `convex/schema.ts` (one new index on `story_feedback_reports` only)
- `convex/_generated/**` (via codegen only — never hand-edit)
- `src/components/StoryFeedback/StoryFeedback.tsx` (textarea `maxLength`, and surface the new server errors in its existing error state if it has one — check how line 133's call handles rejection and match that pattern)
- `src/app/editor/(course)/feedback/page_client.tsx`
- `src/app/editor/(course)/feedback/feedback_review_view.tsx` and/or `src/app/editor/feedback/feedback_review_view.tsx` (only as needed for the load-more control)

**Out of scope** (do NOT touch, even though they look related):
- `updateStoryFeedbackStatus` and the status workflow.
- The identity-capture logic (`userId`/`userName`/`userEmail`) — it is already correct.
- Installing `@convex-dev/rate-limiter` or any new dependency.
- `convex/storyDone.ts` — its hardening is plan 014.

## Git workflow

- Branch: `advisor/013-harden-feedback-intake`
- Commit style: short imperative subject, e.g. `Bound story feedback submissions and paginate review queue`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the schema index

In `convex/schema.ts`, add `.index("by_story_and_status", ["storyId", "status"])` to `story_feedback_reports` (alongside the existing four indexes). Run `pnpm exec convex codegen`.

**Verify**: codegen exits 0; `grep -n "by_story_and_status" convex/schema.ts` → one match.

### Step 2: Harden submitStoryFeedback

Implement design decisions 1-3 in `convex/storyFeedback.ts`. Order inside the handler: trim + length-validate all strings → resolve story by `by_legacy_id` (throw "Unknown story") → count open reports via the new index with `.take(25)` (throw the cap error at ≥25) → insert as today.

**Verify**: `pnpm exec convex codegen && pnpm typecheck` exit 0.

### Step 3: Paginate listStoryFeedbackReports

Replace `limit` with `paginationOpts: paginationOptsValidator`; return `.paginate(args.paginationOpts)` ordered `desc` on the existing `by_status_and_created_at` index. Keep the guard as the first statement. Note: the `returns:` validator must change accordingly (pagination results have `page`/`isDone`/`continueCursor`) — follow `convex/_generated/ai/guidelines.md`.

**Verify**: `pnpm exec convex codegen && pnpm typecheck` exit 0.

### Step 4: Update the review queue client

In `page_client.tsx`, switch to `usePaginatedQuery(api.storyFeedback.listStoryFeedbackReports, { status }, { initialNumItems: 50 })` and render a "Load more" button when `status === "CanLoadMore"` (the hook's status field). Keep the per-status tabs behavior; changing the status filter should reset pagination (the hook does this when args change).

**Verify**: `pnpm typecheck && pnpm lint` exit 0.

### Step 5: Client-side cap + error surfacing

In `StoryFeedback.tsx`: add `maxLength={2000}` to the textarea (lines 183-191). Check how the submit call at line 133 handles a rejected promise; if it already shows an error state, ensure the new server messages pass through; if it swallows errors silently, surface `window.alert(<message>)` on failure — `window.alert` is the repo's established failure-feedback convention (see `src/app/editor/story/[story]/sound-recorder.tsx:259`).

**Verify**: `pnpm typecheck && pnpm lint` exit 0.

### Step 6: Full verification

Run `pnpm format && pnpm typecheck && pnpm lint && pnpm test`.

**Verify**: all exit 0.

## Test plan

There is no Convex test harness yet (plan 006, TODO), and `pnpm test` only globs `src/**`, so Convex-side unit tests cannot be added in this plan. Keep validation inline in the mutation and record in `plans/README.md` that `convex/storyFeedback.test.ts` (already added to plan 006's file list) must cover: length-cap rejection, unknown-story rejection, the 25-open-reports cap, and pagination of `listStoryFeedbackReports`. Manual verification for this plan: exercise the feedback dialog once on a local dev story page (`pnpm dev`, open any story, submit feedback; then check the editor queue paginates) and report what you observed.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "by_story_and_status" convex/schema.ts` → match
- [ ] `grep -n "maxLength" src/components/StoryFeedback/StoryFeedback.tsx` → match
- [ ] `grep -n "paginationOpts" convex/storyFeedback.ts` → match; `grep -n '"limit"\|limit:' convex/storyFeedback.ts` → no `limit` arg remains on the list query
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exit 0
- [ ] `git status` shows no modified files outside the in-scope list (plus `convex/_generated` from codegen)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift).
- `usePaginatedQuery` is unavailable or behaves differently in the installed `convex` version (check `node_modules/convex/package.json` version, currently ^1.42.0) — report instead of hand-rolling cursors.
- Surfacing errors in `StoryFeedback.tsx` requires restructuring the component beyond the submit handler.
- You are tempted to install any package.

## Maintenance notes

- The 25-open-reports-per-story cap is a dampener, not real rate limiting. If feedback abuse actually occurs, install `@convex-dev/rate-limiter` and key on identity token (signed-in) with a coarse anonymous bucket — that supersedes the cap.
- When plan 006's harness lands, the four test cases named in "Test plan" above are the acceptance tests for this module.
- Reviewer: check the pagination `returns` validator matches what `usePaginatedQuery` expects, and that the status-tab switch resets the page (stale-cursor bugs are the classic mistake here).
- Related direction idea (maintainer decision, not planned): notify the reporting learner when their feedback is resolved — see "Direction options" in `plans/README.md`.
