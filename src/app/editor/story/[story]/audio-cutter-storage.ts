"use client";

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
    blobKey: string;
  }[];
  updatedAt: number;
};

const AUDIO_CUTTER_DB_NAME = "audio-cutter";
const AUDIO_CUTTER_OUTPUT_STORE = "output-files";

function getTranscriptStorageKey(storyId: number) {
  return `audio-cutter:transcript:${storyId}`;
}

export function getOutputStorageKey(storyId: number) {
  return `audio-cutter:output:${storyId}`;
}

function parseStoredAudioCutterOutput(raw: string | null) {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAudioCutterOutput;
  } catch {
    return null;
  }
}

function getIndexedDb() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("IndexedDB is not available in this browser.");
  }

  return window.indexedDB;
}

function openAudioCutterDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = getIndexedDb().open(AUDIO_CUTTER_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AUDIO_CUTTER_OUTPUT_STORE)) {
        database.createObjectStore(AUDIO_CUTTER_OUTPUT_STORE);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(
        request.error ?? new Error("Could not open the audio cutter database."),
      );
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    };
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}

async function deleteStoredOutputBlobs(blobKeys: string[]) {
  if (blobKeys.length === 0) return;

  const database = await openAudioCutterDb();

  try {
    const transaction = database.transaction(
      AUDIO_CUTTER_OUTPUT_STORE,
      "readwrite",
    );
    const store = transaction.objectStore(AUDIO_CUTTER_OUTPUT_STORE);

    for (const blobKey of blobKeys) {
      store.delete(blobKey);
    }

    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
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

  const storageKey = getOutputStorageKey(storyId);
  const previousPayload = parseStoredAudioCutterOutput(
    window.localStorage.getItem(storageKey),
  );
  const nextFiles = files.map((file, index) => ({
    name: file.name,
    type: file.type,
    blobKey: `${storageKey}:${index}:${Date.now()}:${globalThis.crypto.randomUUID()}`,
  }));
  const database = await openAudioCutterDb();

  try {
    const transaction = database.transaction(
      AUDIO_CUTTER_OUTPUT_STORE,
      "readwrite",
    );
    const store = transaction.objectStore(AUDIO_CUTTER_OUTPUT_STORE);

    for (const [index, file] of files.entries()) {
      store.put(file, nextFiles[index]?.blobKey);
    }

    await transactionToPromise(transaction);
  } finally {
    database.close();
  }

  const payload: StoredAudioCutterOutput = {
    files: nextFiles,
    updatedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    await deleteStoredOutputBlobs(nextFiles.map((file) => file.blobKey));
    throw error;
  }

  await deleteStoredOutputBlobs(
    (previousPayload?.files ?? []).map((file) => file.blobKey),
  );
}

export async function consumeAudioCutterOutput(storyId: number) {
  if (typeof window === "undefined") return [] as File[];

  const key = getOutputStorageKey(storyId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return [] as File[];

  try {
    const payload = JSON.parse(raw) as StoredAudioCutterOutput;
    if (!Array.isArray(payload.files)) return [] as File[];

    const database = await openAudioCutterDb();
    let files: File[];

    try {
      const transaction = database.transaction(
        AUDIO_CUTTER_OUTPUT_STORE,
        "readonly",
      );
      const store = transaction.objectStore(AUDIO_CUTTER_OUTPUT_STORE);

      files = await Promise.all(
        payload.files.map(async (file) => {
          const blob = await requestToPromise(store.get(file.blobKey));
          if (!(blob instanceof Blob)) {
            throw new Error(`Missing staged audio blob for ${file.name}.`);
          }

          return new File([blob], file.name, {
            type: file.type || blob.type || "audio/mpeg",
          });
        }),
      );

      await transactionToPromise(transaction);
    } finally {
      database.close();
    }

    window.localStorage.removeItem(key);
    void deleteStoredOutputBlobs(payload.files.map((file) => file.blobKey));

    return files;
  } catch {
    return [];
  }
}
