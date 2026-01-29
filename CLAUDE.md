# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unofficial Duolingo Stories (https://duostories.org) - a community-driven platform that brings Duolingo Stories to new languages through community translation. Built with Next.js 16 (App Router) and React 19, using PostgreSQL for data storage.

## Development Commands

```bash
pnpm run dev          # Development server at http://localhost:3000
pnpm run build        # Production build
pnpm run lint         # ESLint (uses pnpm exec eslint internally)
pnpm run typecheck    # TypeScript type checking (tsc --noEmit)
pnpm run init         # Initialize test database with sample data
pnpm run init-reset   # Reset test database
pnpm run storybook    # Component development at http://localhost:6006
pnpm run new-component # Generate new component from template
```

Note: TypeScript build errors are ignored in `next.config.js` (`ignoreBuildErrors: true`), so `npm run build` will succeed even with type errors. Use `npm run typecheck` to check types separately.

## Database Setup

Requires PostgreSQL. The app uses two database connections:
- `POSTGRES_URL2` - used by `src/lib/db.ts` (via `postgres` library) for all application SQL queries
- `DATABASE_URL` - used by `src/auth.ts` (via `@neondatabase/serverless` Pool) for Better Auth

For local development, set both in `.env.local`:
```
POSTGRES_URL2=postgresql://postgres:postgres@localhost:5432/duostories_test_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/duostories_test_db
```

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
- `src/lib/authClient.ts` - Client-side auth client (`signIn`, `signOut`, `useSession` exports)
- `src/lib/db.ts` - PostgreSQL connection (`sql` export) and `cache()` wrapper for Next.js caching

### Authentication
Uses Better Auth with JWT sessions (5-minute cookie cache). Supports email/password and OAuth (GitHub, Google, Facebook, Discord). Custom table names map to legacy schema (e.g., `user_better_auth`, `session_better_auth`). User model has custom `role` and `admin` fields.

### Database Access
Direct SQL queries via `postgres` library using tagged template literals (`sql`). Use `cache()` wrapper from db.ts for Next.js request deduplication/caching. Set `NO_CACHE=true` to disable caching.

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
`@/` maps to `src/` (tsconfig baseUrl is `src`, paths `@/*` → `./*`). Example: `import { sql } from "@/lib/db"` resolves to `src/lib/db`.

## Story Workflow

Stories have a status workflow: draft → feedback → finished. Stories belong to courses, which link a learning language to a base language.

## Audio/TTS

Multiple TTS providers in `src/app/audio/_lib/audio/`: Azure, Google Cloud, AWS Polly, ElevenLabs.
