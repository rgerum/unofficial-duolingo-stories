import {
  generate_ssml_line,
  text_to_keypoints,
} from "../../story/text_lines/audio_edit_tools";
import { Avatar } from "@/app/editor/story/[story]/page";

// Core Types
interface HintMapItem {
  hintIndex: number;
  rangeFrom: number;
  rangeTo: number;
}

interface HintMapResult {
  hintMap: HintMapItem[];
  hints: string[];
  text: string;
}

interface ContentWithHints {
  hintMap: HintMapItem[];
  text: string;
  [key: string]: any; // For additional properties
}

export interface HideRange {
  start: number;
  end: number;
}

function generateHintMap(
  text: string = "",
  translation: string = "",
): HintMapResult {
  if (!text) text = "";
  text = text.replace(/\|/g, "⁠");
  let text_list = splitTextTokens(text);
  text = text.replace(/~/g, " "); //
  if (!translation) translation = "";
  translation = translation.replace(/\|/g, "⁠");
  let trans_list = splitTextTokens2(translation);
  let hints = [];
  let hintMap = [];
  let text_pos = 0;
  for (let i = 0; i < text_list.length; i++) {
    if (i === 0 && text_list[i] === "") {
      trans_list.unshift("", "");
    }
    if (i % 2 === 0 && trans_list[i] && trans_list[i] !== "~") {
      hintMap.push({
        hintIndex: hints.length,
        rangeFrom: text_pos,
        rangeTo: text_pos + text_list[i].length - 1,
      });
      hints.push(trans_list[i].replace(/~/g, " ").replace(/\|/g, "⁠"));
    }
    text_pos += text_list[i].length;
  }
  return { hintMap: hintMap, hints: hints, text: text.trim() };
}

function hintsShift(content: ContentWithHints, pos: number): void {
  for (let i in content.hintMap) {
    if (content.hintMap[i].rangeFrom > pos) content.hintMap[i].rangeFrom -= 1;
    if (content.hintMap[i].rangeTo >= pos) content.hintMap[i].rangeTo -= 1;
  }
  content.text =
    content.text.substring(0, pos) + content.text.substring(pos + 1);
}

function getButtons(content: ContentWithHints): [string[], number[]] {
  let buttons = [...content.text.matchAll(/\(([^)]*)\)/g)];
  let selectablePhrases = [];
  for (let button of buttons) {
    selectablePhrases.push(
      button[1].replace(/\[\[/g, "[").replace(/]]/g, "]").replace(/\\n/g, "\n"),
    );
  }
  let characterPositions = [];
  let pos1 = content.text.indexOf("(");
  pos1 = content.text.indexOf(")");
  while (pos1 !== -1) {
    hintsShift(content, pos1);
    pos1 = content.text.indexOf(")");
  }
  pos1 = content.text.indexOf("(");
  let first = true;
  while (pos1 !== -1) {
    hintsShift(content, pos1);
    if (content.text.substring(pos1, pos1 + 1) === "+")
      hintsShift(content, pos1);
    if (!first) characterPositions.push(pos1 - 1);
    first = false;
    pos1 = content.text.indexOf("(");
  }
  characterPositions.push(content.text.length - 2);

  return [selectablePhrases, characterPositions];
}

