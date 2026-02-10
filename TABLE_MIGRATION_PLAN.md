# Postgres -> Convex Table Migration Plan

## Goal
Migrate application data from Postgres to Convex with a low-risk transition period:
- Keep Postgres as source of truth during transition.
- Dual-write to Convex for mirrored state.
- Cut over reads table-by-table behind flags.
- Remove Postgres writes once parity is proven.

## Current Status (as of 2026-02-09)
- Better Auth data exists in Convex (`user`, `account`, `session`, etc.).
- Runtime Postgres auth reads were removed from profile and editor paths.
- Legacy auth tables (`users`, `accounts`, `sessions`, `verification_token`) are out of migration scope.
- Remaining migration focus is app/domain tables in `database/schema.sql`.

## Postgres Table Dependency Graph
Note: `users` dependencies below refer to author/actor linkage semantics. The legacy `users` table itself is not in migration scope.

### Roots (no foreign-key dependencies)
- `image`
- `language`
- `avatar`

### Depends on `language`
- `speaker`
- `localization`
- `course`
- `avatar_mapping` (also depends on `avatar`)

### Depends on `course`, `users`, `image`
- `story`

### Depends on `story` (+ `users`)
- `story_done`
- `story_approval`

## Recommended Migration Order

1. `language`
2. `localization`
3. `image`
4. `avatar`
5. `speaker`
6. `avatar_mapping`
7. `course`
8. `story`
9. `story_approval`
10. `story_done`

Rationale:
- Start with low-churn lookup/config tables.
- Then move core content with derived fields.
- End with high-volume event tables.

## Cross-Table Invariants to Preserve
- `course.count` reflects published stories count.
- `course.todo_count` reflects sum of story TODO counts in course.
- `course.learning_language_name` and `course.from_language_name` remain synchronized with `language`.
- `story_approval` transitions affect story publishability and course aggregates.

## Dual-Write Architecture

For each mutating path:
1. Validate input.
2. Write to Postgres (current behavior).
3. Write equivalent mutation to Convex (idempotent).
4. Emit structured log/metric with operation key.

Requirements:
- Idempotency key per mutation (`table + primary key + updated_at/version`).
- Retry with backoff for Convex mirror write.
- Dead-letter queue/log for failed mirror writes.
- Alert when mirror lag or failure rate breaches threshold.

## Phased Plan

## Phase 0: Foundation
- Add shared mirror helpers for dual-write and idempotency.
- Add parity checks (counts + sampled row hash by PK).
- Add feature flags for per-table read cutover.

Exit criteria:
- Mirror helper integrated in at least one write path.
- Parity job running and reporting.

## Phase 1: Lookup/Config Tables
Tables:
- `language`, `localization`, `image`, `avatar`, `speaker`, `avatar_mapping`

Actions:
- Dual-write all mutations.
- Keep reads on Postgres initially.
- Backfill full historical data to Convex once.

Exit criteria:
- 7 days parity with zero unresolved drift.

## Phase 2: Course
Table:
- `course`

Actions:
- Dual-write create/update paths.
- Mirror derived fields (`count`, `todo_count`, language names) from same transaction boundary.

Exit criteria:
- Admin/editor course views match Postgres vs Convex parity checks.

## Phase 3: Story
Table:
- `story`

Actions:
- Dual-write story set/update/delete/approve/import routes.
- Ensure status and publish transitions are mirrored atomically.

Exit criteria:
- Story CRUD and publication workflows match in parity checks.

## Phase 4: Approval/Event Tables
Tables:
- `story_approval`, `story_done`

Actions:
- Dual-write insert/delete/toggle flows.
- Batch writes if necessary for high throughput.

Exit criteria:
- Stats endpoints show acceptable parity tolerance against Postgres baseline.

## Phase 5: Read Cutover
- Enable Convex reads per table behind feature flags.
- Roll out in stages: internal users -> partial traffic -> full traffic.
- Keep fast rollback to Postgres reads until stable.

Exit criteria:
- Stable latency/error budgets and parity for full traffic window.

## Phase 6: Postgres Decommission (Per Table)
For each table after stable cutover window:
- Stop Postgres writes.
- Archive snapshot.
- Remove code paths and SQL references.

## Immediate Priority Tasks

1. Add migration inventory doc mapping each write endpoint to target table(s).
2. Implement dual-write helper + idempotency key standard.
3. Start Phase 1 with `language` + `localization` (smallest blast radius).
4. Add CI guardrail:
   - Disallow new runtime SQL access to legacy auth tables in `src/**`:
   - `users`, `accounts`, `sessions`, `verification_token`.

## Operational Guardrails
- Add dashboard metrics:
  - mirror write success rate
  - mirror write latency
  - pending retry queue size
  - parity drift count per table
- Define rollback policy:
  - If mirror failures > threshold, disable Convex read flag for affected tables.

## Risks
- Hidden write paths not yet instrumented.
- Derived field drift (`course.count`, `course.todo_count`) if write ordering diverges.
- Large table backfills impacting production if not throttled.

## Validation Checklist (Per Table)
- [ ] Backfill complete
- [ ] Dual-write enabled
- [ ] Idempotency tested
- [ ] Retry/alerts configured
- [ ] Parity checks green for 7+ days
- [ ] Read cutover enabled and stable
- [ ] Rollback tested
- [ ] Postgres write path removed
