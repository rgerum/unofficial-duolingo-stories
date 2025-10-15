import { fetch_post } from "../../../lib/fetch_post.mjs";
import {
  add_word_marks_replacements,
  find_replace_with_mapping,
  init_mapping,
  replace_with_mapping,
  transcribe_text,
} from "./text_with_mapping";
import { EditorView } from "codemirror";
import {
  HideRange,
  LineTuple,
  TranscribeData,
} from "@/components/editor/story/syntax_parser_new";

export function generate_ssml_line(
  ssml: { speaker: string; text: string },
  transcribe_data: TranscribeData,
  hideRanges: HideRange[],
  ipa_replacements: string[] & { index: number }[],
) {
  // foo{bar:ipa} replacement
  hideRanges = JSON.parse(JSON.stringify(hideRanges));

  let speaker = ssml["speaker"] || "";
  let speak_text = init_mapping(ssml["text"]);
  let match = speaker.match(/([^(]*)\((.*)\)/);

  let offset = 0;
  function insert(insert: string, pos: number) {
    speak_text = replace_with_mapping(speak_text, insert, offset + pos);
    for (let range of hideRanges) {
      if (range.end > offset + pos) range.end += insert.length;
      if (range.start > offset + pos) range.start += insert.length;
    }
    offset += insert.length;
  }
  for (let match of ipa_replacements) {
    let new_words = [`<sub alias="${match[2]}">`, `</sub>`];
    if (match[3]) {
      new_words = [
        `<phoneme alphabet="${match[3].substring(1)}" ph="${match[2]}">`,
        `</phoneme>`,
      ];
    }
    insert(new_words[0], match.index);
    insert(new_words[1], match.index + match[1].length);
  }

  for (let range of hideRanges) {
    if (speaker.split("-").length === 3)
      speak_text = replace_with_mapping(
        speak_text,
        "<break/>",
        range.start,
        range.end,
      );
    else {
      speak_text = replace_with_mapping(speak_text, "</prosody>", range.end);
      speak_text = replace_with_mapping(
        speak_text,
        '<prosody volume="silent">',
        range.start,
      );
    }
  }
  speak_text.text = speak_text.text.replace(
    /<\/prosody><\/sub>/g,
    "</sub></prosody>",
  );
  speak_text.text = speak_text.text.replace(
    /<\/prosody><\/phoneme>/g,
    "</phoneme></prosody>",
  );
  //speak_text = find_replace_with_mapping(speak_text, /(\[)(.*)(])]/,
  //    '<prosody volume="silent">$2</prosody>');

  //speak_text = find_replace_with_mapping(speak_text, /\[/, '');
  //speak_text = find_replace_with_mapping(speak_text, /]/, '');

  if (transcribe_data)
    speak_text = transcribe_text(speak_text, transcribe_data);

  speak_text = find_replace_with_mapping(
    speak_text,
    /(\.\.\.|…)/,
    '<sub alias=" ">$1</sub><break/>',
  );

  if (speak_text.text.startsWith("<speak>"))
    speak_text = replace_with_mapping(speak_text, "", 0, "<speak>".length);
  if (speak_text.text.endsWith("</speak>"))
    speak_text = replace_with_mapping(
      speak_text,
      "",
      speak_text.text.length - "</speak>".length,
      speak_text.text.length,
    );

  if (match) {
    speaker = match[1];
    let attributes = "";
    for (let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
      attributes += ` ${part[1]}="${part[2]}"`;
    }

    speak_text = replace_with_mapping(speak_text, `<prosody ${attributes}>`, 0);
    speak_text = replace_with_mapping(
      speak_text,
      `</prosody>`,
      speak_text.text.length,
    );
  }
  if (
    speaker.split("-").length === 4 &&
    ["Wavenet", "Standard", "Neural2"].includes(speaker.split("-")[2])
  ) {
    speak_text = add_word_marks_replacements(speak_text);
    speak_text = replace_with_mapping(speak_text, `<speak>`, 0);
    speak_text = replace_with_mapping(
      speak_text,
      `</speak>`,
      speak_text.text.length,
    );
  } else if (speaker.split("-").length >= 3) {
    let lang = speaker.split("-")[0] + "-" + speaker.split("-")[1];
    //text = `<speak version='1.0' xml:lang='${lang}'><voice name="${voice_id}">${text}</voice></speak>`;
    speak_text = replace_with_mapping(
      speak_text,
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${speaker}">`,
      0,
    );
    speak_text = replace_with_mapping(
      speak_text,
      `</voice></speak>`,
      speak_text.text.length,
    );
    // TODO make sure this is text and not textx
    speak_text.text = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-JennyNeural">Enjoy <break/> speech </voice> </speak>`;
  } else {
    speak_text = replace_with_mapping(speak_text, `<speak>`, 0);
    speak_text = replace_with_mapping(
      speak_text,
      `</speak>`,
      speak_text.text.length,
    );
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

  ssml = {
    ...ssml,
    text: speak_text.text,
    mapping: speak_text.mapping,
    speaker: speaker,
  };
  return ssml;
}

export async function generate_audio_line(ssml: {
  text: string;
  speaker: string;
  id: number;
  mapping: Record<number, number>;
}) {
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
  let response2 = await fetch_post(`/audio/create`, {
    id: ssml["id"],
    speaker: speaker,
    text: speak_text,
  });
  let ssml_response = await response2.json();
  let keypoints = [];
  if (ssml_response.timepoints) {
    for (let mark of ssml_response.timepoints) {
      keypoints.push({
        rangeEnd: parseInt(mark.markName),
        audioStart: Math.round(mark.timeSeconds * 1000),
      });
    }
  } else if (ssml_response.marks2) {
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
      });
      //timings.push([parseInt(mark.markName) - last_end, last_time_delta])
      last_end = parseInt(mark.markName);
      last_time_delta = Math.round(mark.timeSeconds * 1000); // - last_time;
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
      keypoints.push({
        rangeEnd: mapping[Math.round(mark.end)],
        audioStart: Math.round(mark.time),
      });
      //timings.push([Math.round(mark.value.length) + Math.round(last_end), Math.round(mark.time) - last_time]);
      last_end += Math.round(mark.value.length);
      last_time = Math.round(mark.time);
    }
  }

  return {
    filename: ssml_response["output_file"],
    keypoints: keypoints,
    content: ssml_response.content,
  };
}

