# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unofficial Duolingo Stories (https://duostories.org) - a community-driven platform that brings Duolingo Stories to new languages through community translation. Built with Next.js 16 (App Router) and React 19, with Convex as the canonical app data layer.

## Development Commands

```bash
pnpm run dev          # Development server at http://localhost:3000
pnpm run build        # Production build
pnpm run lint         # ESLint (uses pnpm exec eslint internally)
pnpm run typecheck    # TypeScript type checking (tsc --noEmit)
pnpm exec convex codegen # Regenerate Convex bindings after adding/changing Convex functions
pnpm run init         # Initialize test database with sample data
pnpm run init-reset   # Reset test database
pnpm run storybook    # Component development at http://localhost:6006
pnpm run new-component # Generate new component from template
```

Note: TypeScript build errors are ignored in `next.config.js` (`ignoreBuildErrors: true`), so `npm run build` will succeed even with type errors. Use `npm run typecheck` to check types separately.

## Environment Setup

Requires PostgreSQL and Convex.

Next.js `.env.local` typically includes:
- `DATABASE_URL` - Better Auth DB connection
- `POSTGRES_URL2` - mirrors local Postgres for Convex mirror actions
- `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_URL`
- `BETTER_AUTH_SECRET`
- `SITE_URL`

Convex env (`pnpm exec convex env set ...`) typically includes:
- `POSTGRES_URL2` - used by `convex/postgresMirror.ts`
- `GITHUB_REPO_TOKEN` - used by `convex/editorSideEffects.ts`
- `POSTHOG_KEY` and `POSTHOG_HOST` - used by `convex/editorSideEffects.ts`
- `RESEND_API_KEY`, `SITE_URL`, `BETTER_AUTH_SECRET`

Test credentials: user/test (normal), editor/test (editor access), admin/test (admin access)

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages
  - `(stories)/` - Main story browsing (route group, includes story reader, course listing, profile, FAQ)
  - `admin/` - Admin dashboard
  - `editor/` - Story editor interface
  - `auth/` - Authentication (signin, register, password reset)
  - `api/` - API routes (auth handler, OG image generation)
  - `audio/` - Audio processing endpoints
- `src/components/` - Reusable React components
- `src/lib/` - Server utilities, database helpers, auth
- `database/` - SQL schema (`schema.sql`), test data, story JSON files

### Key Files
- `src/auth.ts` - Better Auth server configuration (JWT sessions, OAuth providers, email verification)
- `src/lib/auth-client.ts` - Client-side Better Auth client
- `convex/postgresMirror.ts` - Postgres mirror writes from Convex internal actions
- `convex/editorSideEffects.ts` - GitHub/PostHog side effects scheduled by write mutations
- `convex/lib/authorization.ts` - shared auth guard helpers for Convex functions

### Authentication
Uses Better Auth with JWT sessions (5-minute cookie cache). Supports email/password and OAuth (GitHub, Google, Facebook, Discord). Custom table names map to legacy schema (e.g., `user_better_auth`, `session_better_auth`). User model has custom `role` and `admin` fields.

### Database Access
Application reads/writes should go through Convex queries/mutations. Postgres writes are mirrored via Convex internal actions in `convex/postgresMirror.ts`.

### Write-path Rules

- Prefer direct client/server-action calls to Convex mutations for app writes.
- Do not add pass-through Next route handlers for simple reads/writes.
- Use Next route handlers only for server-only concerns (auth entrypoint, file upload, external secrets/integration boundaries).
- Schedule side effects from Convex mutations using `ctx.scheduler.runAfter(..., internal...)`.
- Include `operationKey` for retriable writes.
- Keep side effects non-blocking: DB mutation success should not depend on GitHub/PostHog success.

### Component Pattern
```
/ComponentName
  ├── ComponentName.tsx        # Implementation
  ├── ComponentName.module.css # CSS Module styles
  └── index.ts                 # Export
```

### Styling
- CSS Modules for scoped styles (primary)
- Styled Components for dynamic styles (compiler enabled in `next.config.js`)
- Global styles in `src/styles/global.css`

### Path Alias
`@/` maps to `src/` (tsconfig baseUrl is `src`, paths `@/*` → `./*`).

## Story Workflow

Stories have a status workflow: draft → feedback → finished. Stories belong to courses, which link a learning language to a base language.

## Migration Notes

Recent migration and restructuring recap is documented at:
- `docs/architecture/migration-recap.md`

## Audio/TTS

Multiple TTS providers in `src/app/audio/_lib/audio/`: Azure, Google Cloud, AWS Polly, ElevenLabs.
