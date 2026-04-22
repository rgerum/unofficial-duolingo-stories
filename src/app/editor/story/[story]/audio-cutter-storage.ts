"use client";

import { decode, encode } from "base64-arraybuffer";
import type { BulkAudioEditorItem } from "@/app/editor/story/[story]/bulk-audio-editor";

export type AudioCutterTranscriptItem = Pick<
  BulkAudioEditorItem,
  "id" | "order" | "lineIndex" | "type" | "speaker" | "content"
>;

type StoredAudioCutterTranscript = {
  items: AudioCutterTranscriptItem[];
  updatedAt: number;
};

type StoredAudioCutterOutput = {
  files: {
    name: string;
    type: string;
    base64: string;
  }[];
  updatedAt: number;
};

function getTranscriptStorageKey(storyId: number) {
  return `audio-cutter:transcript:${storyId}`;
}

export function getOutputStorageKey(storyId: number) {
  return `audio-cutter:output:${storyId}`;
}

export function storeAudioCutterTranscript(
  storyId: number,
  items: AudioCutterTranscriptItem[],
) {
  if (typeof window === "undefined") return;

  const payload: StoredAudioCutterTranscript = {
    items,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(
    getTranscriptStorageKey(storyId),
    JSON.stringify(payload),
  );
}

export function loadAudioCutterTranscript(storyId: number) {
  if (typeof window === "undefined") return [] as AudioCutterTranscriptItem[];

  const raw = window.localStorage.getItem(getTranscriptStorageKey(storyId));
  if (!raw) return [] as AudioCutterTranscriptItem[];

  try {
    const payload = JSON.parse(raw) as StoredAudioCutterTranscript;
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

export async function storeAudioCutterOutput(storyId: number, files: File[]) {
  if (typeof window === "undefined") return;

  const serializedFiles = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      base64: encode(await file.arrayBuffer()),
    })),
  );

  const payload: StoredAudioCutterOutput = {
    files: serializedFiles,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(
    getOutputStorageKey(storyId),
    JSON.stringify(payload),
  );
}

export function consumeAudioCutterOutput(storyId: number) {
  if (typeof window === "undefined") return [] as File[];

  const key = getOutputStorageKey(storyId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return [] as File[];

  window.localStorage.removeItem(key);

  try {
    const payload = JSON.parse(raw) as StoredAudioCutterOutput;
    if (!Array.isArray(payload.files)) return [] as File[];

    return payload.files.map(
      (file) =>
        new File([decode(file.base64)], file.name, {
          type: file.type || "audio/mpeg",
        }),
    );
  } catch {
    return [];
  }
}
