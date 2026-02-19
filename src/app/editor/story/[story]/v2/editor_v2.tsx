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
import SoundRecorder from "@/app/editor/story/[story]/sound-recorder";
import {
  insert_audio_line,
  timings_to_text,
} from "@/lib/editor/audio/audio_edit_tools";
import type {
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { useStoryEditorModel } from "./use_story_editor_model";

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

export default function EditorV2({
  story_data,
  avatar_names,
}: {
  story_data: StoryData;
  avatar_names: Record<number, Avatar>;
}) {
  const navigate = useRouter().push;
  const editorRef = React.useRef<HTMLDivElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const marginRef = React.useRef<SVGSVGElement>(null);
  const svgParentRef = React.useRef<SVGSVGElement>(null);
  const viewRef = React.useRef<EditorView | null>(null);
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
  const [show_trans, set_show_trans] = React.useState(false);
  const [show_ssml, set_show_ssml] = React.useState(false);
  const [audioEditorData, setAudioEditorData] = React.useState<
    StoryElementLine | StoryElementHeader | undefined
  >(undefined);

  React.useEffect(() => {
    setDocText(story_data.text ?? "");
    setRevision(0);
    setLineNo(1);
    setAudioEditorData(undefined);
  }, [story_data.id, story_data.text]);

  const model = useStoryEditorModel({
    storyData: story_data,
    avatarNames: avatar_names,
    docText,
    revision,
    learningLanguage: language_data,
    fromLanguage: language_data2,
  });

  useResizeEditor(editorRef.current, previewRef.current, marginRef.current);
  useScrollLinking(view, previewRef.current, svgParentRef.current);

  React.useEffect(() => {
    const sync = EditorView.updateListener.of((update) => {
      const currentLine = update.state.doc.lineAt(
        update.state.selection.main.from,
      ).number;
      setLineNo(currentLine);

      if (update.docChanged) {
        setDocText(update.state.doc.toString());
        setRevision((prev) => prev + 1);
      }
    });

    const state = EditorState.create({
      doc: story_data.text || "",
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
  }, [story_data.id, story_data.text]);

  React.useEffect(() => {
    const warningMessage =
      "You have unsaved changes. Are you sure you want to leave this page?";

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!model.dirty) return;
      event.preventDefault();
      event.returnValue = warningMessage;
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!model.dirty) return;
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
      if (!model.dirty) return;
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
  }, [model.dirty]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "s") return;
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (model.isSaving || model.isDeleting) return;
      void model.save();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [model.isDeleting, model.isSaving, model.save]);

  const onAudioSave = React.useCallback(
    (filename: string, timingText: string) => {
      const view = viewRef.current;
      if (!view || !audioEditorData?.audio) return;
      if (!model.audioInsertLines) return;
      insert_audio_line(
        `$${filename}${timingText}`,
        audioEditorData.audio.ssml,
        view,
        model.audioInsertLines,
      );
    },
    [audioEditorData, model.audioInsertLines],
  );

  const soundRecorderNext = React.useCallback(() => {
    if (!audioEditorData) return;
    const index = audioEditorData.trackingProperties.line_index || 0;
    for (const element of model.parsedStory.elements) {
      if (
        element.type === "LINE" &&
        (element.trackingProperties?.line_index ?? 0) > index
      ) {
        setAudioEditorData(element);
        break;
      }
    }
  }, [audioEditorData, model.parsedStory.elements]);

  const soundRecorderPrevious = React.useCallback(() => {
    if (!audioEditorData) return;
    const index = audioEditorData.trackingProperties.line_index || 0;
    for (const element of [...model.parsedStory.elements].reverse()) {
      if (
        (element.type === "LINE" || element.type === "HEADER") &&
        (element.trackingProperties?.line_index ?? 0) < index
      ) {
        setAudioEditorData(element);
        break;
      }
    }
  }, [audioEditorData, model.parsedStory.elements]);

  const editorStateForPreview: EditorStateType | undefined =
    React.useMemo(() => {
      const view = viewRef.current;
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
        audio_insert_lines: model.audioInsertLines,
        show_trans,
        show_ssml,
        show_audio_editor: (data) => setAudioEditorData(data),
      };
    }, [lineNo, model.audioInsertLines, show_ssml, show_trans]);

  const audioEditorDataContent =
    (audioEditorData?.type === "LINE" && audioEditorData.line.content) ||
    (audioEditorData?.type === "HEADER" &&
      audioEditorData.learningLanguageTitleContent);

  return (
    <div id="body" className="flex h-full flex-col">
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
        story_data={story_data}
        unsaved_changes={model.dirty}
        func_save={model.save}
        func_delete={async () => {
          await model.remove();
          navigate(`/editor/course/${story_data.course_id}`);
        }}
        is_saving={model.isSaving}
        is_deleting={model.isDeleting}
        last_saved_at={model.lastSavedAt}
        show_trans={show_trans}
        set_show_trans={set_show_trans}
        show_ssml={show_ssml}
        set_show_ssml={set_show_ssml}
        language_data={language_data}
        language_data2={language_data2}
      />
      {audioEditorData &&
        audioEditorData.audio &&
        audioEditorDataContent &&
        model.parsedStory && (
          <SoundRecorder
            key={audioEditorData.trackingProperties.line_index}
            content={audioEditorDataContent}
            initialTimingText={timings_to_text({
              filename: audioEditorData.audio.url ?? "",
              keypoints: audioEditorData.audio.keypoints ?? [],
            })}
            url={
              "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/" +
              audioEditorData.audio.url
            }
            story_id={story_data.id}
            onClose={() => setAudioEditorData(undefined)}
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

      <div className="flex h-[100px] grow">
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
            "w-[100px] grow [scroll-behavior:auto] max-[975px]:h-[calc((100vh-64px)/2)] max-[975px]:w-full " +
            (language_data?.rtl ? "[direction:rtl]" : "")
          }
        />
        <svg
          className="h-[calc(100vh-64px)] w-[2%] cursor-col-resize overflow-scroll float-left"
          ref={marginRef}
        />
        <div
          ref={previewRef}
          className="w-[100px] grow overflow-scroll [scroll-behavior:auto] max-[975px]:absolute max-[975px]:top-[calc((100vh-64px)/2+64px)] max-[975px]:h-[calc((100vh-64px)/2)] max-[975px]:w-full p-3"
        >
          <Cast
            id={story_data.id}
            cast={model.parsedMeta.cast}
            short={story_data.short}
          />
          <StoryEditorPreview
            story={model.parsedStory}
            editorState={editorStateForPreview}
          />
        </div>
      </div>
    </div>
  );
}