function regexIndexOf(
  string: string,
  regex: RegExp,
  startpos?: number,
): number {
  var indexOf = string.substring(startpos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf;
}
function removeDoubleBrackets(
  content: ContentWithHints,
  pos: number[],
): number[] {
  for (let char of [/(?<!\[)\[(?!\[)/, /(?<!\])\](?!\])/, /\[\[/, /\]\]/]) {
    let pos1 = regexIndexOf(content.text, char);
    while (pos1 !== -1) {
      for (let i = 0; i < pos.length; i++) if (pos[i] > pos1) pos[i] -= 1;
      hintsShift(content, pos1);
      pos1 = regexIndexOf(content.text, char);
    }
  }
  return pos;
}

function getHideRanges(content: ContentWithHints): HideRange[] {
  let pos_br = content.text.indexOf("\\n");
  while (pos_br !== -1) {
    hintsShift(content, pos_br);
    content.text =
      content.text.substring(0, pos_br) +
      "\n" +
      content.text.substring(pos_br + 1);
    pos_br = content.text.indexOf("\\n");
  }
  //content.text = content.text.replace(/\\n/g, "\n");

  // find brackets that are not doubled
  let pos1 = regexIndexOf(content.text, /(?<!\[)\[(?!\[)/);
  let pos2 = regexIndexOf(content.text, /(?<!\])\](?!\])/);

  if (pos1 !== -1 && pos2 !== -1) {
    hintsShift(content, pos1);
    hintsShift(content, pos2 - 1);
    [pos1, pos2] = removeDoubleBrackets(content, [pos1, pos2]);
    return [{ start: pos1, end: pos2 - 1 }];
  }
  removeDoubleBrackets(content, []);
  return [];
}

function shuffleArray(selectablePhrases: string[]): [number[], string[]] {
  let phraseOrder = [];
  for (let i in selectablePhrases) {
    phraseOrder.push(parseInt(i));
  }
  const shuffleArray = (array: number[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  };
  shuffleArray(phraseOrder);
  let selectablePhrases2 = [];
  for (let i of phraseOrder) selectablePhrases2.push(selectablePhrases[i]);
  return [phraseOrder, selectablePhrases2];
}

function split_lines(text: string) {
  /* splits the text into lines and removes comments */
  let lines: LineTuple[] = [];
  let lineno = 0;
  let todo_count = 0;
  for (let line of text.split("\n")) {
    lineno += 1;
    // ignore empty lines or lines with comments (and remove rtl isolate)
    line = line.trim().replace(/\u2067/, "");
    if (line.length === 0 || line.substring(0, 1) === "#") {
      if (line.indexOf("TODO") !== -1) todo_count++;
      continue;
    }

    lines.push([lineno, line]);
  }
  lines.push([lineno + 1, ""]);
  lines.push([lineno + 2, ""]);
  return { lines, todo_count };
}

function processBlockData(line_iter: LineIterator, story: Story) {
  while (line_iter.get()) {
    let line = line_iter.get();
    if (!line) break;
    if (line.indexOf("=") !== -1) {
      let [key, value] = line.split("=", 2);
      story.meta[key.trim()] = value.trim();
      line_iter.advance();
      continue;
    }
    break;
  }
  for (let key in story.meta) {
    if (key.startsWith("icon_")) {
      let id = key.substring(5);
      if (!story.meta.avatar_overwrites[id])
        story.meta.avatar_overwrites[id] = {
          id: id,
          link: "",
          speaker: "",
          name: "",
        };
      story.meta.avatar_overwrites[id].link = story.meta[key] ?? "";
    }
    if (key.startsWith("speaker_")) {
      let id = key.substring(8);
      if (!story.meta.avatar_overwrites[id])
        story.meta.avatar_overwrites[id] = {
          id: id,
          link: "",
          speaker: "",
          name: "",
        };
      story.meta.avatar_overwrites[id].speaker = story.meta[key] ?? "";
    }
  }
  if (story.meta["set"] && story.meta["set"].indexOf("|") !== -1) {
    [story.meta.set_id, story.meta.set_index] = story.meta["set"].split("|");
  }
  story.from_language_name = story.meta.from_language_name;
}

let punctuation_chars =
  "\\/¡!\"'`#$%&*,.:;<=>¿?@^_`{|}…" + "。、，！？；：（）～—·《…》〈…〉﹏……——";
//punctuation_chars = "\\\\¡!\"#$%&*,、，.。\\/:：;<=>¿?@^_`{|}…"

let regex_split_token = new RegExp(
  `([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​|⁠)[\\s${punctuation_chars}]*)`,
);
let regex_split_token2 = new RegExp(
  `([\\s${punctuation_chars}~]*(?:^|\\s|$|​|⁠)[\\s${punctuation_chars}~]*)`,
);
/*
function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    //console.log(text, text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*(?:^|\s|$)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/))
    if(keep_tilde)
        return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    //return text.split(regex_split_token)
    else
        return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
    //return text.split(regex_split_token2)
}
*/

export function splitTextTokens(text: string, keep_tilde = true) {
  if (!text) return [];
  //console.log(text, text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*(?:^|\s|$)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/))
  if (keep_tilde)
    //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    return text.split(regex_split_token);
  //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…\]]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/)
  //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
  else return text.split(regex_split_token2);
  //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…~]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…~]*)/)
}

function splitTextTokens2(text: string, keep_tilde = true) {
  if (!text) return [];
  if (keep_tilde)
    //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    return text.split(/([\s​⁠]+)/);
  //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
  else return text.split(/([\s​⁠~]+)/);
}

function getInputStringText(text: string) {
  // remove multiple white space characters
  text = text.replace(/(\s)\s+/g, "$1");
  //
  return text; //.replace(/([^-|~ ,、，;.。:：_?!…]*){([^}]*)}/g, "$1");
}

function getInputStringSpeechText(text: string, hide: boolean) {
  if (hide) {
    text = text.replace("[", '<prosody volume="silent">');
    text = text.replace("]", "</prosody>");
  }
  //text = text.replace(/(\.\.\.|…)/g, '<sub alias=" ">$1</sub><break/>');
  //text = text.replace(/\(\+/g, "");
  //text = text.replace(/\(/g, "");
  //text = text.replace(/\)/g, "");
  //text = text.replace(/\[/g, "");
  //text = text.replace(/\]/g, "");
  return text;
  return (
    "<speak>" +
    text
      .replace(
        /([^-|~ ,;.:_?!…]*)\{([^\}:]*):([^\}]*)\}/g,
        '<phoneme alphabet="$3" ph="$2">$1</phoneme>',
      )
      .replace(/([^-|~ ,;.:_?!…]*)\{([^\}]*)\}/g, '<sub alias="$2">$1</sub>')
      .replace(/~/g, " ")
      .replace(/\|/g, "⁠") +
    "</speak>"
  );
}

