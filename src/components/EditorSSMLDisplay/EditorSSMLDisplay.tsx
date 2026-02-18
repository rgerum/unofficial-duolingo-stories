"use client";
import React from "react";
import { MicIcon } from "lucide-react";
import {
  generate_audio_line,
  timings_to_text,
  insert_audio_line,
} from "@/lib/editor/audio/audio_edit_tools";
import type {
  Audio,
  StoryElementLine,
  StoryElementHeader,
} from "@/components/editor/story/syntax_parser_types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";

interface EditorSSMLDisplayProps {
  ssml: Audio["ssml"];
  element: StoryElementLine | StoryElementHeader;
  editor: EditorStateType;
}

export default function EditorSSMLDisplay({
  ssml,
  element,
  editor,
}: EditorSSMLDisplayProps) {
  let [loading, setLoading] = React.useState(false);
  let [error, setError] = React.useState<boolean>(false);
  let line_id = "ssml" + ssml.id;

  let show_audio = editor.show_ssml;

  async function reload() {
    setLoading(true);
    try {
      let { filename, keypoints } = await generate_audio_line(ssml);
      let text = timings_to_text({ filename, keypoints });
      if (editor.audio_insert_lines) {
        insert_audio_line(text, ssml, editor.view, editor.audio_insert_lines);
      }
    } catch (e) {
      console.error("error", e);
      setError(true);
    }
    setLoading(false);
  }

  if (!show_audio) return <></>;
  return (
    <>
      <br />
      <span className="en mr-[3px] rounded-[5px] bg-[var(--editor-ssml)] px-[5px] py-[2px] text-[0.8em]">
        {ssml.speaker}
      </span>
      <button
        onClick={() => editor.show_audio_editor(element)}
        className="inline-flex h-[25px] w-[25px] shrink-0 items-center justify-center align-middle"
        title="Open sound editor"
        aria-label="Open sound editor"
        type="button"
      >
        <MicIcon className="h-5 w-5" />
      </button>
      {ssml.speaker ? (
        error ? (
          <span>
            <img
              title="error generating audio"
              alt="error"
              src="/editor/icons/error.svg"
            />
          </span>
        ) : (
          <span
            title={loading ? "generating audio..." : "regenerate audio"}
            id={line_id}
            className={
              "inline-block h-[25px] w-[25px] cursor-pointer bg-contain bg-center bg-no-repeat transition-transform " +
              (loading ? "animate-[spin_2s_linear_infinite]" : "")
            }
            style={{
              backgroundImage:
                'url("https://carex.uber.space/stories/old/refresh.png")',
              transitionDuration: "1s",
            }}
            onClick={reload}
          />
        )
      ) : (
        <span>
          <img
            title="no speaker defined"
            alt="error"
            src="/editor/icons/error.svg"
          />
        </span>
      )}
    </>
  );
}
