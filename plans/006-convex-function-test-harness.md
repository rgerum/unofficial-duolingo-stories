# Plan 006: Stand up a Convex function test harness and characterize the critical write paths

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- convex/lib/authorization.ts convex/storyWrite.ts convex/storyApproval.ts convex/storyDone.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1 (prerequisite for plans 009 and 010)
- **Effort**: M
- **Risk**: MED (new tooling; risk is wasted setup, not breakage — no production code changes)
- **Depends on**: plans/001-ci-verification-baseline.md (CI must run tests)
- **Category**: tests
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

The entire Convex backend (~7,500 lines across `convex/*.ts`) has **zero tests**: authorization guards, story upsert, approval flow, course count recomputation, completion tracking. These are the platform's money paths — a regression in `requireContributorOrAdmin` or `setStory` ships silently today. Two larger refactors (plan 009 audio-cutter split is frontend, but plan 010's schema migration is backend) are blocked on having a safety net. The standard tool is `convex-test` (official mock of the Convex runtime) running under Vitest.

## Current state

- Test infra today: `package.json` → `"test": "pnpm exec tsx --test src/**/*.test.ts"` (Node test runner; 3 frontend test files). There is **no vitest and no convex-test** in `package.json` (verified). The `src` tests must keep working unchanged.
- `convex-test` is the official library for testing Convex functions against an in-memory backend; it requires Vitest (it relies on `import.meta.glob` to load function modules) and the `edge-runtime` environment is recommended by Convex docs.
- Repo rule (CLAUDE.md): **read `convex/_generated/ai/guidelines.md` before writing any Convex code** — it exists and overrides trained knowledge. Also: `pnpm exec convex codegen` regenerates bindings.
- Functions to characterize (read each fully before testing):
  - `convex/lib/authorization.ts` — `requireAdmin` / `requireContributorOrAdmin` throw `Error("Unauthorized")` based on `identity.role`; `requireSessionLegacyUserId` parses `identity.userId` into a positive integer or throws; `getSessionLegacyUserId` returns the parsed id or `null`.
  - `convex/storyWrite.ts:11-173` — `setStory` mutation: requires contributor/admin (line 38); rejects overwriting official-course stories unless `role === "admin"` AND `args.confirmOfficialOverwrite` (lines 53-62); finds the story by `legacyStoryId` then by `duo_id` (returns `null` if none); patches story + story_content; recomputes the course `todo_count` by summing all stories in the course (lines 140-148); schedules `internal.editorSideEffects.onStorySaved` with an `operationKey` (lines 154-163).
  - `convex/storyApproval.ts` — approval mutations (read the file; it uses the same guard helpers — grep showed 8 guard call sites).
  - `convex/storyDone.ts:29-79` — `recordStoryDone`: inserts a `story_done` row; when the session has a numeric legacy id and the story's course has a `legacyId`, also upserts `story_done_state` and `course_activity` rows.
- Identity shape: guards read `identity.role` and `identity.userId` from `ctx.auth.getUserIdentity()`. With convex-test, `t.withIdentity({...})` supplies custom identity fields.
- Schema: `convex/schema.ts` — needed tables for seeding: `languages`, `courses` (requires `legacyId`, `learningLanguageId`, `fromLanguageId`, `public`, `official`), `stories` (requires `name`, `public`, `courseId`, `status` one of `"draft" | "feedback" | "finished"`...), `story_content`, `story_done`. Read the schema before seeding; required vs optional fields matter.

## Commands you will need

| Purpose            | Command                              | Expected on success |
|--------------------|--------------------------------------|---------------------|
| Install dev deps   | `pnpm add -D convex-test vitest @edge-runtime/vm` | exit 0 |
| Convex tests       | `pnpm test:convex` (created in Step 2) | all pass          |
| Existing tests     | `pnpm test`                          | all pass, unchanged |
| Typecheck          | `pnpm typecheck`                     | exit 0              |
| Lint               | `pnpm lint`                          | exit 0              |

## Suggested executor toolkit

- Read `convex/_generated/ai/guidelines.md` first (repo rule).
- If a `convex` or `convex-quickstart` skill is available in your environment, consult it for convex-test setup specifics rather than guessing API shapes.
- convex-test docs: https://docs.convex.dev/testing/convex-test

## Scope

**In scope** (the only files you should modify/create):
- `package.json` (add devDependencies + `test:convex` script)
- `vitest.config.ts` (create, scoped to `convex/**/*.test.ts`)
- `convex/authorization.test.ts` (create)
- `convex/storyWrite.test.ts` (create)
- `convex/storyDone.test.ts` (create)
- `convex/storyApproval.test.ts` (create)
- `convex/storyFeedback.test.ts` (create — added 2026-07-09: the module shipped after this plan was written; cover the `requireContributorOrAdmin` guard on `listStoryFeedbackReports`/`updateStoryFeedbackStatus`, empty-comment rejection in `submitStoryFeedback`, and one `open→reviewed` status transition)
- `.github/workflows/ci.yaml` (add the `pnpm test:convex` step — only if plan 001 already landed)

**Out of scope** (do NOT touch):
- Any production code in `convex/` or `src/` — these are characterization tests; if a test reveals a bug, record it in `plans/README.md` and test the CURRENT behavior with a comment, do not fix.
- The existing `tsx --test` setup and the 3 `src` test files.
- `convex/authMigration.ts`, `convex/discord*.ts` — migration-era / integration code, not worth harness time now.

