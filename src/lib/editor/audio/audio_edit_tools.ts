import { fetch_post } from "@/lib/fetch_post";
import type { ChangeDesc, Text } from "@codemirror/state";
import { EditorView } from "codemirror";

export {
  generate_ssml_line,
  text_to_keypoints,
  timing_text_without_filename,
  timings_to_text,
} from "./audio_timing";

export async function generate_audio_line(ssml: {
  text: string;
  speaker: string;
  id: number;
  mapping?: Record<number, number>;
}) {
  let speaker = ssml["speaker"].trim();
  let speak_text = ssml["text"];
  let mapping = ssml["mapping"] ?? {};
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

export type AudioInsertAnchor = {
  kind: "replace" | "insert";
  from: number;
  to: number;
};

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

export function insert_audio_line(
  text: string,
  ssml: {
    text: string;
    speaker: string;
    id: number;
    inser_index: number;
  },
  view: EditorView,
  audio_insert_lines: [number | undefined, number][],
) {
  const anchor = create_audio_insert_anchor(ssml, view, audio_insert_lines);
  if (!anchor) return;
  insert_audio_at_anchor(text, view, anchor);
}

export function create_audio_insert_anchor(
  ssml: {
    inser_index: number;
  },
  view: EditorView,
  audio_insert_lines: [number | undefined, number][],
): AudioInsertAnchor | undefined {
  const insertTarget = audio_insert_lines[ssml.inser_index];
  if (!insertTarget) return undefined;

  const [line, line_insert] = insertTarget;
  if (line !== undefined) {
    const lineNumber = Math.min(Math.max(1, line), view.state.doc.lines);
    const line_state = view.state.doc.line(lineNumber);
    return {
      kind: "replace",
      from: line_state.from,
      to: line_state.to,
    };
  }

  const line_state = get_audio_insert_line(view.state.doc, line_insert);
  return {
    kind: "insert",
    from: line_state.from,
    to: line_state.from,
  };
}

export function get_audio_insert_line(doc: Text, line_insert: number) {
  const lineNumber = Math.min(Math.max(1, line_insert), doc.lines);
  return doc.line(lineNumber);
}

export function map_audio_insert_anchor(
  anchor: AudioInsertAnchor,
  changes: ChangeDesc,
) {
  if (anchor.kind === "replace") {
    // Keep replacement anchors wrapped around the edited content.
    anchor.from = changes.mapPos(anchor.from, -1);
    anchor.to = changes.mapPos(anchor.to, 1);
    return;
  }

  const mapped = changes.mapPos(anchor.from, 1);
  anchor.from = mapped;
  anchor.to = mapped;
}

export function insert_audio_at_anchor(
  text: string,
  view: EditorView,
  anchor: AudioInsertAnchor,
) {
  const insertText = anchor.kind === "insert" ? `${text}\n` : text;
  const insertedLength = insertText.length;
  const from = anchor.from;
  view.dispatch(
    view.state.update({
      changes: {
        from,
        to: anchor.to,
        insert: insertText,
      },
    }),
  );
  anchor.kind = "replace";
  anchor.from = from;
  anchor.to = from + insertedLength;
}

export function insert_audio_lines(
  updates: {
    text: string;
    ssml: {
      text: string;
      speaker: string;
      id: number;
      inser_index: number;
    };
  }[],
  view: EditorView,
  audio_insert_lines: [number | undefined, number][],
) {
  const changes = updates
    .map((update) => {
      const insertTarget = audio_insert_lines[update.ssml.inser_index];
      if (!insertTarget) return undefined;

      const [line, line_insert] = insertTarget;
      if (line !== undefined) {
        const lineNumber = Math.min(Math.max(1, line), view.state.doc.lines);
        const line_state = view.state.doc.line(lineNumber);
        return {
          from: line_state.from,
          to: line_state.to,
          insert: update.text,
        };
      }

      const line_state = get_audio_insert_line(view.state.doc, line_insert);
      return {
        from: line_state.from,
        to: line_state.from,
        insert: update.text + "\n",
      };
    })
    .filter((change) => change !== undefined)
    .sort((a, b) => a.from - b.from || a.to - b.to);

  if (changes.length === 0) return;

  view.dispatch(
    view.state.update({
      changes,
    }),
  );
}
