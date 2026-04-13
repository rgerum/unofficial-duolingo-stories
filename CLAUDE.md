# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unofficial Duolingo Stories (https://duostories.org) - a community-driven platform that brings Duolingo Stories to new languages through community translation. Built with TanStack Start and React 19, with Convex as the canonical app data layer.

## Development Commands

```bash
pnpm run dev          # Development server at http://localhost:3000
pnpm run build        # Production build
pnpm run format       # Biome formatter on src/ and convex/
pnpm run lint         # Biome linter (with format check first)
pnpm run typecheck    # TypeScript type checking (tsc --noEmit)
pnpm exec convex codegen # Regenerate Convex bindings after adding/changing Convex functions
```

Use `pnpm run typecheck` to validate types separately from the production build.

## Environment Setup

Requires Convex.

`.env.local` typically includes:
- `VITE_CONVEX_URL` and `CONVEX_URL`
- `BETTER_AUTH_SECRET`
- `SITE_URL`

Convex env (`pnpm exec convex env set ...`) typically includes:
- `GITHUB_REPO_TOKEN` - used by `convex/editorSideEffects.ts`
- `POSTHOG_KEY` and `POSTHOG_HOST` - used by `convex/editorSideEffects.ts`
- `RESEND_API_KEY`, `SITE_URL`, `BETTER_AUTH_SECRET`

Test credentials: user/test (normal), editor/test (editor access), admin/test (admin access)

## Architecture

### Directory Structure
- `src/routes/` - TanStack Start route tree and HTTP endpoints
  - story browsing, profile, FAQ, docs, auth, admin, editor, and API endpoints
- `src/app/` - feature modules reused by routes during the migration
- `audio/` - Audio processing endpoints
- `src/components/` - Reusable React components
- `src/lib/` - Server utilities, database helpers, auth

### Key Files
- `src/auth.ts` - Better Auth server configuration (JWT sessions, OAuth providers, email verification)
- `src/lib/auth-client.ts` - Client-side Better Auth client
- `convex/editorSideEffects.ts` - GitHub/PostHog side effects scheduled by write mutations
- `convex/lib/authorization.ts` - shared auth guard helpers for Convex functions

### Authentication
Uses Better Auth with JWT sessions (5-minute cookie cache). Supports email/password and OAuth (GitHub, Google, Facebook, Discord). Custom table names map to legacy schema (e.g., `user_better_auth`, `session_better_auth`). User model has custom `role` and `admin` fields.

### Database Access
Application reads/writes should go through Convex queries/mutations.

### Write-path Rules

- Prefer direct client/server-action calls to Convex mutations for app writes.
- Do not add pass-through framework route handlers for simple reads/writes.
- Use TanStack Start server routes only for server-only concerns (auth entrypoint, file upload, external secrets/integration boundaries).
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
- Styled Components for dynamic styles where already present
- Global styles in `src/styles/global.css`

### Path Alias
`@/` maps to `src/` (tsconfig baseUrl is `src`, paths `@/*` → `./*`).

## Story Workflow

Stories have a status workflow: draft → feedback → finished. Stories belong to courses, which link a learning language to a base language.

## Audio/TTS

Multiple TTS providers in `src/app/audio/_lib/audio/`: Azure, Google Cloud, AWS Polly, ElevenLabs.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
