# Migration Recap (Convex-first write path)

This document summarizes the recent migration from mixed Next route writes to direct Convex writes with internal side effects.

## Goals

- Reduce write-path duplication and route-level boilerplate.
- Keep authorization and write semantics centralized in Convex.
- Move side effects out of Next route handlers and into explicit internal actions.
- Improve maintainability and predictability of data flow.

## Before

- Many editor/admin write paths used Next route handlers as pass-through layers.
- Route handlers duplicated auth checks and payload handling.
- Some write side effects (GitHub sync, PostHog tracking) were tied to route handlers.
- Different write surfaces existed for similar operations.

## After

- App writes are primarily direct Convex mutations.
- Next route handlers remain only where server-only boundaries are required:
  - auth entrypoint
  - audio endpoints/upload integration
- Write side effects are scheduled from Convex mutations via:
  - `convex/postgresMirror.ts`
  - `convex/editorSideEffects.ts`

## Implemented patterns

1. Client -> mutation
- UI components call `useMutation(api....)` directly for editor/admin writes.

2. Mutation -> side effects
- Mutations schedule internal actions with `ctx.scheduler.runAfter(0, internal....)`.
- Side effects do not block canonical DB write success.

3. Operation keys
- Write calls include `operationKey` for retriable paths and future idempotency hardening.

## Route handlers removed in this phase

- `src/app/editor/language/set_default_text/route.ts`
- `src/app/editor/language/save_tts_replace/route.ts`
- `src/app/editor/language/set_avatar_speaker/route.ts`
- `src/app/editor/localization/set/route.ts`
- `src/app/admin/languages/set/route.ts`
- `src/app/admin/courses/set/route.ts`
- `src/app/editor/story/get_image/[image_id]/route.ts`
- `src/app/editor/story/get_language/[language_id]/route.ts`
- `src/app/editor/story/set_story/route.ts`
- `src/app/editor/story/delete_story/route.ts`
- `src/app/editor/(course)/approve/[story_id]/route.ts`
- `src/app/editor/(course)/course/[course_id]/import/send/[story_id]/route.ts`

## Convex side effects added

- `convex/editorSideEffects.ts`
  - story save: GitHub sync + PostHog event
  - story delete: GitHub delete + PostHog event
  - story import: GitHub sync
  - story approval toggle: PostHog event

## Parser and payload hardening

- Fixed parser/audio mapping generation to avoid nested `undefined` values in story JSON.
- Added defensive save-time sanitization (`undefined -> null`) before Convex mutation submission.

## Remaining follow-ups

- Add an explicit idempotency ledger for side effects keyed by `operationKey`.
- Continue tightening schema validation for story JSON (`v.any()` reduction).
- Keep documenting "when a Next route is justified" as architecture evolves.