function speaker_text_trans(
  data: Speaker,
  meta: Meta,
  use_buttons = false,
  hide = false,
) {
  //console.log("data.text", data.text)

  const text_match = data.text?.match(
    /\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S|\S)\s*/,
  );
  const speaker_text = text_match?.[1] || "";
  let text = text_match?.[2] || "";

  const translation = data.trans?.match(/\s*~\s*(\S.*\S|\S)\s*/)?.[1] || "";

  getInputStringText(text);
  let ipa_replacements: string[] & { index: number }[] = [];
  let ipa_match = text.match(/([^-|~ ,、，;.。:：_?!…]*){([^}:]*)(:[^}]*)?}/);

  while (ipa_match && ipa_match.index !== undefined) {
    ipa_replacements.push({ index: ipa_match.index });
    text =
      text.substring(0, ipa_match.index + ipa_match[1].length) +
      text.substring(ipa_match.index + ipa_match[0].length);
    ipa_match = text.match(/([^-|~ ,、，;.。:：_?!…]*){([^}:]*)(:[^}]*)?}/);
  }
  //text = text.replace(/([^-|~ ,、，;.。:：_?!…]*){([^}]*)}/g, "$1");

  let content = generateHintMap(text, translation);

  let selectablePhrases, characterPositions;
  if (use_buttons)
    [selectablePhrases, characterPositions] = getButtons(content);

  let hideRanges = getHideRanges(content);
  for (let hide of hideRanges) {
    for (let match of ipa_replacements) {
      if (match.index > hide.start) match.index -= 1;
      if (match.index > hide.end) match.index -= 1;
    }
  }

  // split number of speaker
  let speaker;
  let speaker_id = "0";
  if (speaker_text) {
    speaker_id = speaker_text.match(/Speaker(.*)/)?.[1] || "0";
  }
  if (meta) {
    speaker = get_avatar(speaker_id, meta.avatar_names, meta.avatar_overwrites);
    meta.cast[speaker_id] = {
      speaker:
        meta.avatar_overwrites[speaker_id]?.speaker ||
        meta.avatar_names[speaker_id]?.speaker ||
        meta.avatar_names[0]?.speaker ||
        "",
      link:
        meta.avatar_overwrites[speaker_id]?.link ||
        meta.avatar_names[speaker_id]?.link,
      name:
        meta.avatar_overwrites[speaker_id]?.name ||
        meta.avatar_names[speaker_id]?.name,
      id: speaker_id,
    };
  }
  let audio;
  if (data.allow_audio) {
    let speaker_name =
      meta["speaker_" + "narrator"] || meta.avatar_names[0]?.speaker;
    if (speaker_id)
      speaker_name =
        meta.avatar_overwrites[speaker_id]?.speaker ||
        meta.avatar_names[speaker_id]?.speaker ||
        meta.avatar_names[0]?.speaker;

    audio = line_to_audio(
      data.audio ?? "",
      content.text,
      speaker_name,
      meta.story_id,
      hide ? hideRanges : [],
      meta.transcribe_data,
      ipa_replacements,
    );
    audio.ssml.inser_index = meta.audio_insert_lines.length;
    audio.ssml.plan_text = text;
    audio.ssml.plan_text_speaker_name = speaker_name;
    meta.audio_insert_lines.push([
      data.audio_line ?? 0,
      data.audio_line_inset ?? "",
    ]);
    //audio.ssml.line = data.audio_line;
    //audio.ssml.line_insert = data.audio_line_inset;
    content.audio = audio;
  }

  let line;
  if (speaker && speaker_id !== "0") {
    line = {
      type: "CHARACTER",
      avatarUrl: speaker.avatarUrl,
      characterId: speaker.characterId,
      characterName: speaker?.characterName,
      content: content,
    };
  } else {
    line = {
      type: "PROSE",
      content: content,
    };
  }
  return {
    speaker: speaker,
    line: line,
    content: content,
    hideRanges: hideRanges,
    selectablePhrases: selectablePhrases,
    characterPositions: characterPositions,
    audio: audio,
  };
}

