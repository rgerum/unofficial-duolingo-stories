import jsyaml from "js-yaml";
import { TranscribeData } from "@/components/editor/story/syntax_parser_new";

type Mapping = number[];
type MappedText = { text: string; mapping: Mapping };

export function init_mapping(text: string) {
  const mapping: Mapping = [];
  for (let i = 0; i < text.length; i++) {
    mapping.push(i);
  }
  return { text, mapping } as MappedText;
}

export function replace_with_mapping(
  { text, mapping }: MappedText,
  replace: string,
  start: number,
  end?: number,
) {
  if (mapping === undefined) mapping = init_mapping(text).mapping;
  if (!end) end = start;
  let length = end - start;
  //console.log("replace_with_mapping", {text, mapping}, replace, start, end, length)

  let new_indices = [];
  for (let j = 0; j < replace.length; j++) {
    if (j < length) new_indices.push(mapping[start + j]);
    else new_indices.push(mapping[start + length - 1]);
  }
  mapping.splice(start, length, ...new_indices);
  text = text.substring(0, start) + replace + text.substring(end);
  return { text, mapping, length: text.length };
}

export function find_replace_with_mapping(
  mapped_text: { text: string; mapping: number[] },
  find: RegExp,
  replace: string,
) {
  let match = mapped_text.text.match(find);
  let o = 0;
  while (match && match.index) {
    match.index += o;
    if (match.length > 1) {
      let replacer = replace;
      for (let i = 1; i < match.length; i++) {
        let p1 = replacer.indexOf("$" + i);
        if (p1 !== -1) {
          mapped_text = replace_with_mapping(
            mapped_text,
            replacer.substring(0, p1),
            match.index,
            match.index,
          );
          replacer = replacer.substring(p1 + 2);
          match.index += p1 + match[i].length;
        } else {
          mapped_text = replace_with_mapping(
            mapped_text,
            "",
            match.index,
            match.index + match[i].length,
          );
          //replacer = replacer.substring(p1 + 2);
          //match.index += match[i].length;
        }
      }
      mapped_text = replace_with_mapping(mapped_text, replacer, match.index);
      o = match.index + replacer.length;
    } else {
      mapped_text = replace_with_mapping(
        mapped_text,
        replace,
        match.index,
        match.index + match[0].length,
      );
      o = match.index + match[0].length;
    }
    //console.log(o, mapped_text.text.substring(o), match)
    match = mapped_text.text.substring(o).match(find);
  }
  return mapped_text;
}

function apply_letter_replacements(
  mapped_text: { text: string; mapping: number[] },
  replacements?: Record<string, string>,
) {
  if (!replacements) return mapped_text;
  let tag_start = [];
  for (let i = 0; i < mapped_text.text.length; i++) {
    let char = mapped_text.text[i].toLowerCase();
    let new_char = replacements[char];
    if (char === "<") {
      tag_start.push(i);
    } else if (char === ">") {
      tag_start.pop();
    }
    if (new_char !== undefined && tag_start.length === 0) {
      mapped_text = replace_with_mapping(mapped_text, new_char, i, i + 1);
      i += new_char.length - 1;
    }
  }
  return mapped_text;
}

/**
 * Iterate over word replacements in the given mapped text.
 *
 * @param {object} mapped_text - The mapped text object.
 * @param {function} callback - The callback function to be called for each word replacement.
 * @returns {object} - The modified mapped text object.
 */
function iter_word_replacements(
  mapped_text: { text: string; mapping: number[] },
  callback: (
    mapped_text: { text: string; mapping: number[] },
    word: string,
    word_start: number,
    i: number,
    bracket_start: number,
  ) => [mapped_text: { text: string; mapping: number[] }, i: number],
) {
  // Initialize variables
  let last_char_word = false;
  let word_start = undefined;
  let tag_start = [];
  let bracket_start = [];

  // Iterate over each character in the text
  for (let i = 0; i < mapped_text.text.length + 1; i++) {
    let char = mapped_text.text[i] || "\n";
    let word;
    let is_word = false;

    // Check if the character is part of a word
    if (!["<", ">", "[", "]"].includes(char))
      is_word = char.match(reg_white) === null;

    // Check if a new word starts or ends
    if (!last_char_word && is_word) {
      word_start = i;
    } else if (word_start !== undefined && !is_word) {
      word = mapped_text.text.substring(word_start, i);
    }
    last_char_word = is_word;

    // Call the callback function if not inside a tag and a word is found
    if (tag_start.length === 0 && word && word_start !== undefined) {
      [mapped_text, i] = callback(
        mapped_text,
        word,
        word_start,
        i,
        bracket_start.length,
      );
    }
    if (word) word_start = undefined;

    // Update tag_start and bracket_start arrays
    switch (char) {
      case "<":
        tag_start.push(i);
        break;
      case ">":
        tag_start.pop();
        break;
      case "[":
        bracket_start.push(i);
        break;
      case "]":
        bracket_start.pop();
        break;
    }
  }

  return mapped_text;
}

