# UI Alignment Phase 1 (Inventory and Mapping)

Date: 2026-02-13

## Scope

Phase 1 output for aligning the codebase to a shadcn/ui-style component system:

- Component inventory
- Classification (`primitive`, `composite`, `page-specific`)
- Mapping from current components to target `src/components/ui/*` primitives
- Initial migration order
- Visual baseline checklist to prevent drift

## Current inventory

- Top-level component groups in `src/components`: 44
- Highest-usage primitive-like imports from app code:
  - `layout/spinner` (19 imports)
  - `layout/flag` (8 imports)
  - `layout/button` (8 imports)
  - `layout/Input` (6 imports)

## Classification

### Primitive candidates (base UI layer)

- `src/components/layout/button.tsx`
- `src/components/layout/Input.tsx`
- `src/components/layout/dropdown.tsx`
- `src/components/layout/switch.tsx`
- `src/components/layout/tag.tsx`
- `src/components/layout/spinner.tsx`
- `src/components/layout/flag.tsx`
- `src/components/Button/Button.tsx` (duplicate button surface)
- `src/components/CheckButton/CheckButton.tsx`
- `src/components/WordButton/WordButton.tsx`
- `src/components/VisuallyHidden/VisuallyHidden.tsx`

### Composite/system components

- Docs shell/navigation:
  - `src/components/DocsHeader/DocsHeader.tsx`
  - `src/components/DocsBreadCrumbNav/DocsBreadCrumbNav.tsx`
  - `src/components/DocsNavigation/DocsNavigation.tsx`
  - `src/components/DocsNavigationBackdrop/DocsNavigationBackdrop.tsx`
  - `src/components/DocsSearchModal/DocsSearchModal.tsx`
- Story runtime shell:
  - `src/components/StoryProgress/StoryProgress.tsx`
  - `src/components/StoryHeader/StoryHeader.tsx`
  - `src/components/StoryFooter/StoryFooter.tsx`
  - `src/components/StoryTextLine/StoryTextLine.tsx`
  - `src/components/StoryLineHints/StoryLineHints.tsx`
- Animation/presentation helpers:
  - `src/components/FadeGlideIn/FadeGlideIn.tsx`
  - `src/components/PlayAudio/PlayAudio.tsx`
  - `src/components/ProgressBar/ProgressBar.tsx`

### Page-specific feature components (migrate later)

- `src/components/StoryChallenge*/*`
- `src/components/StoryQuestion*/*`
- `src/components/StoryEditorPreview/StoryEditorPreview.tsx`
- `src/components/StoryAutoPlay/StoryAutoPlay.tsx`
- `src/components/EditorSSMLDisplay/EditorSSMLDisplay.tsx`
- `src/components/login/*`
- `src/components/react-audio-recorder/*`

## Mapping to target shadcn-style UI layer

Target location for primitives: `src/components/ui/*`

| Current | Target |
|---|---|
| `layout/button`, `Button/Button` | `ui/button` |
| `layout/Input` | `ui/input` + `ui/label` |
| `layout/dropdown` | `ui/select` or `ui/dropdown-menu` (depends on current behavior) |
| `layout/switch` | `ui/switch` |
| `layout/tag` | `ui/badge` |
| `layout/spinner` | `ui/spinner` (custom primitive, shadcn-adjacent) |
| `layout/flag` | keep as domain primitive (`ui/flag` or `primitives/flag`) |
| `CheckButton` | composition of `ui/button` + icon variant |
| `WordButton` | composition of `ui/button` with status variants |
| app admin edit dialog (`src/app/admin/edit_dialog.tsx`) | `ui/dialog` + field wrappers |

Notes:
- `flag` is domain-specific, not a standard shadcn primitive. Keep, but normalize API and style tokens.
- Keep custom motion-heavy components (`FadeGlideIn`) outside `ui/` and compose around primitives.

## Initial migration order (after Phase 1)

1. Build `ui` foundation:
   - `button`, `input`, `label`, `badge`, `switch`, `dialog`, `spinner`
2. Replace high-usage imports:
   - `layout/button`, `layout/Input`, `layout/spinner`
3. Align admin forms/tables:
   - admin languages/courses/users pages
4. Align docs shell components
5. Align story runtime controls (`footer`, `progress`, question controls)

## Visual baseline checklist (no-drift)

Capture baseline screenshots before Phase 2 for these routes/states:

1. Story runtime:
   - `/story/[id]` (title, multiple challenge types, footer states)
2. Editor:
   - `/editor/course/[course]`
   - `/editor/story/[story]`
   - `/editor/language/[language]`
3. Admin:
   - `/admin/languages`
   - `/admin/courses`
   - `/admin/users`
4. Auth:
   - `/auth/signin`
   - `/auth/register`

State matrix per route:

- default
- hover/focus (keyboard)
- disabled/loading
- mobile viewport
- desktop viewport

## Acceptance criteria for Phase 1

- Inventory completed and committed.
- Primitive/composite boundaries documented.
- Mapping table agreed.
- Baseline screenshot route list agreed.
- No code behavior changes required in Phase 1.
