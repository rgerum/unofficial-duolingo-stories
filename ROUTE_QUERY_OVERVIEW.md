# Route -> Query Overview

This maps URL routes to the data queries/mutations they execute today.

## Legend
- `Convex query/mutation`: `api.*` functions in `convex/*.ts`
- `SQL`: direct Postgres via `sql\`\`` in route/server-action files
- `Mixed`: route uses Convex reads plus SQL writes (or vice versa)

## Public Story Routes

| Route | Query/Mutation Calls | Backend |
|---|---|---|
| `/` | `api.landing.getPublicCourseList`; `api.localization.getLocalizationWithEnglishFallback`; `api.localization.getLanguageFlagById` | Convex |
| `/:course_id` | `api.landing.getPublicCoursePageData`; `api.storyDone.getDoneStoryIdsForCourse` | Convex |
| `/story/:story_id` | `api.storyRead.getStoryByLegacyId`; `api.storyRead.getStoryMetaByLegacyId`; `api.storyDone.recordStoryDone` | Convex |
| `/story/:story_id/script` | `api.storyRead.getStoryByLegacyId`; `api.storyRead.getStoryMetaByLegacyId` | Convex |
| `/story/:story_id/test` | `api.storyRead.getStoryByLegacyId` | Convex |
| `/story/:story_id/auto_play` | `api.storyRead.getStoryByLegacyId` | Convex |
| `/learn` | `api.storyDone.getLastDoneCourseShortForLegacyUser` | Convex |
| `/profile` | `api.auth.getLinkedProvidersForCurrentUser` | Convex |
| `/stats/:year` | `get_stats(year)` in `src/app/(stories)/stats/[year]/db_query.js` | SQL |
| `/stats/:year/:month` | `get_stats(year, month)` in `src/app/(stories)/stats/[year]/[month]/db_query.ts` | SQL |

## Editor UI Routes

| Route | Query/Mutation Calls | Backend |
|---|---|---|
| `/editor/course/:course_id` | `api.editorRead.getEditorCourseByIdentifier`; `api.editorRead.getEditorStoriesByCourseLegacyId` | Convex |
| `/editor/course/:course_id/import/:from_id` | `api.editorRead.getEditorSidebarData`; `api.editorRead.getEditorCourseByIdentifier`; `api.editorRead.getEditorCourseImport` | Convex |
| `/editor/story/:story` | `api.editorRead.getEditorStoryPageData`; `api.editorRead.getEditorLanguageByLegacyId` | Convex |
| `/editor/language/:language` | `api.editorRead.resolveEditorLanguage`; `api.editorRead.getEditorSpeakersByLanguageLegacyId`; `api.editorRead.getEditorAvatarNamesByLanguageLegacyId` | Convex |
| `/editor/language/:language/tts_edit` | `api.editorRead.resolveEditorLanguage`; `api.editorRead.getEditorSpeakersByLanguageLegacyId` | Convex |
| `/editor/localization/:language` | `api.editorRead.resolveEditorLanguage`; `api.editorRead.getEditorLocalizationRowsByLanguageLegacyId` | Convex |

## Admin UI Routes

| Route | Query/Mutation Calls | Backend |
|---|---|---|
| `/admin/courses` | `api.adminData.getAdminCourses` | Convex |
| `/admin/languages` | `api.adminData.getAdminLanguages` | Convex |
| `/admin/users` | `api.adminData.getAdminUsersPage` | Convex |
| `/admin/users/:user_id` | `api.adminData.getAdminUserByLegacyId`; mutations `api.adminData.setAdminUserActivated`, `api.adminData.setAdminUserWrite`, `api.adminData.setAdminUserDelete` | Convex |
| `/admin/story/:story_id` | `api.adminData.getAdminStoryByLegacyId`; server actions `togglePublished` + `removeApproval` in `src/app/admin/story/[story_id]/actions.ts` | Mixed (Convex read + SQL write) |

## API/Route Handlers (`route.ts`)

| Route Handler | Query/Mutation Calls | Backend |
|---|---|---|
| `POST /admin/courses/set` | update path: `api.adminWrite.updateAdminCourse` + `internal.postgresMirror.mirrorAdminCourseUpdate`; create path fallback: SQL insert + `mirrorCourse` | Mixed (Convex-first updates, SQL create fallback) |
| `POST /admin/languages/set` | update path: `api.adminWrite.updateAdminLanguage` + `internal.postgresMirror.mirrorAdminLanguageUpdate`; create path fallback: SQL insert + `mirrorLanguage` | Mixed (Convex-first updates, SQL create fallback) |
| `GET/POST /api/auth/[...all]` | delegated to `handler` from `src/lib/auth-server.ts` | Better Auth/Convex adapter |
| `POST /audio/create` | no DB query (TTS providers + filesystem) | External APIs/filesystem |
| `POST /audio/upload` | no DB query (blob upload + filesystem) | Vercel Blob/filesystem |
| `GET /audio/voices` | `api.languageWrite.upsertSpeakerFromVoice`; internal action `internal.postgresMirror.mirrorSpeakerUpsert` | Convex mutation + Postgres mirror action |
| `GET /editor/story/get_image/:image_id` | `api.editorRead.getEditorImageByLegacyId` | Convex |
| `GET /editor/story/get_language/:language_id` | `api.editorRead.getEditorLanguageByLegacyId` | Convex |
| `POST /editor/localization/set` | `api.localizationWrite.setLocalization`; internal action `internal.postgresMirror.mirrorLocalizationUpsert` | Convex mutation + Postgres mirror action |
| `POST /editor/language/set_default_text` | `api.languageWrite.setDefaultText`; internal action `internal.postgresMirror.mirrorLanguageDefaultText` | Convex mutation + Postgres mirror action |
| `POST /editor/language/set_avatar_speaker` | `api.languageWrite.setAvatarSpeaker`; internal action `internal.postgresMirror.mirrorAvatarMappingUpsert` | Convex mutation + Postgres mirror action |
| `POST /editor/language/save_tts_replace` | `api.languageWrite.setTtsReplace`; internal action `internal.postgresMirror.mirrorLanguageTtsReplace` | Convex mutation + Postgres mirror action |
| `POST /editor/story/set_story` | `api.storyWrite.setStory`; internal action `internal.postgresMirror.mirrorStorySet` | Convex mutation + Postgres mirror action |
| `POST /editor/story/delete_story` | `api.storyWrite.deleteStory`; internal action `internal.postgresMirror.mirrorStoryDelete` | Convex mutation + Postgres mirror action |
| `GET /editor/course/:course_id/import/send/:story_id` | `api.storyWrite.importStory`; internal action `internal.postgresMirror.mirrorStoryImport` | Convex mutation + Postgres mirror action |
| `GET /editor/approve/:story_id` | toggles `story_approval`; updates `story.status`, `story.public`, `course.count`, contributor lists; mirrors approval/story/course | SQL + Convex mirror |

## Core Convex Query Modules (what many routes depend on)

- `convex/landing.ts`: course list + course page reads
- `convex/storyRead.ts`: story content/meta reads
- `convex/storyDone.ts`: story completion reads/writes
- `convex/editorRead.ts`: editor sidebar/course/story/language/localization reads
- `convex/adminData.ts`: admin users/courses/languages/story reads + user role mutations
- `convex/localization.ts`: localization + language flag reads

## Architecture Snapshot

- Public/read-heavy paths are mostly Convex reads.
- Most editor/admin writes still go through direct Postgres SQL routes and then mirror into Convex (`lookupTableMirror`).
- Current state is hybrid: **Convex for canonical read APIs in the app layer, SQL still active for many write paths**.
