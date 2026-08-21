# Mobile Editor visual review

Use this checklist for UI changes on `t3code/improve-mobile-editor`. It keeps
visual review separate from type, lint, and unit-test verification.

## Screenshot protocol

- Capture the same route and data before and after a change.
- Use iPhone Safari or the `390 x 844` iPhone viewport for mobile screenshots.
- Capture `1440 x 900` as the desktop regression view when desktop markup or a
  shared renderer changed.
- Include the open sheet, dialog, keyboard, or selected tab when that state is
  part of the change.
- Name evidence `<id>-before-<device>.png` and `<id>-after-<device>.png`.
- Share each image with `share-artifact <path>` and add both artifact links to
  the table below.

The branch baseline is merge-base `2fd6a021`. The focused coherence-pass
baseline is `39e1cfea`.

## Focused coherence pass

| ID | Route/state | Visible change | Before | After | Manual checks |
| --- | --- | --- | --- | --- | --- |
| CP-01 | `/editor/course/:course/voices`, initial load | The shared 60px Character Voices header remains visible while course data loads. | Capture with a throttled connection at `39e1cfea`. | Pending authenticated device capture. | Back target remains usable; no header-height jump when flags replace the loading icon. |
| CP-02 | `/editor/course/:invalid-course/voices` | A terminal Character Voices header and `Course not found` state replace the bare paragraph. | Capture invalid route at `39e1cfea`. | Pending authenticated device capture. | Back goes to `/editor`; page does not look permanently loading. |
| CP-03 | `/editor/course/:course/story/:story`, Interleaved preview, `[MATCH]` with long answers | Compact answers use two shrinkable columns and wrap instead of being clipped by the widget. | [Existing iPhone baseline](http://richard-aspire-a515-55g.tailed9e74.ts.net:8787/ac58d26c2a25c7c437ab7980/20260821T190948Z-67fb9c25-3a98-48ae-9594-722f500a9a31-8952a403-e69f-4f10-8c84-6f5c0e18cb75.png) | Pending authenticated device capture. | No horizontal scrolling; both columns remain visible at 320px and 390px; long unbroken text stays readable. |
| CP-04 | `/editor/course/:course`, desktop information block | `Character Voice Editor` and `From Language` use the documented Editor Area terminology. | Commit `39e1cfea`. | Pending desktop capture. | Links and surrounding layout are unchanged. |

The following coherence-pass changes are intentionally not visual and need
behavioral regression checks rather than before/after screenshots:

- Convex return validation for the Editor Course sidebar payload.
- Shared course-flag illustration and Editor options sheet presentation.
- Shared course/Feedback scroll restoration lifecycle.
- Voice terminology inside new TypeScript interfaces.
- Skipping the expensive sidebar query on nested routes whose page owns its
  header.

## Full branch route matrix

| Area | Route/state | Mobile review | Desktop regression |
| --- | --- | --- | --- |
| Editor Course list | `/editor` | Shared header, search sizing, compact rows, pin ordering, empty/loading/access states. | Search and course navigation remain usable. |
| Editor Course Story Overview | `/editor/course/:course` | Header, full-bleed filters, compact rows, status/Approval separation, pin and stats menu items. | Existing stats and desktop story table remain present. |
| Story Editor | `/editor/course/:course/story/:story` | Header/menu, soft wrap, gutter, floating Edit/Preview switch, Interleaved mode, keyboard end space, hidden Checks while typing. | Side-by-side Editor/Preview, checks, save, delete, and navigation are unchanged. |
| Approval dialog | Open an Approval action from the Story list | Dialog uses natural height, readable actions, and safe viewport bounds. | Existing centered dialog remains unchanged. |
| Story Import | `/editor/course/:course/import/es-en` | Shared header and compact import rows; only the current source is shown. | Source selector and table layout remain available. |
| Feedback | `/editor/feedback` and `/editor/course/:course/feedback` | Shared header, horizontal filters, compact separated cards, status control, title link, return scroll restoration. | Card actions and exact metadata remain available. |
| Character Voice Editor | `/editor/course/:course/voices` | Shared header, sticky Cast/Voices tabs, one outer scroll owner, compact rows, copy feedback, per-tab scroll restoration. | Legacy two-column presentation remains unchanged. |
| Pronunciation Rules | `/editor/course/:course/voices/edit` | Shared header, Rules/Test tabs, dirty/save state, 44px controls, voice testing. | Legacy rule and voice workspace remains unchanged. |
| Course stats | `/editor/course/:course/stats` | Shared header and compact responsive period controls. | Stats remain embedded in the desktop Course overview. |
| Learner interest | `/editor/interest` | Shared header and compact ranked Course rows at 320px and 390px. | Existing ranked desktop list remains unchanged. |
| Audio Cutter | `/editor/course/:course/story/:story/audio-cutter` | Shared header, loading and not-found context. | Audio Cutter controls and desktop workspace remain unchanged. |

## Stateful mobile regression pass

- Open every ellipsis menu and verify typography, safe-area padding, scrolling,
  close behavior, and Back destinations.
- Focus both Editor Course and Story searches in iPhone Safari; neither may
  trigger page zoom.
- Open the iPhone keyboard near the final Story Text row; the row must scroll
  above the keyboard without losing the sticky app header.
- Switch Cast/Voices and Rules/Test after scrolling each tab; each tab must
  restore its own position and preserve unsaved input.
- Enter and leave a Story from Feedback; Back must restore status, loaded
  reports, and scroll position.
- Exercise Interleaved `MULTIPLE_CHOICE`, `SELECT_PHRASE`, `CONTINUATION`,
  `ARRANGE`, `POINT_TO_PHRASE`, and `MATCH` blocks at 320px and 390px.