type Audio = {
  ssml: {
    text: string;
    speaker: string;
    id: number;

    inser_index: number | undefined;
    plan_text: string | undefined;
    plan_text_speaker_name: string | undefined;
  };
  url: undefined | string;
  keypoints: undefined | { rangeEnd: number; audioStart: number }[];
};
function line_to_audio(
  line: string,
  text: string,
  speaker: string,
  story_id: number,
  hideRanges: HideRange[],
  transcribe_data: TranscribeData,
  ipa_replacements: { index: number }[],
) {
  //let text_speak = getInputStringSpeechText(text, hide);
  let audio = {
    ssml: {
      text: text,
      speaker: speaker,
      id: story_id,
    },
    url: undefined,
    keypoints: undefined,
  } as Audio;
  audio.ssml = generate_ssml_line(
    audio.ssml,
    transcribe_data,
    hideRanges,
    ipa_replacements,
  );
  if (line) {
    line = line.substring(1);
    let [filename, keypoints] = text_to_keypoints(line);
    audio.url = "audio/" + filename;
    audio.keypoints = keypoints;
  }
  return audio;
}

function get_avatar(
  id: string,
  avatar_names: Record<string, Avatar>,
  avatar_overwrites: Record<string, AvatarOverwrites>,
) {
  const id2 = parseInt(id) ?? id;
  if (avatar_overwrites[id2])
    return { characterId: id2, avatarUrl: avatar_overwrites[id2]?.link };
  return {
    characterId: id2,
    avatarUrl: avatar_names[id2]?.link,
    characterName: avatar_names[id2]?.name,
  };
}

