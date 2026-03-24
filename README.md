# Unofficial Duolingo Stories

[![Cypress Test](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/cvszgh/master&style=flat&logo=cypress)](https://cloud.cypress.io/projects/cvszgh/runs)
[![chat](https://img.shields.io/discord/726701782075572277)](https://discord.com/invite/4NGVScARR3)

This project brings the official Duolingo Stories to new languages, translated by a community effort.

It is _not_ an official product of Duolingo, nor is there any plan to integrate it into their platform or app.

It is hosted at https://duostories.org and reproduces the story experience from the official Duolingo stories.

The app is based on Next.js with React. It is currently in `next/next-all`.

## Architecture snapshot (2026 migration baseline)

- App/UI: Next.js 16 + React 19 (`src/app`, `src/components`)
- Canonical app data access: Convex queries/mutations (`convex/*`)
- Write-side side effects (GitHub/PostHog): Convex internal actions in `convex/editorSideEffects.ts`
- Remaining Next route handlers are intentionally server-only:
  - Auth entrypoint (`src/app/api/auth/[...all]/route.ts`)
  - Audio endpoints (`src/app/audio/*/route.ts`)

### Write flow

Client component -> Convex mutation -> schedule internal actions:
- `editorSideEffects.*` for GitHub/PostHog side effects

This keeps write authorization, mutation semantics, and side effects centralized in Convex.

Legacy Postgres mirror decommission steps are documented in `docs/architecture/postgres-sunset-checklist.md`.
Post-cutover checks are in `docs/architecture/postgres-post-cutover-verification.md`.

## How to run locally

Now create `.env.local` in the project root.

Minimum local values:

```
NEXT_PUBLIC_CONVEX_URL=<your_convex_dev_url>
CONVEX_URL=<your_convex_dev_url>
BETTER_AUTH_SECRET=<your_secret>
SITE_URL=http://localhost:3000
```

Convex runtime env (set via `pnpm exec convex env set ...`) should include:

```
GITHUB_REPO_TOKEN=<optional_for_side_effect_sync>
POSTHOG_KEY=<optional_for_server_tracking>
POSTHOG_HOST=<optional_for_server_tracking>
RESEND_API_KEY=<optional_for_email_flows>
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<must_match_auth_setup>
```

Install dependencies

```
pnpm install
```

Fill the database with test data

```
pnpm run init
```

`pnpm run init` is a legacy Postgres seed path for older tooling. The main app write/read path is Convex.

To develop you can then run and visit http://localhost:3000

```
pnpm run dev
```

Recommended checks:

```
pnpm run typecheck
pnpm run lint
```

The test database contains three uses to test the login process:

| Username | Password | Usage                                |
| -------- | -------- | ------------------------------------ |
| user     | test     | To test a normal user login          |
| editor   | test     | To test login to the editor          |
| admin    | test     | To test login to the admin interface |

## How to contribute

To contribute to the project you should open an issue to discuss your proposed change.
You can assign the issue to yourself to show that you want to work on that.
If there is a consensus that this bug should be fixed or this feature should be implemented,
then follow the following steps:

- create a fork of the repository
- clone it to your computer
- create a branch for your feature
- make the changes to the code
- commit and push the changes to GitHub
- create a pull request

Please make sure to only commit changes to files that are necessary to the issue.
Try to not commit accidentally other changes, e.g. package-lock.json files.
This makes it harder to review and merge the pull request.

### Contribution rules for new backend work

- New app writes should be direct Convex mutations from the client or server action.
- Avoid adding pass-through Next route handlers for simple reads/writes.
- Server side effects should be scheduled from Convex mutations via internal actions.
- Include an `operationKey` for mutation calls that can be retried.

If everything is fine, I will accept the pull request and I will soon upload it to the website.
