# Duostories Mobile App — Design Document

> **Implementation status:** M1 + M2 are implemented in [`app-mobile/`](../app-mobile/)
> (Expo). Accounts (M3) and polish (M4) are still open — the Welcome screen's
> Sign in / Register buttons lead to a placeholder until then. See
> `app-mobile/README.md` for how to run it.

A native iOS/Android app for the public-facing part of duostories.org: course selection,
story reading, and profile settings. No editor, no admin.

The guiding principle: **the mobile app is a new client for the existing Convex backend,
not a new backend.** Every screen below maps to Convex queries/mutations that already
exist and are already public.

---

## 1. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo (React Native) + TypeScript** | One codebase for iOS + Android; same language/ecosystem as the web app, so story-rendering logic and types can be shared |
| Navigation | Expo Router | File-based routes mirroring the web app's structure |
| Backend client | `convex/react` (works in React Native) | The exact same generated `api` object as the web app — full type safety, live queries for free |
| Auth | Better Auth with `@better-auth/expo` client plugin | The server is already Better Auth; the Expo plugin adds deep-link OAuth, SecureStore token storage, and cookie handling |
| Audio | `expo-audio` | Per-line MP3 playback with position polling for word highlighting |
| Images | `expo-image` + `react-native-svg` (`SvgUri`) | Story illustrations come from `stories-cdn.duolingo.com/image/{id}.svg` — SVG, so they need `react-native-svg`, not plain `<Image>` |
| Local storage | `expo-secure-store` (tokens), `AsyncStorage` (progress/preferences), `expo-file-system` (downloaded audio) | |
| Styling | StyleSheet + a small theme module | Port the web app's CSS-variable palette (incl. dark mode) into a theme object |

### Repo layout

Develop the app inside this repo as a workspace package so it imports the generated
Convex API directly:

```text
/app-mobile/              # Expo app (new)
  app/                    # Expo Router routes
  src/
    components/
    story/                # challenge renderers (see §4)
    audio/
    theme/
/convex/                  # existing — shared via workspace import
/packages/story-shared/   # (optional, phase 2) extract pure logic shared with web:
                          # element types, hint-map parsing, answer checking
```

Sharing `convex/_generated/api` gives the mobile app compile-time checking against
backend changes — the single biggest payoff of staying in this repo.

---

## 2. Information Architecture & Navigation

```text
Root (tab-less stack)
├── Welcome               # app start, signed-out only: Sign in / Register / Continue anonymously
├── Onboarding            # after Welcome on first launch: pick base language → course
├── Tabs
│   ├── Learn (home)      # current course: story list grouped by sets
│   ├── Courses           # switch/browse courses (the "language selection")
│   └── Profile           # settings, auth, stats
├── /story/[id]           # full-screen modal: the reader
└── /story/[id]/done      # completion screen → next story
```

- **Welcome** mirrors the PWA's start screen (`src/app/(stories)/learn/welcome.tsx`,
  the PWA `start_url`): see §3.0.
- **Learn** is the default tab and opens the *last used course* (stored locally;
  for logged-in users seeded from `storyDone.getLastDoneCourseShortForLegacyUser`).
- The reader is a full-screen modal with no tab bar — a story is an immersive,
  do-not-interrupt flow, same as Duolingo's apps.

---

## 3. Screens

### 3.0 Welcome screen (app entry)