type Speaker = {
  text: undefined | string;
  trans: undefined | string;
  allow_audio: undefined | boolean;
  audio_line_inset: undefined | number;
  audio: undefined | string;
  audio_line: undefined | number;
};

function getText(
  line_iter: LineIterator,
  allow_speaker: boolean,
  allow_trans: boolean,
  allow_audio: boolean,
) {
  let speaker: Speaker = {
    text: undefined,
    trans: undefined,
    allow_audio: undefined,
    audio_line_inset: undefined,
    audio: undefined,
    audio_line: undefined,
  };
  let line = line_iter.get();
  if (!line) return speaker;
  if (line.startsWith(">") || (allow_speaker && line.match(/\w*:/))) {
    speaker.text = line;
    line = line_iter.advance(1);
    if (line?.startsWith("~") && allow_trans) {
      speaker.trans = line;
      line = line_iter.advance();
    }
    if (allow_audio) {
      speaker.allow_audio = allow_audio;
      speaker.audio_line_inset = line_iter.get_lineno();
      if (line?.startsWith("$")) {
        speaker.audio = line;
        speaker.audio_line = line_iter.get_lineno();
        line_iter.advance();
      }
    }
  }
  return speaker;
}

function getAnswers(line_iter: LineIterator, allow_trans, lang_hints) {
  let answers = [];
  let correct_answer = undefined;
  while (line_iter.get()) {
    let line = line_iter.get();
    if (line.startsWith("+") || line.startsWith("-")) {
      if (line.startsWith("+")) correct_answer = answers.length;
      let answer = { text: line };
      line = line_iter.advance();
      if (line && line.startsWith("~") && allow_trans) {
        answer.trans = line;
        line = line_iter.advance();
      }
      if (allow_trans) {
        let data_text = speaker_text_trans(answer);
        data_text.content.lang_hints = lang_hints;
        answers.push(data_text.content);
      } else answers.push(answer.text.substring(1).trim());
      continue;
    }
    break;
  }
  return [answers, correct_answer];
}

function pointToPhraseButtons(line) {
  [, , line] = line.match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S)\s*/);
  line = line.replace(/(\s*)\)/g, ")$1");
  line = line.replace(/~/g, " ");
  line = line.replace(/ +/g, " ");
  line = line.replace(/\|/g, "⁠");
  line = line.replace(/\[\[/g, "[");
  line = line.replace(/]]/g, "]");
  line = line.replace(/\\n/g, "\n");
  let transcriptParts = [];
  let correctAnswerIndex = 0;
  let index = 0;

  while (line.length) {
    let pos = line.indexOf("(");
    if (pos === -1) {
      for (let l of splitTextTokens(line))
        if (l !== "")
          transcriptParts.push({
            selectable: false,
            text: l,
          });
      break;
    }
    if (line.substring(0, pos) !== "") {
      for (let l of splitTextTokens(line.substring(0, pos)))
        if (l !== "")
          transcriptParts.push({
            selectable: false,
            text: l,
          });
    }
    line = line.substring(pos + 1);
    if (line.startsWith("+")) {
      correctAnswerIndex = index;
      line = line.substring(1);
    }
    let pos2 = line.indexOf(")");
    if (pos2 === -1) pos2 = line.length - 1;
    transcriptParts.push({
      selectable: true,
      text: line.substring(0, pos2).trim(),
    });
    index += 1;
    line = line.substring(pos2 + 1);
  }

  return [correctAnswerIndex, transcriptParts];
}

function processBlockHeader(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let data = getText(line_iter, false, true, true);
  let data_text = speaker_text_trans(data, story.meta);

  data_text.line.content.lang_hints = story_languages.from_language;

  story.elements.push({
    type: "HEADER",
    illustrationUrl:
      "https://stories-cdn.duolingo.com/image/" + story.meta["icon"] + ".svg",
    title: story.meta["from_language_name"],
    learningLanguageTitleContent: data_text.content,
    trackingProperties: {},
    audio: data_text.audio,
    lang: lang || story_languages.learning_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: line_iter.get_lineno(),
      active_no: start_no1,
    },
  });
  return false;
}

