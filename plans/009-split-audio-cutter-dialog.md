# Plan 009: Extract the pure logic out of the 4,100-line audio-cutter dialog

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- "src/app/editor/story/[story]/audio-cutter-dialog.tsx"`
> This file is the highest-churn file in the repo — drift is LIKELY. If the
> line numbers below are off by more than ~50 lines or any named function is
> missing, re-locate each symbol by name before proceeding; if a named
> function no longer exists, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M–L
- **Risk**: MED
- **Depends on**: plans/001-ci-verification-baseline.md (CI must run tests); plans/005-fix-bulk-audio-editor-bounds.md (creates `src/lib/editor/audio/timing_text.ts`, which this plan may reuse)
- **Category**: tech-debt
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

`src/app/editor/story/[story]/audio-cutter-dialog.tsx` is 4,135 lines — an order of magnitude above the repo median — and is the most actively developed file (15 commits, including 6 of the last 10 on `main`). It mixes ~50 pure helper functions (segment math, range normalization, word-mark estimation, formatting) with React state, wavesurfer integration, and MP3 encoding. Every feature added to the audio cutter raises regression risk because almost none of this logic is tested (only `audio-cutter-text.test.ts`, 2 tests, covers an adjacent file). **Note:** an earlier audit hypothesis that this file bloats other routes' bundles is wrong — it is imported only by its own route (`.../audio-cutter/page_client.tsx`), so Next.js already code-splits it. The value here is maintainability and testability, not bundle size. This plan extracts the pure logic into tested modules; it deliberately does NOT restructure the React component.

## Current state

- `src/app/editor/story/[story]/audio-cutter-dialog.tsx` — 4,135 lines. Sole import site: `src/app/editor/(course)/course/[course_id]/story/[story]/audio-cutter/page_client.tsx:9`.
- The file's pure-helper band (line numbers at commit `a1b96b7f`; re-locate by name on drift):
  - Constants block, lines 40-63 (`DEFAULT_WAVEFORM_ZOOM`, `MIN_SEGMENT_LENGTH_SECONDS`, `SEGMENT_COLOR`, etc.)
  - `sortSegments` (186), `areTimeRangesEqual` (190), `areSegmentsEqual` (198), `clamp` (213), `formatSeconds` (217), `getFileBaseName` (225), `getErrorMessage` (230), `createSegmentId` (240), `sortRanges` (356), `normalizeRanges` (360), `getTotalRangeDuration` (383), `getKeepRangeEnd` (390), `getEffectiveSegmentDuration` (398), `getKeepRanges` (409), `mapPlayableOffsetToAbsoluteTime` (436), `clampTimeToKeepRanges` (454), `getApproximateWordMarks` (479), `getApproximateWordPlaybackRange` (519), and more below — enumerate with:
    `grep -n "^function\|^const [A-Z_]* =" "src/app/editor/story/[story]/audio-cutter-dialog.tsx"`
  - DOM/React-coupled helpers that must NOT move: `getWaveformScrollElement` (244), `isEditableTarget` (259), `renderTextWithHighlightedWord` (271, returns JSX), `getSegmentsFromPlugin` (314), `getOverlappingRegion` (325) — anything touching `RegionsPlugin`, `EventTarget`, or JSX stays.
- Existing tested-audio-helper convention to follow: `src/lib/editor/audio/` contains `audio_edit_tools.ts` + `audio_edit_tools.test.ts` (node:test + assert/strict, run by `pnpm test`). Plan 005 adds `timing_text.ts` there.
- Types used by the helpers (`Segment`, `TimeRange`, `AudioMark`) are defined near the top of the dialog file — they move with the helpers.

## Commands you will need

| Purpose   | Command           | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0              |
| Lint      | `pnpm lint`       | exit 0              |
| Tests     | `pnpm test`       | all pass, incl. new |
| Format    | `pnpm run format` | exit 0              |

## Suggested executor toolkit

- If a `vercel-react-best-practices` skill is available, consult it only if you end up touching component code (you shouldn't).

## Scope

**In scope** (the only files you should modify/create):
- `src/app/editor/story/[story]/audio-cutter-dialog.tsx` (remove moved code, add imports — no logic changes)
- `src/lib/editor/audio/segments.ts` (create — segment/range math + types)
- `src/lib/editor/audio/segments.test.ts` (create)
- `src/lib/editor/audio/word_marks.ts` (create — `getApproximateWordMarks`, `getApproximateWordPlaybackRange`)
- `src/lib/editor/audio/word_marks.test.ts` (create)
- `src/lib/editor/audio/format.ts` (create — `formatSeconds`, `getFileBaseName`, `getErrorMessage`, `clamp`)
- `src/lib/editor/audio/format.test.ts` (create)

**Out of scope** (do NOT touch):
- Any React state, hooks, JSX, wavesurfer/RegionsPlugin interaction, MP3 encoding (`lamejs`), zip export (`fflate`), keyboard shortcuts.
- `bulk-audio-editor.tsx` and `audio-cutter-text.ts(x)` — separate files.
- Any behavior change whatsoever — this is a pure move-and-test refactor. If you spot a bug in a helper, record it in `plans/README.md`, test CURRENT behavior with a `// BUG?:` comment.

