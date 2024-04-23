import React from "react";
import { EditorContext } from "../story";
import styles from "./audio_edit.module.css";
import {
  generate_audio_line,
  timings_to_text,
  insert_audio_line,
} from "./audio_edit_tools";
import { useSearchParams } from "next/navigation";

export default function EditorSSMLDisplay({ ssml, element, audio }) {
  //let urlParams = new URLSearchParams(window.location.search);
  const beta = false;

  let [loading, setLoading] = React.useState(false);
  let [error, setError] = React.useState(false);
  let line_id = "ssml" + (ssml.line ? ssml.line : ssml.line_insert);

  //var [show_audio, set_show_audio] = React.useState(editor.editorShowSsml);
  //useEventListener("editorShowSsml", (e) => set_show_audio(e.detail.show))
  const editor = React.useContext(EditorContext);

  let show_audio = editor.show_ssml;

  async function reload() {
    setLoading(true);
    try {
      let { filename, keypoints } = await generate_audio_line(ssml);
      let text = timings_to_text({ filename, keypoints });
      insert_audio_line(text, ssml, editor.view, editor.audio_insert_lines);
    } catch (e) {
      console.error("error", e);
      setError(e);
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
          onClick={() => window.open_recoder({ ssml, element, audio, editor })}
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