export function content_to_audio(content: string) {
  let binaryString = window.atob(content);
  let binaryData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryData[i] = binaryString.charCodeAt(i);
  }
  let blob = new Blob([binaryData], { type: "audio/mp3" });
  let url = URL.createObjectURL(blob);
  let audio = new Audio();
  audio.src = url;
  return audio;
}

export function timings_to_text({
  filename,
  keypoints,
}: {
  filename: string;
  keypoints: { rangeEnd: number; audioStart: number }[];
}) {
  let text = filename ? "$" + filename : "";
  let last_end = 0;
  let last_time = 0;
  if (keypoints) {
    for (let point of keypoints) {
      text += ";";
      text += Math.round(point.rangeEnd - last_end);
      text += ",";
      text += Math.round(point.audioStart - last_time);
      last_end = point.rangeEnd;
      last_time = point.audioStart;
    }
  }
  return text;
}

export function text_to_keypoints(line: string) {
  const parts = line.split(";");
  const filename = parts.splice(0, 1)[0];
  const keypoints: { rangeEnd: number; audioStart: number }[] = [];
  let last_end = 0;
  let last_time = 0;
  for (const part of parts) {
    const [start0, duration0] = part.split(",");
    const start = parseInt(start0);
    const duration = parseInt(duration0);
    keypoints.push({
      rangeEnd: last_end + start,
      audioStart: last_time + duration,
    });
    last_end += start;
    last_time += duration;
  }
  return [filename, keypoints] as const;
}

export function insert_audio_line(
  text: string,
  ssml: {
    text: string;
    speaker: string;
    id: number;
    inser_index: number;
  },
  view: EditorView,
  audio_insert_lines: LineTuple[],
) {
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
