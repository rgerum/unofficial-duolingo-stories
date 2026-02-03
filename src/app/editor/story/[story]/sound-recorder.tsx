"use no memo";
import styles from "./sound-recorder.module.css";
import React, { useCallback, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import StoryLineHints from "@/components/StoryLineHints";
import { splitTextTokens } from "@/lib/editor/tts_transcripte";
import TextMarkerEditor from "./TextMarkerEditor";

import { useWavesurfer } from "@wavesurfer/react";
import Regions from "wavesurfer.js/dist/plugins/regions.js";
import PlayAudio from "@/components/PlayAudio";
import type { ContentWithHints } from "@/components/editor/story/syntax_parser_types";

interface Region {
  start: number;
  content?: HTMLElement;
  innerText?: string;
}

interface RegionsPlugin {
  regions: Region[];
  addRegion: (options: {
    start: number;
    content: string;
    color: string;
  }) => void;
  on: (event: string, callback: (region: Region) => void) => void;
}

interface SoundRecorderProps {
  content: ContentWithHints;
  initialTimingText: string;
  url: string;
  story_id: number;
  onClose: () => void;
  onSave: (filename: string, timingText: string) => void;
  editMode?: MarkerMode;
  onEditModeChange?: (mode: MarkerMode) => void;
  soundRecorderNext: () => void;
  soundRecorderPrevious: () => void;
  total_index: number;
  current_index: number;
}

interface Part {
  text: string;
  pos: number;
}

type MarkerMode = "manual" | "auto";

function cumulativeSums(values: number[]): number[] {
  let total = 0;
  const sums: number[] = [];
  values.forEach((v: number) => {
    total += v;
    sums.push(total);
  });
  return sums;
}

/**
 * Strip the $filename prefix from timing text if present.
 * Format: "$filename;timing..." -> ";timing..."
 * Format: "$filename;m=1,2;timing..." -> ";m=1,2;timing..."
 * Legacy: "$filename#markers;timing..." -> "#markers;timing..."
 */
function stripFilenamePrefix(timingText: string): string {
  if (!timingText) return "";
  if (timingText.startsWith("$")) {
    // Find first semicolon or # after $
    const hashIndex = timingText.indexOf("#");
    const semiIndex = timingText.indexOf(";");

    if (hashIndex !== -1 && (semiIndex === -1 || hashIndex < semiIndex)) {
      // Legacy markers: $filename#markers;timing -> #markers;timing
      return timingText.substring(hashIndex);
    } else if (semiIndex !== -1) {
      // No markers: $filename;timing -> ;timing
      return timingText.substring(semiIndex);
    }
    return "";
  }
  return timingText;
}

function parseMarkersFromTimingText(timingText: string): number[] {
  if (!timingText) return [];

  // Strip filename prefix if present
  const stripped = stripFilenamePrefix(timingText);

  // New format: first segment after filename is markers: ";m=1,2;timing..."
  if (stripped.startsWith(";")) {
    const firstSegment = stripped.substring(1).split(";")[0];
    if (firstSegment.startsWith("m=") || firstSegment.startsWith("m:")) {
      const markerStr = firstSegment.substring(2);
      return markerStr
        ? markerStr
            .split(",")
            .map((s) => parseInt(s, 10))
            .filter((n) => !isNaN(n))
        : [];
    }
  }

  // Legacy: marker section starts with #
  if (stripped.startsWith("#")) {
    const markerSection = stripped.split(";")[0];
    let markerStr = markerSection.substring(1); // Remove #
    if (!markerStr) return [];
    if (markerStr.startsWith("m:") || markerStr.startsWith("a:")) {
      markerStr = markerStr.substring(2);
    }
    return markerStr
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
  }

  return [];
}

/**
 * Extract timing portion from timing text (strips filename and markers prefix if present).
 * Format: "$filename;m=markers;timing;timing" -> ";timing;timing"
 * Format: "$filename;timing;timing" -> ";timing;timing"
 * Format: "#markers;timing;timing" -> ";timing;timing"
 */
function getTimingPortion(timingText: string): string {
  if (!timingText) return "";

  // Strip filename prefix if present
  let stripped = stripFilenamePrefix(timingText);

  // Strip new markers segment if present (";m=..." or ";m:...")
  if (stripped.startsWith(";")) {
    const firstSegment = stripped.substring(1).split(";")[0];
    if (firstSegment.startsWith("m=") || firstSegment.startsWith("m:")) {
      const remainderIndex = 1 + firstSegment.length;
      return stripped.substring(remainderIndex);
    }
  }

  // Strip markers prefix if present
  if (stripped.startsWith("#")) {
    const firstSemi = stripped.indexOf(";");
    if (firstSemi === -1) return "";
    return stripped.substring(firstSemi);
  }
  return stripped;
}

/**
 * Generate parts array from manual markers.
 */
function generatePartsFromMarkers(
  text: string,
  markers: number[],
): { text: string; pos: number }[] {
  const parts: { text: string; pos: number }[] = [];
  let lastPos = 0;

  // Sort markers and filter valid ones
  const sortedMarkers = [...markers, text.length]
    .filter((m) => m > 0 && m <= text.length)
    .sort((a, b) => a - b);

  // Remove duplicates
  const uniqueMarkers = [...new Set(sortedMarkers)];

  for (const markerPos of uniqueMarkers) {
    if (markerPos > lastPos) {
      parts.push({
        text: text.substring(lastPos, markerPos),
        pos: lastPos,
      });
      lastPos = markerPos;
    }
  }
  return parts;
}

/**
 * Generate parts array from automatic token splitting.
 */
function generatePartsFromTokens(
  text: string,
): { text: string; pos: number }[] {
  const parts = splitTextTokens(text);
  const result: { text: string; pos: number }[] = [];
  if (parts[parts.length - 1] === "") parts.pop();
  let current_pos = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      result.push({ text: parts[i], pos: current_pos });
    }
    current_pos += parts[i].length;
  }
  return result;
}