function processBlockLine(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let data = getText(line_iter, true, true, true);
  let data_text = speaker_text_trans(data, story.meta);

  data_text.line.content.lang_hints = story_languages.from_language;

  story.elements.push({
    type: "LINE",
    hideRangesForChallenge: data_text.hideRanges,
    line: data_text.line,
    trackingProperties: {
      line_index: story.meta.line_index,
    },
    audio: data_text.audio,
    lang: lang || story_languages.learning_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: line_iter.get_lineno(),
      active_no: start_no1,
    },
  });
  story.meta.line_index += 1;
  return false;
}

function processBlockMultipleChoice(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let data = getText(line_iter, false, true, false);
  let data_text = speaker_text_trans(data, story.meta);

  let [answers, correct_answer] = getAnswers(line_iter, true);
  story.elements.push({
    type: "MULTIPLE_CHOICE",
    answers: answers,
    correctAnswerIndex: correct_answer,
    question: data_text.content,
    trackingProperties: {
      line_index: story.meta.line_index - 1,
      challenge_type: "multiple-choice",
    },
    lang: lang || story_languages.from_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: line_iter.get_lineno(),
      active_no: start_no1,
    },
  });
  //story.meta.line_index += 1;
  return false;
}

function processBlockSelectPhrase(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let question_data = getText(line_iter, false, true, false);
  let question_data_text = speaker_text_trans(question_data, story.meta);

  let start_no2 = line_iter.get_lineno(0);
  let data = getText(line_iter, true, true, true);
  let data_text = speaker_text_trans(data, story.meta);

  data_text.line.content.lang_hints = story_languages.from_language;

  let start_no3 = line_iter.get_lineno(0);
  let [answers, correct_answer] = getAnswers(line_iter, false);
  story.elements.push({
    type: "CHALLENGE_PROMPT",
    prompt: question_data_text.content,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "select-phrases",
    },
    lang: lang || story_languages.from_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: start_no2,
      active_no: start_no1,
    },
  });
  story.elements.push({
    type: "LINE",
    hideRangesForChallenge: data_text.hideRanges,
    line: data_text.line,
    trackingProperties: {
      line_index: story.meta.line_index,
    },
    audio: data_text.audio,
    lang: story_languages.learning_language,
    editor: { start_no: start_no2, end_no: start_no3 },
  });
  story.elements.push({
    type: "SELECT_PHRASE",
    answers: answers,
    correctAnswerIndex: correct_answer,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "select-phrases",
    },
    lang: story_languages.learning_language,
    editor: { start_no: start_no3, end_no: line_iter.get_lineno() },
  });
  story.meta.line_index += 1;
}

function processBlockContinuation(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let question_data = getText(line_iter, false, true, false);
  let question_data_text = speaker_text_trans(question_data, story.meta);

  let start_no2 = line_iter.get_lineno();
  let data = getText(line_iter, true, true, true);
  let data_text = speaker_text_trans(data, story.meta, false, true);

  data_text.line.content.lang_hints = story_languages.from_language;

  let start_no3 = line_iter.get_lineno();
  let [answers, correct_answer] = getAnswers(
    line_iter,
    true,
    story_languages.from_language,
  );
  story.elements.push({
    type: "CHALLENGE_PROMPT",
    prompt: question_data_text.content,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "continuation",
    },
    lang: lang || story_languages.from_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: start_no2,
      active_no: start_no1,
    },
  });
  story.elements.push({
    type: "LINE",
    hideRangesForChallenge: data_text.hideRanges,
    line: data_text.line,
    trackingProperties: {
      line_index: story.meta.line_index,
    },
    audio: data_text.audio,
    lang: story_languages.learning_language,
    editor: { start_no: start_no2, end_no: start_no3 },
  });
  story.elements.push({
    type: "MULTIPLE_CHOICE",
    answers: answers,
    correctAnswerIndex: correct_answer,
    //question: data_text.content,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "continuation",
    },
    lang: story_languages.learning_language,
    editor: { start_no: start_no3, end_no: line_iter.get_lineno() },
  });
  story.meta.line_index += 1;
}