The first screen on launch when no session exists — the mobile equivalent of the
PWA welcome page at `/learn` (`welcome.tsx`), with the same three options and
copy ("Sign in to keep your reading progress, or continue anonymously and start
learning right away."):

| Option | Action |
|---|---|
| **Sign in** | → auth screens (§3.5), then to Learn/Onboarding |
| **Register** | → registration (§3.5), then to Learn/Onboarding |
| **Continue anonymously** | → Onboarding (no course chosen yet) or Learn |

Differences from the web, because this is an installed app rather than a URL hit:

- The choice is **remembered**: once the user continues anonymously (or signs in),
  subsequent launches go straight to the tabs (`hasSeenWelcome` flag in
  AsyncStorage; web shows the page on every unauthenticated visit to `/learn`).
- Signing out, or tapping the "create an account to sync your progress" banner in
  the Profile tab, returns to this screen — so anonymous users always have a path
  back to sign-in/register.
- Branding: logo + a one-line value proposition above the buttons; keep it to a
  single screen with no carousel.

### 3.1 Onboarding / Course Selection ("Courses" tab)

**Data:** `api.landing.getPublicLandingPageData` → `{ stats, groups: [{ fromLanguageName, courses: [{ short, name, count, learningLanguage }] }] }`

- Step 1: "I speak …" — list of base languages (the `groups`), English pinned first,
  with flags from the `languages` table (`flag` / `flag_file` sprite data).
- Step 2: "I'm learning …" — courses in that group, each row showing flag, course
  name, and "N stories" (use the course `localization` strings, as the web does).
- Selecting a course stores `courseShort` in AsyncStorage and lands on **Learn**.
- For returning users this same screen is the "Courses" tab, with the active course
  highlighted and per-course progress (`storyDone.getDoneCourseIdsForUser`) when
  logged in.

No account required — mirror the web app, which is fully anonymous-readable.

### 3.2 Story List ("Learn" tab)

**Data:**
- `api.landing.getPublicCoursePageData({ short })` → course + `stories[]`
- `api.storyDone.getDoneStoryIdsForCurrentUserInCourse({ courseShort })` (empty when logged out → merge with local progress, see §6)

**Layout:** vertical scroll of **sets** (`set_id`), each set a horizontal row or
2-column grid of story buttons:

- Not done → `active` illustration on the `active_lip` accent color
- Done → `gilded` illustration on gold
- Tapping opens the reader modal.

**Header:** course name, progress bar (`completedCount/totalCount` from
`getNextStoryForCurrentUserInCourse`), and a **listening-mode toggle** (per-course,
local — same semantics as the web's localStorage toggle: stories open in auto-play
mode with questions hidden).

Convex queries are live subscriptions, so completing a story updates the gilding
on this screen with no manual refetch.

### 3.3 Story Reader (the core screen)

**Data:** `api.storyRead.getStoryByLegacyId({ storyId })` → `{ elements[], illustrations, from/learning language metadata, rtl flags }`

This is a vertical, progressively-revealed feed — identical interaction model to the
web reader and to Duolingo's own app:

1. Elements render one group at a time; a **Continue** button (or answering the
   current challenge) reveals the next.
2. Audio for the newly revealed LINE auto-plays; a per-line replay button (turtle
   speed not available — only one audio per line exists in the data).
3. **Word highlighting:** `audio.keypoints` is `[{ rangeEnd, audioStart }]`.
   Poll `expo-audio` playback position (~60 ms) and highlight the text range whose
   `audioStart` has passed — same algorithm as the web component.
4. **Hints:** any word covered by a `hintMap` range is dotted-underlined; tapping
   shows a translation bubble (popover). Include `hints_pronunciation` when present.
5. **RTL:** respect `learning_language_rtl` / `from_language_rtl` per text block
   (`writingDirection` style), not per screen.

**Challenge renderers** — one component per element type, ported from the web
components (the parsing/answer logic is plain TS and can be shared via
`packages/story-shared`):

| Element type | Mobile interaction |
|---|---|
| `HEADER` | Illustration (`SvgUri`), title in both languages, play button |
| `LINE` | Avatar + speech bubble (CHARACTER) or prose paragraph; `hideRangesForChallenge` masks text while its challenge is active |
| `MULTIPLE_CHOICE` | Tap one of N cards; wrong shakes red, right turns green and reveals next |
| `SELECT_PHRASE` | Same as multiple choice but inline phrase options |
| `CHALLENGE_PROMPT` | Instruction banner above its paired challenge |
| `ARRANGE` | Word-bank chips that fly into an answer row (the canonical Duolingo interaction; reorder by tapping, not dragging, for simplicity) |
| `POINT_TO_PHRASE` | The transcript renders with `selectable: true` parts as tappable tokens |
| `MATCH` | Two shuffled columns of pairs; tap one from each side, matched pairs lock green |

**Top bar:** progress bar (revealed / total elements), close (X) with a
"quit story?" confirm. **Listening mode** (auto-play): no challenges, lines reveal
automatically as each line's audio ends; honor the account-level
`hideStoryQuestions` preference as the default.

**Completion:** when the last element is revealed:
- Logged in → `api.storyDone.recordStoryDone({ legacyStoryId, time })`
- Logged out → append to local progress (§6)
- Navigate to the **Done screen**: celebration, story time, course progress, and
  "Next story" via `api.storyDone.getNextStoryForCurrentUserInCourse` (which also
  supplies `reviewStoryId` for a "review an old story" secondary action).

### 3.4 Profile tab

**Logged out:** sign-in / register entry points + app-local settings (theme,
listening mode default) + a "your progress is saved on this device — create an
account to sync" banner.

**Logged in** — data: Better Auth session, `api.auth.getLinkedProvidersForCurrentUser`,
`api.userPreferences.getCurrentStoryPreferences`:

| Section | Contents | Backend |
|---|---|---|
| Account | avatar, username (3–20 chars, validated), email change (confirmation email flow), password reset (email link) | Better Auth client (`authClient.changeEmail`, `requestPasswordReset`) |
| Linked accounts | GitHub / Google / Discord / Facebook link & unlink | `authClient.linkSocial` / `listAccounts` + unlink, via in-app browser |
| Story settings | "Hide story questions" toggle | `api.userPreferences.setCurrentStoryPreferences` |
| App settings | theme (system/light/dark), sounds | local only |
| Stats | stories completed per course | `getDoneCourseIdsForUser` + course data |
| Danger zone | sign out; delete account (typed confirmation) | `api.account.deleteCurrentUser` |

### 3.5 Auth screens

- Email/password sign-in and registration (email verification is already enforced
  server-side), password-reset request.
- OAuth buttons → `expo-web-browser` auth session → deep link back
  (`duostories://auth-callback`).

---

## 4. Auth integration details

The server side already exists (Better Auth on Convex). Mobile work needed:

1. Add the Expo plugin to the Better Auth server config (`expo()` from
   `@better-auth/expo`) and add the app scheme `duostories://` to
   `trustedOrigins`. This is the **only backend change auth requires**.
2. Mobile client: `createAuthClient` with `expoClient({ scheme: "duostories", storage: SecureStore })`
   plus the same `convexClient()` and `usernameClient()` plugins the web uses.
3. Convex connection: `ConvexProviderWithAuth` wired to the Better Auth JWT —
   identical identity (`RoleIdentity` with legacy `userId`) reaches the existing
   `convex/lib/authorization.ts` guards, so **no Convex function changes**.
4. OAuth redirect URIs for the four providers need the app scheme added in each
   provider's console.

---

## 5. Audio design

- Story audio is plain MP3s on Vercel Blob (`audio.url` per element) — stream with
  `expo-audio`, one player instance, "stop previous before play" (the web's
  `window.playing_audio` stack becomes a tiny AudioController singleton).
- Configure iOS audio session for playback-while-silent-switch (`playsInSilentMode`),
  and pause on interruption (calls).
- **Prefetch:** when the reader opens, queue downloads of all element audio into
  `expo-file-system` cache; play from cache when present. A story is ~10–40 small
  files; this makes mid-story playback instant and flaky-network-proof.

---

## 6. Anonymous-first progress (the one real product decision)

The backend stores progress only for logged-in users; everything else is public.
The app should be usable forever without an account:

- Local progress: `AsyncStorage` map `{ [courseShort]: { doneStoryIds: number[], times } }`.
- Story list "done" state = server set ∪ local set.
- **On first login, sync up:** replay local entries through
  `recordStoryDone(legacyStoryId, time)` one by one (it's idempotent —
  returns `{ inserted: false }` on duplicates). No new backend endpoint required;
  an optional `recordStoriesDoneBatch` mutation is a nice-to-have if the per-call
  round trips ever matter.

---

## 7. Backend changes summary

Deliberately minimal:

| Change | Required? |
|---|---|
| `expo()` plugin + `duostories://` in Better Auth `trustedOrigins` | **Yes** |
| OAuth provider consoles: add mobile redirect URIs | **Yes** |
| Batch progress-sync mutation | Optional |
| Everything else (courses, stories, progress, preferences, account deletion) | Already exists |

---

## 8. Platform & quality notes

- **Offline reading (phase 2):** "download story/course" = persist the
  `getStoryByLegacyId` payload + its audio files + illustrations. The story JSON is
  self-contained, so this is straightforward.
- **SVG caveat:** verify `SvgUri` renders the Duolingo CDN illustrations correctly
  early (spike task) — if some SVGs use unsupported features, fall back to a
  server-side raster proxy.
- **Accessibility:** dynamic type for story text, VoiceOver/TalkBack labels on
  challenge options, reduced-motion variant for the arrange/match animations.
- **Deep links / universal links:** `https://duostories.org/story/{id}` and
  `/{course_short}` open the corresponding app screen.
- **Analytics:** the story elements carry `trackingProperties` — forward them to
  PostHog (already in the stack) on challenge answers and completion.

---

## 9. Milestones

1. **M1 — Read-only walking skeleton:** Expo app, Convex connection, Welcome
   screen ("Continue anonymously" path only; sign-in/register buttons stubbed
   until M3) → course list → story list → reader with LINE + audio +
   highlighting only. Anonymous.
2. **M2 — Full reader:** all 8 element types, listening mode, completion screen,
   local progress.
3. **M3 — Accounts:** Better Auth (email + OAuth), progress sync, profile/settings.
4. **M4 — Polish:** audio prefetch, dark mode, RTL QA, deep links, accessibility,
   store assets, beta via TestFlight / Play internal track.