function apply_word_replacements(
  mapped_text: { text: string; mapping: number[] },
  replacements: Record<string, string>,
  options: { in_brackets?: number },
) {
  mapped_text = iter_word_replacements(
    mapped_text,
    (mapped_text, word, word_start, i, bracket_level) => {
      if (
        options.in_brackets !== undefined &&
        options.in_brackets != bracket_level
      )
        return [mapped_text, i];
      //console.log(mapped_text.text.substring(0, i)+ "ö" + mapped_text.text.substring(i))
      let new_word = replacements[word.toLowerCase()];
      if (new_word !== undefined) {
        if (new_word.endsWith(":ipa")) {
          new_word = `<phoneme alphabet="ipa" ph="${new_word.substring(
            0,
            new_word.length - 4,
          )}">`;
          mapped_text = replace_with_mapping(
            mapped_text,
            new_word,
            word_start,
            word_start,
          );
          i += new_word.length;
          new_word = `</phoneme>`;
          mapped_text = replace_with_mapping(mapped_text, new_word, i, i);
          i += new_word.length;
        } else {
          mapped_text = replace_with_mapping(
            mapped_text,
            new_word,
            word_start,
            word_start + word.length,
          );
          i += new_word.length - word.length;
        }
      }
      return [mapped_text, i];
    },
  );
  return mapped_text;
}

let punctuation_chars =
  "\\/¡!\"'`#$%&*,.:;<=>¿?@^_`{|}…" + "。、，！？；：（）～—·《…》〈…〉﹏……——";
//punctuation_chars = "\\\\¡!\"#$%&*,、，.。\\/:：;<=>¿?@^_`{|}…"

let reg_white = new RegExp(`[\\s${punctuation_chars}~]`);
export function add_word_marks_replacements(mapped_text: {
  text: string;
  mapping: number[];
}) {
  mapped_text = iter_word_replacements(
    mapped_text,
    (mapped_text, word, word_start, i, bracket_start) => {
      let insert = `<mark name="${mapped_text.mapping[i]}"/>`;
      mapped_text = replace_with_mapping(mapped_text, insert, word_start);
      i += insert.length;
      return [mapped_text, i];
    },
  );
  return mapped_text;
}

let regex_split_token = new RegExp(
  `([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​)[\\s${punctuation_chars}]*)`,
);
let regex_split_token2 = new RegExp(
  `([\\s${punctuation_chars}~]*(?:^|\\s|$|​)[\\s${punctuation_chars}~]*)`,
);
function splitTextTokens(text: string, keep_tilde = true) {
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

function apply_fragment_replacements(
  mapped_text: { text: string; mapping: number[] },
  replacements: Record<string, string>,
) {
  mapped_text = iter_word_replacements(
    mapped_text,
    (mapped_text, word, word_start, i, bracket_start) => {
      for (let frag in replacements) {
        let match = word.match(new RegExp(frag, "i"));
        if (!match || !match.index) continue;
        let new_word = replacements[frag];
        mapped_text = replace_with_mapping(
          mapped_text,
          new_word,
          word_start + match.index,
          word_start + match.index + match[0].length,
        );
        i += new_word.length - match[0].length;
      }
      return [mapped_text, i];
    },
  );
  return mapped_text;

  for (let frag in replacements) {
    mapped_text = find_replace_with_mapping(
      mapped_text,
      new RegExp(frag, "i"),
      replacements[frag],
    );
  }
  return mapped_text;
}

function apply_group(
  mapped_text: { text: string; mapping: number[] },
  data: Record<string, any>,
  options: { in_brackets?: number },
) {
  for (const section in data) {
    if (section.toUpperCase() === "OPTIONS") {
      options = { ...options, ...data[section] } as { in_brackets?: number };
    }
  }

  for (const section in data) {
    if (section.toUpperCase().startsWith("GROUP")) {
      mapped_text = apply_group(mapped_text, data[section], options);
    }
    if (section.toUpperCase() === "LETTERS") {
      mapped_text = apply_letter_replacements(
        mapped_text,
        data[section],
        //options,
      );
    }
    if (section.toUpperCase() === "FRAGMENTS") {
      mapped_text = apply_fragment_replacements(
        mapped_text,
        data[section],
        //options,
      );
    }
    if (section.toUpperCase() === "WORDS") {
      mapped_text = apply_word_replacements(
        mapped_text,
        data[section],
        options,
      );
    }
  }
  return mapped_text;
}

export function transcribe_text(
  mapped_text: { text: string; mapping: number[] },
  data: TranscribeData,
) {
  const data2 = jsyaml.load(data) as Record<string, any>;

  mapped_text = apply_group(mapped_text, data2, {});

  return mapped_text;
}

if (0) {
  let speak_text = init_mapping(
    "break this... <break name='xx' />is [be KALO and] Text break",
  );

  //speak_text = apply_word_replacements(speak_text, {"break": "take:ipa", "is": "XX"})

  //console.log(speak_text)
  //speak_text = apply_letter_replacements(speak_text, {"b": "IaI", "n": "i"})
  //console.log(speak_text)

  speak_text = apply_fragment_replacements(speak_text, {
    eak$: "ion",
    "^b": "B",
  });

  //speak_text = add_word_marks_replacements(speak_text);
  //console.log(speak_text)
}
if (0) {
  let speak_text = init_mapping(
    "break this... <break name='xx' />is [be KALO and] Text break",
  );
  speak_text = apply_letter_replacements(speak_text, { i: "IaI", a: "i" });
  speak_text = apply_word_replacements(
    speak_text,
    {
      is: "bla:ipa",
      text: "test",
    },
    {},
  );
  //speak_text = find_replace_with_mapping(speak_text, "t", "t")

  //speak_text = find_replace_with_mapping(speak_text, /\[/, "")
  //console.log(speak_text)

  //speak_text = find_replace_with_mapping(speak_text, /(is)/, "X$1X")
  //speak_text = find_replace_with_mapping(speak_text, /(\[.*?)(K)(ALO)(.*?\])/, '$1$2$4');
  speak_text = find_replace_with_mapping(
    speak_text,
    /(\W)(is)(\W)/,
    '$1<phoneme alphabet="ipa" ph="bla">$2</phoneme>$3',
  );
}
