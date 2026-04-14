"use client";

import React from "react";
import { createPortal } from "react-dom";
import WaveSurfer from "wavesurfer.js";
import { useWavesurfer } from "@wavesurfer/react";
import Regions from "wavesurfer.js/dist/plugins/regions.js";
import { unzipSync } from "fflate";
import { Volume2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import PlayAudio from "@/components/PlayAudio";
import StoryLineHints from "@/components/StoryLineHints";
import type {
  Audio,
  ContentWithHints,
  HideRange,
} from "@/components/editor/story/syntax_parser_types";
import {
  text_to_keypoints,
  timings_to_text,
} from "@/lib/editor/audio/audio_edit_tools";
import { splitTextTokens } from "@/lib/editor/tts_transcripte";

const PUBLIC_BLOB_BASE_URL =
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/";
const DEFAULT_WAVEFORM_ZOOM = 420;
const MIN_WAVEFORM_ZOOM = 40;
const MAX_WAVEFORM_ZOOM = 640;
const WAVEFORM_ZOOM_STEP = 40;
const ZIP_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "multipart/x-zip",
]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".ogg", ".aac"]);

type BulkAudioEditorDraft = {
  file: File | null;
  localUrl: string | null;
  uploadedFilename: string;
  uploadState: "idle" | "uploading" | "uploaded" | "failed";
  error: string | null;
  matchSource: "existing" | "filename" | "order" | "manual" | null;
  timingText: string;
};

export type BulkAudioEditorItem = {
  id: string;
  order: number;
  lineIndex: number;
  type: "HEADER" | "LINE";
  speaker: string;
  content: ContentWithHints;
  hideRangesForChallenge?: HideRange[];
  existingFilename: string;
  existingKeypoints: { rangeEnd: number; audioStart: number }[];
  ssml: Audio["ssml"];
};

export type BulkAudioEditorUpdate = {
  itemId: string;
  filename: string;
  keypoints: { rangeEnd: number; audioStart: number }[];
  serializedText: string;
  ssml: Audio["ssml"];
};

interface Region {
  start: number;
  element?: HTMLElement | null;
  content?: HTMLElement;
  innerText?: string;
}

interface RegionsPlugin {
  regions: Array<
    Region & {
      setOptions: (options: { start?: number; end?: number }) => void;
    }
  >;
  addRegion: (options: {
    start: number;
    content: string;
    color: string;
  }) => void;
  on: (event: string, callback: (region: Region) => void) => void;
  un: (event: string, callback: (region: Region) => void) => void;
}

interface Part {
  text: string;
  pos: number;
}

function cumulativeSums(values: number[]): number[] {
  let total = 0;
  const sums: number[] = [];
  values.forEach((v) => {
    total += v;
    sums.push(total);
  });
  return sums;
}

function stripAudioPathPrefix(filename: string) {
  if (!filename) return "";
  if (filename.startsWith("audio/")) {
    return filename.slice("audio/".length);
  }
  return filename;
}

function getPublicAudioUrl(filename: string) {
  if (!filename) return "";
  if (filename.startsWith("blob:") || filename.startsWith("http")) {
    return filename;
  }
  return `${PUBLIC_BLOB_BASE_URL}${filename.startsWith("audio/") ? filename : `audio/${filename}`}`;
}

function isZipFile(file: File) {
  return (
    ZIP_MIME_TYPES.has(file.type) || file.name.toLowerCase().endsWith(".zip")
  );
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

function getAudioMimeType(filename: string) {
  const extension = getFileExtension(filename);
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".ogg") return "audio/ogg";
  if (extension === ".aac") return "audio/aac";
  return "";
}

function isAudioFilename(filename: string) {
  return AUDIO_EXTENSIONS.has(getFileExtension(filename));
}

function timingTextFromKeypoints(
  keypoints: { rangeEnd: number; audioStart: number }[],
) {
  let text = "";
  let lastEnd = 0;
  let lastTime = 0;
  for (const point of keypoints) {
    text += `;${Math.round(point.rangeEnd - lastEnd)},${Math.round(point.audioStart - lastTime)}`;
    lastEnd = point.rangeEnd;
    lastTime = point.audioStart;
  }
  return text;
}

