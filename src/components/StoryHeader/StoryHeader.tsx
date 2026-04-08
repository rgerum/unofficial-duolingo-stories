import React from "react";
import useAudio from "../StoryTextLine/use-audio.hook";
import PlayAudio from "../PlayAudio";
import StoryLineHints from "../StoryLineHints";
import StoryTextLineSimple from "../StoryTextLineSimple";
import EditorSSMLDisplay from "../EditorSSMLDisplay";
import { StoryElementHeader } from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import {
  getEditorHandlers,
  type EditorProps,
} from "@/lib/editor/editorHandlers";

function StoryHeader({
  active,
  element,
  settings,
  editorState,
  audioRangeOverride,
  hideAudioButton = false,
}: {
  active: boolean;
  element: StoryElementHeader;
  settings: StorySettings;
  editorState?: EditorStateType;
  audioRangeOverride?: number;
  hideAudioButton?: boolean;
}) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);
  const [audioRange, playAudio, ref, url] = useAudio(element, active);
  const effectiveAudioRange = audioRangeOverride ?? audioRange;
  const isRtl = settings.rtl || element.lang === "rtl";

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
          className="mx-auto block h-[175px] w-[175px]"
          src={element.illustrationUrl}
        />
      </div>
      <h1 className="m-0 text-[25px] leading-[34px] font-bold">
        {url && (
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
        )}
        {!hideAudioButton && <PlayAudio onClick={playAudio} rtl={isRtl} />}
        <StoryLineHints
          audioRange={effectiveAudioRange}
          hideRangesForChallenge={hideRangesForChallenge}
          content={element.learningLanguageTitleContent}
          editorState={editorState}
        />
        {editorState && element.audio && (
          <EditorSSMLDisplay
            ssml={element.audio.ssml}
            element={element}
            editor={editorState}
          />
        )}
      </h1>
    </div>
  );
}

export default StoryHeader;
