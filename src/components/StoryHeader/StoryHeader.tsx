import React from "react";
import useAudio from "../StoryTextLine/use-audio.hook";
import PlayAudio from "../PlayAudio";
import StoryLineHints from "../StoryLineHints";
import StoryTextLineSimple from "../StoryTextLineSimple";
import EditorSSMLDisplay from "../EditorSSMLDisplay";
import {
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import {
  getEditorHandlers,
  type EditorProps,
} from "@/lib/editor/editorHandlers";
import { cn } from "@/lib/utils";

function StoryHeader({
  active,
  element,
  settings,
  editorState,
  editorShowTranslationsOverride,
  editorShowAudioDetailsOverride,
  onOpenAudioEditor,
  audioRangeOverride,
  hideAudioButton = false,
  compact = false,
}: {
  active: boolean;
  element: StoryElementHeader;
  settings: StorySettings;
  editorState?: EditorStateType;
  editorShowTranslationsOverride?: boolean;
  editorShowAudioDetailsOverride?: boolean;
  onOpenAudioEditor?: (
    element: StoryElementLine | StoryElementHeader,
  ) => void | Promise<void>;
  audioRangeOverride?: number;
  hideAudioButton?: boolean;
  compact?: boolean;
}) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);
  const [audioRange, playAudio, ref, url] = useAudio(
    element,
    active,
    settings.show_audio,
  );
  const effectiveAudioRange = audioRangeOverride ?? audioRange;
  const isRtl = settings.rtl || element.lang === "rtl";
  const showEditorAudioDetails =
    editorShowAudioDetailsOverride ?? settings.show_audio;

  const hideRangesForChallenge = undefined;

  if (settings?.show_names) {
    const name = "Narrator";
    if (!settings?.highlight_name.includes(name) && settings.hideNonHighlighted)
      return null;
    return (
      <StoryTextLineSimple
        speaker={"Narrator"}
        highlight={settings?.highlight_name.includes(name)}
        id={settings?.id + "-" + 0}
      >
        {element.learningLanguageTitleContent.text}
      </StoryTextLineSimple>
    );
  }

  return (
    <div
      className={`text-center ${element.lang}`}
      style={{ textAlign: "center" }}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      <div>
        <img
          alt="title image"
          className={cn(
            "mx-auto block h-[175px] w-[175px]",
            compact && "h-24 w-24",
          )}
          src={element.illustrationUrl}
        />
      </div>
      <h1
        className={cn(
          "m-0 text-[25px] leading-[34px] font-bold",
          compact && "text-xl leading-7",
        )}
      >
        {url && (
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
        )}
        {!hideAudioButton && settings.show_audio && (
          <PlayAudio onClick={playAudio} rtl={isRtl} />
        )}
        <StoryLineHints
          showHints={settings.show_hints}
          showTranslationsInline={editorShowTranslationsOverride}
          audioRange={effectiveAudioRange}
          hideRangesForChallenge={hideRangesForChallenge}
          content={element.learningLanguageTitleContent}
          editorState={editorState}
        />
        {showEditorAudioDetails &&
          element.audio &&
          (editorState || onOpenAudioEditor) && (
            <EditorSSMLDisplay
              ssml={element.audio.ssml}
              element={element}
              editor={editorState}
              onOpenAudioEditor={onOpenAudioEditor}
            />
          )}
      </h1>
    </div>
  );
}

export default StoryHeader;
