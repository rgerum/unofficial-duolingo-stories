# Mobile rendering benchmark

A screenshot benchmark for the Expo app (`app-mobile/`) that renders story
content in controlled states across scripts, so text-rendering regressions
(clipped glyphs, broken hint underlines, wrong RTL flow, mispositioned
popups) are visible at a glance and comparable between Android and iOS.

## Why

Text rendering is the highest-risk surface of the reader:

- Android and iOS use different text engines (Minikin vs Core Text) — line
  height, glyph clipping, and underline metrics differ per platform.
- CJK languages (`ja`, `zh`, `ko`) take a separate native-layout render path
  (`HintText renderMode="native"`) where hint underlines are drawn as SVG dots
  from measured text — a path with its own failure modes.
- Indic scripts (Telugu especially) have a history of vertical clipping in
  this app (see `agent/fix-telugu-*` branches).
- Hidden-challenge ranges, hint underlines, audio word-dimming, and the chip
  palette are all custom drawing on top of platform text.

## How to run

```bash
# Android (Linux/macOS): boots nothing itself — needs a running emulator or
# device with Expo Go, and the Metro server started in app-mobile/.
cd app-mobile && pnpm start          # terminal 1
./scripts/mobile-benchmark.sh        # terminal 2 → shots + HTML contact sheet

# iOS (macOS only): needs a booted simulator with Expo Go installed.
./scripts/mobile-benchmark-ios.sh
```

Both scripts read the case registry
(`app-mobile/src/debug-benchmark/cases.json`), open
`exp://<host>/--/debug/benchmark?case=<case>&theme=<theme>` per entry, and
save one PNG per case to `benchmark-shots/<platform>/<id>.png`. Afterwards
`scripts/benchmark-contact-sheet.mjs` builds `benchmark-shots/index.html` — a
grid with Android and iOS side by side per case. A single case can be
inspected interactively by opening the same URL in Expo Go.

The screen renders fixture data only — no network, no audio, no sign-in.
Fixtures live in `app-mobile/src/debug-benchmark/fixtures.ts`; hint ranges
are computed from substrings at load time, so texts are safe to edit.

## Coverage matrix

### Scripts under test (group `lines`, one screenshot each)

Every language screen shows the same six states: title line, character
bubble with dotted hint underlines, long wrapping prose line, hidden
challenge range (solid underline), the same line revealed, and a line with
mid-audio word dimming (`audioRangeOverride`).

| Case | Script | What it stresses | Course |
|---|---|---|---|
| `lines-es` | Latin | baseline for comparison | es-en |
| `lines-vi` | Latin + diacritics | stacked tone marks vs line height | vi-en |
| `lines-ru` | Cyrillic | — | ru-en |
| `lines-el` | Greek | — | el-en |
| `lines-ar` | Arabic | RTL flow, ligatures, contextual shaping, bubble tail side | ar-en |
| `lines-he` | Hebrew | RTL flow | he-en |
| `lines-ja` | CJK (native path) | no-space segmentation, SVG dot underlines, furigana | ja-en |
| `lines-zh` | CJK (native path) | as above, pinyin | zh-en |
| `lines-ko` | Hangul (native path) | syllable blocks | none published (code path exists) |
| `lines-hi` | Devanagari | conjuncts, matras, headstroke | hi-en |
| `lines-te` | Telugu | below-base forms, **known clipping regressions** | tel-en |
| `lines-th` | Thai | no spaces, stacked vowels/tone marks | th-en |
| `lines-dv` | Thaana | RTL non-Arabic script (smoke level) | dv-en |
| `lines-tok2` | sitelen pona | custom font path in `languageStyles.ts` | tok-en |

Published scripts intentionally not covered (add when they regress):
Kannada/Bengali/Tamil (Telugu is the Indic canary), Yiddish (Hebrew script
covered by `he`), Georgian.

### Hints (group `hint-popup`)

Auto-opened `HintPopup` over a fixture line: translation wrapping, RTL text
inside the bubble, pronunciation line (furigana `hint-ja`, pinyin `hint-zh`),
and edge clamping (`hint-edge-ar`). Cases: `es`, `ar`, `ja`, `zh`, `te`, `th`
+ edge.

### Exercises (group `exercises`, 5 types × 4 scripts)

Scripts: `es` (Latin), `ar` (RTL), `ja` (CJK), `te` (Indic). Each case stacks
several instances of the same component in forced states, so one screenshot
covers the state axis:

| Case | States shown in one shot |
|---|---|
| `ex-mc-*` | unanswered / one wrong (red X, dimmed) / answered right (green check, others grey) |
| `ex-select-*` | hidden line above; chips unanswered / wrong / right-stay |
| `ex-arrange-*` | fresh / mid-progress (placed chips greyed, line partially revealed) / wrong flash |
| `ex-point-*` | transcript with inline chips: unanswered / wrong + right |
| `ex-match-*` | pairs showing idle / selected / right (green) / matched (faded) / wrong |

States are forced through small optional debug props (`debugInitialState` on
the choice components, deterministic shuffle + forced word states on match) —
never through timers or synthetic taps, so screenshots are reproducible.

### Chip gallery (group `chips`)

`chips`: every `WordChip` status (`idle, selected, right, right-stay,
matched, wrong, off`) × six scripts in one grid — the cheapest way to catch
palette or chip-metric regressions across scripts.

### Dark mode (group `dark`)

Same renderer with the theme forced dark (`?theme=dark`) for a representative
subset: `lines-es`, `lines-ar`, `lines-ja`, `lines-te`, `ex-match-es`,
`hint-ja`, `chips`. Notable: `hiddenUnderline` flips from near-black to
near-white in dark mode.

### Platforms

Every case runs on both platforms; the contact sheet pairs them per case.

| Platform | Driver | Where it runs |
|---|---|---|
| Android | `scripts/mobile-benchmark.sh` (adb deep link + `screencap`) | any machine with an emulator/device |
| iOS | `scripts/mobile-benchmark-ios.sh` (`xcrun simctl openurl` + `simctl io screenshot`) | macOS only |

## Known gaps / future work

- **Header illustration** and the finished-story screen are excluded (remote
  SVG fetch; needs a stub before it can be hermetic).
- Hint popup position is fixed by the harness, not derived from a real word
  tap — bubble rendering and clamping are covered, word-anchoring is not.
- Wrong-flash states are frozen via debug props; the real 820 ms flash timing
  is not exercised.
- No pixel-diffing: the benchmark produces a contact sheet for eyeballing.
  If a golden-image workflow is wanted later, the deterministic fixtures make
  that a small step.
- Listening mode, footer/continue button, and course list screens are out of
  scope (not text-rendering-critical).
