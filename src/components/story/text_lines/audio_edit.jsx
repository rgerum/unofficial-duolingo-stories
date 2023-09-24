import React from "react";
import { fetch_post } from "../../../lib/fetch_post";
import styles from "./audio_edit.module.css";
import { EditorContext } from "../story";
import {
    add_word_marks_replacements,
    find_replace_with_mapping,
    init_mapping,
    replace_with_mapping,
    transcribe_text
} from "./text_with_mapping.mjs";

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
      let {filename, keypoints} = await generate_audio_line(ssml);
      let text = timings_to_text({filename, keypoints});
      insert_audio_line(text, ssml, editor.view, editor.audio_insert_lines);
    } catch (e) {
        console.error("error", e);
      setError(e);
    }
    setLoading(false);
  }

  if (!show_audio) return <></>;
  return (
    <>
      <br />
      <span className={styles.ssml_speaker + " en"}>{ssml.speaker}</span>
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


export function generate_ssml_line(ssml, transcribe_data, hideRanges) {
    let speaker = ssml["speaker"] || "";
    let speak_text = init_mapping(ssml["text"]);
    let match = speaker.match(/([^(]*)\((.*)\)/);

    console.log("speak_text", speak_text)

    for(let range of hideRanges) {
        if(speaker.split("-").length === 3)
            speak_text = replace_with_mapping(speak_text, "<break/>", range.start, range.end);
        else {
            speak_text = replace_with_mapping(speak_text, "\n</prosody>\n", range.end);
            speak_text = replace_with_mapping(speak_text, "<prosody volume=\"silent\">\n", range.start);
        }
    }
    //speak_text = find_replace_with_mapping(speak_text, /(\[)(.*)(])]/,
    //    '<prosody volume="silent">$2</prosody>');

    //speak_text = find_replace_with_mapping(speak_text, /\[/, '');
    //speak_text = find_replace_with_mapping(speak_text, /]/, '');

    if(transcribe_data)
        speak_text = transcribe_text(speak_text, transcribe_data)

    speak_text = find_replace_with_mapping(speak_text, /(\.\.\.|…)/, '<sub alias=" ">$1</sub><break/>');

    if (speak_text.text.startsWith("<speak>"))
        speak_text = replace_with_mapping(speak_text, "", 0, "<speak>".length);
    if (speak_text.text.endsWith("</speak>"))
        speak_text = replace_with_mapping(speak_text, "", speak_text.text.length - "</speak>".length, speak_text.text.length);

    if (match) {
        speaker = match[1];
        let attributes = "";
        for (let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
            attributes += ` ${part[1]}="${part[2]}"`;
        }

        speak_text = replace_with_mapping(speak_text, `<prosody ${attributes}>`, 0);
        speak_text = replace_with_mapping(speak_text, `</prosody>`, speak_text.text.length);
    }
    if(speaker.split("-").length === 4) {
        speak_text = add_word_marks_replacements(speak_text);
        speak_text = replace_with_mapping(speak_text, `<speak>`, 0);
        speak_text = replace_with_mapping(speak_text, `</speak>`, speak_text.text.length);
    }
    else if(speaker.split("-").length === 3) {
        let lang = speaker.split("-")[0] + "-" + speaker.split("-")[1];
        //text = `<speak version='1.0' xml:lang='${lang}'><voice name="${voice_id}">${text}</voice></speak>`;
        speak_text = replace_with_mapping(speak_text, `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${speaker}">`, 0);
        speak_text = replace_with_mapping(speak_text, `</voice></speak>`, speak_text.text.length);
        console.log("here", speak_text)
        speak_text.textx = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-JennyNeural">Enjoy <break/> speech </voice> </speak>`;
    }
    else {
        speak_text = replace_with_mapping(speak_text, `<speak>`, 0);
        speak_text = replace_with_mapping(speak_text, `</speak>`, speak_text.text.length);
    }
    /*
    // when the speaker contains three times "-"
    if((speaker.split("-")))
    let lang = voice_id.split("-")[0] + "-" + voice_id.split("-")[1];
    text = `<speak version='1.0' xml:lang='${lang}'><voice name="${voice_id}">${text}</voice></speak>`;
    if()
    if()
    if(speaker.)

     */


    ssml = { ...ssml, text: speak_text.text, mapping: speak_text.mapping, speaker: speaker };
    return ssml;
}

export async function generate_audio_line(ssml) {
    let speaker = ssml["speaker"].trim();
    let speak_text = ssml["text"];
    let mapping = ssml["mapping"];
    /*
  let speaker = ssml["speaker"].trim();
  let speak_text = init_mapping(ssml["text"]);
  let match = speaker.match(/([^(]*)\((.*)\)/);



    speak_text = find_replace_with_mapping(speak_text, /\[/, '');
    speak_text = find_replace_with_mapping(speak_text, /]/, '');
    speak_text = find_replace_with_mapping(speak_text, /]/, '');

    if(transcribe_data)
        speak_text = transcribe_text(speak_text, transcribe_data)

    speak_text = find_replace_with_mapping(speak_text, /(\.\.\.|…)/, '<sub alias=" ">$1</sub><break/>');

  if (speak_text.text.startsWith("<speak>"))
    speak_text = replace_with_mapping(speak_text, "", 0, "<speak>".length);
  if (speak_text.text.endsWith("</speak>"))
    speak_text = replace_with_mapping(speak_text, "", speak_text.text.length - "</speak>".length, speak_text.text.length);

  if (match) {
    speaker = match[1];
    let attributes = "";
    for (let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
      attributes += ` ${part[1]}="${part[2]}"`;
    }

    speak_text = replace_with_mapping(speak_text, `<prosody ${attributes}>`, 0);
    speak_text = replace_with_mapping(speak_text, `</prosody>`, speak_text.text.length);
  }
  speak_text = replace_with_mapping(speak_text, `<speak>`, 0);
  speak_text = replace_with_mapping(speak_text, `</speak>`, speak_text.text.length);

  //speak_text = find_replace_with_mapping(speak_text, /(\W)(is)(\W)/, '$1<phoneme alphabet="ipa" ph="bla">$2</phoneme>$3');
*/
  console.log("ssml_response", speak_text)
  let response2 = await fetch_post(`/audio/create`, {
    id: ssml["id"],
    speaker: speaker,
    text: speak_text,
  });
  let ssml_response = await response2.json();
  console.log("ssml_response", ssml_response)
  console.log("ssml_response", speak_text)
  let keypoints = [];
  if (ssml_response.timepoints) {
      for (let mark of ssml_response.timepoints) {
          keypoints.push({
              rangeEnd: parseInt(mark.markName),
              audioStart: Math.round(mark.timeSeconds * 1000),
          })
      }
  }
  else if (ssml_response.marks2) {
    let last_time = 0;
    let last_time_delta = 0;
    let last_end = 0;
    for (let mark of ssml_response.marks2) {
      if (mark.timeSeconds === undefined) {
        last_end = parseInt(mark.markName);
        continue;
      }
      keypoints.push({
          rangeEnd: parseInt(mark.markName),
          audioStart: last_time_delta,
      })
      //timings.push([parseInt(mark.markName) - last_end, last_time_delta])
      last_end = parseInt(mark.markName);
      last_time_delta = Math.round(mark.timeSeconds * 1000);// - last_time;
      last_time = Math.round(mark.timeSeconds * 1000);
    }
  } else {
    let last_time = 0;
    let last_end = 0;
    for (let mark of ssml_response.marks) {
      console.log("mark", mark, speak_text.substring(mark.start, mark.end))
      if (mark.time === undefined) {
        last_end += Math.round(mark.value.length);
        continue;
      }
      keypoints.push({
          rangeEnd: mapping[Math.round(mark.end)],
          audioStart: Math.round(mark.time),
      })
      console.log(keypoints[keypoints.length-1], mark.end, Math.round(mark.end))
      //timings.push([Math.round(mark.value.length) + Math.round(last_end), Math.round(mark.time) - last_time]);
      last_end += Math.round(mark.value.length);
      last_time = Math.round(mark.time);
    }
  }

  return {filename: ssml_response["output_file"], keypoints: keypoints, content: ssml_response.content};
}

export function content_to_audio(content) {
    let binaryString = window.atob(content);
    let binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
    }
    let blob = new Blob([binaryData], { type: "audio/mp3" });
    let url = URL.createObjectURL(blob);
    let audio = new Audio();
    audio.src = url;
    return audio
}

function timings_to_text({filename, keypoints}) {
    let text = "$" + filename;
    let last_end = 0
    let last_time = 0
    for(let point of keypoints) {
        text += ";";
        text += Math.round(point.rangeEnd - last_end);
        text += ",";
        text += Math.round(point.audioStart - last_time);
        last_end = point.rangeEnd
        last_time = point.audioStart
    }
    return text;
}

export function text_to_keypoints(line) {
    let parts = line.split(";");
    let filename = parts.splice(0, 1)[0];
    let keypoints = [];
    let last_end = 0;
    let last_time = 0;
    for (let part of parts) {
        let [start, duration] = part.split(",");
        start = parseInt(start);
        duration = parseInt(duration);
        keypoints.push({
            rangeEnd: last_end + start,
            audioStart: last_time + duration,
        });
        last_end += start;
        last_time += duration;
    }
    return [filename, keypoints]
}

function insert_audio_line(text, ssml, view, audio_insert_lines) {
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
