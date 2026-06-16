# Plan 005: Fix out-of-bounds access in bulk audio editor region updates

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- "src/app/editor/story/[story]/bulk-audio-editor.tsx" src/lib/editor/audio/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

`onRegionUpdated` in the bulk audio editor builds the audio timing text by iterating over the waveform regions and indexing into the transcript `parts` array with non-null assertions. When there are more regions than parts (a user can add regions on the waveform), `parts[index]!.text` dereferences `undefined` and throws a `TypeError` inside the wavesurfer callback — breaking timing-text updates for the rest of the session. The fix is a bounds-safe loop, and extracting the pure timing-text computation makes it testable, following the precedent of `audio-cutter-text.test.ts` in the same route.

## Current state

- `src/app/editor/story/[story]/bulk-audio-editor.tsx:445-474` — the buggy callback:
  ```ts
  const onRegionUpdated = React.useCallback(
    (plugin: RegionsPlugin) => {
      const regions = plugin.regions.sort(
        (left, right) => left.start - right.start,
      );
      let nextTimingText = "";
      for (let index = 0; index < regions.length; index += 1) {
        if (
          regions[index]!.content !== undefined &&
          parts[index] !== undefined
        ) {
          regions[index]!.content!.innerText = parts[index]!.text;
        }
        nextTimingText +=
          ";" +
          (parts[index]!.text.length +          // <-- throws when regions.length > parts.length
            parts[index]!.pos -
            (parts[index - 1]?.text.length + parts[index - 1]?.pos || 0)) +
          "," +
          (Math.floor(regions[index]!.start * 1000) -
            Math.floor(regions[index - 1]?.start * 1000 || 0));
      }

      onChange((currentDraft) => ({
        ...currentDraft,
        timingText: nextTimingText,
      }));
    },
    [onChange, parts],
  );
  ```
  Note: line ~453 guards only the `innerText` assignment; the `nextTimingText` accumulation is unguarded.
- `parts` is the tokenized transcript: array of `{ text: string; pos: number }`.
- Timing-text format (preserve exactly): for each index, `";" + <charDelta> + "," + <msDelta>` where `charDelta = parts[i].text.length + parts[i].pos - (parts[i-1].text.length + parts[i-1].pos || 0)` and `msDelta = floor(regions[i].start*1000) - floor(regions[i-1].start*1000 || 0)`.
- Testing precedent in this route: `src/app/editor/story/[story]/audio-cutter-text.test.ts` uses `node:test` + `assert` (run by `pnpm test` = `tsx --test src/**/*.test.ts`). Existing pure-audio helpers with tests live in `src/lib/editor/audio/` (`audio_edit_tools.test.ts`).

## Commands you will need

| Purpose   | Command           | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0              |
| Lint      | `pnpm lint`       | exit 0              |
| Tests     | `pnpm test`       | all pass, including new ones |

## Scope

**In scope** (the only files you should modify):
- `src/app/editor/story/[story]/bulk-audio-editor.tsx`
- `src/lib/editor/audio/timing_text.ts` (create)
- `src/lib/editor/audio/timing_text.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- `audio-cutter-dialog.tsx` — separate component with its own timing logic (plan 009 covers it).
- Changing the timing-text format — stored story data depends on it.
- Other callbacks in `bulk-audio-editor.tsx`.

## Git workflow

- Branch: `advisor/005-bulk-audio-editor-bounds`
- Commit style: short imperative subject, e.g. `Guard bulk audio timing text against extra regions`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract a pure, bounds-safe timing-text builder

Create `src/lib/editor/audio/timing_text.ts`:

```ts
export type TimingPart = { text: string; pos: number };
export type TimingRegion = { start: number };

/** Builds the ";chars,ms" timing string for aligned (part, region) pairs.
 *  Pairs beyond the shorter of the two arrays are ignored. */
export function buildTimingText(
  parts: readonly TimingPart[],
  regions: readonly TimingRegion[],
): string {
  const count = Math.min(parts.length, regions.length);
  let timingText = "";
  for (let index = 0; index < count; index += 1) {
    const part = parts[index]!;
    const previousPart = parts[index - 1];
    const previousEnd = previousPart
      ? previousPart.text.length + previousPart.pos
      : 0;
    const previousMs = regions[index - 1]
      ? Math.floor(regions[index - 1]!.start * 1000)
      : 0;
    timingText +=
      ";" +
      (part.text.length + part.pos - previousEnd) +
      "," +
      (Math.floor(regions[index]!.start * 1000) - previousMs);
  }
  return timingText;
}
```

This preserves the existing output for the in-bounds case (the old `(... || 0)` fallbacks are equivalent to the explicit `previousPart`/`previousMs` handling for index 0) and silently ignores surplus regions.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Use it in onRegionUpdated

In `bulk-audio-editor.tsx`, replace the body of the `for` loop + accumulation with:

```ts
const regions = plugin.regions.sort((left, right) => left.start - right.start);
for (let index = 0; index < Math.min(regions.length, parts.length); index += 1) {
  if (regions[index]!.content !== undefined && parts[index] !== undefined) {
    regions[index]!.content!.innerText = parts[index]!.text;
  }
}
const nextTimingText = buildTimingText(parts, regions);
```

Import `buildTimingText` from `@/lib/editor/audio/timing_text`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Write the regression tests

Create `src/lib/editor/audio/timing_text.test.ts` using `node:test` + `assert/strict` (model the file structure after `src/lib/editor/audio/audio_edit_tools.test.ts`). Cases:

1. **Happy path parity**: 3 parts, 3 regions with known values → assert the exact expected string computed by hand with the formula above.
2. **More regions than parts** (the bug): 2 parts, 4 regions → does not throw; output equals the 2-pair result.
3. **More parts than regions**: 4 parts, 2 regions → does not throw; output covers 2 pairs.
4. **Empty inputs**: `buildTimingText([], [])` → `""`.

**Verify**: `pnpm test` → all pass, including 4 new tests.

### Step 4: Full verification

`pnpm run format && pnpm lint && pnpm typecheck && pnpm test`

**Verify**: all exit 0.

## Test plan

Covered in Step 3 (the extraction exists precisely to make this testable). Pattern exemplar: `src/lib/editor/audio/audio_edit_tools.test.ts`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `src/lib/editor/audio/timing_text.ts` and its test file exist
- [ ] `grep -n "buildTimingText" "src/app/editor/story/[story]/bulk-audio-editor.tsx"` → 1+ match
- [ ] `grep -n 'parts\[index\]!\.text\.length' "src/app/editor/story/[story]/bulk-audio-editor.tsx"` → no matches
- [ ] `pnpm test` exits 0 with the 4 new tests passing
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `onRegionUpdated` code no longer matches the "Current state" excerpt.
- Your happy-path test (case 1) produces a different string than the old inline formula for the same inputs — that means the extraction changed behavior; do not "fix" the test to match.
- The timing-text format turns out to be consumed somewhere that needs surplus regions encoded (search `timingText` consumers first if in doubt).

## Maintenance notes

- Any future change to the timing-text format must update `buildTimingText` and its tests together; the format is persisted in story audio data.
- Plan 009 (audio-cutter-dialog split) should reuse `buildTimingText` if the dialog has an equivalent inline computation — check there before duplicating.
