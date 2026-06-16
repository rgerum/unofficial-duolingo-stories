# Plan 002: Enforce contributor authorization on editor Convex queries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- convex/editorRead.ts convex/lib/authorization.ts src/app/editor/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW–MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

Three public Convex queries in `convex/editorRead.ts` — `getEditorSidebarData`, `getEditorCourseByIdentifier`, `getEditorStoriesByCourseLegacyId` — have **no authorization check**. The only "protection" is a client-side redirect in `src/app/editor/layout.tsx`, but Convex queries are directly callable by anyone who knows the public deployment URL and function names. This leaks the full editorial state: every course (including non-public ones), todo counts, story statuses, author names, and contributor lists. All editor **write** mutations are correctly guarded (e.g. `convex/storyWrite.ts:38` calls `requireContributorOrAdmin`), so this is purely a read-side gap.

## Current state

- `convex/lib/authorization.ts` — shared guard helpers. Exports `requireAdmin`, `requireContributorOrAdmin` (throws `Error("Unauthorized")` unless `identity.role` is `"contributor"` or `"admin"`), `requireSessionLegacyUserId`, `getSessionLegacyUserId`. Role comes from `ctx.auth.getUserIdentity()`.
- `convex/editorRead.ts:5` — already imports `getSessionLegacyUserId` from `./lib/authorization`, so the import path pattern is established.
- The three unguarded queries:
  - `convex/editorRead.ts:213` — `getEditorSidebarData = query({ args: {}, handler: async (ctx) => { const courseRows = await ctx.db.query("courses").collect(); ... return { courses }; } })`
  - `convex/editorRead.ts:244` — `getEditorCourseByIdentifier = query({ args: { identifier: v.string() }, returns: editorCourseValidator, handler ... })` — returns `null` when the course is not found (line 249), so callers already handle `null`.
  - `convex/editorRead.ts:283` — `getEditorStoriesByCourseLegacyId = query({ args: { identifier: v.string() }, handler ... })`
- Callers (all under `src/app/editor/`):
  - Client components via `useQuery` (auth token flows through the Convex provider): `course_list.tsx:22`, `layout_flag.tsx:29`, `course/[course_id]/page_client.tsx:21,25`, `voices/page_client.tsx:21`, `voices/edit/page_client.tsx:22`, `import/[from_id]/import_list.tsx:17,20`, `import/[from_id]/page_client.tsx:19,20`, `localization/page_client.tsx:17`, `_components/editor_command_palette.tsx:235,309`, `course/[course_id]/story/[story]/audio-cutter/page_client.tsx:75,79`, `editor/story/[story]/page_client.tsx:37,41`.
  - **Server components via unauthenticated `fetchQuery` from `convex/nextjs`** — these will break if the query throws on missing identity, and must be switched to the repo's authenticated helper:
    - `src/app/editor/(course)/course/[course_id]/page.tsx:12`
    - `src/app/editor/(course)/course/[course_id]/voices/page.tsx:18`
    - `src/app/editor/(course)/course/[course_id]/voices/edit/page.tsx:18`
    - `src/app/editor/(course)/course/[course_id]/import/[from_id]/page.tsx:13`
    - `src/app/editor/(course)/course/[course_id]/localization/page.tsx:18`
- The repo's authenticated server-side query helper: `src/lib/auth-server.ts` exports `fetchAuthQuery` (from `convexBetterAuthNextJs`). Exemplar usage: `src/lib/userInterface.ts:55` — `await fetchAuthQuery(api.auth.getCurrentUser)`.
- Repo convention note (CLAUDE.md): when working on Convex code, read `convex/_generated/ai/guidelines.md` first.

### Design decision (made by the advisor — follow it)

Use **non-throwing guards that return empty data** for these three queries, instead of throwing. Reason: `useQuery` subscriptions fire while the client auth token is still loading; a throwing guard would surface transient error states in every editor screen. Returning empty data is indistinguishable from "loading/none" for the existing UI (it already handles `null` course and empty lists), while still revealing nothing to unauthorized callers.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Typecheck | `pnpm typecheck`                 | exit 0              |
| Lint      | `pnpm lint`                      | exit 0              |
| Format    | `pnpm run format`                | files formatted     |
| Codegen   | `pnpm exec convex codegen`       | exit 0 (run after editing convex functions) |
| Tests     | `pnpm test`                      | all pass            |

## Suggested executor toolkit

- Read `convex/_generated/ai/guidelines.md` before editing Convex code (repo rule).
- If a `convex-setup-auth` skill is available, it may be useful background, but this plan does not require it.

## Scope

