# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Unofficial Duolingo Stories. The integration includes both client-side and server-side tracking, user identification on login/registration, exception capture, and a reverse proxy configuration for improved reliability. Events are tracked across authentication flows, story engagement, and editor workflows.

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_in` | User successfully logged in with credentials or OAuth | `src/app/auth/signin/page.tsx`, `src/app/auth/signin/login_options.tsx` |
| `user_registered` | User successfully submitted registration form | `src/app/auth/register/register.tsx` |
| `user_account_activated` | User activated their account via email link | `src/app/auth/activate/[name]/[hash]/activate.ts` |
| `password_reset_requested` | User requested a password reset link | `src/app/auth/reset_pw/reset_pw.tsx` |
| `story_started` | User started reading a story (clicked story button) | `src/app/(stories)/(main)/[course_id]/story_button.tsx` |
| `story_completed` | User finished a story | `src/app/(stories)/story/[story_id]/page.tsx` |
| `story_saved` | Editor saved changes to a story | `src/app/editor/story/set_story/route.ts` |
| `story_approved` | Editor approved a story | `src/app/editor/(course)/approve/[story_id]/route.ts` |
| `story_deleted` | Editor deleted a story | `src/app/editor/story/delete_story/route.ts` |
| `story_imported` | Editor imported a story from another course | `src/app/editor/(course)/course/[course_id]/import/send/[story_id]/route.ts` |
| `audio_created` | TTS audio file was generated for a story | `src/app/audio/create/route.ts` |
| `course_selected` | User selected a course to browse stories | `src/app/(stories)/(main)/course-dropdown.tsx` |

## Files Created/Modified

### New Files
- `instrumentation-client.ts` - Client-side PostHog initialization using Next.js 15.3+ pattern
- `src/lib/posthog-server.ts` - Server-side PostHog client for API routes and server actions

### Modified Files
- `next.config.js` - Added reverse proxy rewrites for `/ingest` to PostHog servers
- `.env.local` - PostHog environment variables already present

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/304490/dashboard/1202339) - Core analytics dashboard for Duostories

### Insights
- [User Sign-ins & Registrations](https://us.posthog.com/project/304490/insights/gzSC9NwW) - Track daily authentication activity
- [Story Completion Funnel](https://us.posthog.com/project/304490/insights/Tbpqjgif) - Conversion from starting to completing stories
- [User Activation Funnel](https://us.posthog.com/project/304490/insights/jUmbE0kP) - Journey from registration to first sign-in
- [Editor Activity](https://us.posthog.com/project/304490/insights/BxBTcWVp) - Track contributor engagement
- [Daily Active Learners](https://us.posthog.com/project/304490/insights/nJ2g5tKu) - Unique daily users engaged with stories

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Configuration

PostHog is configured via environment variables:
```
NEXT_PUBLIC_POSTHOG_KEY=phc_RIEV4nFI5GUUe7AVH00PcRABQjd5HzhAYKTr3rCD3IH
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

The reverse proxy routes requests through `/ingest` to avoid ad blockers and improve data collection reliability.