## Git workflow

- Branch: `advisor/006-convex-test-harness`
- Commit per step; message style: short imperative, e.g. `Add convex-test harness with vitest`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install and configure

`pnpm add -D convex-test vitest @edge-runtime/vm`

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["convex/**/*.test.ts"],
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
```

Add to `package.json` scripts: `"test:convex": "vitest run --config vitest.config.ts"`.

**Verify**: `pnpm test:convex` → "no test files found" style exit (or trivially passing) AND `pnpm test` still passes unchanged.

### Step 2: Smoke-test the harness with the authorization guards

Create `convex/authorization.test.ts`. Pattern:

```ts
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
```

Because the guards are plain functions taking a ctx, the cleanest smoke test is through a real function that uses them (e.g. expect `api.storyWrite.setStory` to reject). Write:

1. Unauthenticated `t.mutation(api.storyWrite.setStory, {...minimal args})` → rejects with `Unauthorized`.
2. `t.withIdentity({ role: "user", userId: "5" })` → still `Unauthorized`.
3. `t.withIdentity({ role: "contributor", userId: "5" })` → passes the guard (will then fail later on missing course — assert the error is "Course ... not found", proving the guard admitted the caller).

Minimal `setStory` args (from `convex/storyWrite.ts:12-26`): `{ duo_id: "d1", name: "n", image: "", set_id: 1, set_index: 1, legacyCourseId: 999, text: "", json: {}, todo_count: 0, change_date: new Date().toISOString() }`.

**Verify**: `pnpm test:convex` → 3 tests pass.

### Step 3: Characterize setStory

In `convex/storyWrite.test.ts`, seed via `t.run(async (ctx) => {...})`: two `languages`, one `courses` row (non-official, with `legacyId`), one `stories` row with `legacyId` + a `story_content` row. Read `convex/schema.ts` for required fields. Tests:

1. Contributor updates an existing story by `legacyStoryId` → returns `{ id, name, course_id, text, todo_count }`; `story_content.text` updated; course `todo_count` equals the sum over stories.
2. Unknown `legacyStoryId` and no `duo_id` match → returns `null`, nothing written.
3. Official course + contributor identity → rejects with "Official stories cannot be overwritten."
4. Official course + admin identity without `confirmOfficialOverwrite` → rejects with "Official story overwrite requires explicit confirmation."
5. (Scheduler) After a successful save, assert no crash from the scheduled `editorSideEffects` — with convex-test, scheduled functions only run when you advance time; do NOT assert on GitHub/PostHog effects (they read env vars and call the network; out of scope).

**Verify**: `pnpm test:convex` → all pass.

### Step 4: Characterize recordStoryDone, approval, and story feedback

- `convex/storyDone.test.ts`: seed course+story; (1) anonymous completion inserts `story_done` with `legacyUserId: undefined` and does NOT create `course_activity`; (2) identity with `userId: "7"` creates `story_done`, `story_done_state`, and `course_activity` rows; (3) unknown `legacyStoryId` → rejects with "Missing story for legacy id".
- `convex/storyApproval.test.ts`: read `convex/storyApproval.ts` first; characterize its main mutation's guard (unauthorized rejects) and one happy path (approval row created / story status updated as the code dictates).
- `convex/storyFeedback.test.ts`: (1) unauthenticated callers are rejected by both `listStoryFeedbackReports` and `updateStoryFeedbackStatus`; (2) `submitStoryFeedback` rejects an empty comment; (3) a contributor can transition a report from `open` to `reviewed`.

**Verify**: `pnpm test:convex` → all pass.

### Step 5: Wire into CI (only if plan 001 landed)

Add to `.github/workflows/ci.yaml` after the `Test` step:

```yaml
      - name: Convex tests
        run: pnpm test:convex
```

**Verify**: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:convex` → all exit 0.

## Test plan

This plan IS the test plan. Target: ≥15 passing tests across 5 files covering the guard matrix, setStory happy/null/official paths, recordStoryDone variants, one approval path, and the three story-feedback cases in Step 4.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm test:convex` exits 0 with ≥15 tests across 5 files, including `convex/storyFeedback.test.ts`
- [ ] `pnpm test` (existing suite) exits 0, unchanged
- [ ] `pnpm typecheck && pnpm lint` exit 0
- [ ] No file under `convex/` other than new `*.test.ts` files is modified (`git status`)
- [ ] `plans/README.md` status row updated (note any bugs the characterization revealed)

## STOP conditions

Stop and report back (do not improvise) if:

- `convex-test` cannot load the schema or functions after one focused debugging attempt (e.g. incompatibility with the `@convex-dev/better-auth` component registration) — report the exact error; the fallback (testing against a real dev deployment) is an advisor decision.
- `t.withIdentity` cannot produce an identity whose `role`/`userId` reach the guards (would mean identity fields are injected by the better-auth component in a way the mock can't reproduce).
- Seeding requires more than ~30 lines per table because of required fields — check the schema again; if truly so, report rather than inventing data.
- A characterization test reveals what looks like a real bug — record it, assert current behavior with a `// BUG?:` comment, and continue.

## Maintenance notes

- New Convex mutations should land with a test in this harness; reviewers should ask for one.
- Plan 010 (schema migration) must extend these tests before touching `authorId` handling.
- Deferred: testing `editorSideEffects` actions (network-bound; would need fetch mocking) and `authMigration.ts` (one-shot migration code).
