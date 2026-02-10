# PostHog post-wizard report

The wizard has completed a deep integration of your Unofficial Duolingo Stories project with PostHog analytics. The integration includes both client-side and server-side event tracking, user identification, exception capture, and a reverse proxy setup to avoid ad blockers.

## Summary of Changes

### Core Setup Files Created
- **`instrumentation-client.ts`** - PostHog client-side initialization for Next.js 16.1.6+ using the recommended `instrumentation-client.ts` approach
- **`src/lib/posthog-server.ts`** - Server-side PostHog client for tracking events in API routes

### Configuration Updates
- **`next.config.js`** - Added reverse proxy rewrites for PostHog to avoid ad blockers (`/ingest/*` routes)
- **`.env.local`** - Environment variables already configured:
  - `NEXT_PUBLIC_POSTHOG_KEY=phc_RIEV4nFI5GUUe7AVH00PcRABQjd5HzhAYKTr3rCD3IH`
  - `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`

## Events Tracked

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_in` | User successfully signed in via credentials | `src/app/auth/signin/login_options.tsx` |
| `user_signed_up` | User submitted registration form successfully | `src/app/auth/register/register.tsx` |
| `oauth_provider_clicked` | User clicked on an OAuth provider button | `src/app/auth/signin/login_options.tsx` |
| `user_registered_server` | Server-side user registration event | `src/app/auth/register/send/route.js` |
| `story_started` | User started reading a story | `src/app/(stories)/story/[story_id]/story_wrapper.tsx` |
| `story_completed` | User finished reading a story | `src/app/(stories)/story/[story_id]/story_wrapper.tsx` |
| `story_saved` | Editor saved a story (server-side) | `src/app/editor/story/set_story/route.ts` |
| `story_approved` | Editor approved a story (server-side) | `src/app/editor/(course)/approve/[story_id]/route.ts` |
| `story_deleted` | Editor deleted a story (server-side) | `src/app/editor/story/delete_story/route.ts` |
| `audio_created` | Editor created audio for a story (server-side) | `src/app/audio/create/route.ts` |

## User Identification

User identification (`posthog.identify()`) is implemented in the following locations:
- **Client-side sign-in** - Users are identified upon successful credential login
- **Client-side sign-up** - Users are identified upon successful registration
- **Server-side registration** - Users are identified with their username and email

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics Dashboard](https://us.posthog.com/project/304490/dashboard/1202521)

### Insights
- [User Engagement Overview](https://us.posthog.com/project/304490/insights/FgjWSVE6) - Weekly trends of sign-ups, sign-ins, and story engagement
- [Story Completion Funnel](https://us.posthog.com/project/304490/insights/F91062OY) - Conversion funnel from story started to story completed
- [Editor Activity](https://us.posthog.com/project/304490/insights/XvhNgRVi) - Daily editor activity: story saves, approvals, deletions, and audio creation
- [New User Activation Funnel](https://us.posthog.com/project/304490/insights/vcXVkLBz) - Conversion funnel from sign-up to first story completion
- [Daily Active Readers](https://us.posthog.com/project/304490/insights/ZbDQQY6J) - Unique users who started reading a story each day

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Dependencies

The following packages are used:
- `posthog-js` (v1.254.0) - Client-side PostHog SDK (already installed)
- `posthog-node` - Server-side PostHog SDK (newly installed)