function processBlockArrange(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let question_data = getText(line_iter, false, true, false);
  let question_data_text = speaker_text_trans(question_data, story.meta);

  let start_no2 = line_iter.get_lineno();
  let data = getText(line_iter, true, true, true);
  let data_text = speaker_text_trans(data, story.meta, true);

  data_text.line.content.lang_hints = story_languages.from_language;

  let [phraseOrder, selectablePhrases2] = shuffleArray(
    data_text.selectablePhrases,
  );
  story.elements.push({
    type: "CHALLENGE_PROMPT",
    prompt: question_data_text.content,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "arrange",
    },
    lang: lang || story_languages.from_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: start_no2,
      active_no: start_no1,
    },
  });
  story.elements.push({
    type: "LINE",
    hideRangesForChallenge: data_text.hideRanges,
    line: data_text.line,
    trackingProperties: {
      line_index: story.meta.line_index,
    },
    audio: data_text.audio,
    lang: story_languages.learning_language,
    editor: { start_no: start_no2, end_no: line_iter.get_lineno() },
  });
  story.elements.push({
    type: "ARRANGE",
    characterPositions: data_text.characterPositions,
    phraseOrder: phraseOrder,
    selectablePhrases: selectablePhrases2,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "arrange",
    },
    lang: story_languages.learning_language,
    editor: { start_no: start_no2, end_no: line_iter.get_lineno() },
  });
  story.meta.line_index += 1;
}

function processBlockPointToPhrase(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let question_data = getText(line_iter, false, true, false);
  let question_data_text = speaker_text_trans(question_data, story.meta);

  let start_no2 = line_iter.get_lineno();
  let data = getText(line_iter, true, true, true);
  let data_text = speaker_text_trans(data, story.meta, true);

  data_text.line.content.lang_hints = story_languages.from_language;

  let [correctAnswerIndex, transcriptParts] = pointToPhraseButtons(data.text);

  story.elements.push({
    type: "LINE",
    hideRangesForChallenge: data_text.hideRanges,
    line: data_text.line,
    trackingProperties: {
      line_index: story.meta.line_index,
    },
    audio: data_text.audio,
    lang: story_languages.learning_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: start_no2,
      active_no: start_no1,
    },
  });
  story.elements.push({
    type: "POINT_TO_PHRASE",
    correctAnswerIndex: correctAnswerIndex,
    transcriptParts: transcriptParts,
    question: question_data_text.content,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "point-to-phrase",
    },
    lang_question: lang || story_languages.from_language,
    lang: story_languages.learning_language,
    editor: { start_no: start_no2, end_no: line_iter.get_lineno() },
  });
  story.meta.line_index += 1;
}

function processBlockMatch(
  line_iter: LineIterator,
  story: Story,
  lang: string,
  story_languages: StoryLanguages,
) {
  let start_no = line_iter.get_lineno(-1);
  let start_no1 = line_iter.get_lineno();
  let question_data = getText(line_iter, false, true, false);
  let question_data_text = speaker_text_trans(question_data, story.meta);

  let answers = [];
  while (line_iter.get()) {
    let line = line_iter.get();
    if (!line) break;
    let match = line.match(/-\s*(.*\S)\s*<>\s*(.*\S)\s*/);
    if (match) {
      let [, word1, word2] = match;
      answers.push({ phrase: word1, translation: word2 });
      line_iter.advance();
      continue;
    }
    break;
  }

  story.elements.push({
    type: "MATCH",
    fallbackHints: answers,
    prompt: question_data_text.content.text,
    trackingProperties: {
      line_index: story.meta.line_index,
      challenge_type: "match",
    },
    lang: story_languages.learning_language,
    lang_question: lang || story_languages.from_language,
    editor: {
      block_start_no: start_no,
      start_no: start_no,
      end_no: line_iter.get_lineno(),
      active_no: start_no1,
    },
  });
  story.meta.line_index += 1;
}