**In scope** (the only files you should modify):
- `convex/lib/authorization.ts` (add one helper)
- `convex/editorRead.ts` (guard 3 queries)
- The 5 server pages listed above (switch `fetchQuery` → `fetchAuthQuery`)

**Out of scope** (do NOT touch, even though they look related):
- `convex/adminData.ts` — has its own admin check; leave as is.
- All client `useQuery` call sites — they need no change with the empty-data guard.
- Any write mutation — already guarded.
- `convex/landing.ts`, `convex/storyRead.ts` — intentionally public (story reading is the public product).

## Git workflow

- Branch: `advisor/002-guard-editor-queries`
- Commit style: short imperative subject, e.g. `Require contributor role for editor read queries`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a non-throwing role check to authorization lib

In `convex/lib/authorization.ts`, add (alongside the existing helpers, reusing the private `getRole`):

```ts
export async function isContributorOrAdmin(ctx: AuthCtx) {
  const role = await getRole(ctx);
  return role === "contributor" || role === "admin";
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Guard the three queries in editorRead.ts

At the top of each handler, return empty data when unauthorized:

- `getEditorSidebarData` (line ~215): first line of handler:
  `if (!(await isContributorOrAdmin(ctx))) return { courses: [] };`
- `getEditorCourseByIdentifier` (line ~247): first line of handler:
  `if (!(await isContributorOrAdmin(ctx))) return null;`
  (The `returns: editorCourseValidator` validator must already permit `null` — it does, since the not-found path returns `null` at line 249. If typecheck complains, STOP.)
- `getEditorStoriesByCourseLegacyId` (line ~285): first line of handler:
  `if (!(await isContributorOrAdmin(ctx))) return [];`
  Check what the function returns on its happy path first: if it returns an object rather than an array, return the matching empty shape instead. STOP if the empty shape is ambiguous.

Update the import at `convex/editorRead.ts:5` to also import `isContributorOrAdmin`.

**Verify**: `pnpm typecheck` → exit 0; `pnpm exec convex codegen` → exit 0.

### Step 3: Switch the 5 server pages to authenticated fetch

In each of the 5 server components listed in "Current state", replace
`import { fetchQuery } from "convex/nextjs"` usage for these editor queries with
`import { fetchAuthQuery } from "@/lib/auth-server"` and call
`fetchAuthQuery(api.editorRead.getEditorCourseByIdentifier, { identifier: ... })`.

Keep everything else about the call identical. If a file uses `fetchQuery` for other queries too, only change the editor query call, and keep both imports.

**Verify**: `grep -rn "fetchQuery(api.editorRead" src/` → no matches; `pnpm typecheck` → exit 0.

### Step 4: Full verification

`pnpm run format && pnpm lint && pnpm typecheck && pnpm test`

**Verify**: all exit 0.

### Step 5 (optional, if a dev deployment is configured): behavioral check

`pnpm exec convex run editorRead:getEditorSidebarData '{}'` — runs without a user identity.

**Verify**: output is `{"courses":[]}` (empty data, not the real course list, and no thrown error).

## Test plan

- If plan 006 (Convex test harness) has already landed: add tests in `convex/editorRead.test.ts` asserting (a) unauthenticated call returns empty shape, (b) identity with `role: "contributor"` receives data. Model after the harness's existing guard tests.
- If plan 006 has not landed: the optional Step 5 plus typecheck/lint is the gate; note in `plans/README.md` that tests should be added when 006 lands.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "isContributorOrAdmin" convex/editorRead.ts` shows 3 usages (one per query) plus the import
- [ ] `grep -rn "fetchQuery(api.editorRead" src/` → no matches
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all exit 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `getEditorStoriesByCourseLegacyId`'s happy-path return shape is not a plain array (the empty-value choice then needs an advisor decision).
- Typecheck rejects returning `null`/empty from any of the queries due to its `returns:` validator.
- Switching a server page to `fetchAuthQuery` breaks its rendering because the page is reachable by non-contributors by design.
- You find additional unguarded queries you want to fix "while you're here" — report them instead; only the three named queries are in scope.

## Maintenance notes

- Any new query added to `convex/editorRead.ts` must start with the same guard; reviewers should treat a missing guard in that file as a defect.
- The empty-data-vs-throw decision is deliberate (subscription-friendly). If the team later adds a global Convex error boundary for auth, these can be migrated to throwing guards in one pass.
- Follow-up explicitly deferred: auditing `convex/audioRead.ts` and `convex/lookupTables.ts` read functions for the same pattern (lower sensitivity, see plans/README.md rejected/deferred notes).
