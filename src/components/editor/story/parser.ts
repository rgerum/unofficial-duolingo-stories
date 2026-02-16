/*
This parser does the syntax highlighting for the editor
 */

import { StreamLanguage, StringStream } from "@codemirror/language";

// Ideally this should be proper tag definitions instead of mapping them to arbitrary tag symbols
// I just did not find out yet how to define custom tag symbols
const STATE_DEFAULT = "atom";

const STATE_DATA_KEY = "heading";
const STATE_DATA_VALUE = "name";

const STATE_TRANS_EVEN = "propertyName";
const STATE_TRANS_ODD = "macroName";
const STATE_TEXT_EVEN = "tagName";
const STATE_TEXT_ODD = "name";

const STATE_TEXT_HIDE_EVEN = "className";
const STATE_TEXT_HIDE_ODD = "typeName";
const STATE_TEXT_HIDE_NEUTRAL = "changed";

const STATE_TEXT_BUTTON_EVEN = "number";
const STATE_TEXT_BUTTON_ODD = "labelName";

const STATE_TEXT_HIDE_BUTTON_EVEN = "meta";
const STATE_TEXT_HIDE_BUTTON_ODD = "comment";
const STATE_TEXT_BUTTON_RIGHT_EVEN = "modifier";

const STATE_BLOCK_TYPE = "keyword";
const STATE_SPEAKER_TYPE = STATE_DATA_KEY;

const STATE_ERROR = "deleted";
const STATE_TODO = "annotation";

const STATE_AUDIO = "color";
const STATE_COMMENT = "comment"; //"t.strong";

const chalky = "#e5c07b",
  coral = "#e06c75",
  cyan = "#56b6c2",
  invalid = "#ffffff",
  ivory = "#abb2bf",
  stone = "#7d8799", // Brightened compared to original to increase contrast
  malibu = "#61afef",
  sage = "#98c379",
  whiskey = "#d19a66",
  violet = "#c678dd";
/*
    darkBackground = "#21252b",
    highlightBackground = "#2c313a",
    background = "#282c34",
    tooltipBackground = "#353a42",
    selection = "#3E4451",
    cursor = "#528bff"
 */

const color_even = "#009623",
  color_odd = "#00389d";

import { tags } from "@lezer/highlight";
import { HighlightStyle } from "@codemirror/language";

let myHighlightStyle = HighlightStyle.define([
  // STATE_TRANS_EVEN
  {
    tag: tags.propertyName,
    color: color_even,
    fontStyle: "italic",
    opacity: 0.5,
  },
  // STATE_TRANS_ODD
  { tag: tags.macroName, color: color_odd, fontStyle: "italic", opacity: 0.5 },
  // STATE_TEXT_EVEN
  { tag: tags.tagName, color: color_even },
  // STATE_TEXT_ODD
  { tag: tags.name, color: color_odd },

  // STATE_TEXT_HIDE_EVEN
  {
    tag: tags.className,
    color: color_even,
    opacity: 0.4,
    borderBottom: "2px solid black",
  }, // textDecoration: "underline",
  // STATE_TEXT_HIDE_ODD
  {
    tag: tags.typeName,
    color: color_odd,
    opacity: 0.4,
    borderBottom: "2px solid black",
  },
  // STATE_TEXT_HIDE_NEUTRAL
  { tag: tags.changed, opacity: 0.4, borderBottom: "2px solid black" },

  // STATE_TEXT_BUTTON_EVEN
  {
    tag: tags.number,
    color: color_even,
    background: "#c8c8c8",
    borderRadius: "10px",
  },
  // STATE_TEXT_BUTTON_ODD
  {
    tag: tags.labelName,
    color: color_odd,
    background: "#c8c8c8",
    borderRadius: "10px",
  },

  // STATE_TEXT_HIDE_BUTTON_EVEN
  {
    tag: tags.meta,
    color: color_even,
    borderBottom: "2px solid black",
    background: "#c8c8c8",
    borderRadius: "10px",
    opacity: 0.4,
  },
  // STATE_TEXT_HIDE_BUTTON_ODD
  {
    tag: tags.comment,
    color: color_odd,
    borderBottom: "2px solid black",
    background: "#c8c8c8",
    borderRadius: "10px",
    opacity: 0.4,
  },
  // STATE_TEXT_BUTTON_RIGHT_EVEN
  {
    tag: tags.modifier,
    color: "black",
    background: "#9bd297",
    borderRadius: "10px",
  },

  // STATE_BLOCK_TYPE
  { tag: tags.keyword, color: violet },
  // STATE_ERROR
  {
    tag: [tags.deleted, tags.character],
    color: coral,
    textDecoration: "line-through",
  },
  {
    tag: [tags.function(tags.variableName)],
    color: malibu,
  },
  // STATE_AUDIO
  {
    tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
    color: whiskey,
  },
  {
    tag: [tags.definition(tags.name), tags.separator],
    color: ivory,
  },
  // STATE_TODO
  {
    tag: [tags.annotation, tags.self, tags.namespace],
    background: coral,
    color: ivory,
  },
  {
    tag: [
      tags.operator,
      tags.operatorKeyword,
      tags.url,
      tags.escape,
      tags.regexp,
      tags.link,
      tags.special(tags.string),
    ],
    color: cyan,
  },

  {
    tag: tags.strong,
    color: stone,
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
  },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
  },
  {
    tag: tags.link,
    color: stone,
    textDecoration: "underline",
  },
  {
    tag: tags.heading,
    fontWeight: "bold",
    color: coral,
  },
  {
    tag: tags.atom,
  },
  {
    tag: [tags.bool, tags.special(tags.variableName)],
    color: whiskey,
  },
  {
    tag: [tags.processingInstruction, tags.string, tags.inserted],
    color: sage,
  },
  {
    tag: tags.invalid,
    color: invalid,
  },
]);