const block_functions: Record<
  string,
  (
    line_iter: LineIterator,
    story: Story,
    lang: string,
    story_languages: StoryLanguages,
  ) => void
> = {
  DATA: processBlockData,
  HEADER: processBlockHeader,
  LINE: processBlockLine,
  MULTIPLE_CHOICE: processBlockMultipleChoice,
  SELECT_PHRASE: processBlockSelectPhrase,
  CONTINUATION: processBlockContinuation,
  ARRANGE: processBlockArrange,
  POINT_TO_PHRASE: processBlockPointToPhrase,
  MATCH: processBlockMatch,
};

function line_iterator(lines: LineTuple[]) {
  let index = 0;
  function get(offset = 0) {
    if (lines[index + offset]) return lines[index + offset][1];
  }
  function get_lineno(offset = 0) {
    if (lines[index + offset]) return lines[index + offset][0];
  }
  function advance(offset = 1) {
    index += offset;
    return get();
  }
  return { get: get, get_lineno: get_lineno, advance: advance };
}
type LineIterator = ReturnType<typeof line_iterator>;

export type StoryElement = {};
export type Story = {
  elements: StoryElement[];
  meta: Meta;
  from_language_name: string | undefined;
};
export type Meta = {
  audio_insert_lines: LineTuple[];
  line_index: number;
  story_id: number;
  avatar_names: Record<string, Avatar>;
  avatar_overwrites: Record<string, AvatarOverwrites>;
  cast: Record<string, Cast>;
  transcribe_data: TranscribeData;
  todo_count: number;
  from_language_name: string | undefined;
  set: string | undefined;
  set_id: string | undefined;
  set_index: string | undefined;
  [key: string]: any;
};

type AvatarOverwrites = {
  id: string;
  link: string;
  speaker: string;
  name: string;
};
type Cast = { id: string; link: string; speaker: string; name: string };

type StoryLanguages = {
  learning_language: string;
  from_language: string;
};

export type TranscribeData = {};

export type LineTuple = [number, string];

//window.audio_insert_lines = []
export function processStoryFile(
  text: string,
  story_id: number,
  avatar_names: Record<number, Avatar>,
  story_languages: StoryLanguages,
  transcribe_data: TranscribeData,
) {
  // reset those line as they may have changed
  //window.audio_insert_lines = []

  const { lines, todo_count } = split_lines(text);

  const story: Story = {
    elements: [],
    meta: {
      audio_insert_lines: [],
      line_index: 1,
      story_id: story_id,
      avatar_names: avatar_names,
      avatar_overwrites: {},
      cast: {},
      transcribe_data: transcribe_data,
      todo_count: 0,
    },
  };
  const line_iter = line_iterator(lines);
  while (line_iter.get()) {
    const line = line_iter.get();
    if (!line) break;
    const match = line.match(/\[([^\]]*)\](<(.+)>)?$/);
    if (match !== null) {
      line_iter.advance();
      const current_block: string = match[1];
      try {
        if (block_functions[current_block]) {
          block_functions[current_block](
            line_iter,
            story,
            match[3],
            story_languages,
          );
          continue;
        }
      } catch (e) {
        console.error(e);
      }
    }
    story.elements.push({
      type: "ERROR",
      text: line,
      trackingProperties: {
        line_index: story.meta.line_index,
        challenge_type: "error",
      },
      // "editor": {"start_no": group.start_no, "end_no": group.end_no}
    });
    story.meta.line_index += 1;
    //console.log("error", lineno, line)
    line_iter.advance();
  }
  story.meta.todo_count = todo_count;
  const meta = story.meta;
  delete story.meta;
  const audio_insert_lines = meta.audio_insert_lines;
  delete meta.audio_insert_lines;

  return [story, meta, audio_insert_lines];
}