function createDraft(item: BulkAudioEditorItem): BulkAudioEditorDraft {
  return {
    file: null,
    localUrl: null,
    uploadedFilename: "",
    uploadState: "idle",
    error: null,
    matchSource: item.existingFilename ? "existing" : null,
    timingText: timingTextFromKeypoints(item.existingKeypoints),
  };
}

function createDraftMap(items: BulkAudioEditorItem[]) {
  return Object.fromEntries(items.map((item) => [item.id, createDraft(item)]));
}

function revokeDraftUrls(drafts: Record<string, BulkAudioEditorDraft>) {
  for (const draft of Object.values(drafts)) {
    if (draft.localUrl) URL.revokeObjectURL(draft.localUrl);
  }
}

function getLeadingNumber(filename: string) {
  const match = filename.match(/^(\d{1,4})(?:\D|$)/);
  return match ? Number(match[1]) : null;
}

const naturalSort = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function isChanged(item: BulkAudioEditorItem, draft: BulkAudioEditorDraft) {
  const filename = draft.uploadedFilename || item.existingFilename;
  if (draft.file) return true;
  if (!filename) return false;
  const initialText = timings_to_text({
    filename: item.existingFilename,
    keypoints: item.existingKeypoints,
  });
  return `$${filename}${draft.timingText}` !== initialText;
}

async function uploadAudioFile(file: File, storyId: number) {
  const data = new FormData();
  data.set("file", file);
  data.set("story_id", String(storyId));

  const response = await fetch("/audio/upload", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as {
    success?: boolean;
    filename?: string;
  };

  if (!payload.success || !payload.filename) {
    throw new Error("Upload failed.");
  }

  return payload.filename;
}

async function expandUploadFiles(files: File[]) {
  const expandedFiles: File[] = [];

  for (const file of files) {
    if (isZipFile(file)) {
      const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
      for (const [archivePath, content] of Object.entries(archive)) {
        const name = archivePath.split("/").pop() ?? archivePath;
        if (!name || !isAudioFilename(name)) continue;
        const fileBytes = new Uint8Array(content);
        expandedFiles.push(
          new File([fileBytes], name, {
            type: getAudioMimeType(name),
          }),
        );
      }
      continue;
    }

    if (file.type.startsWith("audio/") || isAudioFilename(file.name)) {
      expandedFiles.push(file);
    }
  }

  return expandedFiles;
}

function rowLabel(item: BulkAudioEditorItem) {
  return item.type === "HEADER" ? "Header" : `Line ${item.order}`;
}

function statusLabel(item: BulkAudioEditorItem, draft: BulkAudioEditorDraft) {
  if (draft.uploadState === "failed") return "Upload failed";
  if (draft.file && !draft.uploadedFilename) return "Staged";
  if (draft.uploadedFilename || item.existingFilename) return "Ready";
  return "Missing audio";
}

function getParts(text: string) {
  const parts = splitTextTokens(text);
  const words: Part[] = [];
  if (parts[parts.length - 1] === "") parts.pop();
  let currentPos = 0;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index] ?? "";
    if (index % 2 === 0) {
      words.push({ text: part, pos: currentPos });
    }
    currentPos += part.length;
  }
  return words;
}

function getAutoRegionStarts(parts: Part[], duration: number) {
  if (parts.length === 0 || duration <= 0) return [];

  const startPadding = Math.min(0.08, duration * 0.05);
  const endPadding = Math.min(0.14, duration * 0.08);
  const usableDuration = Math.max(0.05, duration - startPadding - endPadding);
  const weights = parts.map((part) => {
    const trimmed = part.text.trim();
    const charCount = Math.max(1, trimmed.length);
    return Math.max(1, Math.round(Math.sqrt(charCount) * 10));
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

  let elapsed = startPadding;
  return parts.map((_, index) => {
    const currentStart = elapsed;
    const sliceDuration = usableDuration * (weights[index]! / totalWeight);
    elapsed += sliceDuration;
    return currentStart;
  });
}

function timingTextFromStarts(parts: Part[], starts: number[]) {
  let text = "";
  let previousPos = 0;
  let previousStart = 0;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) continue;
    const nextPos = part.pos + part.text.length;
    const nextStart = starts[index] ?? 0;
    text += `;${nextPos - previousPos},${Math.round(nextStart * 1000 - previousStart)}`;
    previousPos = nextPos;
    previousStart = Math.round(nextStart * 1000);
  }

  return text;
}