import { syntaxHighlighting } from "@codemirror/language";
export let highlightStyle = syntaxHighlighting(myHighlightStyle);

function parserTextWithTranslation(
  stream: StringStream,
  state: State,
  allow_hide: boolean = false,
  allow_buttons: number = 0,
) {
  if (stream.match(/[ |]+/)) {
    state.odd = !state.odd;
    if (state.bracket && allow_hide) return STATE_TEXT_HIDE_NEUTRAL;
    return STATE_DEFAULT;
  }
  if (allow_hide) {
    if (stream.eat("[")) {
      state.bracket = true;
      return STATE_DEFAULT;
    }
    if (stream.eat("]")) {
      state.bracket = false;
      return STATE_DEFAULT;
    }
  }
  if (allow_buttons === 2)
    if (stream.match(/\(\+[^()]*\)/)) {
      return STATE_TEXT_BUTTON_RIGHT_EVEN;
    }
  if (allow_buttons)
    if (stream.match(/\([^()]*\)/)) {
      if (state.bracket) {
        if (state.odd) return STATE_TEXT_HIDE_BUTTON_ODD;
        return STATE_TEXT_HIDE_BUTTON_EVEN;
      }
      if (state.odd) return STATE_TEXT_BUTTON_ODD;
      return STATE_TEXT_BUTTON_EVEN;
    }

  if (
    (!allow_buttons && stream.match(/[^ |$\]\[]+/)) ||
    (allow_buttons && stream.match(/[^ |$\]\[()]+/))
  ) {
    if (state.bracket && allow_hide) {
      if (state.odd) return STATE_TEXT_HIDE_ODD;
      return STATE_TEXT_HIDE_EVEN;
    }

    if (state.odd) return STATE_TEXT_ODD;
    return STATE_TEXT_EVEN;
  }
  stream.skipToEnd();
  return STATE_ERROR;
}

function parserTranslation(stream: StringStream, state: State) {
  if (stream.match(/[ |]+/)) {
    state.odd = !state.odd;
    return STATE_DEFAULT;
  }
  if (stream.match(/[^ |$\]\[]+/)) {
    if (state.odd) return STATE_TRANS_ODD;
    return STATE_TRANS_EVEN;
  }
  stream.skipToEnd();
  return STATE_ERROR;
}

