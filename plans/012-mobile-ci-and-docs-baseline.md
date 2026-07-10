# Plan 012: Make app-mobile visible to CI and make its docs tell the truth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 54df8979..HEAD -- .github/workflows/ci.yaml app-mobile/package.json app-mobile/README.md docs/mobile-app-design.md AGENTS.md CLAUDE.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `54df8979`, 2026-07-09

## Why this matters

`app-mobile/` is currently the most actively developed part of the repo (52 commits in the last month — more than `src/` and `convex/` combined) and has **zero verification coverage**: root `tsconfig.json` explicitly excludes it, root `biome.json` covers only `src/**` and `convex/**`, and CI never enters the directory. A contributor or agent who follows the repo's own instructions ("run `pnpm typecheck`, `pnpm lint`") gets a false green after editing mobile code. Additionally, `app-mobile/README.md` and `docs/mobile-app-design.md` still describe shipped features (social login, Sign in with Apple, dark mode, cloud progress sync) as "not yet implemented", which misdirects anyone deciding what to build next.

## Current state

- `.github/workflows/ci.yaml` — single `build` job: checkout, pnpm setup (`pnpm/action-setup@v5`), node 24 setup with `cache: pnpm`, `pnpm install --frozen-lockfile`, a copy-`.env.example` step, `pnpm typecheck`, `pnpm lint`. No reference to `app-mobile` anywhere.
- Root `tsconfig.json:46` — `"app-mobile"` is in the `exclude` array (correct — the mobile app has its own TS config; don't change this).
- `app-mobile/` is its **own pnpm root** (own `pnpm-workspace.yaml`, own `pnpm-lock.yaml`); it is NOT a member of the root workspace (`pnpm-workspace.yaml` lists only `"."`).
- `app-mobile/package.json` scripts:
  ```json
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit"
  }
  ```
  There is no `lint` or `test` script (adding a linter/test runner for mobile is deliberately out of scope — see Maintenance notes).
- `pnpm --dir app-mobile typecheck` works locally today (node_modules present). In CI it needs its own install step first because it has a separate lockfile.
- `app-mobile/README.md:52-57`:
  ```markdown
  ## Not yet implemented

  - **Accounts (M3)**: cloud progress sync after sign-in, password reset, and
    social login/Sign in with Apple.
  - **M4 polish**: audio prefetch to disk, dark mode, offline
    story downloads.
  ```
  Reality check against code/git: social login incl. Apple exists (`app-mobile/app/auth.tsx` uses `signIn.social` for apple/google/github/discord — commits `3c34500a`, `138c4bfa`), cloud progress sync exists (`ac289a70`, `recordStoryDone` calls in `app-mobile/app/story/[id].tsx:127`), dark mode landed 2026-07-06 (`a29f1246`, PR #538), and deep links are implemented for stories and courses. Still genuinely missing as of today: password reset flow in the app, audio prefetch to disk, and offline story downloads.
- `docs/mobile-app-design.md:3-5` — says "Accounts (M3) and polish (M4) are still open — the Welcome screen's Sign in / Register buttons lead to a placeholder until then." The sign-in screen is real now (`app-mobile/app/auth.tsx`).
- Root `AGENTS.md` / `CLAUDE.md` tell agents to run `pnpm typecheck` / `pnpm lint` with no mention that these skip `app-mobile`. There is also `app-mobile/AGENTS.md` (one line pointing at Expo v56 docs) — leave that file alone.
- Domain vocabulary (CONTEXT.md): the mobile app serves **Learners** (users who consume stories); use "Learner" not "user" in any prose you write.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|----------------------------------|---------------------|
| Mobile install | `pnpm --dir app-mobile install --frozen-lockfile` | exit 0 |
| Mobile typecheck | `pnpm --dir app-mobile typecheck` | exit 0 |
| Root typecheck | `pnpm typecheck` | exit 0 |
| Root lint | `pnpm lint` | exit 0 |
| CI syntax check | `pnpm exec tsx -e "const yaml=require('yaml');const fs=require('fs');const d=yaml.parse(fs.readFileSync('.github/workflows/ci.yaml','utf8'));console.log(Object.keys(d.jobs).join(','))"` | prints job names, no parse error |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/ci.yaml` (add mobile install + typecheck steps or a second job)
- `app-mobile/README.md` (truth-up the status section)
- `docs/mobile-app-design.md` (truth-up the status line)
- `AGENTS.md` and/or `CLAUDE.md` at repo root (one-line coverage note)

**Out of scope** (do NOT touch, even though they look related):
- Root `tsconfig.json` / `biome.json` — the exclusion of `app-mobile` from root tooling is correct; mobile gets its own steps instead.
- `app-mobile/package.json` — no new lint/test scripts in this plan.
- `pnpm-workspace.yaml` (root or mobile) — merging the workspaces is a separate, riskier decision (Metro resolution under hoisting); explicitly deferred.
- Any `app-mobile/src`/`app-mobile/app` source file — if typecheck fails in CI on pre-existing errors, that's a STOP, not a fix-it-here.

## Git workflow

- Branch: `advisor/012-mobile-ci-and-docs`
- Commit style: short imperative subject, e.g. `Run app-mobile typecheck in CI and update mobile docs` (match recent history).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm mobile typecheck is green locally

Run `pnpm --dir app-mobile install --frozen-lockfile && pnpm --dir app-mobile typecheck`.

**Verify**: both exit 0. If typecheck fails, STOP and report every error verbatim — CI must not be wired to a red check, and fixing mobile type errors is not in this plan's scope.

### Step 2: Add a mobile job to CI

In `.github/workflows/ci.yaml`, add a second job (a separate job keeps the caches independent, since app-mobile has its own lockfile):

```yaml
  mobile:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Setup pnpm
        uses: pnpm/action-setup@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm
          cache-dependency-path: app-mobile/pnpm-lock.yaml

      - name: Install Dependencies
        run: pnpm --dir app-mobile install --frozen-lockfile

      - name: Typecheck
        run: pnpm --dir app-mobile typecheck
```

Match the existing file's indentation and step-naming style (shown in "Current state").

**Verify**: the CI syntax-check command from the table prints `build,mobile`.

### Step 3: Truth-up app-mobile/README.md

Replace the "Not yet implemented" section body with the actual remaining gaps (verified in "Current state"):

```markdown
## Not yet implemented

- Password reset from within the app.
- Audio prefetch to disk / offline story downloads.

Keep this list honest: update it in the same PR that ships one of these items.
```

**Verify**: `grep -n "social login\|dark mode" app-mobile/README.md` returns no hits inside the "Not yet implemented" section (hits elsewhere describing shipped features are fine).

### Step 4: Truth-up docs/mobile-app-design.md

Update the stale status sentence ("Accounts (M3) and polish (M4) are still open — the Welcome screen's Sign in / Register buttons lead to a placeholder until then.") to reflect that M3 (accounts: email + social sign-in incl. Apple, cloud progress sync, account deletion) shipped, and M4 is partially done (dark mode and deep links shipped; audio prefetch and offline downloads remain). Keep the edit to the status prose — do not rewrite the design content.

**Verify**: `grep -n "placeholder" docs/mobile-app-design.md` → no match.

### Step 5: Add the coverage note for agents

In root `AGENTS.md` (and `CLAUDE.md` if it duplicates the commands section), add one line near the typecheck/lint commands:

> Note: root `pnpm typecheck` / `pnpm lint` do NOT cover `app-mobile/` — it is a separate pnpm root. For mobile changes run `pnpm --dir app-mobile typecheck`.

**Verify**: `grep -n "app-mobile" AGENTS.md` → at least one match.

### Step 6: Full local verification

**Verify**: `pnpm typecheck && pnpm lint` exit 0 (root untouched by your changes, but confirm), and `pnpm --dir app-mobile typecheck` exits 0.

## Test plan

No new test files — the deliverable IS a verification gate (CI job) plus doc corrections. Gates: CI YAML parses with both jobs, mobile typecheck green, greps in steps 3-5 pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `ci.yaml` contains a job that runs `pnpm --dir app-mobile typecheck`
- [ ] `pnpm --dir app-mobile typecheck` exits 0 locally
- [ ] `app-mobile/README.md` "Not yet implemented" section no longer lists social login, dark mode, or cloud progress sync
- [ ] `grep -n "placeholder" docs/mobile-app-design.md` returns nothing
- [ ] `grep -n "app-mobile" AGENTS.md` returns at least one match
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1's mobile typecheck fails on a clean checkout (pre-existing type errors must be triaged by the maintainer first).
- The features listed as "shipped" in Current state are not actually present in `app-mobile/app/auth.tsx` (drift — the docs may have been right after all).
- You find yourself wanting to edit `tsconfig.json`, `biome.json`, or any mobile source file.

## Maintenance notes

- Follow-ups deliberately deferred: a Biome (or ESLint) config for `app-mobile` and a mobile test runner (needed by the hint-underline characterization tests — see the unplanned findings list in `plans/README.md`), and the workspace-merge question (single lockfile for both apps, see plan 011's mobile pin drift).
- When plan 001 lands (CI test step), keep the mobile job separate — its lockfile and cache key differ.
- Reviewer should check the CI run actually executes both jobs (a YAML indentation slip can silently drop a job).
