# Migration Write Matrix

This file tracks write paths for the currently scoped migration tables and whether each path is mirrored to Convex.

Scope:
- `language`
- `image`
- `avatar`
- `speaker`
- `localization`
- `course`
- `avatar_mapping`
- `story`
- `story_content`
- `story_done`
- `story_approval`

Status values:
- `Yes`: Runtime write path includes Convex mirror call.
- `N/A`: No runtime write path exists in `src/app` for this table.
- `Backfill`: Batch migration script path (not a user-facing runtime write).

## Runtime Write Paths

| Table | File | SQL Write | What This Write Is About | Convex Mirror | Migrated |
|---|---|---|---|---|---|
| `language` | `src/app/admin/languages/set/route.ts` | `INSERT/UPDATE language` | Admin creates/edits language metadata (name, short code, flag, default voice, RTL). | `mirrorLanguage(...)` | Yes |
| `language` | `src/app/editor/language/set_default_text/route.ts` | `UPDATE language default_text` | Editor updates default TTS text template used in language voice testing. | `mirrorLanguage(...)` | Yes |
| `language` | `src/app/editor/language/save_tts_replace/route.ts` | `UPDATE language tts_replace` | Editor updates text replacement rules used before speech synthesis. | `mirrorLanguage(...)` | Yes |
| `image` | _No runtime writes in `src/app`_ | N/A | Image rows are currently treated as seed/config data and read at runtime. | N/A | N/A |
| `avatar` | _No runtime writes in `src/app`_ | N/A | Avatar base rows are currently treated as seed/config data and read at runtime. | N/A | N/A |
| `speaker` | `src/app/audio/voices/route.ts` | `REPLACE INTO speaker` | Admin voice sync imports available TTS voices and maps them to languages. | `mirrorSpeaker(...)` | Yes |
| `localization` | `src/app/editor/localization/[language]/localization_editor.tsx` (server action) | `INSERT ... ON CONFLICT UPDATE localization` | Editor updates UI translation strings by language and tag. | `mirrorLocalization(...)` | Yes |
| `avatar_mapping` | `src/app/editor/language/set_avatar_speaker/route.ts` | `INSERT/UPDATE avatar_mapping` | Editor customizes per-language avatar display name and assigned speaker. | `mirrorAvatarMapping(...)` | Yes |
| `course` | `src/app/admin/courses/set/route.ts` | `INSERT/UPDATE course` | Admin creates/edits course metadata and language pair identity. | `mirrorCourse(...)` | Yes |
| `course` | `src/app/editor/story/set_story/route.ts` | `UPDATE course todo_count` | Story save recalculates aggregate TODO count for the course. | `mirrorCourse(...)` | Yes |
| `course` | `src/app/editor/(course)/approve/[story_id]/route.ts` | `UPDATE course count/contributors/contributors_past` | Approval flow updates publication totals and active/past contributor lists for the affected course. | `mirrorCourse(...)` | Yes |
| `course` | `src/app/admin/story/[story_id]/actions.ts` | `UPDATE course count` | Admin publish toggle recalculates public story count for the story's course. | `mirrorCourse(...)` | Yes |
| `story` | `src/app/editor/story/set_story/route.ts` | `UPDATE story` | Contributor saves story metadata and content (`text`, `json`) and updates status-related fields. | `mirrorStory(...)` | Yes |
| `story` | `src/app/editor/story/delete_story/route.ts` | `UPDATE story deleted/public` | Contributor soft-deletes story and unpublishes it. | `mirrorStory(...)` | Yes |
| `story` | `src/app/editor/(course)/course/[course_id]/import/send/[story_id]/route.ts` | `INSERT INTO story` | Contributor imports an existing story into another course. | `mirrorStory(...)` | Yes |
| `story` | `src/app/editor/(course)/approve/[story_id]/route.ts` | `UPDATE story status/public/date_published` | Approval toggles update review status and auto-publish completed set stories. | `mirrorStory(...)` | Yes |
| `story` | `src/app/admin/story/[story_id]/actions.ts` | `UPDATE story public` | Admin publish toggle directly flips visibility. | `mirrorStory(...)` | Yes |
| `story_content` | `src/app/editor/story/set_story/route.ts` | _Not yet split in SQL_ | Mirrors heavy story payload (`text`, `json`) into Convex `story_content`. | `mirrorStory(..., { mirrorContent: true })` | Yes |
| `story_content` | `src/app/editor/(course)/course/[course_id]/import/send/[story_id]/route.ts` | _Not yet split in SQL_ | Mirrors imported story payload into Convex `story_content`. | `mirrorStory(..., { mirrorContent: true })` | Yes |
| `story_done` | `src/app/(stories)/story/[story_id]/page.tsx` | `INSERT INTO story_done` | Reader completion event in default story player. | `mirrorStoryDone(...)` | Yes |
| `story_done` | `src/app/(stories)/story/[story_id]/script/page.tsx` | `INSERT INTO story_done` | Reader completion event in script-mode story player. | `mirrorStoryDone(...)` | Yes |
| `story_approval` | `src/app/editor/(course)/approve/[story_id]/route.ts` | `INSERT/DELETE story_approval` | Contributor toggles approval for a story; status/publication logic depends on approval count. | `mirrorStoryApprovalUpsert(...)` / `mirrorStoryApprovalDelete(...)` | Yes |
| `story_approval` | `src/app/admin/story/[story_id]/actions.ts` | `DELETE story_approval` | Admin removes a specific approval entry from a story. | `mirrorStoryApprovalDeleteByLegacyId(...)` | Yes |