function parserPair(stream: StringStream, state: State) {
  if (state.odd === false) {
    stream.match(/.*(?=<>)/);
    state.odd = true;
    return STATE_TEXT_ODD;
  } else if (stream.eat("<>")) return STATE_DEFAULT;
  else {
    stream.skipToEnd();
    return STATE_TRANS_ODD;
  }
}

function parseBlockData(stream: StringStream, state: State) {
  if (stream.match(/[^=]+/)) {
    if (state.odd) {
      state.odd = false;
      return STATE_DATA_VALUE;
    }
    return STATE_DATA_KEY;
  }
  if (stream.eat("=")) {
    state.odd = true;
    return STATE_DEFAULT;
  }

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockHeader(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text", true);
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        1,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.allow_audio && stream.eat("$")) {
      startLine(state);
      stream.skipToEnd();
      return STATE_AUDIO;
    }
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(stream, state);
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockLine(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text", true);
      return STATE_DEFAULT;
    }
    if (state.block.line === 0 && stream.match(/\S+:/)) {
      startLine(state, 1, true, "text", true);
      return STATE_SPEAKER_TYPE;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        1,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.allow_audio && stream.eat("$")) {
      startLine(state);
      stream.skipToEnd();
      return STATE_AUDIO;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(stream, state);
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function startLine(
  state: State,
  line: number = 0,
  allow_trans: boolean = false,
  line_type: string = "",
  allow_audio: boolean = false,
) {
  let block = { ...state.block };
  if (line) block.line = line;
  if (
    allow_audio === undefined &&
    state.block.allow_trans &&
    state.block.allow_audio
  )
    allow_audio = state.block.allow_audio;
  block.allow_audio = allow_audio;
  block.allow_trans = allow_trans;
  state.odd = false;
  block.line_type = line_type;
  state.block = block;
}

function parseBlockSelectPhrase(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text");
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        undefined,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.line === 1 && stream.match(/\S+:/)) {
      startLine(state, 2, true, "text", true);
      return STATE_SPEAKER_TYPE;
    }
    if (state.block.line === 1 && stream.eat(/>/)) {
      startLine(state, 2, true, "text", true);
      return STATE_DEFAULT;
    }
    if (state.block.allow_audio && stream.eat("$")) {
      startLine(state);
      stream.skipToEnd();
      return STATE_AUDIO;
    }

    if (state.block.line >= 2 && stream.eat("+")) {
      startLine(state, 3, false, "text");
      stream.skipToEnd();
      return STATE_DEFAULT;
    }
    if (state.block.line >= 2 && stream.eat("-")) {
      startLine(state, 3, false, "text");
      stream.skipToEnd();
      return STATE_DEFAULT;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(stream, state, state.block.line === 2);
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockContinuation(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text");
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        undefined,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.line === 1 && stream.match(/\S+:/)) {
      startLine(state, 2, true, "text", true);
      return STATE_SPEAKER_TYPE;
    }
    if (state.block.line === 1 && stream.eat(">")) {
      startLine(state, 2, true, "text", true);
      return STATE_DEFAULT;
    }
    if (state.block.allow_audio && stream.eat("$")) {
      startLine(state);
      stream.skipToEnd();
      return STATE_AUDIO;
    }

    if (state.block.line >= 2 && stream.eat("+")) {
      startLine(state, 3, true, "text");
      return STATE_DEFAULT;
    }
    if (state.block.line >= 2 && stream.eat("-")) {
      startLine(state, 3, true, "text");
      return STATE_DEFAULT;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(stream, state, state.block.line === 2);
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockMultipleChoice(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text");
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        undefined,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.line >= 1 && stream.eat("+")) {
      startLine(state, 2, true, "text");
      return STATE_DEFAULT;
    }
    if (state.block.line >= 1 && stream.eat("-")) {
      startLine(state, 2, true, "text");
      return STATE_DEFAULT;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(stream, state);
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockArrange(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text");
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        undefined,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.line === 1 && stream.match(/\S+:/)) {
      startLine(state, 2, true, "text", true);
      return STATE_SPEAKER_TYPE;
    }
    if (state.block.line === 1 && stream.eat(">")) {
      startLine(state, 2, true, "text", true);
      return STATE_DEFAULT;
    }
    if (state.block.allow_audio && stream.eat("$")) {
      startLine(state);
      stream.skipToEnd();
      return STATE_AUDIO;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(
      stream,
      state,
      state.block.line === 2,
      state.block.line === 2 ? 1 : 0,
    );
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockPointToPhrase(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text", true);
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        undefined,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.line === 1 && stream.match(/\S+:/)) {
      startLine(state, 2, true, "text", true);
      return STATE_SPEAKER_TYPE;
    }
    if (state.block.line === 1 && stream.eat(">")) {
      startLine(state, 2, true, "text", true);
      return STATE_DEFAULT;
    }
    if (state.block.allow_audio && stream.eat("$")) {
      startLine(state);
      stream.skipToEnd();
      return STATE_AUDIO;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(
      stream,
      state,
      state.block.line === 2,
      state.block.line === 2 ? 2 : 0,
    );
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

function parseBlockMatch(stream: StringStream, state: State) {
  if (stream.sol()) {
    if (state.block.line === 0 && stream.eat(">")) {
      startLine(state, 1, true, "text");
      return STATE_DEFAULT;
    }
    const hintPrefix = state.block.allow_trans && stream.eat(/[~^]/);
    if (hintPrefix) {
      startLine(
        state,
        undefined,
        true,
        hintPrefix === "~" ? "trans" : "pron",
        true,
      );
      return STATE_DEFAULT;
    }
    if (state.block.line === 1 && stream.eat("-")) {
      startLine(state, 1, false, "pair");
      return STATE_DEFAULT;
    }

    stream.skipToEnd();
    return STATE_ERROR;
  }
  if (state.block.line_type === "text")
    return parserTextWithTranslation(stream, state);
  if (state.block.line_type === "trans" || state.block.line_type === "pron")
    return parserTranslation(stream, state);
  if (state.block.line_type === "pair") return parserPair(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

const BLOCK_FUNCS: Record<
  string,
  (stream: StringStream, state: State) => string
> = {
  DATA: parseBlockData,
  HEADER: parseBlockHeader,
  LINE: parseBlockLine,
  MULTIPLE_CHOICE: parseBlockMultipleChoice,
  SELECT_PHRASE: parseBlockSelectPhrase,
  CONTINUATION: parseBlockContinuation,
  ARRANGE: parseBlockArrange,
  MATCH: parseBlockMatch,
  POINT_TO_PHRASE: parseBlockPointToPhrase,
};

function parseBlockDef(stream: StringStream, state: State) {
  if (stream.eat("]")) {
    state.func = BLOCK_FUNCS[state?.block?.name];
    return STATE_DEFAULT;
  }
  const match = stream.match(/[^\]]+/);
  const name =
    match && typeof match === "object" && "0" in match ? match[0] : "";
  state.block = {
    name: name,
    line: 0,
    line_type: "",
    allow_trans: false,
    allow_audio: false,
  };
  return STATE_BLOCK_TYPE;
}

function parserWithMetadata(stream: StringStream, state: State) {
  if (stream.match("#")) {
    if (stream.match(/.*TODO.*/)) {
      stream.skipToEnd();
      return STATE_TODO;
    }
    stream.skipToEnd();
    return STATE_COMMENT;
  }
  if (stream.sol()) {
    stream.match(/\s*/);
    if (stream.eat("[")) {
      state.func = parseBlockDef;
      return STATE_DEFAULT;
    }
  }
  if (state.func) return state.func(stream, state);

  stream.skipToEnd();
  return STATE_ERROR;
}

type State = {
  pos: string;
  block: {
    name: string;
    line: number;
    line_type: string;
    allow_trans: boolean;
    allow_audio: boolean;
  };
  odd: boolean;
  func: any;
  bracket: boolean;
};

const exampleLanguage = StreamLanguage.define({
  token: parserWithMetadata,
  startState() {
    return {
      pos: "default",
      block: {
        name: "",
        line: 0,
        line_type: "",
        allow_trans: false,
        allow_audio: false,
      },
      odd: false,
      func: null,
      bracket: false,
    };
  },
});

import { LanguageSupport } from "@codemirror/language";

export function example() {
  return new LanguageSupport(exampleLanguage);
}
