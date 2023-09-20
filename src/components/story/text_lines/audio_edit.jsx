import React from "react";
import { fetch_post } from "../../../lib/fetch_post";
import styles from "./audio_edit.module.css";
import { EditorContext } from "../story";

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
      await generate_audio_line(ssml, editor.view, editor.audio_insert_lines);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  }
  if (!show_audio) return <></>;
  return (
    <>
      <br />
      <span className={styles.ssml_speaker}>{ssml.speaker}</span>
      <span className={styles.ssml}>{ssml.text}</span>
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
        >
          🎤
        </a>
      ) : (
        <></>
      )}
    </>
  );
}

async function generate_audio_line(ssml, view, audio_insert_lines) {
  let speaker = ssml["speaker"].trim();
  let speak_text = ssml["text"].trim();
  let match = speaker.match(/([^(]*)\((.*)\)/);

  if (match) {
    speaker = match[1];
    let attributes = "";
    for (let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
      attributes += ` ${part[1]}="${part[2]}"`;
    }
    if (speak_text.startsWith("<speak>"))
      speak_text = speak_text.substring("<speak>".length);
    if (speak_text.endsWith("</speak>"))
      speak_text = speak_text.substring(
        0,
        speak_text.length - "</speak>".length,
      );
    speak_text = `<speak><prosody ${attributes}>${speak_text}</prosody></speak>`;
  }

  let response2 = await fetch_post(`/audio/create`, {
    id: ssml["id"],
    speaker: speaker,
    text: speak_text,
  });
  let ssml_response = await response2.json();

  let text = "$" + ssml_response["output_file"];
  if (ssml_response.marks2) {
    let last_time = 0;
    let last_time_delta = 0;
    let last_end = 0;
    for (let mark of ssml_response.marks2) {
      if (mark.timeSeconds === undefined) {
        last_end = parseInt(mark.markName);
        continue;
      }
      text += ";";
      text += parseInt(mark.markName) - last_end;
      text += ",";
      text += last_time_delta;
      last_end = parseInt(mark.markName);
      last_time_delta = Math.round(mark.timeSeconds * 1000) - last_time;
      last_time = Math.round(mark.timeSeconds * 1000);
    }
  } else {
    let last_time = 0;
    let last_end = 0;
    for (let mark of ssml_response.marks) {
      if (mark.time === undefined) {
        last_end += Math.round(mark.value.length);
        continue;
      }
      text += ";";
      text += Math.round(mark.value.length) + Math.round(last_end);
      text += ",";
      text += Math.round(mark.time) - last_time;
      last_end = 1;
      last_time = Math.round(mark.time);
    }
  }
  let [line, line_insert] = audio_insert_lines[ssml.inser_index];
  if (line !== undefined) {
    let line_state = view.state.doc.line(line);
    view.dispatch(
      view.state.update({
        changes: {
          from: line_state.from,
          to: line_state.to,
          insert: text,
        },
      }),
    );
  } else {
    let line_state = view.state.doc.line(line_insert - 1);
    view.dispatch(
      view.state.update({
        changes: {
          from: line_state.from,
          to: line_state.from,
          insert: text + "\n",
        },
      }),
    );
  }
}
