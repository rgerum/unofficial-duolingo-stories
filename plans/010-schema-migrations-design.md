# Plan 010: Design the two parked schema migrations (author identity + Postgres-sunset fields)

> **Executor instructions**: This is a DESIGN/SPIKE plan, not a build plan.
> The deliverable is a written migration design (a new markdown file under
> `plans/`), validated against production data shape via read-only queries —
> NOT executed migrations. Follow the steps; honor STOP conditions. When done,
> update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- convex/schema.ts convex/editorRead.ts`
> If `convex/schema.ts` lines 99-108 or 135-140 changed, the TODOs may have
> been addressed — check `plans/README.md` and git log before proceeding.

## Status

- **Priority**: P2
- **Effort**: M for the design (the later execution is L)
- **Risk**: LOW (design only; the designed migration itself is MED-HIGH and that's why it gets a design first)
- **Depends on**: plans/006-convex-function-test-harness.md (the design must specify tests that the harness makes possible)
- **Category**: migration
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

Two acknowledged-but-parked migrations live as TODOs in `convex/schema.ts`, and both force dual-path code through the read layer:

1. **Author identity** (`schema.ts:135-140`): `stories.authorId` and `authorChangeId` are `v.union(v.number(), v.string())` — some rows hold legacy numeric user IDs, others hold better-auth doc IDs. Every author lookup needs two resolution paths (`getUserNameByLegacyId` + `getUserNameByAuthDocId` in `convex/editorRead.ts:129+`, plus `toNumber` coercion at `editorRead.ts:372-380`).
2. **Postgres-compat denormalized course fields** (`schema.ts:99-108`): `learning_language_name`, `from_language_name`, `contributors`, `contributors_past` duplicate the `languages` table and `contributorDetails`; readers carry fallbacks like `learningLanguage?.name ?? course.learning_language_name ?? ""` (`editorRead.ts:274-275`).

Migrating without a plan risks breaking author display and course rendering site-wide. The right first step is a design grounded in actual data counts (how many rows still carry legacy shapes), an inventory of every reader, and a staged widen→migrate→narrow sequence.

## Current state

- `convex/schema.ts:135-140`:
  ```ts
  // Temporary migration compatibility:
  // some existing Convex rows stored auth component user IDs (string),
  // while mirrored Postgres rows use legacy numeric user IDs.
  // TODO(post-migration): normalize to a single author identity type.
  authorId: v.optional(v.union(v.number(), v.string())),
  authorChangeId: v.optional(v.union(v.number(), v.string())),
  ```
- `convex/schema.ts:99-104`:
  ```ts
  // Legacy denormalized fields kept only for Postgres-compat migration.
  // TODO(postgres-sunset): remove these once all readers use joined language docs.
  learning_language_name: v.optional(v.string()),
  from_language_name: v.optional(v.string()),
  contributors: v.optional(v.array(v.string())),
  contributors_past: v.optional(v.array(v.string())),
  ```
- Dual-path resolution exemplar: `convex/editorRead.ts:129-165` (`getUserNameByAuthDocId` falls back to per-ID `ctx.runQuery(components.betterAuth.adapter.get, ...)`).
- Write path: `convex/storyWrite.ts:39,110` — new writes set `authorChangeId` to the **numeric** legacy user ID (`requireSessionLegacyUserId`). So the current write convention is numeric; the string rows are historical.
- Migration tooling conventions: Convex recommends `@convex-dev/migrations` for online backfills; the repo does not yet depend on it. Repo rule: read `convex/_generated/ai/guidelines.md` first. A `convex-migration-helper` skill may be available in the executor environment — use it; it encodes the widen→migrate→narrow methodology.
- `convex/lookupTableMirror`-related code and `mirrorUpdatedAt` / `lastOperationKey` fields suggest an external Postgres mirror existed; whether anything still syncs FROM Postgres determines if the denormalized fields can go. `src/lib/lookupTableMirror.ts` is the client-side piece to inspect.

## Commands you will need

| Purpose            | Command                              | Expected on success |
|--------------------|--------------------------------------|---------------------|
| Typecheck          | `pnpm typecheck`                     | exit 0              |
| Read-only data probe | `pnpm exec convex run <fn> '{}'` against a **dev** deployment, or one-off query in the dashboard | counts, no writes |
| Codegen            | `pnpm exec convex codegen`           | exit 0              |

## Suggested executor toolkit

- `convex-migration-helper` skill (if available) — read it before writing the design.
- `convex/_generated/ai/guidelines.md` — mandatory background.

## Scope

**In scope**:
- Creating `plans/011-author-identity-migration-design.md` (the deliverable — despite the name it is a design document, numbered as the next plan slot; adjust the number if 011 is taken).
- Optionally adding ONE read-only temporary query (e.g. `convex/migrationProbes.ts` with `internalQuery` functions counting rows by author-id type) to gather data — clearly marked `// TEMPORARY: remove after migration design (plan 010)`.