## Git workflow

- Branch: `advisor/009-extract-audio-cutter-logic`
- One commit per extracted module; message style: short imperative, e.g. `Extract segment math from audio cutter dialog`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Inventory and classify

Generate the current helper list: `grep -n "^function " "src/app/editor/story/[story]/audio-cutter-dialog.tsx"`. Classify each as PURE (no DOM, no React, no wavesurfer types, no JSX) or COUPLED. Write the classification into your working notes. Only PURE functions move.

**Verify**: every function in the file appears in your classification; COUPLED list includes at least `getWaveformScrollElement`, `isEditableTarget`, `renderTextWithHighlightedWord`, `getSegmentsFromPlugin`, `getOverlappingRegion`.

### Step 2: Move formatting/util helpers → `format.ts`

Move `clamp`, `formatSeconds`, `getFileBaseName`, `getErrorMessage` (and any other pure string/number utility from your Step 1 list) to `src/lib/editor/audio/format.ts` with `export`. Update the dialog to import them from `@/lib/editor/audio/format`. Write `format.test.ts` (node:test + assert/strict, model after `audio_edit_tools.test.ts`): at minimum `formatSeconds` (0, sub-minute, over-a-minute, fractional), `clamp` (below/within/above), `getFileBaseName` (with/without extension, dotted names), `getErrorMessage` (Error instance, non-Error, fallback).

**Verify**: `pnpm typecheck && pnpm test` → pass; `grep -n "^function clamp" "src/app/editor/story/[story]/audio-cutter-dialog.tsx"` → no match.

### Step 3: Move segment/range math → `segments.ts`

Move the `Segment`/`TimeRange` types (export them) and the pure range/segment functions: `sortSegments`, `areTimeRangesEqual`, `areSegmentsEqual`, `createSegmentId`, `sortRanges`, `normalizeRanges`, `getTotalRangeDuration`, `getKeepRangeEnd`, `getEffectiveSegmentDuration`, `getKeepRanges`, `mapPlayableOffsetToAbsoluteTime`, `clampTimeToKeepRanges`, plus pure constants they depend on (e.g. `SHRINK_WRAP_STABILITY_EPSILON_SECONDS`). Update dialog imports. Keep the dialog compiling after this single step.

Write `segments.test.ts` covering at minimum: `normalizeRanges` (overlapping ranges merge, unsorted input, empty), `getKeepRanges` (no skips, skip in middle, skip covering whole bounds), `clampTimeToKeepRanges` (inside a range, in a gap, before first, after last), `mapPlayableOffsetToAbsoluteTime` (offset across a skipped gap), `getTotalRangeDuration` (empty/undefined → 0).

**Verify**: `pnpm typecheck && pnpm test` → pass.

### Step 4: Move word-mark estimation → `word_marks.ts`

Move `getApproximateWordMarks`, `getApproximateWordPlaybackRange` and their types (`AudioMark`). Tests: a simple two-word text yields marks in ascending time within the segment; empty text yields no marks; playback range for the nth word lies within the segment bounds and ranges are non-overlapping for consecutive words. Derive exact expectations by reading the implementation — characterization, not specification.

**Verify**: `pnpm typecheck && pnpm test` → pass.

### Step 5: Confirm the dialog shrank and nothing else changed

`wc -l "src/app/editor/story/[story]/audio-cutter-dialog.tsx"` — expect roughly 3,300-3,600 lines (≈500-800 lines moved). Run the full gate.

**Verify**: `pnpm run format && pnpm lint && pnpm typecheck && pnpm test` → all exit 0; `git diff --stat` shows only in-scope files.

### Step 6 (manual, if dev environment available): smoke-test the cutter

`pnpm dev`, open a story's audio cutter route, load an audio file, create/drag/delete a segment, use speaker filtering, export.

**Verify**: behavior identical to before; no console errors.

## Test plan

Steps 2-4 each carry their own test file; total expected: ≥18 new test cases. Pattern exemplar: `src/lib/editor/audio/audio_edit_tools.test.ts`. All run under `pnpm test` (already CI-gated by plan 001).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Three new modules + three new test files exist under `src/lib/editor/audio/`
- [ ] `pnpm test` exits 0 with ≥18 new passing tests
- [ ] `audio-cutter-dialog.tsx` is ≤3,700 lines and contains no `^function` matching a moved helper name
- [ ] `pnpm typecheck && pnpm lint` exit 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows the dialog changed so much that a named function is gone or renamed.
- A "pure" helper turns out to capture component state or a module-level mutable (e.g. the `cachedAudioSegmentation` WeakMap at line ~63) — leave such helpers in place and note them; do not thread new parameters through.
- Moving a helper requires changing its signature or behavior.
- The manual smoke test (Step 6) shows any behavioral difference.

## Maintenance notes

- Future audio-cutter features should put new pure logic in `src/lib/editor/audio/` with tests from day one; the dialog file should only shrink from here.
- A follow-up plan (not written) could split the remaining component into subcomponents (waveform panel, transcript panel, toolbar) — only worth it after this plan's tests exist.
- Reviewer focus: the diff should be pure moves — `git diff` hunks in the dialog should be deletions + import lines only.
