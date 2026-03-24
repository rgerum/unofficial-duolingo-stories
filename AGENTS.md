# Agent Notes

## Formatting
- Run `pnpm run format` after code edits in this repository.
- Use `pnpm run format:check` for CI/local validation.
- Formatting scope is intentionally limited to `src/` and `convex/`.
- Prettier excludes lockfiles and Convex generated files via `.prettierignore`.

## Type Checking
- Run `pnpm typecheck` after code edits and before finishing.

## Convex
- Follow `./convex/convex_rules.md` when making changes in `convex/`.
- Always deploy Convex after changing files in `convex/` to the dev deployment (for example with `pnpm convex dev --once`), not prod.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->