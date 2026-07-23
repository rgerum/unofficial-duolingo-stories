import {
  add_word_marks_replacements,
  find_replace_with_mapping,
  init_mapping,
  replace_with_mapping,
  transcribe_text,
} from "./text_with_mapping";
import { HideRange } from "@/components/editor/story/syntax_parser_types";
import type {
  IpaReplacement,
  TranscribeData,
} from "@/components/editor/story/syntax_parser_new";

// Pure audio timing/SSML helpers, kept free of CodeMirror and browser
// dependencies so the story parser (and everything importing it, like the
// server-side lint) can be bundled outside the editor, e.g. in Convex actions.

export function generate_ssml_line(
  ssml: { speaker: string; text: string },
  transcribe_data: TranscribeData,
  hideRanges: HideRange[],
  ipa_replacements: IpaReplacement[],
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
    if (!match.word || !match.alias) continue;
    let new_words = [`<sub alias="${match.alias}">`, `</sub>`];
    if (match.alphabet) {
      new_words = [
        `<phoneme alphabet="${match.alphabet}" ph="${match.alias}">`,
        `</phoneme>`,
      ];
    }
    insert(new_words[0], match.index);
    insert(new_words[1], match.index + match.word.length);
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
  } else {
    speak_text = replace_with_mapping(speak_text, `<speak>`, 0);
    speak_text = replace_with_mapping(
      speak_text,
      `</speak>`,
      speak_text.text.length,
    );
  }

  const normalizedMapping: number[] = [];
  let lastValid = 0;
  for (let i = 0; i < speak_text.mapping.length; i++) {
    const value = speak_text.mapping[i];
    if (typeof value === "number" && Number.isFinite(value)) {
      lastValid = value;
      normalizedMapping.push(value);
    } else {
      normalizedMapping.push(lastValid);
    }
  }

  return {
    ...ssml,
    text: speak_text.text,
    mapping: normalizedMapping,
    speaker: speaker,
  };
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

export function timing_text_without_filename(text: string) {
  const firstTimingIndex = text.indexOf(";");
  if (firstTimingIndex === -1) return "";
  return text.slice(firstTimingIndex);
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
