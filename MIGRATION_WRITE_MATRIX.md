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

## Notes

- `course` mirroring exists on all currently discovered runtime `UPDATE course`/`INSERT course` paths in `src/app`.
- `image` and `avatar` currently do not have runtime writes in `src/app`; they are covered by backfill and seed flows.
- Mirror helpers are fail-fast: mirror failure propagates an error rather than silently succeeding.