## Backfill Paths

| Table | File | Path Type | What It Does | Convex Mutation | Migrated |
|---|---|---|---|---|---|
| `language` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `language` to Convex. | `api.lookupTables.upsertLanguagesBatch` | Backfill |
| `image` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `image` to Convex. | `api.lookupTables.upsertImagesBatch` | Backfill |
| `avatar` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `avatar` to Convex. | `api.lookupTables.upsertAvatarsBatch` | Backfill |
| `speaker` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `speaker` to Convex. | `api.lookupTables.upsertSpeaker` | Backfill |
| `localization` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `localization` to Convex. | `api.lookupTables.upsertLocalization` | Backfill |
| `course` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `course` to Convex. | `api.lookupTables.upsertCourse` | Backfill |
| `avatar_mapping` | `scripts/migrate-lookup-tables.ts` | Backfill | Bulk copy from Postgres `avatar_mapping` to Convex. | `api.lookupTables.upsertAvatarMapping` | Backfill |
| `story` | `scripts/migrate-story-tables.ts` | Backfill | Bulk copy story metadata from Postgres `story` to Convex `stories`. | `api.storyTables.upsertStory` | Backfill |
| `story_content` | `scripts/migrate-story-tables.ts` | Backfill | Bulk copy heavy payload (`text`, `json`) from Postgres `story` to Convex `story_content`. | `api.storyTables.upsertStoryContent` | Backfill |
| `story` | `scripts/remove-story-heavy-fields.ts` | Cleanup migration | Strip deprecated heavy fields (`text`, `json`) from existing Convex `stories` documents after `story_content` backfill. | `api.storyTables.stripStoryHeavyFieldsBatch` | Backfill |
| `story_done` | `scripts/migrate-story-done.ts` | Backfill | Bulk copy user/story completion records from Postgres `story_done`. | `api.storyDone.recordStoryDone` | Backfill |
| `story_approval` | `scripts/migrate-story-approval.ts` | Backfill | Bulk copy story approval records from Postgres `story_approval`. | `api.storyApproval.upsertStoryApprovalBatch` | Backfill |

## Notes

- `course` mirroring exists on all currently discovered runtime `UPDATE course`/`INSERT course` paths in `src/app`.
- `image` and `avatar` currently do not have runtime writes in `src/app`; they are covered by backfill and seed flows.
- Mirror helpers are fail-fast: mirror failure propagates an error rather than silently succeeding.
