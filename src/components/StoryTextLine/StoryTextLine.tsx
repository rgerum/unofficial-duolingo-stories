import React from "react";
import useAudio from "./use-audio.hook";
import StoryLineHints from "../StoryLineHints";
import PlayAudio from "../PlayAudio";
import StoryTextLineSimple from "../StoryTextLineSimple";
import EditorSSMLDisplay from "../EditorSSMLDisplay";
import { StoryElementLine } from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import {
  getEditorHandlers,
  type EditorProps,
} from "@/lib/editor/editorHandlers";
import { cn } from "@/lib/utils";

function StoryTextLine({
  active,
  element,
  unhide = 999999,
  settings,
  editorState,
  audioRangeOverride,
  hideAudioButton = false,
}: {
  active: boolean;
  element: StoryElementLine;
  unhide?: number;
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
  const titleClassName = "m-0 text-[25px] leading-[34px] font-bold";
  const phraseClassName = "my-5 flex flex-nowrap items-start";
  const bubbleClassName = cn(
    "relative inline-block w-max max-w-[80%] rounded-[0_14px_14px_14px] border-2 border-[var(--color_base_border)] bg-[var(--color_base_background)] px-3 py-[10px]",
    "before:absolute before:top-[-2px] before:left-[-14px] before:content-[''] before:border-r-[12px] before:border-b-[12px] before:border-r-[var(--color_base_border)] before:border-b-transparent",
    "after:absolute after:top-0 after:left-[-9px] after:content-[''] after:border-r-[12px] after:border-b-[12px] after:border-r-[var(--color_base_background)] after:border-b-transparent",
    isRtl &&
      "rounded-tl-[14px] rounded-tr-none before:left-auto before:right-[-14px] before:border-r-0 before:border-l-[12px] before:border-l-[var(--color_base_border)] after:left-auto after:right-[-9px] after:border-r-0 after:border-l-[12px] after:border-l-[var(--color_base_background)]",
  );

  if (element.line === undefined) return <></>;

  const hideRangesForChallenge = element.hideRangesForChallenge;

  if (settings?.show_names) {
    const name =
      (element.line.type == "CHARACTER" &&
        (element.line.characterName || element.line.characterId.toString())) ||
      "Narrator";
    if (!settings?.highlight_name.includes(name) && settings.hideNonHighlighted)
      return null;
    return (
      <>
        <StoryTextLineSimple
          speaker={name}
          highlight={settings?.highlight_name.includes(name)}
          id={settings?.id + "-" + element?.trackingProperties?.line_index}
        >
          {element.line.content.text}
        </StoryTextLineSimple>
      </>
    );
  }

  if (element.line.type === "TITLE")
    return (
      <div
        key={element.trackingProperties.line_index}
        className={`${titleClassName} ${element.lang}`}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <span className={titleClassName}>
          {url && (
            <audio ref={ref}>
              <source src={url} type="audio/mp3" />
            </audio>
          )}
          {!hideAudioButton && <PlayAudio onClick={playAudio} />}
          <StoryLineHints
            audioRange={effectiveAudioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            content={element.line.content}
            editorState={editorState}
          />
        </span>
      </div>
    );
  else if (
    element.line.type === "CHARACTER" &&
    element.line.avatarUrl != undefined
  )
    return (
      <div
        key={element.trackingProperties.line_index}
        className={`${phraseClassName} ${element.lang}`}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <img
          className={cn(
            "mr-[18px] flex h-[50px] w-[50px] flex-[0_0_50px]",
            isRtl && "mr-0 ml-3 scale-x-[-1]",
          )}
          src={element.line.avatarUrl}
          alt="head"
        />
        <span className={bubbleClassName}>
          {url && (
            <audio ref={ref}>
              <source src={url} type="audio/mp3" />
            </audio>
          )}
          {!hideAudioButton && <PlayAudio onClick={playAudio} />}
          <StoryLineHints
            audioRange={effectiveAudioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            unhide={unhide}
            content={element.line.content}
            editorState={editorState}
          />
          {editorState && element.line.content.audio && (
            <EditorSSMLDisplay
              ssml={element.line.content.audio.ssml}
              element={element}
              editor={editorState}
            />
          )}
        </span>
      </div>
    );
  else
    return (
      <div
        key={element.trackingProperties.line_index}
        className={`${phraseClassName} ${element.lang}`}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <span>
          {url && (
            <audio ref={ref}>
              <source src={url} type="audio/mp3" />
            </audio>
          )}
          {!hideAudioButton && <PlayAudio onClick={playAudio} />}
          <StoryLineHints
            audioRange={effectiveAudioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            unhide={unhide}
            content={element.line.content}
            editorState={editorState}
          />
          {editorState && element.line.content.audio && (
            <EditorSSMLDisplay
              ssml={element.line.content.audio.ssml}
              element={element}
              editor={editorState}
            />
          )}
        </span>
      </div>
    );
}

export default StoryTextLine;
