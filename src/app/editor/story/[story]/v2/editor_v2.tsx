"use client";

import React from "react";
import { basicSetup, EditorView } from "codemirror";
import { EditorSelection, EditorState } from "@codemirror/state";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { example, highlightStyle } from "@/components/editor/story/parser";
import useScrollLinking from "@/components/editor/story/scroll_linking";
import useResizeEditor from "@/components/editor/story/editor-resize";
import StoryEditorPreview from "@/components/StoryEditorPreview";
import Cast from "@/components/editor/story/cast";
import { StoryEditorHeader } from "@/app/editor/story/[story]/header";
import type { Avatar, StoryData } from "@/app/editor/story/[story]/types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import BulkAudioEditor, {
  type BulkAudioEditorItem,
  type BulkAudioEditorUpdate,
} from "@/app/editor/story/[story]/bulk-audio-editor";
import SoundRecorder from "@/app/editor/story/[story]/sound-recorder";
import { useStoryEditorPreferences } from "@/app/editor/_components/story_editor_preferences";
import {
  create_audio_insert_anchor,
  insert_audio_at_anchor,
  map_audio_insert_anchor,
  insert_audio_lines,
  timings_to_text,
  type AudioInsertAnchor,
} from "@/lib/editor/audio/audio_edit_tools";
import type {
  Audio,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { useStoryEditorModel } from "./use_story_editor_model";

type StoryNavigation = {
  previousStory: {
    href: string;
    name: string;
  } | null;
  nextStory: {
    href: string;
    name: string;
  } | null;
};

type LanguageData = {
  languageId: string;
  id: number;
  name: string;
  short: string;
  flag: number | null;
  flag_file: string | null;
  speaker: string | null;
  default_text: string;
  tts_replace: string | null;
  public: boolean;
  rtl: boolean;
};

function getMax<T>(list: T[], callback: (obj: T) => number) {
  let max = -Infinity;
  for (const obj of list) {
    const v = callback(obj);
    if (v > max) max = v;
  }
  return max;
}

function normalizeDocText(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function getElementAudio(
  element: StoryElementLine | StoryElementHeader | undefined,
): Audio | undefined {
  if (!element) return undefined;
  if (element.type === "HEADER") return element.audio;
  return element.line.content.audio ?? element.audio;
}

function getBulkAudioEditorItems(elements: Array<any>): BulkAudioEditorItem[] {
  const items: BulkAudioEditorItem[] = [];
  let order = 1;

  for (const element of elements) {
    if (element.type !== "HEADER" && element.type !== "LINE") continue;
    if (!element.audio) continue;

    const text =
      element.type === "HEADER"
        ? element.learningLanguageTitleContent?.text
        : element.line.content?.text;
    const content =
      element.type === "HEADER"
        ? element.learningLanguageTitleContent
        : element.line.content;

    if (!text || !content) continue;

    items.push({
      id: `${element.type}-${element.trackingProperties.line_index}-${element.audio.ssml.inser_index}`,
      order,
      lineIndex: element.trackingProperties.line_index || 0,
      type: element.type,
      speaker: element.audio.ssml.speaker,
      content,
      hideRangesForChallenge:
        element.type === "LINE" ? element.hideRangesForChallenge : undefined,
      existingFilename: element.audio.url?.replace(/^audio\//, "") ?? "",
      existingKeypoints: element.audio.keypoints ?? [],
      ssml: element.audio.ssml,
    });

    order += 1;
  }

  return items;
}

export default function EditorV2({
  isAdmin,
  story_data,
  avatar_names,
  story_navigation,
}: {
  isAdmin: boolean;
  story_data: StoryData;
  avatar_names: Record<number, Avatar>;
  story_navigation: StoryNavigation;
}) {
  const navigate = useRouter().push;
  const editorRef = React.useRef<HTMLDivElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const marginRef = React.useRef<SVGSVGElement>(null);
  const svgParentRef = React.useRef<SVGSVGElement>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const trackedAudioAnchorsRef = React.useRef<Set<AudioInsertAnchor>>(
    new Set(),
  );
  const audioEditorAnchorRef = React.useRef<{
    anchor: AudioInsertAnchor;
    release: () => void;
  } | null>(null);
  const [view, setView] = React.useState<EditorView | undefined>(undefined);

  const language_data = (useQuery(api.editorRead.getEditorLanguageByLegacyId, {
    legacyLanguageId: story_data.learning_language,
  }) ?? undefined) as LanguageData | undefined;
  const language_data2 = (useQuery(api.editorRead.getEditorLanguageByLegacyId, {
    legacyLanguageId: story_data.from_language,
  }) ?? undefined) as LanguageData | undefined;

  const [docText, setDocText] = React.useState(story_data.text ?? "");
  const [revision, setRevision] = React.useState(0);
  const [lineNo, setLineNo] = React.useState(1);
  const {
    showHints: show_trans,
    setShowHints: set_show_trans,
    showAudio: show_ssml,
    setShowAudio: set_show_ssml,
  } = useStoryEditorPreferences();
  const [audioEditorData, setAudioEditorData] = React.useState<
    StoryElementLine | StoryElementHeader | undefined
  >(undefined);
  const [bulkAudioOpen, setBulkAudioOpen] = React.useState(false);
  const storySnapshot = React.useMemo(
    () => ({
      id: story_data.id,
      text: story_data.text ?? "",
    }),
    [story_data.id, story_data.text],
  );
  const storyText = storySnapshot.text;

  React.useEffect(() => {
    // Reset editor-local state when switching stories, even if the text matches.
    setDocText(normalizeDocText(storySnapshot.text));
    setRevision(0);
    setLineNo(1);
    setAudioEditorData(undefined);
    setBulkAudioOpen(false);
  }, [storySnapshot]);
  const model = useStoryEditorModel({
    isAdmin,
    storyData: story_data,
    avatarNames: avatar_names,
    docText,
    revision,
    learningLanguage: language_data,
    fromLanguage: language_data2,
  });
  const {
    audioInsertLines,
    dirty,
    isDeleting,
    isSaving,
    markServerSynced,
    parsedStory,
    save,
  } = model;

  const releaseTrackedAudioEditorAnchor = React.useCallback(() => {
    audioEditorAnchorRef.current?.release();
    audioEditorAnchorRef.current = null;
  }, []);

  const trackAudioInsertAnchor = React.useCallback(
    (ssml: Audio["ssml"]) => {
      const view = viewRef.current;
      if (!view || !audioInsertLines) return undefined;
      const anchor = create_audio_insert_anchor(ssml, view, audioInsertLines);
      if (!anchor) return undefined;
      trackedAudioAnchorsRef.current.add(anchor);
      return {
        anchor,
        release: () => {
          trackedAudioAnchorsRef.current.delete(anchor);
        },
      };
    },
    [audioInsertLines],
  );

  const openAudioEditor = React.useCallback(
    (data: StoryElementLine | StoryElementHeader | undefined) => {
      releaseTrackedAudioEditorAnchor();
      if (!data) {
        setAudioEditorData(undefined);
        return;
      }
      const audio = getElementAudio(data);
      const trackedAnchor = audio?.ssml
        ? trackAudioInsertAnchor(audio.ssml)
        : undefined;
      if (trackedAnchor) {
        audioEditorAnchorRef.current = trackedAnchor;
      }
      setAudioEditorData(data);
    },
    [releaseTrackedAudioEditorAnchor, trackAudioInsertAnchor],
  );

  React.useEffect(() => {
    // Reset editor-local state when switching stories, even if the text matches.
    setDocText(normalizeDocText(storySnapshot.text));
    setRevision(0);
    setLineNo(1);
    releaseTrackedAudioEditorAnchor();
    setAudioEditorData(undefined);
  }, [releaseTrackedAudioEditorAnchor, storySnapshot]);

  React.useEffect(
    () => () => {
      releaseTrackedAudioEditorAnchor();
      trackedAudioAnchorsRef.current.clear();
    },
    [releaseTrackedAudioEditorAnchor],
  );

  useResizeEditor(editorRef.current, previewRef.current, marginRef.current);
  useScrollLinking(view, previewRef.current, svgParentRef.current);

  React.useEffect(() => {
    const sync = EditorView.updateListener.of((update) => {
      const currentLine = update.state.doc.lineAt(
        update.state.selection.main.from,
      ).number;
      setLineNo(currentLine);

      if (update.docChanged) {
        for (const anchor of trackedAudioAnchorsRef.current) {
          map_audio_insert_anchor(anchor, update.changes);
        }
        setDocText(update.state.doc.toString());
        setRevision((prev) => prev + 1);
      }
    });

    const state = EditorState.create({
      doc: normalizeDocText(storySnapshot.text),
      extensions: [basicSetup, sync, example(), highlightStyle],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current ?? undefined,
    });

    viewRef.current = view;
    setView(view);
    return () => {
      view.destroy();
      viewRef.current = null;
      setView(undefined);
    };
  }, [storySnapshot]);

  React.useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (dirty) return;

    const remoteText = normalizeDocText(storyText);
    const localText = view.state.doc.toString();
    if (localText === remoteText) return;

    markServerSynced(remoteText);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: remoteText },
    });
  }, [dirty, markServerSynced, storyText]);

  React.useEffect(() => {
    const warningMessage =
      "You have unsaved changes. Are you sure you want to leave this page?";

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = warningMessage;
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!dirty) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSameRoute =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;

      if (isSameRoute) return;

      const shouldLeave = window.confirm(warningMessage);
      if (shouldLeave) return;

      event.preventDefault();
      event.stopPropagation();
    };

    const onPopState = () => {
      if (!dirty) return;
      const shouldLeave = window.confirm(warningMessage);
      if (shouldLeave) return;
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [dirty]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "s") return;
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (isSaving || isDeleting) return;
      void save();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDeleting, isSaving, save]);

  const onAudioSave = React.useCallback(
    (filename: string, timingText: string) => {
      const view = viewRef.current;
      let trackedAnchor = audioEditorAnchorRef.current;
      if (!trackedAnchor) {
        const audio = getElementAudio(audioEditorData);
        trackedAnchor = audio?.ssml
          ? (trackAudioInsertAnchor(audio.ssml) ?? null)
          : null;
        if (trackedAnchor) {
          audioEditorAnchorRef.current = trackedAnchor;
        }
      }
      if (!view || !trackedAnchor) return;
      insert_audio_at_anchor(
        `$${filename}${timingText}`,
        view,
        trackedAnchor.anchor,
      );
    },
    [audioEditorData, trackAudioInsertAnchor],
  );

  const onBulkAudioApply = React.useCallback(
    (updates: BulkAudioEditorUpdate[]) => {
      const view = viewRef.current;
      if (!view) return;
      if (!audioInsertLines || updates.length === 0) return;
      insert_audio_lines(
        updates.map((update) => ({
          text: update.serializedText,
          ssml: update.ssml,
        })),
        view,
        audioInsertLines,
      );
    },
    [audioInsertLines],
  );

  const soundRecorderNext = React.useCallback(() => {
    if (!audioEditorData) return;
    const index = audioEditorData.trackingProperties.line_index || 0;
    for (const element of parsedStory.elements) {
      if (
        element.type === "LINE" &&
        (element.trackingProperties?.line_index ?? 0) > index
      ) {
        openAudioEditor(element);
        break;
      }
    }
  }, [audioEditorData, openAudioEditor, parsedStory.elements]);

  const soundRecorderPrevious = React.useCallback(() => {
    if (!audioEditorData) return;
    const index = audioEditorData.trackingProperties.line_index || 0;
    for (const element of [...parsedStory.elements].reverse()) {
      if (
        (element.type === "LINE" || element.type === "HEADER") &&
        (element.trackingProperties?.line_index ?? 0) < index
      ) {
        openAudioEditor(element);
        break;
      }
    }
  }, [audioEditorData, openAudioEditor, parsedStory.elements]);

  const editorStateForPreview: EditorStateType | undefined =
    React.useMemo(() => {
      if (!view) return undefined;
      return {
        line_no: lineNo,
        view,
        select: (line: string, scroll: boolean) => {
          const lineNumber = Number.parseInt(line, 10);
          if (!Number.isFinite(lineNumber) || lineNumber <= 0) return;
          const pos = view.state.doc.line(lineNumber).from;
          view.dispatch(
            view.state.update({
              selection: EditorSelection.cursor(pos),
              scrollIntoView: scroll,
            }),
          );
        },
        audio_insert_lines: audioInsertLines,
        create_audio_insert_anchor: (ssml) =>
          audioInsertLines
            ? create_audio_insert_anchor(ssml, view, audioInsertLines)
            : undefined,
        track_audio_insert_anchor: (anchor) => {
          trackedAudioAnchorsRef.current.add(anchor);
          return () => {
            trackedAudioAnchorsRef.current.delete(anchor);
          };
        },
        insert_audio_at_anchor: (text, anchor) =>
          insert_audio_at_anchor(text, view, anchor),
        show_audio_editor: (data) => openAudioEditor(data),
      };
    }, [audioInsertLines, lineNo, openAudioEditor, view]);

  const audioEditorDataContent =
    (audioEditorData?.type === "LINE" && audioEditorData.line.content) ||
    (audioEditorData?.type === "HEADER" &&
      audioEditorData.learningLanguageTitleContent);
  const audioEditorAudio = getElementAudio(audioEditorData);
  const bulkAudioItems = React.useMemo(
    () => getBulkAudioEditorItems(model.parsedStory.elements),
    [model.parsedStory.elements],
  );

  return (
    <div id="body" className="flex h-full min-h-0 flex-col">
      {model.saveError && (
        <>
          <div
            className="fixed inset-0 z-[1999] bg-[rgba(0,0,0,0.5)]"
            onClick={model.clearSaveError}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#f44336] p-[10px] text-center text-white">
            {model.saveErrorMessage}
            <button
              className="ml-2 rounded border border-white/60 px-2 py-0.5 text-[0.85rem] hover:bg-white/15 disabled:cursor-default disabled:opacity-70"
              disabled={model.isSaving || model.isDeleting}
              onClick={() => {
                void model.save();
              }}
            >
              {model.isSaving ? "Saving..." : "Retry"}
            </button>
            <div
              className="absolute right-[10px] top-0"
              onClick={model.clearSaveError}
            >
              X
            </div>
          </div>
        </>
      )}

      <StoryEditorHeader
        isAdmin={isAdmin}
        story_data={story_data}
        unsaved_changes={model.dirty}
        func_save={model.save}
        func_delete={async () => {
          await model.remove();
          navigate(`/editor/course/${story_data.short}`);
        }}
        is_saving={model.isSaving}
        is_deleting={model.isDeleting}
        last_saved_at={model.lastSavedAt}
        show_trans={show_trans}
        set_show_trans={set_show_trans}
        show_ssml={show_ssml}
        set_show_ssml={set_show_ssml}
        open_bulk_audio={() => {
          setAudioEditorData(undefined);
          setBulkAudioOpen(true);
        }}
        previous_story={story_navigation.previousStory}
        next_story={story_navigation.nextStory}
      />
      <BulkAudioEditor
        open={bulkAudioOpen}
        onOpenChange={setBulkAudioOpen}
        storyId={story_data.id}
        items={bulkAudioItems}
        onApply={onBulkAudioApply}
      />
      {audioEditorData &&
        audioEditorAudio &&
        audioEditorDataContent &&
        model.parsedStory && (
          <SoundRecorder
            key={audioEditorData.trackingProperties.line_index}
            content={audioEditorDataContent}
            initialTimingText={timings_to_text({
              filename: audioEditorAudio.url ?? "",
              keypoints: audioEditorAudio.keypoints ?? [],
            })}
            url={`https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/${audioEditorAudio.url}`}
            story_id={story_data.id}
            onClose={() => openAudioEditor(undefined)}
            onSave={onAudioSave}
            soundRecorderNext={soundRecorderNext}
            soundRecorderPrevious={soundRecorderPrevious}
            total_index={getMax(
              model.parsedStory.elements,
              (elem) => elem.trackingProperties.line_index || 0,
            )}
            current_index={audioEditorData.trackingProperties.line_index || 0}
          />
        )}

      <div className="flex min-h-0 flex-1">
        <svg
          className="pointer-events-none fixed z-[-1] h-full w-full float-left"
          ref={svgParentRef}
        >
          <path
            className="fill-[var(--svg-fill)] stroke-[var(--svg-stroke)]"
            d=""
          />
        </svg>
        <div
          ref={editorRef}
          className={
            "min-h-0 w-[100px] grow [scroll-behavior:auto] max-[975px]:h-[calc((100vh-64px)/2)] max-[975px]:w-full " +
            (language_data?.rtl ? "[direction:rtl]" : "")
          }
        />
        <svg
          className="h-full w-[2%] cursor-col-resize overflow-scroll float-left"
          ref={marginRef}
        />
        <div
          ref={previewRef}
          className="min-h-0 w-[100px] grow overflow-scroll [scroll-behavior:auto] max-[975px]:absolute max-[975px]:top-[calc((100vh-64px)/2+64px)] max-[975px]:h-[calc((100vh-64px)/2)] max-[975px]:w-full p-3"
        >
          <Cast
            id={story_data.id}
            cast={model.parsedMeta.cast}
            short={story_data.short}
          />
          <StoryEditorPreview
            story={model.parsedStory}
            editorState={editorStateForPreview}
            onOpenAudioEditor={openAudioEditor}
          />
        </div>
      </div>
    </div>
  );
}
