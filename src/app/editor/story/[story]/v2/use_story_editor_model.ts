"use client";

import React from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  processStoryFile,
  type StoryType,
} from "@/components/editor/story/syntax_parser_new";
import type { Avatar, StoryData } from "@/app/editor/story/[story]/types";

type LanguageLike = {
  short: string;
  rtl: boolean;
  tts_replace: string | null;
};

type ImageLike = {
  active: string;
  gilded: string;
  locked: string;
};

type UseStoryEditorModelArgs = {
  storyData: StoryData;
  avatarNames: Record<number, Avatar>;
  docText: string;
  revision: number;
  learningLanguage?: LanguageLike;
  fromLanguage?: LanguageLike;
};

function toConvexValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => toConvexValue(item));
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toConvexValue(item);
    }
    return result;
  }
  return value;
}

export type EditorModel = {
  parsedStory: StoryType & {
    learning_language_rtl?: boolean;
    from_language_rtl?: boolean;
    learning_language?: string;
    from_language?: string;
    illustrations: {
      active?: string;
      gilded?: string;
      locked?: string;
    };
  };
  parsedMeta: ReturnType<typeof processStoryFile>[1];
  audioInsertLines: ReturnType<typeof processStoryFile>[2];
  save: () => Promise<void>;
  remove: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  saveError: boolean;
  saveErrorMessage: string;
  clearSaveError: () => void;
  lastSavedAt: number | null;
  dirty: boolean;
};

export function useStoryEditorModel({
  storyData,
  avatarNames,
  docText,
  revision,
  learningLanguage,
  fromLanguage,
}: UseStoryEditorModelArgs): EditorModel {
  const convex = useConvex();
  const setStoryMutation = useMutation(api.storyWrite.setStory);
  const deleteStoryMutation = useMutation(api.storyWrite.deleteStory);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [saveError, setSaveError] = React.useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState(
    "There was an error saving.",
  );
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [lastSavedText, setLastSavedText] = React.useState(
    storyData.text ?? "",
  );
  const [image, setImage] = React.useState<ImageLike | null>(null);

  React.useEffect(() => {
    setIsSaving(false);
    setIsDeleting(false);
    setSaveError(false);
    setSaveErrorMessage("There was an error saving.");
    setLastSavedAt(null);
    setLastSavedText(storyData.text ?? "");
  }, [storyData.id]);

  const [parsedStoryBase, parsedMeta, audioInsertLines] = React.useMemo(
    () =>
      processStoryFile(
        docText,
        storyData.id,
        avatarNames,
        {
          learning_language: learningLanguage?.short ?? "",
          from_language: fromLanguage?.short ?? "",
        },
        learningLanguage?.tts_replace ?? "",
      ),
    [
      avatarNames,
      docText,
      fromLanguage?.short,
      learningLanguage?.short,
      learningLanguage?.tts_replace,
      storyData.id,
    ],
  );

  React.useEffect(() => {
    let cancelled = false;
    const icon = parsedMeta.icon;
    if (!icon) {
      setImage(null);
      return;
    }

    void convex
      .query(api.editorRead.getEditorImageByLegacyId, { legacyImageId: icon })
      .then((value) => {
        if (cancelled) return;
        if (!value) {
          setImage(null);
          return;
        }
        setImage({
          active: value.active,
          gilded: value.gilded,
          locked: value.locked,
        });
      })
      .catch(() => {
        if (!cancelled) setImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, parsedMeta.icon]);

  const parsedStory = React.useMemo(
    () => ({
      ...parsedStoryBase,
      illustrations: {
        active: image?.active,
        gilded: image?.gilded,
        locked: image?.locked,
      },
      learning_language_rtl: learningLanguage?.rtl ?? false,
      from_language_rtl: fromLanguage?.rtl ?? false,
      learning_language: learningLanguage?.short,
      from_language: fromLanguage?.short,
    }),
    [
      fromLanguage?.rtl,
      fromLanguage?.short,
      image?.active,
      image?.gilded,
      image?.locked,
      learningLanguage?.rtl,
      learningLanguage?.short,
      parsedStoryBase,
    ],
  );

  const toFriendlyError = React.useCallback((error: unknown, verb: string) => {
    const rawMessage = error instanceof Error ? error.message : "";
    const isOffline =
      typeof window !== "undefined" && window.navigator.onLine === false;
    if (isOffline) {
      return `You are offline. Reconnect to the internet and retry ${verb}.`;
    }
    if (
      rawMessage.includes("Unauthorized") ||
      rawMessage.toLowerCase().includes("unauthorized")
    ) {
      return "Your session expired or your account no longer has editor access. Please sign in again and retry.";
    }
    return `There was an error ${verb}.`;
  }, []);

  const save = React.useCallback(async () => {
    if (isSaving || isDeleting) return;
    setIsSaving(true);
    const saveStartRevision = revision;
    try {
      const result = await setStoryMutation({
        legacyStoryId: storyData.id,
        duo_id: storyData.duo_id ?? "",
        name: parsedMeta.fromLanguageName,
        image: parsedMeta.icon ?? "",
        set_id: parsedMeta.set_id,
        set_index: parsedMeta.set_index,
        legacyCourseId: storyData.course_id,
        text: docText,
        json: toConvexValue(parsedStoryBase),
        todo_count: parsedMeta.todo_count,
        change_date: new Date().toISOString(),
        operationKey: `story:${storyData.id}:set_story:v2:${Date.now()}:${saveStartRevision}`,
      });
      if (!result) {
        throw new Error(`Story ${storyData.id} not found`);
      }
      setLastSavedAt(Date.now());
      setLastSavedText(docText);
      setSaveError(false);
      setSaveErrorMessage("There was an error saving.");
    } catch (error) {
      const message = toFriendlyError(error, "saving");
      setSaveError(true);
      setSaveErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    docText,
    isDeleting,
    isSaving,
    parsedMeta.fromLanguageName,
    parsedMeta.icon,
    parsedMeta.set_id,
    parsedMeta.set_index,
    parsedMeta.todo_count,
    parsedStoryBase,
    revision,
    setStoryMutation,
    storyData.course_id,
    storyData.duo_id,
    storyData.id,
    toFriendlyError,
  ]);

  const remove = React.useCallback(async () => {
    if (isSaving || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteStoryMutation({
        legacyStoryId: storyData.id,
        operationKey: `story:${storyData.id}:delete:v2:${Date.now()}`,
      });
      if (!result) throw new Error(`Story ${storyData.id} not found`);
    } catch (error) {
      const message = toFriendlyError(error, "deleting");
      setSaveError(true);
      setSaveErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteStoryMutation,
    isDeleting,
    isSaving,
    storyData.id,
    toFriendlyError,
  ]);

  return {
    parsedStory,
    parsedMeta,
    audioInsertLines,
    save,
    remove,
    isSaving,
    isDeleting,
    saveError,
    saveErrorMessage,
    clearSaveError: () => setSaveError(false),
    lastSavedAt,
    dirty: docText !== lastSavedText,
  };
}
