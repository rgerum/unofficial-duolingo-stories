# Duostories Mobile (iOS / Android)

Expo (React Native) app for the public-facing part of duostories.org:
course selection, story reading, and profile settings. It is a thin client
over the existing Convex backend — no editor, no admin. Design rationale:
[`docs/mobile-app-design.md`](../docs/mobile-app-design.md).

## Run it

```bash
cd app-mobile
pnpm install
pnpm start          # Expo dev server → press i (iOS simulator) / a (Android)
```

Works in Expo Go. `EXPO_PUBLIC_CONVEX_URL` and
`EXPO_PUBLIC_CONVEX_SITE_URL` (in `.env`) point at the same Convex deployment
as the web app.

```bash
pnpm run typecheck  # tsc --noEmit
```

## What's implemented (milestones M1 + M2, plus account entry)

- **Welcome screen** mirroring the PWA's `/learn` page: Sign in / Register /
  Continue anonymously. Anonymous choice is remembered (`hasSeenWelcome`).
- **Account entry**: Better Auth username/password sign-in and registration
  backed by the existing Convex auth server, with the mobile session stored in
  SecureStore.
- **Course picker** (onboarding + Courses tab) from
  `api.landing.getPublicLandingPageData`, grouped by base language.
- **Story list** (Learn tab) from `api.landing.getPublicCoursePageData`:
  sets, active/gilded illustrations on the `active_lip` color, progress bar,
  per-course listening-mode toggle.
- **Story reader** — full port of the web's progressive-reveal engine
  (`StoryProgress`) with all challenge types: multiple choice, continuation,
  select-phrase, arrange, point-to-phrase, match. Per-line audio with
  keypoint-driven word highlighting (expo-audio), tap-a-word hint bubbles,
  hidden/revealed challenge ranges, RTL text support, listening mode with
  auto-advance.
- **Local progress** (anonymous-first): completions stored in AsyncStorage as
  `{storyId: timestamp}` per course — the same shape `recordStoryDone`
  expects, so first-login sync can replay it. "Next story" after completion
  is computed locally from the course list.
- **Profile tab**: account card with sign-in/register/sign-out actions,
  "hide story questions" preference, per-course progress stats, reset.

## Not yet implemented

- **Accounts (M3)**: cloud progress sync after sign-in, password reset, and
  social login/Sign in with Apple.
- **M4 polish**: audio prefetch to disk, dark mode, deep links, offline
  story downloads.

## Architecture notes

- `src/api.ts` binds Convex's `anyApi` to the **types** of the repo's
  generated `convex/_generated/api.d.ts` via a type-only import. Runtime
  stays inside this package (Metro never crosses the repo root), but every
  `useQuery(api...)` is still type-checked against the real backend. After
  changing Convex functions, `pnpm exec convex codegen` at the repo root
  updates the types seen here too.
- `src/story/` is the reader: `parts.ts` (reveal grouping — a direct port of
  the web's `GetParts`), `Reader.tsx` (engine), `Part.tsx` (one component per
  challenge type, mirroring the web's `StoryChallenge*` wrappers),
  `HintText.tsx` (hint/hide-range/highlight text renderer), `audio.ts`
  (single-player audio controller with keypoint timeouts).
- Story illustrations are SVGs from stories-cdn.duolingo.com, rendered with
  `react-native-svg`'s `SvgUri` (`SmartImage` picks SVG vs raster by URL).
- `.npmrc` sets `node-linker=hoisted` — React Native tooling expects a flat
  `node_modules`; keep it when reinstalling.
- The root web app excludes this folder in its `tsconfig.json` (react-native
  globals conflict with DOM types).
