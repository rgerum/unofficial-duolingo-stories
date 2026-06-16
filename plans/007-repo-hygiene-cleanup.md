# Plan 007: Repo hygiene — untrack artifacts, drop orphan deps, remove debug instrumentation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- package.json convex/editorRead.ts README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

Five small pieces of accumulated cruft: (1) `tmp/` screenshot artifacts are git-tracked even though `.gitignore` line 53 ignores `tmp/` — they were committed before the rule and tracked files override gitignore; (2) `@types/pg` sits in devDependencies with no `pg` usage anywhere (leftover from the Postgres era); (3) the pnpm override pinning `kysely` to `0.28.17` has no comment explaining it (it's a transitive dep of better-auth via `@better-auth/kysely-adapter`, pinned deliberately in commit `7a311b2f`); (4) `convex/editorRead.ts` ships `console.time`/`console.timeEnd` perf instrumentation in a production query; (5) `database/` and `import_tools/` are legacy pre-Convex migration artifacts with no imports from app code, undocumented.

## Current state

- `git ls-files tmp/` → lists tracked PNG screenshots under `tmp/course-pixel-pass/`, `tmp/course-tailwind*/`, plus `discord-avatar-backfill` artifacts and `discord_log.txt`. `.gitignore:53` contains `tmp/`.
- `package.json` devDependencies include `"@types/pg": "^8.20.0"`. `grep -rln "from \"pg\"" src/ convex/ scripts/` → no matches (verified at planning time).
- `package.json`:
  ```json
  "pnpm": {
    "overrides": {
      "kysely": "0.28.17"
    }
  }
  ```
  `pnpm-lock.yaml` shows kysely is pulled in via `@better-auth/kysely-adapter@1.6.14`. Pinned by commit `7a311b2f` ("Pin kysely to 0.28.17").
- `convex/editorRead.ts` — inside `getEditorStoriesByCourseLegacyId` (starting line ~283): `console.time(timerBase)` at line 290, `console.timeEnd`/`console.log` at 294-295, `console.time(storiesTimer)` at 301, `console.timeEnd` at 306, more at 310, 326, 355. The timer label variables are defined at lines 286-289 (`timerBase`, `storiesTimer`, `imagesTimer`, `authorsTimer`).
- `database/` (story text files) and `import_tools/` (Python `app.py`, Greasemonkey script) — ignored in `knip.json`, no imports from `src/` or `convex/`.
- `tsconfig.tsbuildinfo` at repo root is NOT git-tracked (verified) — no action needed.

## Commands you will need

| Purpose   | Command           | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0              |
| Lint      | `pnpm lint`       | exit 0              |
| Tests     | `pnpm test`       | all pass            |
| Install   | `pnpm install`    | exit 0, lockfile consistent |

## Scope

**In scope** (the only files you should modify):
- git index for `tmp/` (untrack only — keep files on disk)
- `package.json` (+ `pnpm-lock.yaml` via `pnpm install`)
- `convex/editorRead.ts` (remove instrumentation only)
- `README.md` (one short "Legacy artifacts" note)

**Out of scope** (do NOT touch):
- Do NOT delete `database/` or `import_tools/` — documenting them is in scope; deletion is a maintainer decision.
- Do NOT remove or change the kysely override version — only annotate it.
- Do NOT touch any query logic in `editorRead.ts` — only the console instrumentation lines.
- `knip.json`, `.gitignore` — already correct.

## Git workflow

- Branch: `advisor/007-repo-hygiene`
- One commit per step is ideal; message style: short imperative, e.g. `Untrack tmp artifacts`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Untrack tmp/ (keep files on disk)

`git rm -r --cached tmp/`

**Verify**: `git ls-files tmp/` → empty; `ls tmp/` → files still present on disk; `git status` shows deletions staged under `tmp/`.

### Step 2: Remove @types/pg

Remove the `"@types/pg"` line from `package.json` devDependencies, then `pnpm install`.

**Verify**: `pnpm typecheck` → exit 0 (proves nothing imported the types).

### Step 3: Annotate the kysely override

JSON has no comments, so document the pin where pnpm supports it — add a sibling key in `package.json`:

```json
"pnpm": {
  "//": "kysely is transitive via @better-auth/kysely-adapter; pinned to 0.28.17 for better-auth 1.6.x compatibility (commit 7a311b2f). Re-evaluate when bumping better-auth.",
  "overrides": {
    "kysely": "0.28.17"
  }
}
```

If `pnpm install` rejects the `"//"` key, put the same sentence in `README.md` under a "Dependency notes" heading instead.

**Verify**: `pnpm install` → exit 0.

### Step 4: Strip console.time instrumentation from editorRead.ts

In `convex/editorRead.ts`, remove all `console.time`, `console.timeEnd`, and the associated `console.log` lines inside `getEditorStoriesByCourseLegacyId`, and the now-unused label variables (`timerBase`, `storiesTimer`, `imagesTimer`, `authorsTimer`, lines ~286-289). Touch nothing else in the handler.

**Verify**: `grep -n "console.time" convex/editorRead.ts` → no matches; `pnpm typecheck` → exit 0 (catches unused-variable leftovers); `pnpm lint` → exit 0.

### Step 5: Document the legacy directories

Add a short section to `README.md` (near the end):

```markdown
## Legacy artifacts

- `database/` — story text exports from the pre-Convex (MySQL/Postgres) era. Not used by the app.
- `import_tools/` — one-off import scripts (Python/Greasemonkey) from the original data migration. Not used by the app.

Both are kept for historical reference and are excluded from dead-code checks (`knip.json`).
```

**Verify**: `grep -n "Legacy artifacts" README.md` → 1 match.

### Step 6: Full verification

`pnpm run format && pnpm lint && pnpm typecheck && pnpm test`

**Verify**: all exit 0.

## Test plan

No new tests — nothing behavioral changes. The typecheck gate in Step 4 is the guard against accidentally removing a used variable.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git ls-files tmp/` → empty
- [ ] `grep -n "@types/pg" package.json` → no matches
- [ ] `grep -n "console.time" convex/editorRead.ts` → no matches
- [ ] kysely pin still present: `grep -n '"kysely": "0.28.17"' package.json` → 1 match
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all exit 0
- [ ] `git status` clean apart from the intended changes
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm typecheck` fails after removing `@types/pg` (something does use pg types — restore and report).
- Removing the instrumentation lines requires touching any non-console logic in the handler.
- You are tempted to delete `database/` or `import_tools/` — that decision is reserved for the maintainer.

## Maintenance notes

- When `better-auth` is next upgraded, re-test without the kysely override and remove it if the incompatibility is gone.
- If perf visibility for `getEditorStoriesByCourseLegacyId` is wanted later, prefer the Convex dashboard's function metrics over console timers.
- `tmp/` is the designated scratch dir going forward — gitignore already covers it.
