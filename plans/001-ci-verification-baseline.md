# Plan 001: Make CI run the test suite and remove dead deployment workflows

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- .github/workflows/ README.md .env.example`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

The repo has a working test suite (`pnpm test`, currently 3 test files, all passing locally) but CI never runs it — `.github/workflows/ci.yaml` only runs typecheck and lint, so test regressions can land on `main` unnoticed. Two additional workflows (`build.yml`, `build_pr.yml`) are dead: they target the `master` branch (the repo uses `main`), use npm (the repo uses pnpm), and SSH-tunnel to a MySQL database on `ara.uberspace.de` that was retired when the app migrated to Convex. They confuse contributors and would fail silently if ever triggered. Finally, CI contains a step that copies `.env.example` files, but no `.env.example` exists anywhere in the repo — the step is a no-op and onboarding has no env-var template.

## Current state

- `.github/workflows/ci.yaml` — the live CI workflow. Runs on `push`. Steps: checkout, pnpm setup, node 24 setup, `pnpm install --frozen-lockfile`, a "Copy .env.example files" step (`find . -type f -name ".env.example" -exec sh -c 'cp "$1" "${1%.*}"' _ {} \;` — currently a no-op), `pnpm typecheck`, `pnpm lint`. There is **no test step**.
- `.github/workflows/build.yml` — dead. Header comment dated workflow; `on: push: branches: ["master"]`; uses `actions/setup-node@v4` with `cache: 'npm'`; contains a step "ssh tunnel to mysql database" connecting to `duostori@ara.uberspace.de`.
- `.github/workflows/build_pr.yml` — dead. `on: pull_request: branches: ["master"]`; npm install; writes a secret to `.env.local` via `printf "${{ secrets.ENV_LOCAL }}"`; deploys over SSH to `ara.uberspace.de` with `supervisorctl`.
- `package.json` scripts (relevant): `"test": "pnpm exec tsx --test src/**/*.test.ts"`.
- `README.md` "How to run locally" section documents the required `.env.local` values:
  `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_URL`, `BETTER_AUTH_SECRET`, `SITE_URL`, and Convex-side env vars (`GITHUB_REPO_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `RESEND_API_KEY`, `SITE_URL`, `BETTER_AUTH_SECRET`).
- No `.env.example` file exists (`find . -name ".env.example" -not -path "./node_modules/*"` returns nothing).

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `pnpm install`                   | exit 0              |
| Typecheck | `pnpm typecheck`                 | exit 0, no errors   |
| Tests     | `pnpm test`                      | all tests pass, exit 0 |
| Lint      | `pnpm lint`                      | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/ci.yaml` (edit)
- `.github/workflows/build.yml` (delete)
- `.github/workflows/build_pr.yml` (delete)
- `.env.example` (create)

**Out of scope** (do NOT touch, even though they look related):
- `package.json` — the test script already works; do not change it.
- `.env.local` — never read its contents into any committed file. It contains real secrets.
- Any test file — this plan only wires CI, it does not add tests.

## Git workflow

- Branch: `advisor/001-ci-verification-baseline`
- Commit style: short imperative subject, e.g. `Run tests in CI and drop legacy build workflows` (match recent history like "Show current user's approval state in story list").
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the test suite passes locally

Run `pnpm test`.

**Verify**: exit code 0, output lists passing tests from the 3 test files (`parser.test.ts`, `audio_edit_tools.test.ts`, `audio-cutter-text.test.ts`). If any test fails on a clean checkout, STOP — CI must not be wired to a red suite; report which test fails.

### Step 2: Add a test step to ci.yaml

In `.github/workflows/ci.yaml`, after the `Lint` step, add:

```yaml
      - name: Test
        run: pnpm test
```

Match the existing indentation (6 spaces for `- name:`).

**Verify**: `pnpm exec tsx -e "const yaml=require('yaml');const fs=require('fs');const d=yaml.parse(fs.readFileSync('.github/workflows/ci.yaml','utf8'));console.log(d.jobs.build.steps.map(s=>s.name).join(','))"` → output includes `Test`.

### Step 3: Delete the dead workflows

Status: **done 2026-06-30**. Deleted `.github/workflows/build.yml` and `.github/workflows/build_pr.yml` because both referenced retired `ara.uberspace.de` infrastructure and targeted `master`.

Delete `.github/workflows/build.yml` and `.github/workflows/build_pr.yml`.

Before deleting, confirm they are the dead ones: both must contain the string `ara.uberspace.de` and target `master`. If either file does not match that description, STOP.

**Verify**: `ls .github/workflows/` → only `ci.yaml` remains. `pnpm typecheck` also passed after deletion.

### Step 4: Create .env.example

Create `.env.example` at the repo root with placeholder values only (NEVER copy values from `.env.local`):

```bash
# Next.js app (.env.local) — required
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
CONVEX_URL=https://<your-deployment>.convex.cloud
BETTER_AUTH_SECRET=<generate-a-random-secret>
SITE_URL=http://localhost:3000

# Convex runtime env — set via `pnpm exec convex env set NAME value`, not in this file.
# GITHUB_REPO_TOKEN   (optional: GitHub side-effect sync, convex/editorSideEffects.ts)
# POSTHOG_KEY         (optional: server tracking)
# POSTHOG_HOST        (optional: server tracking)
# RESEND_API_KEY      (optional: email flows)
# SITE_URL            (must match auth setup)
# BETTER_AUTH_SECRET  (must match auth setup)
```

**Verify**: `grep -c "=" .env.example` → a small number (4 real assignments); `grep -iE "(sk_|ghp_|AKIA|secret=[A-Za-z0-9]{16})" .env.example` → no matches (no real-looking secrets).

### Step 5: Full local verification

Run `pnpm typecheck && pnpm lint && pnpm test`.

**Verify**: all three exit 0.

## Test plan

No new tests — this plan adds the CI gate for the existing suite. The verification gates above are the test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm test` exits 0
- [ ] `grep -n "pnpm test" .github/workflows/ci.yaml` returns a match
- [ ] `ls .github/workflows/` shows only `ci.yaml`
- [ ] `.env.example` exists and contains no real secret values
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The test suite fails on a clean checkout (Step 1).
- `build.yml` / `build_pr.yml` do not match the "dead workflow" description (they may have been revived).
- You find yourself about to copy any value out of `.env.local`.

## Maintenance notes

- Plan 006 (Convex test harness) adds a second test command; when it lands, CI needs a step for it too.
- Reviewer should confirm the deleted workflows had no remaining consumers (no branch protection rules reference them).
- Deferred: adding `pnpm knip` (dead-code check) to CI — knip is configured (`knip.json`) but `pnpm dlx` in CI adds install cost; decide separately.
