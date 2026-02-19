# Route -> Query Overview

This maps URL routes to the data queries/mutations they execute today.

## Legend
- `Convex query/mutation`: `api.*` functions in `convex/*.ts`
- `SQL`: direct Postgres via `sql\`\`` in route/server-action files
- `Mixed`: route uses Convex reads plus SQL writes (or vice versa)

## Public Story Routes

| Route | Query/Mutation Calls | Backend |
|---|---|---|
| `/` | `api.landing.getPublicCourseList`; `api.localization.getLocalizationWithEnglishFallback`; `api.localization.getAllLanguageFlags` | Convex |
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
| `POST /admin/courses/set` | create/update via `api.adminWrite.createAdminCourse` / `api.adminWrite.updateAdminCourse` | Convex mutation |
| `POST /admin/languages/set` | create/update via `api.adminWrite.createAdminLanguage` / `api.adminWrite.updateAdminLanguage` | Convex mutation |
| `GET/POST /api/auth/[...all]` | delegated to `handler` from `src/lib/auth-server.ts` | Better Auth/Convex adapter |
| `POST /audio/create` | no DB query (TTS providers + filesystem) | External APIs/filesystem |
| `POST /audio/upload` | no DB query (blob upload + filesystem) | Vercel Blob/filesystem |
| `GET /audio/voices` | `api.languageWrite.upsertSpeakerFromVoice` | Convex mutation |
| `GET /editor/story/get_image/:image_id` | `api.editorRead.getEditorImageByLegacyId` | Convex |
| `GET /editor/story/get_language/:language_id` | `api.editorRead.getEditorLanguageByLegacyId` | Convex |
| `POST /editor/localization/set` | `api.localizationWrite.setLocalization` | Convex mutation |
| `POST /editor/language/set_default_text` | `api.languageWrite.setDefaultText` | Convex mutation |
| `POST /editor/language/set_avatar_speaker` | `api.languageWrite.setAvatarSpeaker` | Convex mutation |
| `POST /editor/language/save_tts_replace` | `api.languageWrite.setTtsReplace` | Convex mutation |
| `POST /editor/story/set_story` | `api.storyWrite.setStory` | Convex mutation |
| `POST /editor/story/delete_story` | `api.storyWrite.deleteStory` | Convex mutation |
| `GET /editor/course/:course_id/import/send/:story_id` | `api.storyWrite.importStory` | Convex mutation |
| `GET /editor/approve/:story_id` | toggles `story_approval`; updates `story.status`, `story.public`, `course.count`, contributor lists | Convex mutation |

## Core Convex Query Modules (what many routes depend on)

- `convex/landing.ts`: course list + course page reads
- `convex/storyRead.ts`: story content/meta reads
- `convex/storyDone.ts`: story completion reads/writes
- `convex/editorRead.ts`: editor sidebar/course/story/language/localization reads
- `convex/adminData.ts`: admin users/courses/languages/story reads + user role mutations
- `convex/localization.ts`: localization + language flag reads

## Architecture Snapshot

- Public/read-heavy paths are mostly Convex reads.
- Editor/admin writes are Convex mutations.
- Current state is **Convex for canonical read + write APIs in the app layer**.
