# Plan 004: Surface story save/delete/upload failures to the editor user

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1b96b7f..HEAD -- "src/app/editor/story/[story]/header.tsx" "src/app/editor/story/[story]/sound-recorder.tsx"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a1b96b7f`, 2026-06-11

## Why this matters

When saving or deleting a story fails in the editor, the error is caught and written to the browser console only — the contributor gets **no feedback** and reasonably assumes their work was saved. For a community-translation platform where contributors invest significant time per story, silent save failure is data loss. The audio upload helper has the same flaw: on failure it logs and returns `undefined`, and callers proceed.

## Current state

- `src/app/editor/story/[story]/header.tsx:81-99` — the swallowing handlers:
  ```ts
  async function Save() {
    if (is_saving || is_deleting) return;
    try {
      await func_save();
    } catch (e) {
      console.log("error save", e);
    }
  }

  async function Delete() {
    if (is_saving || is_deleting) return;
    if (confirm("Are you sure that you want to delete this story?")) {
      try {
        await func_delete();
      } catch (e) {
        console.log("error delete", e);
      }
    }
  }
  ```
  `func_save` is wired from `src/app/editor/story/[story]/v2/editor_v2.tsx:579` (`func_save={model.save}`).
- `src/app/editor/story/[story]/sound-recorder.tsx:57-79` — `uploadAudio` catches all errors, `console.error(e)`, and returns `undefined` (the success path returns the `Response`).
- **Repo convention for editor failure feedback is `window.alert`** — there is no toast system. Exemplars:
  - `src/app/editor/story/[story]/sound-recorder.tsx:259` — `window.alert("Upload failed.");`
  - `src/app/editor/language/[language]/language_editor.tsx:475` — `window.alert("could not be saved");`
  Match this convention. Do NOT introduce a toast library.
- Error-message extraction helper exists in the same route at `src/app/editor/story/[story]/audio-cutter-dialog.tsx:230` — `function getErrorMessage(error: unknown, fallback: string)`. Do not import across files from the dialog; write the same small pattern locally.

## Commands you will need

| Purpose   | Command           | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0              |
| Lint      | `pnpm lint`       | exit 0              |
| Tests     | `pnpm test`       | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/app/editor/story/[story]/header.tsx`
- `src/app/editor/story/[story]/sound-recorder.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `editor_v2.tsx` / `model.save` internals — the fix is at the call sites, not in the save implementation.
- Adding a toast/notification library or global error boundary — out of scope by design; the repo convention is `window.alert`.
- `audio-cutter-dialog.tsx` — has its own error handling.

## Git workflow

- Branch: `advisor/004-surface-editor-save-errors`
- Commit style: short imperative subject, e.g. `Alert the user when story save or delete fails`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Alert on save/delete failure in header.tsx

In `header.tsx`, change the two catch blocks to keep the console log (use `console.error`, not `console.log`) and add a user-visible alert with the underlying message:

```ts
catch (e) {
  console.error("error save", e);
  window.alert(
    `Saving failed — your changes were NOT saved.\n${e instanceof Error ? e.message : ""}`,
  );
}
```

and equivalently for delete (`"Deleting failed."` prefix, no "changes not saved" wording).

**Verify**: `pnpm typecheck` → exit 0; `grep -n "window.alert" "src/app/editor/story/[story]/header.tsx"` → 2 matches.

### Step 2: Stop swallowing upload errors in sound-recorder.tsx

In `uploadAudio` (`sound-recorder.tsx:57-79`), remove the internal try/catch so errors propagate to callers (the function already throws on `!res.ok`). Then check each caller of `uploadAudio` in the same file: callers at ~line 255-275 already handle failure with `window.alert("Upload failed.")` — confirm they are wrapped so a thrown error reaches that alert (wrap the `await uploadAudio(...)` call in try/catch with the existing alert if it currently relies on the `undefined` return instead). The end state: a failed upload always produces exactly one `window.alert`, and no caller treats `undefined` as success.

**Verify**: `pnpm typecheck` → exit 0; `grep -n "console.error(e)" "src/app/editor/story/[story]/sound-recorder.tsx"` inside `uploadAudio` → no match (the swallow is gone).

### Step 3: Full verification

`pnpm run format && pnpm lint && pnpm typecheck && pnpm test`

**Verify**: all exit 0.

### Step 4 (manual, if a dev environment is running): behavioral check

With `pnpm dev` and a dev Convex deployment: open a story in the editor, stop the network (devtools offline), press Save.

**Verify**: an alert appears stating the save failed; nothing in the UI implies success.

## Test plan

These are thin UI handlers around `window.alert`/`confirm`; unit-testing them under `tsx --test` (no DOM) is not practical. The gates are the greps + typecheck + the manual check in Step 4. Record in `plans/README.md` if Step 4 was skipped (no dev deployment available).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "window.alert" "src/app/editor/story/[story]/header.tsx"` → 2
- [ ] `grep -n "console.log(\"error" "src/app/editor/story/[story]/header.tsx"` → no matches
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all exit 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The catch blocks in `header.tsx` no longer match the "Current state" excerpt.
- Removing the swallow in `uploadAudio` reveals a caller that cannot tolerate a thrown error without restructuring beyond this file.
- You feel the need to add state management, a toast system, or touch `editor_v2.tsx`.

## Maintenance notes

- If the team later adds a proper notification system, these `window.alert` sites are the inventory to migrate (grep `window.alert` under `src/app/editor/`).
- Reviewer should test the offline-save path manually; there is no automated coverage for it.
- Deferred: auto-retry of failed saves and local draft backup — meaningful but a feature, not a fix.
