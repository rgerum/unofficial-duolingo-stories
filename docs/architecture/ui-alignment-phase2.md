# UI Alignment Phase 2 (Foundation Slice)

Date: 2026-02-13

## Completed in this slice

- Added `src/components/ui` foundation primitives:
  - `button.tsx`
  - `input.tsx`
  - `label.tsx`
  - `spinner.tsx`
  - `dropdown.tsx`
  - `switch.tsx`
  - `badge.tsx`
  - `flag.tsx`
  - `index.ts`
- Migrated app imports from legacy `layout/*` to `ui/*` for:
  - `button`, `input`, `spinner`, `dropdown`, `switch`, `tag` (`badge`), `flag`
- Converted legacy layout primitives into compatibility re-exports:
  - `src/components/layout/button.tsx`
  - `src/components/layout/Input.tsx`
  - `src/components/layout/spinner.tsx`
  - `src/components/layout/dropdown.tsx`
  - `src/components/layout/switch.tsx`
  - `src/components/layout/tag.tsx`

## Validation

- `pnpm -s typecheck` passes.
- `pnpm -s lint` passes.

## Notes

- This slice intentionally preserves behavior and visual output by reusing existing implementations/styles.
- `src/components/layout/legal.tsx` remains as-is (not part of primitive migration yet).

## Next recommended slices

1. Move `ui/flag` from re-export to an owned implementation and add tests for fallback behavior.
2. Migrate `src/components/Button/Button.tsx` usages (if any appear) to `ui/button` and remove duplicate button surface.
3. Continue dialog/form alignment by replacing `src/app/admin/edit_dialog.tsx` custom styles with standardized `ui/dialog` + form field primitives.

## Follow-up completed after Phase 2

- Admin list surfaces were aligned to a shared console system in:
  - `src/app/admin/users/user_list.tsx`
  - `src/app/admin/languages/language_list.tsx`
  - `src/app/admin/courses/courses.tsx`
- Added shared admin layout styles:
  - `src/app/admin/console.module.css`
- Refined table visual language for admin pages:
  - `src/app/admin/index.module.css`
