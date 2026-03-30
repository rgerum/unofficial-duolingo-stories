# Agent Notes

## Formatting
- Run `pnpm run format` after code edits in this repository.
- Use `pnpm run format:check` for CI/local validation.
- Formatting scope is intentionally limited to `src/` and `convex/`.
- Biome is the default formatter/linter for this repo.

## Type Checking
- Run `pnpm typecheck` after code edits and before finishing.

## Convex
- Follow `./convex/convex_rules.md` when making changes in `convex/`.
- Always deploy Convex after changing files in `convex/` to the dev deployment (for example with `pnpm convex dev --once`), not prod.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
