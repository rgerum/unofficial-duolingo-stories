# Bulk Audio Editor Spec

## Goal

Create a dedicated story-level audio workspace that lets editors upload many audio files, review line-to-file matching, set word timing markers quickly, test playback, and apply all changes back to the story editor in one pass.

## Why This Exists

The current audio workflow is line-by-line:

- open one line
- upload one file
- adjust timings
- save
- move to the next line

That is too click-heavy for story-wide recording passes. Bulk audio editing should keep the editor in a single focused workspace.

## Constraints

- Story audio is still stored inline in the story text as `$filename;timings`.
- Each audio-capable story element is mapped through `audio.ssml.inser_index`.
- Replacing many audio lines must avoid line-number drift while editing the document.
- Existing single-line audio editing stays available for cleanup and edge cases.

## V1 Scope

### Entry Point

- Add a `Bulk Audio` action to the story editor header.
- Open a dedicated modal instead of reusing the single-line overlay.

### Data Model

The bulk editor works from parsed story elements and only includes audio-capable items:

- header audio
- line audio

Each row carries:

- display order
- story `line_index`
- speaker
- source text
- existing filename
- existing keypoints
- SSML insertion metadata

### Layout

Two-pane modal:

- Left pane: scrollable queue of audio rows with status and file assignment.
- Right pane: active row editor with audio player, timing tools, and token list.

### File Workflow

- Accept many files via drag-and-drop or file picker.
- Auto-match by leading filename number when possible.
- Fallback to assignment by row order for unmatched files.
- Allow replacing the file for the active row manually.
- Keep unmatched files visible so the user can resolve them.

### Timing Workflow

- Show tokenized story text for the active row.
- Let the user assign the current playback position to the selected token.
- Allow clearing timings and removing the last marker.
- Preserve existing timings until the user changes them.

### Status Model

Rows surface these states:

- missing
- staged
- uploaded
- timed
- failed

Top-level summary shows counts for:

- total rows
- ready rows
- timed rows
- missing rows

### Apply Flow

- Upload any newly staged local files.
- Convert timing markers into keypoints.
- Serialize each changed row back into `$filename;timings`.
- Apply all row edits safely to the CodeMirror document.

## V1 Non-Goals

- Automatic forced alignment
- Story-level waveform stitching
- Audio deletion and blob cleanup
- Server-side batch upload endpoint
- Cross-session draft persistence

## Follow-Up Ideas

- Auto-advance while marking timings during playback
- Keyboard-first transport and marking shortcuts
- Smarter filename matching with speaker/text hints
- Even-spacing starter markers for untimed files
- Batch retry and resumable draft state
