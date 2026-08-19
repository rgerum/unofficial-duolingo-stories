# Agent Notes

## Formatting
- Run `pnpm run format` after code edits in this repository.
- Use `pnpm run format:check` for CI/local validation.
- Biome is the default formatter/linter for this repo.
- Biome checks are intentionally scoped to `src/` and `convex/`.
- Run `pnpm run lint` before finishing when lint-sensitive files changed.

## Type Checking
- Run `pnpm typecheck` after code edits and before finishing.
- Note: root `pnpm typecheck` / `pnpm lint` do NOT cover `app-mobile/` — it is
  a separate pnpm root. For mobile changes run `pnpm --dir app-mobile format`,
  `pnpm --dir app-mobile lint`, and `pnpm --dir app-mobile typecheck`.

## Convex
- Follow `./convex/convex_rules.md` when making changes in `convex/`.
- Always deploy Convex after changing files in `convex/` to the dev deployment (for example with `pnpm convex dev --once`), not prod.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
