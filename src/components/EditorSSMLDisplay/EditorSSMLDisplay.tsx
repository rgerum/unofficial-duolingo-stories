"use client";
import React from "react";
import { MicIcon } from "lucide-react";
import styles from "./EditorSSMLDisplay.module.css";
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
      <span className={styles.ssml_speaker + " en"}>{ssml.speaker}</span>
      <button
        onClick={() => editor.show_audio_editor(element)}
        className={styles.audio_editor_button}
        title="Open sound editor"
        aria-label="Open sound editor"
        type="button"
      >
        <MicIcon className={styles.audio_editor_icon} />
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
    </>
  );
}