/**
 * Check if text likely needs manual markers (e.g., Chinese without spaces).
 */
function shouldSuggestManualMode(text: string): boolean {
  const parts = generatePartsFromTokens(text);
  // If only 1 part and text is longer than 4 chars, probably needs manual markers
  return parts.length === 1 && text.length > 4;
}

async function uploadAudio(
  file: File | null,
  story_id: number,
): Promise<Response | undefined> {
  if (!file) return;

  try {
    const data = new FormData();
    data.set("file", file);
    data.set("story_id", String(story_id));

    const res = await fetch("/audio/upload", {
      method: "POST",
      body: data,
    });
    // handle the error
    if (!res.ok) throw new Error(await res.text());
    return res;
  } catch (e) {
    // Handle errors here
    console.error(e);
  }
}

export default function SoundRecorder({
  content,
  initialTimingText,
  url,
  story_id,
  onClose,
  onSave,
  editMode: editModeProp,
  onEditModeChange,
  soundRecorderNext,
  soundRecorderPrevious,
  total_index,
  current_index,
}: SoundRecorderProps) {
  const containerRef = useRef(null);
  const autosaveTimerRef = useRef<number | undefined>(undefined);
  const lastSavedKeyRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const [urlIndex, setUrlIndex] = useState(url);
  const [audioRange, setAudioRange] = React.useState(-1);
  const [uploaded, setUploaded] = React.useState(!!url);
  const [file, setFile] = React.useState<File | null>(null);

  // Strip filename prefix from timing text - filename is handled separately
  const [timingText, setTimingText] = useState(() =>
    stripFilenamePrefix(initialTimingText),
  );

  // Manual marker support for languages like Chinese
  const initialMarkers = parseMarkersFromTimingText(initialTimingText);
  const [manualMarkers, setManualMarkers] = useState<number[]>(initialMarkers);
  const [editMode, setEditMode] = useState<"auto" | "manual">(
    editModeProp ??
      (initialMarkers.length > 0 || shouldSuggestManualMode(content.text)
        ? "manual"
        : "auto"),
  );

  const parts2 = useMemo(() => {
    // Use manual markers if in manual mode and markers exist
    if (editMode === "manual" && manualMarkers.length > 0) {
      return generatePartsFromMarkers(content.text, manualMarkers);
    }
    // Fall back to automatic token splitting
    return generatePartsFromTokens(content.text);
  }, [content, editMode, manualMarkers]);

  const normalizeFilename = useCallback((filename: string): string => {
    let next = filename;
    if (
      next.startsWith(
        "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/",
      )
    ) {
      next = next.substring(
        "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/".length,
      );
    }
    if (next.startsWith("audio/")) {
      next = next.substring("audio/".length);
    }
    return next;
  }, []);

  function buildTimingText(
    regions: Region[],
    parts: Part[],
    markers?: number[],
  ): string {
    let text = "";

    // Add markers segment (semicolon-delimited) if markers are provided
    if (markers && markers.length > 0) {
      text = ";m=" + markers.join(",");
    }

    // Only iterate up to the minimum of regions and parts length
    const len = Math.min(regions.length, parts.length);
    for (let i = 0; i < len; i++) {
      text +=
        ";" +
        (parts[i].text.length +
          parts[i].pos -
          (parts[i - 1]?.text?.length + parts[i - 1]?.pos || 0)) +
        "," +
        (Math.floor(regions[i].start * 1000) -
          Math.floor(regions[i - 1]?.start * 1000 || 0));
    }
    return text;
  }

  function updateTimingText(regions: Region[], parts2: Part[]) {
    const markers = manualMarkers.length > 0 ? manualMarkers : undefined;
    setTimingText(buildTimingText(regions, parts2, markers));
  }

  const onDecode = useCallback(
    (wavesurfer: WaveSurfer, duration: number) => {
      setAudioRange(-1);
      // Extract timing portion only (strips markers prefix if present)
      const timingPortion = getTimingPortion(initialTimingText);
      const timings = timingPortion
        ? cumulativeSums(
            [...timingPortion.matchAll(/(\d*),(\d*)/g)].map(
              (a) => parseInt(a[2]) / 1000,
            ),
          )
        : [];

      const regionsPlugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;
      for (let i = 0; i < parts2.length; i++) {
        if (i >= regionsPlugin.regions.length)
          regionsPlugin.addRegion({
            start:
              timings[i] || duration * (parts2[i].pos / content.text.length),
            content: parts2[i].text,
            color: "#e06c75",
          });

        regionsPlugin.regions[i].innerText =
          parts2[i].text + " " + parts2[i].pos;
        regionsPlugin.regions[i].start =
          timings[i] || duration * (parts2[i].pos / content.text.length);
      }
    },
    [parts2, initialTimingText, content.text.length],
  );
  const onTimeUpdate = useCallback(
    (wavesurfer: WaveSurfer, currentTime: number) => {
      const regionsPlugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;
      const regions = regionsPlugin.regions.sort(
        (a: Region, b: Region) => a.start - b.start,
      );
      let pos = -1;
      for (let i = 0; i < regions.length; i++) {
        if (regions[i].start < currentTime && parts2[i] !== undefined)
          pos = parts2[i].pos;
      }
      if (pos !== audioRange) {
        setAudioRange(pos);
      }
    },
    [audioRange, parts2],
  );
  const onRegionUpdated = useCallback(
    (regionsPlugin: RegionsPlugin, region: Region) => {
      const regions = regionsPlugin.regions.sort(
        (a: Region, b: Region) => a.start - b.start,
      );
      for (let i = 0; i < regions.length; i++) {
        if (regions[i].content !== undefined && parts2[i] !== undefined)
          regions[i].content!.innerText = parts2[i].text; //+ " " + parts2[i].pos;
      }
      updateTimingText(regions, parts2);
    },
    [parts2],
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
    url: urlIndex,
    plugins: useMemo(
      () => [
        /*Timeline.create({
          timeInterval: 0.01,
          primaryLabelInterval: 0.1,
          secondaryLabelInterval: 0.05,
        }),*/
        Regions.create(),
      ],
      [],
    ),
  });

  if (wavesurfer) {
    wavesurfer.on("decode", (duration) => onDecode(wavesurfer, duration));
    wavesurfer.on("timeupdate", (currentTime) =>
      onTimeUpdate(wavesurfer, currentTime),
    );
    wavesurfer.on("play", () => {
      setAudioRange(-1);
    });
    wavesurfer.on("finish", () => {
      setAudioRange(Number.MAX_SAFE_INTEGER);
    });
    const plugins = (wavesurfer as unknown as { plugins: RegionsPlugin[] })
      .plugins;
    plugins[0].on("region-updated", (region: Region) => {
      if (plugins[0]) onRegionUpdated(plugins[0], region);
    });
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    //console.log("file", file);
    setFile(file);
    setUploaded(false);
    let url = URL.createObjectURL(file);
    setUrlIndex(url);
  };

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  const onSaveX = useCallback(async (
    timingOverride?: string,
    saveKeyOverride?: string,
  ) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    let filename = urlIndex;
    if (!uploaded) {
      if (!file) {
        isSavingRef.current = false;
        return;
      }
      const uploadResult = await uploadAudio(file, story_id);
      if (!uploadResult) {
        window.alert("Upload failed.");
        isSavingRef.current = false;
        return;
      }
      const response = await uploadResult.json();
      if (response.success) {
        setUrlIndex(
          "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/" +
            response.filename,
        );
        filename = response.filename;
        setUploaded(true);
      } else {
        window.alert("Upload failed.");
        isSavingRef.current = false;
        return;
      }
    }
    filename = normalizeFilename(filename);
    const timingToSave = timingOverride ?? timingText;
    onSave(filename, timingToSave);
    const finalSaveKey = saveKeyOverride ?? `${filename}|${timingToSave}`;
    lastSavedKeyRef.current = finalSaveKey;
    isSavingRef.current = false;
  }, [urlIndex, uploaded, file, story_id, timingText, normalizeFilename, onSave]);

  const computeTimingTextFromRegions = useCallback(() => {
    if (!wavesurfer) return timingText;
    const plugins = (wavesurfer as unknown as { plugins?: unknown[] }).plugins;
    if (!plugins || plugins.length === 0) return timingText;
    const regionsPlugin = plugins[0] as RegionsPlugin | undefined;
    if (!regionsPlugin || !regionsPlugin.regions) return timingText;
    const regions = regionsPlugin.regions.sort(
      (a: Region, b: Region) => a.start - b.start,
    );
    const markers = manualMarkers.length > 0 ? manualMarkers : undefined;
    const updated = buildTimingText(regions, parts2, markers);
    setTimingText(updated);
    return updated;
  }, [wavesurfer, timingText, manualMarkers, parts2]);

  // Handler for when markers change - need to update regions intelligently
  const handleMarkersChange = useCallback(
    (newMarkers: number[]) => {
      setManualMarkers(newMarkers);

      if (!wavesurfer) return;

      const regionsPlugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;
      const duration = wavesurfer.getDuration();
      if (!duration) return;

      // Get current region start times (sorted by position)
      const oldRegions = [...regionsPlugin.regions].sort(
        (a, b) => a.start - b.start,
      );
      const oldStartTimes = oldRegions.map((r) => r.start);

      // Calculate old and new parts
      const oldParts =
        manualMarkers.length > 0
          ? generatePartsFromMarkers(content.text, manualMarkers)
          : generatePartsFromTokens(content.text);
      const newParts = generatePartsFromMarkers(content.text, newMarkers);

      // Build a map of old part positions to their start times
      const posToTime = new Map<number, number>();
      for (let i = 0; i < oldParts.length && i < oldStartTimes.length; i++) {
        posToTime.set(oldParts[i].pos, oldStartTimes[i]);
      }

      // Calculate new start times, preserving existing positions where possible
      const newStartTimes: number[] = [];
      for (let i = 0; i < newParts.length; i++) {
        const part = newParts[i];
        if (posToTime.has(part.pos)) {
          // This part position existed before - keep its timing
          newStartTimes.push(posToTime.get(part.pos)!);
        } else {
          // New part - interpolate between neighbors
          const partEnd = part.pos + part.text.length;
          const partMiddle = part.pos + part.text.length / 2;

          // Find neighboring times based on text position
          let prevTime = 0;
          let nextTime = duration;
          let prevPos = 0;
          let nextPos = content.text.length;

          // Find previous part with known time
          for (let j = i - 1; j >= 0; j--) {
            if (newStartTimes[j] !== undefined) {
              prevTime = newStartTimes[j];
              prevPos = newParts[j].pos;
              break;
            }
          }

          // Find next part with known time (from old parts)
          for (let j = i + 1; j < newParts.length; j++) {
            if (posToTime.has(newParts[j].pos)) {
              nextTime = posToTime.get(newParts[j].pos)!;
              nextPos = newParts[j].pos;
              break;
            }
          }

          // Interpolate based on character position
          const ratio =
            nextPos !== prevPos ? (part.pos - prevPos) / (nextPos - prevPos) : 0;
          const interpolatedTime = prevTime + ratio * (nextTime - prevTime);
          newStartTimes.push(interpolatedTime);
        }
      }

      // Clear all regions
      oldRegions.forEach((region: Region & { remove?: () => void }) => {
        if (region.remove) region.remove();
      });
      regionsPlugin.regions.length = 0;

      // Recreate regions with preserved/interpolated times
      for (let i = 0; i < newParts.length; i++) {
        regionsPlugin.addRegion({
          start: newStartTimes[i],
          content: newParts[i].text,
          color: "#e06c75",
        });
      }

      // Update timing text with new markers
      setTimingText(buildTimingText(regionsPlugin.regions, newParts, newMarkers));
    },
    [wavesurfer, content.text, manualMarkers],
  );

  React.useEffect(() => {
    const markers = parseMarkersFromTimingText(initialTimingText);
    setManualMarkers(markers);
    if (editModeProp === undefined) {
      setEditMode(
        markers.length > 0 || shouldSuggestManualMode(content.text)
          ? "manual"
          : "auto",
      );
    }
    setTimingText(stripFilenamePrefix(initialTimingText));
  }, [initialTimingText, content.text, editModeProp]);

  React.useEffect(() => {
    if (editModeProp !== undefined) {
      setEditMode(editModeProp);
    }
  }, [editModeProp]);

  React.useEffect(() => {
    if (!wavesurfer) return;
    computeTimingTextFromRegions();
  }, [wavesurfer, computeTimingTextFromRegions]);

  React.useEffect(() => {
    if (isSavingRef.current) return;
    if (!uploaded && !file) return;
    const filenameKey = uploaded ? normalizeFilename(urlIndex) : "local";
    const saveKey = `${filenameKey}|${timingText}`;

    if (lastSavedKeyRef.current === null) {
      lastSavedKeyRef.current = saveKey;
      return;
    }
    if (lastSavedKeyRef.current === saveKey) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      void onSaveX(timingText, saveKey);
    }, 800);
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    timingText,
    urlIndex,
    uploaded,
    file,
    onSaveX,
    normalizeFilename,
  ]);

  const handleClose = useCallback(async () => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    if (!uploaded && !file) {
      onClose();
      return;
    }
    const filenameKey = uploaded ? normalizeFilename(urlIndex) : "local";
    const timingToSave = computeTimingTextFromRegions();
    const saveKey = `${filenameKey}|${timingToSave}`;
    if (lastSavedKeyRef.current !== saveKey) {
      await onSaveX(timingToSave, saveKey);
    }
    onClose();
  }, [
    uploaded,
    file,
    urlIndex,
    timingText,
    onSaveX,
    onClose,
    normalizeFilename,
    computeTimingTextFromRegions,
  ]);

  //return <></>;
  return (
    <div className={styles.container}>
      <button className={styles.close} onClick={() => void handleClose()}>
        X
      </button>
      <div className={styles.toolbar}>
        <input type="file" onChange={handleFileChange} accept="audio/*" />
        <PlayAudio onClick={onPlayPause} />
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${editMode === "auto" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              setEditMode("auto");
              onEditModeChange?.("auto");
            }}
            type="button"
          >
            Auto
          </button>
          <button
            className={`${styles.modeButton} ${editMode === "manual" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              setEditMode("manual");
              onEditModeChange?.("manual");
            }}
            type="button"
          >
            Manual
          </button>
        </div>
      </div>
      {editMode === "manual" && (
        <TextMarkerEditor
          text={content.text}
          markers={manualMarkers}
          onMarkersChange={handleMarkersChange}
        />
      )}
      <StoryLineHints
        audioRange={audioRange}
        hideRangesForChallenge={[]}
        content={content}
        splitPositions={manualMarkers.length > 0 ? manualMarkers : undefined}
      />
      <p className={styles.timingText}>{timingText}</p>
      <div ref={containerRef} />
      <div className={styles.footer}>
        <button onClick={soundRecorderPrevious}>Previous</button>
        <button onClick={soundRecorderNext}>Next</button>
        <span className={styles.pageInfo}>
          {current_index + 1} / {total_index}
        </span>
      </div>
    </div>
  );
}
