"use client";
import React from "react";
import styles from "./EditorSSMLDisplay.module.css";
import {
  generate_audio_line,
  timings_to_text,
  insert_audio_line,
} from "../story/text_lines/audio_edit_tools";
import { useSearchParams } from "next/navigation";
import type {
  Audio,
  StoryElementLine,
  StoryElementHeader,
} from "@/components/editor/story/syntax_parser_types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";

// Extend window for open_recoder
declare global {
  interface Window {
    open_recoder?: (data: {
      ssml: Audio["ssml"];
      element: StoryElementLine | StoryElementHeader;
      audio: Audio;
      editor: EditorStateType;
    }) => void;
  }
}

interface EditorSSMLDisplayProps {
  ssml: Audio["ssml"];
  element: StoryElementLine | StoryElementHeader;
  audio: Audio;
  editor: EditorStateType;
}

export default function EditorSSMLDisplay({
  ssml,
  element,
  audio,
  editor,
}: EditorSSMLDisplayProps) {
  const beta = false;

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

  const searchParams = useSearchParams();

  if (!show_audio) return <></>;
  return (
    <>
      <br />
      <span className={styles.ssml_speaker + " en"}>{ssml.speaker}</span>
      <span className={styles.ssml}>{ssml.text}</span>
      {searchParams.get("beta") !== null && (
        <span
          onClick={() => editor.show_audio_editor(element)}
          style={{ cursor: "pointer" }}
        >
          {" "}
          🎤{" "}
        </span>
      )}
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
              styles.ssml_reload +
              " " +
              styles.audio_reload +
              " " +
              (loading ? styles.audio_reload_spin : "")
            }
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
      {beta ? (
        <a
          onClick={() =>
            window.open_recoder?.({ ssml, element, audio, editor })
          }
          style={{ cursor: "pointer" }}
        >
          🎤
        </a>
      ) : (
        <></>
      )}
    </>
  );
}