**Out of scope** (do NOT do):
- Executing any migration or backfill.
- Changing `schema.ts`, any reader, or any writer.
- Installing `@convex-dev/migrations` (the design says when; the execution plan does it).

## Git workflow

- Branch: `advisor/010-schema-migration-design`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Measure the data

Add temporary internal queries (or use the Convex dashboard) to answer, per table, **on the production deployment if the operator grants access, else dev**:

- `stories`: count rows where `authorId` is a number / a string / undefined; same for `authorChangeId`.
- For string `authorId` rows: how many resolve to a better-auth user (sample 20, resolve via the adapter as `editorRead.ts:129+` does) — establishing whether a string→numeric mapping exists for ALL rows.
- `courses`: count rows where each denormalized field is set AND differs from the joined `languages` doc's name.

**Verify**: the design doc's "Data shape" section contains these counts with the date measured.

### Step 2: Inventory every reader/writer

For each of the six fields, list every read and write site:
`grep -rn "authorId\|authorChangeId" convex/ src/ --include="*.ts*" | grep -v _generated | grep -v test` and
`grep -rn "learning_language_name\|from_language_name\|contributors_past\|\.contributors" convex/ src/ --include="*.ts*" | grep -v _generated`.
Classify each site: reads-union (must handle both), writes-numeric, fallback-only.

**Verify**: the design doc has a complete site table (file:line, classification).

### Step 3: Determine whether the Postgres mirror is dead

Inspect `src/lib/lookupTableMirror.ts`, `mirrorUpdatedAt` usage, and ask the maintainer (record the question in the doc if unanswered): does ANYTHING still write `learning_language_name` / `from_language_name` / `contributors` / `contributors_past`, or sync from Postgres? `grep -rn "learning_language_name:" convex/ --include="*.ts" | grep -v schema` to find writers.

**Verify**: design doc states "writers: none / these:" with evidence.

### Step 4: Write the migration design

`plans/011-author-identity-migration-design.md` must contain, for EACH of the two migrations:

1. **Target end state** (e.g. `authorId: v.optional(v.number())` — or `v.id`-based identity if Step 1 shows numeric mapping is impossible for some rows; justify the choice with the counts).
2. **Staged sequence** (widen → backfill → switch readers → narrow), each stage independently deployable and reversible, with the exact schema diff per stage.
3. **Backfill mechanics**: `@convex-dev/migrations` usage, batch size, idempotency, how to handle unresolvable rows (count from Step 1; options: leave null + report, or map to a sentinel).
4. **Test requirements**: which plan-006 harness tests must exist BEFORE each stage (e.g. author-name resolution returns identical results for a numeric row and its string twin).
5. **Verification per stage**: a read-only count query that must return 0 (e.g. "rows where authorId is a string") before the narrowing deploy.
6. **Rollback note per stage**.
7. **Open questions for the maintainer** (e.g. mirror liveness from Step 3).

**Verify**: every numbered element above is present; another agent could execute stage 1 from the doc alone.

### Step 5: Clean up

Remove any temporary probe queries added in Step 1 (or keep them ONLY if the design doc references them as stage-verification tools — then remove the TEMPORARY marker and document them).

**Verify**: `pnpm typecheck && pnpm lint` → exit 0; `git status` shows only the design doc (and optionally the documented probe file).

## Test plan

None — design deliverable. The design itself specifies the tests for execution.

## Done criteria

- [ ] `plans/011-author-identity-migration-design.md` exists and contains all 7 elements of Step 4 for both migrations
- [ ] Data counts in the doc are real (queried), not estimated, with measurement date
- [ ] Reader/writer inventory table complete
- [ ] No schema, reader, or writer code changed (`git diff --stat` vs in-scope list)
- [ ] `plans/README.md` updated: this plan DONE, the new design doc added as a row (status: TODO, blocked on maintainer sign-off)

## STOP conditions

Stop and report back (do not improvise) if:

- You cannot get row counts from any deployment (no dev data ≈ no grounded design — report what access is needed).
- Step 1 reveals a third identity shape (something other than legacy-numeric / auth-doc-string).
- Step 3 finds an active writer of the denormalized fields outside `convex/` (an external system still syncs) — the sunset half of the design is then blocked on that system.

## Maintenance notes

- The design doc is the contract for the execution plan; if more than ~3 months pass (or better-auth is upgraded) before execution, re-run Step 1's counts.
- Until the migration executes, new code must keep writing numeric `authorChangeId` (the `storyWrite.ts:39` convention) — flag any PR that writes a string author ID.