function getWordPlaybackSegments(
  parts: Part[],
  timingText: string,
  durationMs: number,
) {
  const startsMs = timingText
    ? cumulativeSums(
        [...timingText.matchAll(/(\d*),(\d*)/g)].map((match) =>
          Number.parseInt(match[2] ?? "0", 10),
        ),
      )
    : [];

  return parts.map((part, index) => {
    const startMs = startsMs[index] ?? 0;
    const nextStartMs = startsMs[index + 1] ?? durationMs;
    const safeEndMs = Math.max(startMs + 60, nextStartMs);
    return {
      text: part.text,
      startMs,
      endMs: safeEndMs,
    };
  });
}

function BulkAudioRow({
  item,
  draft,
  onChange,
}: {
  item: BulkAudioEditorItem;
  draft: BulkAudioEditorDraft;
  onChange: (
    updater: (draft: BulkAudioEditorDraft) => BulkAudioEditorDraft,
  ) => void;
}) {
  const fileInputId = React.useId();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const parts = React.useMemo(
    () => getParts(item.content.text),
    [item.content.text],
  );
  const [audioRange, setAudioRange] = React.useState(99999);
  const [zoomPxPerSec, setZoomPxPerSec] = React.useState(DEFAULT_WAVEFORM_ZOOM);
  const [waveformReady, setWaveformReady] = React.useState(false);
  const [audioDurationMs, setAudioDurationMs] = React.useState(0);
  const [wordPlaybackHost, setWordPlaybackHost] =
    React.useState<HTMLDivElement | null>(null);
  const audioUrl = React.useMemo(() => {
    if (draft.localUrl) return draft.localUrl;
    const filename = draft.uploadedFilename || item.existingFilename;
    return filename ? getPublicAudioUrl(filename) : "";
  }, [draft.localUrl, draft.uploadedFilename, item.existingFilename]);

  const onDecode = React.useCallback(
    (wavesurfer: WaveSurfer, duration: number) => {
      const timings = draft.timingText
        ? cumulativeSums(
            [...draft.timingText.matchAll(/(\d*),(\d*)/g)].map((match) => {
              return Number.parseInt(match[2] ?? "0", 10) / 1000;
            }),
          )
        : [];

      const plugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;

      for (let index = 0; index < parts.length; index += 1) {
        if (!plugin.regions[index]) {
          plugin.addRegion({
            start:
              timings[index] ||
              duration * (parts[index]!.pos / item.content.text.length),
            content: parts[index]!.text,
            color: "#e06c75",
          });
        }

        plugin.regions[index]!.innerText = parts[index]!.text;
        plugin.regions[index]!.setOptions({
          start:
            timings[index] ||
            duration * (parts[index]!.pos / item.content.text.length),
        });
      }
    },
    [draft.timingText, item.content.text.length, parts],
  );

  const onTimeUpdate = React.useCallback(
    (wavesurfer: WaveSurfer, currentTime: number) => {
      const plugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;
      const regions = plugin.regions.sort(
        (left, right) => left.start - right.start,
      );
      let pos = 0;
      for (let index = 0; index < regions.length; index += 1) {
        if (regions[index]!.start < currentTime && parts[index] !== undefined) {
          pos = parts[index]!.pos;
        }
      }
      if (pos !== audioRange) {
        setAudioRange(pos);
      }
    },
    [audioRange, parts],
  );

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
          (parts[index]!.text.length +
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

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: 60,
    waveColor: "#1cb0f6",
    progressColor: "rgba(28,176,246,0.62)",
    cursorColor: "#0f5f83",
    normalize: true,
    barWidth: 4,
    barGap: 3,
    barRadius: 30,
    minPxPerSec: DEFAULT_WAVEFORM_ZOOM,
    fillParent: false,
    autoScroll: false,
    hideScrollbar: false,
    url: audioUrl || undefined,
    plugins: React.useMemo(() => [Regions.create()], []),
  });

  React.useEffect(() => {
    if (!audioUrl) {
      setZoomPxPerSec(DEFAULT_WAVEFORM_ZOOM);
      setWaveformReady(false);
      setAudioDurationMs(0);
    }
  }, [audioUrl]);

  React.useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.setOptions({
      minPxPerSec: zoomPxPerSec,
      fillParent: false,
      autoScroll: false,
      hideScrollbar: false,
    });
  }, [wavesurfer, zoomPxPerSec]);

  React.useEffect(() => {
    if (!wavesurfer) return;
    setWaveformReady(false);

    const onDecodeEvent = (duration: number) => {
      setWaveformReady(true);
      setAudioDurationMs(Math.round(duration * 1000));
      onDecode(wavesurfer, duration);
    };
    const onTimeUpdateEvent = (currentTime: number) =>
      onTimeUpdate(wavesurfer, currentTime);
    const onReadyEvent = () => {
      setWaveformReady(true);
      setAudioDurationMs(Math.round(wavesurfer.getDuration() * 1000));
    };

    wavesurfer.on("decode", onDecodeEvent);
    wavesurfer.on("timeupdate", onTimeUpdateEvent);
    wavesurfer.on("ready", onReadyEvent);

    const plugin = (wavesurfer as unknown as { plugins: RegionsPlugin[] })
      .plugins[0];
    const onRegionUpdatedEvent = () => {
      onRegionUpdated(plugin);
    };
    plugin?.on("region-updated", onRegionUpdatedEvent);

    return () => {
      wavesurfer.un("decode", onDecodeEvent);
      wavesurfer.un("timeupdate", onTimeUpdateEvent);
      wavesurfer.un("ready", onReadyEvent);
      plugin?.un("region-updated", onRegionUpdatedEvent);
    };
  }, [onDecode, onRegionUpdated, onTimeUpdate, wavesurfer]);

  React.useEffect(() => {
    if (!wavesurfer) {
      setWordPlaybackHost(null);
      return;
    }

    const wrapper = (
      wavesurfer as unknown as {
        getWrapper?: () => HTMLElement;
      }
    ).getWrapper?.();

    if (!wrapper) {
      setWordPlaybackHost(null);
      return;
    }

    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.left = "0";
    host.style.top = "68px";
    host.style.width = "100%";
    host.style.height = "28px";
    host.style.pointerEvents = "none";
    host.style.zIndex = "6";
    wrapper.appendChild(host);
    setWordPlaybackHost(host);

    return () => {
      if (wrapper.contains(host)) {
        wrapper.removeChild(host);
      }
      wrapper.style.paddingBottom = "";
      setWordPlaybackHost(null);
    };
  }, [wavesurfer]);

  const wordPlaybackSegments = React.useMemo(
    () => getWordPlaybackSegments(parts, draft.timingText, audioDurationMs),
    [audioDurationMs, draft.timingText, parts],
  );

  React.useEffect(() => {
    const wrapper = wavesurfer
      ? (
          wavesurfer as unknown as {
            getWrapper?: () => HTMLElement;
          }
        ).getWrapper?.()
      : undefined;
    if (!wrapper) return;

    const hasWordPlayback =
      audioDurationMs > 0 && wordPlaybackSegments.length > 0;
    wrapper.style.paddingBottom = hasWordPlayback ? "36px" : "";
    if (wordPlaybackHost) {
      wordPlaybackHost.style.display = hasWordPlayback ? "block" : "none";
    }
  }, [
    audioDurationMs,
    wavesurfer,
    wordPlaybackHost,
    wordPlaybackSegments.length,
  ]);

  const onPlayPause = React.useCallback(() => {
    wavesurfer?.playPause();
  }, [wavesurfer]);

  const onZoomIn = React.useCallback(() => {
    setZoomPxPerSec((current) =>
      Math.min(MAX_WAVEFORM_ZOOM, current + WAVEFORM_ZOOM_STEP),
    );
  }, []);

  const onZoomOut = React.useCallback(() => {
    setZoomPxPerSec((current) =>
      Math.max(MIN_WAVEFORM_ZOOM, current - WAVEFORM_ZOOM_STEP),
    );
  }, []);

  const onZoomFit = React.useCallback(() => {
    if (!wavesurfer || !waveformReady || !scrollContainerRef.current) return;
    const duration = wavesurfer.getDuration();
    if (!duration || !Number.isFinite(duration)) return;
    const fittedZoom = Math.max(
      MIN_WAVEFORM_ZOOM,
      Math.round(scrollContainerRef.current.clientWidth / duration),
    );
    setZoomPxPerSec(fittedZoom);
  }, [waveformReady, wavesurfer]);

  const onAutoTiming = React.useCallback(() => {
    if (!wavesurfer || parts.length === 0) return;
    const duration = wavesurfer.getDuration();
    if (!duration || !Number.isFinite(duration)) return;

    const plugin = (wavesurfer as unknown as { plugins: RegionsPlugin[] })
      .plugins[0];
    if (!plugin) return;

    const autoStarts = getAutoRegionStarts(parts, duration);
    for (let index = 0; index < parts.length; index += 1) {
      if (!plugin.regions[index]) {
        plugin.addRegion({
          start: autoStarts[index] ?? 0,
          content: parts[index]!.text,
          color: "#e06c75",
        });
      } else {
        plugin.regions[index]!.setOptions({
          start: autoStarts[index] ?? 0,
        });
      }
    }

    onRegionUpdated(plugin);
  }, [onRegionUpdated, parts, wavesurfer]);

  const onPlayWord = React.useCallback(
    (startMs: number, endMs: number) => {
      if (!wavesurfer) return;
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return;
      void wavesurfer.play(startMs / 1000, endMs / 1000);
    },
    [wavesurfer],
  );

  const plugin = (wavesurfer as unknown as { plugins?: RegionsPlugin[] } | null)
    ?.plugins?.[0];

  const onFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      onChange((currentDraft) => {
        if (currentDraft.localUrl) URL.revokeObjectURL(currentDraft.localUrl);
        return {
          ...currentDraft,
          file,
          localUrl: URL.createObjectURL(file),
          uploadedFilename: "",
          uploadState: "idle",
          error: null,
          matchSource: "manual",
        };
      });
      event.target.value = "";
    },
    [onChange],
  );

  return (
    <div className="border-b border-[var(--color_base_border)] px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text-color)]">
              {rowLabel(item)}
              {item.speaker ? ` · ${item.speaker}` : ""}
            </div>
            <div className="text-xs text-[var(--text-color-dim)]">
              {statusLabel(item, draft)}
              {draft.matchSource ? ` · ${draft.matchSource}` : ""}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <label
              htmlFor={fileInputId}
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
            >
              Upload audio
            </label>
            <input
              id={fileInputId}
              className="sr-only"
              type="file"
              accept="audio/*"
              onChange={onFileChange}
            />
            <PlayAudio onClick={audioUrl ? onPlayPause : undefined} />
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={onAutoTiming}
                disabled={!audioUrl}
                title={audioUrl ? "Auto-adjust timing" : "Load audio first"}
              >
                Auto
              </button>
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={onZoomOut}
              >
                -
              </button>
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={onZoomIn}
              >
                +
              </button>
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={onZoomFit}
              >
                Fit
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-[40ch] truncate text-xs text-[var(--text-color-dim)]">
          {draft.file?.name ||
            draft.uploadedFilename ||
            item.existingFilename ||
            "No file selected."}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="min-w-0">
          <div ref={scrollContainerRef}>
            <div ref={containerRef} />
            {wordPlaybackHost &&
            audioDurationMs > 0 &&
            wordPlaybackSegments.length > 0
              ? createPortal(
                  <>
                    {wordPlaybackSegments.map((segment, index) => {
                      const regionLeft =
                        plugin?.regions[index]?.element?.style.left;
                      const fallbackLeft =
                        audioDurationMs > 0
                          ? `${(segment.startMs / audioDurationMs) * 100}%`
                          : "0%";

                      return (
                        <button
                          key={`${segment.text}-${segment.startMs}-${index}`}
                          type="button"
                          style={{
                            position: "absolute",
                            top: "0",
                            left: regionLeft || fallbackLeft,
                            transform: "translateX(-50%)",
                            width: "24px",
                            height: "24px",
                            borderRadius: "9999px",
                            border: "1px solid var(--color_base_border)",
                            background: "var(--body-background)",
                            color: "var(--text-color-dim)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            pointerEvents: "auto",
                          }}
                          title={`Play "${segment.text}"`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onPlayWord(segment.startMs, segment.endMs);
                          }}
                        >
                          <Volume2Icon className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </>,
                  wordPlaybackHost,
                )
              : null}
          </div>
          {draft.error ? (
            <p className="mt-2 text-xs text-[#b33b3b]">{draft.error}</p>
          ) : null}
        </div>

        <div className="min-w-0 border border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-color-dim)]">
            Story preview
          </div>
          <StoryLineHints
            audioRange={audioRange}
            hideRangesForChallenge={item.hideRangesForChallenge ?? []}
            content={item.content}
          />
        </div>
      </div>
    </div>
  );
}

export default function BulkAudioEditor({
  open,
  onOpenChange,
  storyId,
  items,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: number;
  items: BulkAudioEditorItem[];
  onApply: (updates: BulkAudioEditorUpdate[]) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const wasOpenRef = React.useRef(false);
  const draftsRef = React.useRef<Record<string, BulkAudioEditorDraft>>(
    createDraftMap(items),
  );
  const [drafts, setDrafts] = React.useState<
    Record<string, BulkAudioEditorDraft>
  >(() => createDraftMap(items));
  const [unmatchedFiles, setUnmatchedFiles] = React.useState<string[]>([]);
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);
  const [isPreparingFiles, setIsPreparingFiles] = React.useState(false);

  React.useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  React.useEffect(() => {
    return () => revokeDraftUrls(draftsRef.current);
  }, []);

  React.useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (wasOpen || !open) return;

    revokeDraftUrls(draftsRef.current);
    const nextDrafts = createDraftMap(items);
    draftsRef.current = nextDrafts;
    setDrafts(nextDrafts);
    setUnmatchedFiles([]);
    setApplyError(null);
    setIsPreparingFiles(false);
  }, [items, open]);

  const updateDraft = React.useCallback(
    (
      itemId: string,
      updater: (draft: BulkAudioEditorDraft) => BulkAudioEditorDraft,
    ) => {
      setDrafts((current) => {
        const target = current[itemId];
        if (!target) return current;
        return {
          ...current,
          [itemId]: updater(target),
        };
      });
    },
    [],
  );

  const applyMatchedFiles = React.useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const sortedFiles = [...files].sort((left, right) =>
        naturalSort.compare(left.name, right.name),
      );
      const unmatched = new Set<string>();
      setDrafts((current) => {
        const next = { ...current };
        const sortedItems = [...items].sort((left, right) => {
          if (left.order !== right.order) return left.order - right.order;
          return left.lineIndex - right.lineIndex;
        });

        for (const [index, file] of sortedFiles.entries()) {
          const item = sortedItems[index];
          if (!item) {
            unmatched.add(file.name);
            continue;
          }

          const previous = next[item.id];
          if (!previous) continue;
          if (previous.localUrl) URL.revokeObjectURL(previous.localUrl);

          next[item.id] = {
            ...previous,
            file,
            localUrl: URL.createObjectURL(file),
            uploadedFilename: "",
            uploadState: "idle",
            error: null,
            matchSource: "order",
          };
        }

        return next;
      });

      setUnmatchedFiles([...unmatched]);
    },
    [items],
  );

  const onBulkFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      setIsPreparingFiles(true);
      try {
        const expandedFiles = await expandUploadFiles(files);
        applyMatchedFiles(expandedFiles);
        if (expandedFiles.length === 0 && files.length > 0) {
          setApplyError("No audio files were found in the selected upload.");
        } else {
          setApplyError(null);
        }
      } catch (error) {
        setApplyError(
          error instanceof Error && error.message
            ? error.message
            : "Could not read the selected zip file.",
        );
      } finally {
        setIsPreparingFiles(false);
      }
    },
    [applyMatchedFiles],
  );

  const summary = React.useMemo(() => {
    let ready = 0;
    let changed = 0;
    for (const item of items) {
      const draft = drafts[item.id];
      if (!draft) continue;
      if (draft.file || draft.uploadedFilename || item.existingFilename) {
        ready += 1;
      }
      if (isChanged(item, draft)) {
        changed += 1;
      }
    }
    return {
      total: items.length,
      ready,
      changed,
    };
  }, [drafts, items]);

  const uploadPendingFiles = React.useCallback(async () => {
    const pendingItems = items.filter((item) => {
      const draft = draftsRef.current[item.id];
      return draft?.file && !draft.uploadedFilename;
    });

    const uploadedFilenames: Record<string, string> = {};
    const failedIds: string[] = [];

    for (const item of pendingItems) {
      const draft = draftsRef.current[item.id];
      if (!draft?.file) continue;

      updateDraft(item.id, (currentDraft) => ({
        ...currentDraft,
        uploadState: "uploading",
        error: null,
      }));

      try {
        const filename = stripAudioPathPrefix(
          await uploadAudioFile(draft.file, storyId),
        );
        uploadedFilenames[item.id] = filename;
        updateDraft(item.id, (currentDraft) => ({
          ...currentDraft,
          uploadedFilename: filename,
          uploadState: "uploaded",
          error: null,
        }));
      } catch (error) {
        failedIds.push(item.id);
        updateDraft(item.id, (currentDraft) => ({
          ...currentDraft,
          uploadState: "failed",
          error:
            error instanceof Error && error.message
              ? error.message
              : "Upload failed.",
        }));
      }
    }

    return { uploadedFilenames, failedIds };
  }, [items, storyId, updateDraft]);

  const onApplyChanges = React.useCallback(async () => {
    setApplyError(null);
    setIsApplying(true);

    try {
      const { uploadedFilenames, failedIds } = await uploadPendingFiles();
      if (failedIds.length > 0) {
        setApplyError("Some uploads failed. Fix those rows and retry.");
        return;
      }

      const updates: BulkAudioEditorUpdate[] = [];

      for (const item of items) {
        const draft = draftsRef.current[item.id];
        if (!draft) continue;
        const filename =
          uploadedFilenames[item.id] ||
          draft.uploadedFilename ||
          item.existingFilename;
        if (!filename) continue;

        const serializedText = `$${filename}${draft.timingText}`;
        const [_, keypoints] = text_to_keypoints(
          `${filename}${draft.timingText}`,
        );
        const initialText = timings_to_text({
          filename: item.existingFilename,
          keypoints: item.existingKeypoints,
        });

        if (serializedText === initialText) continue;

        updates.push({
          itemId: item.id,
          filename,
          keypoints,
          serializedText,
          ssml: item.ssml,
        });
      }

      onApply(updates);
      onOpenChange(false);
    } catch (error) {
      setApplyError(
        error instanceof Error && error.message
          ? error.message
          : "Could not apply bulk audio changes.",
      );
    } finally {
      setIsApplying(false);
    }
  }, [items, onApply, onOpenChange, uploadPendingFiles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="inset-2 h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:top-2 sm:left-2 sm:max-w-none sm:translate-x-0 sm:translate-y-0"
      >
        <div className="flex min-h-full min-w-[1100px] flex-col bg-[var(--body-background)]">
          <div className="border-b border-[var(--color_base_border)] px-4 py-4">
            <DialogTitle className="text-lg font-semibold text-[var(--text-color)]">
              Bulk audio editor
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-[var(--text-color-dim)]">
              Work through the story line by line with the same audio editor
              layout, then apply all updated audio entries back into the story
              text at once.
            </DialogDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color_base_border)] px-4 py-3">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreparingFiles}
            >
              {isPreparingFiles ? "Preparing..." : "Upload files"}
            </button>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              multiple={true}
              accept="audio/*,.zip,application/zip"
              onChange={onBulkFileChange}
            />
            <div className="text-sm text-[var(--text-color-dim)]">
              {summary.ready} / {summary.total} rows have audio
            </div>
            <div className="text-sm text-[var(--text-color-dim)]">
              {summary.changed} rows changed
            </div>
            {isPreparingFiles ? (
              <div className="text-sm text-[var(--text-color-dim)]">
                Reading selected audio files...
              </div>
            ) : null}
            {unmatchedFiles.length > 0 ? (
              <div className="text-sm text-[#b33b3b]">
                Unmatched: {unmatchedFiles.join(", ")}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {items.map((item) => {
              const draft = drafts[item.id];
              if (!draft) return null;
              return (
                <BulkAudioRow
                  key={item.id}
                  item={item}
                  draft={draft}
                  onChange={(updater) => updateDraft(item.id, updater)}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color_base_border)] px-4 py-3">
            <div className="text-sm text-[var(--text-color-dim)]">
              {summary.changed > 0
                ? `${summary.changed} rows will be written back when you apply.`
                : "No changed rows yet."}
            </div>
            <div className="flex items-center gap-2">
              {applyError ? (
                <div className="text-sm text-[#b33b3b]">{applyError}</div>
              ) : null}
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={() => onOpenChange(false)}
                disabled={isApplying}
              >
                Close
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#0f5f83] bg-[#1cb0f6] px-3 text-sm font-semibold leading-none text-white transition-colors hover:bg-[#1598d7] disabled:cursor-default disabled:opacity-70"
                onClick={() => {
                  void onApplyChanges();
                }}
                disabled={isApplying || summary.changed === 0}
              >
                {isApplying ? "Applying..." : "Apply bulk audio"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
