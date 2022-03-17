import {StreamLanguage} from "@codemirror/stream-parser"

const STATE_DEFAULT = "atom";

const STATE_DATA_KEY = "heading";
const STATE_DATA_VALUE = "name";

const STATE_TRANS_EVEN = "propertyName";
const STATE_TRANS_ODD = "macroName";
const STATE_TEXT_EVEN = "tagName";
const STATE_TEXT_ODD = "name";

const STATE_TEXT_HIDE_EVEN = "className";
const STATE_TEXT_HIDE_ODD = "typeName";

const STATE_TEXT_BUTTON_EVEN = "number";
const STATE_TEXT_BUTTON_ODD = "labelName";
const STATE_TEXT_BUTTON_RIGHT_EVEN = "modifier";

const STATE_BLOCK_TYPE = "keyword";
const STATE_SPEAKER_TYPE = STATE_DATA_KEY;

const STATE_ERROR = "deleted";

const STATE_AUDIO = "color";

function parserTextWithTranslation(stream, state, allow_hide, allow_buttons) {
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
            if (state.bracket)
                return STATE_TEXT_BUTTON_ODD
            return STATE_TEXT_BUTTON_EVEN
        }

    if(stream.match(/ *[^ $\]\[]+ */)) {
        state.odd = !state.odd
        if(state.bracket && allow_hide) {
            if (state.odd)
                return STATE_TEXT_HIDE_EVEN
            return STATE_TEXT_HIDE_ODD
        }

        if (state.odd)
            return STATE_TEXT_EVEN
        return STATE_TEXT_ODD
    }
    stream.skipToEnd();
    return STATE_ERROR;
}


function parserTranslation(stream, state) {
    if(stream.match(/ *[^ $\]\[]+ */)) {
        state.odd = !state.odd

        if (state.odd)
            return STATE_TRANS_EVEN
        return STATE_TRANS_ODD
    }
    stream.skipToEnd();
    return STATE_ERROR;
}

function parserPair(stream, state) {
    if(state.odd === false) {
        stream.match(/.*(?=<>)/);
        state.odd = true;
        return STATE_TEXT_ODD
    }
    else if(stream.eat("<>"))
        return STATE_DEFAULT
    else {
        stream.skipToEnd();
        return STATE_TRANS_ODD
    }
}

function parseBockData(stream, state) {
    if(stream.match(/[^=]+/)) {
        if(state.odd) {
            state.odd = false;
            return STATE_DATA_VALUE;
        }
        return STATE_DATA_KEY;
    }
    if(stream.eat("=")) {
        state.odd = true;
        return STATE_DEFAULT
    }

    stream.skipToEnd();
    return STATE_ERROR;
}

function parseBockHeader(stream, state) {
    if(stream.sol()) {
        if(stream.eat(">") && state.block.line===0) {
            startLine(state, 1, true, "text", true);
            return STATE_DEFAULT;
        }
        if(stream.eat("~") && state.block.allow_trans) {
            startLine(state, 1, false, "trans");
            return STATE_DEFAULT;
        }
        if(stream.eat("$") && state.block.allow_audio) {
            startLine(state); stream.skipToEnd();
            return STATE_AUDIO;
        }
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}

function parseBockLine(stream, state) {
    if(stream.sol()) {
        if(stream.eat(">") && state.block.line===0) {
            startLine(state, 1, true, "text", true);
            return STATE_DEFAULT;
        }
        if(stream.match(/\S+:/) && state.block.line===0) {
            startLine(state, 1, true, "text", true);
            return STATE_SPEAKER_TYPE;
        }
        if(stream.eat("~") && state.block.allow_trans) {
            startLine(state, 1, false, "trans");
            return STATE_DEFAULT;
        }
        if(stream.eat("$") && state.block.allow_audio) {
            startLine(state); stream.skipToEnd();
            return STATE_AUDIO;
        }

        stream.skipToEnd();
        return STATE_ERROR;
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}

function startLine(state, line, allow_trans, line_type, allow_audio) {
    if(line)
        state.block.line = line;
    if(allow_audio === undefined && state.block.allow_trans && state.block.allow_audio)
        allow_audio = state.block.allow_audio;
    state.block.allow_audio = allow_audio;
    state.block.allow_trans = allow_trans;
    state.odd = false;
    state.block.line_type = line_type;
}

function parseBockSelectPhrase(stream, state) {
    if(stream.sol()) {
        if(stream.eat(">") && state.block.line===0) {
            startLine(state, 1, true, "text");
            return STATE_DEFAULT;
        }
        if(stream.eat("~") && state.block.allow_trans) {
            startLine(state, undefined, false, "trans");
            return STATE_DEFAULT;
        }
        if(stream.match(/\S+:/) && state.block.line===1) {
            startLine(state, 2, true, "text", true);
            return STATE_SPEAKER_TYPE;
        }
        if(stream.eat("$") && state.block.allow_audio) {
            startLine(state); stream.skipToEnd();
            return STATE_AUDIO;
        }

        if(stream.eat("+") && state.block.line>=2) {
            startLine(state, 3, false, "text");
            stream.skipToEnd();
            return STATE_DEFAULT;
        }
        if(stream.eat("-") && state.block.line>=2) {
            startLine(state, 3, false, "text");
            stream.skipToEnd();
            return STATE_DEFAULT;
        }

        stream.skipToEnd();
        return STATE_ERROR;
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state, state.block.line === 2)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}

function parseBockMultipleChoice(stream, state) {
    if(stream.sol()) {
        if(stream.eat(">") && state.block.line===0) {
            startLine(state, 1, true, "text");
            return STATE_DEFAULT;
        }
        if(stream.eat("~") && state.block.allow_trans) {
            startLine(state, undefined, false, "trans");
            return STATE_DEFAULT;
        }
        if(stream.eat("+") && state.block.line>=1) {
            startLine(state, 2, true, "text");
            return STATE_DEFAULT;
        }
        if(stream.eat("-") && state.block.line>=1) {
            startLine(state, 2, true, "text");
            return STATE_DEFAULT;
        }

        stream.skipToEnd();
        return STATE_ERROR;
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}

function parseBockArrange(stream, state) {
    if(stream.sol()) {
        if(stream.eat(">") && state.block.line===0) {
            startLine(state, 1, true, "text");
            return STATE_DEFAULT;
        }
        if(stream.eat("~") && state.block.allow_trans) {
            startLine(state, undefined, false, "trans");
            return STATE_DEFAULT;
        }
        if(stream.match(/\S+:/) && state.block.line===1) {
            startLine(state, 2, true, "text", true);
            return STATE_SPEAKER_TYPE;
        }
        if(stream.eat("$") && state.block.allow_audio) {
            startLine(state); stream.skipToEnd();
            return STATE_AUDIO;
        }

        stream.skipToEnd();
        return STATE_ERROR;
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state, state.block.line === 2, state.block.line === 2)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}

function parseBockPointToPhrase(stream, state) {
    if(stream.sol()) {
        if(state.block.line===0 && stream.eat(">")) {
            startLine(state, 1, true, "text");
            return STATE_DEFAULT;
        }
        if(state.block.allow_trans && stream.eat("~")) {
            startLine(state, undefined, false, "trans");
            return STATE_DEFAULT;
        }
        if(state.block.line===1 && stream.match(/\S+:/)) {
            startLine(state, 2, true, "text", true);
            return STATE_SPEAKER_TYPE;
        }
        if(state.block.line===1 && stream.eat(">")) {
            startLine(state, 2, true, "text", true);
            return STATE_DEFAULT;
        }
        if(state.block.allow_audio && stream.eat("$")) {
            startLine(state); stream.skipToEnd();
            return STATE_AUDIO;
        }

        stream.skipToEnd();
        return STATE_ERROR;
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state, state.block.line === 2, (state.block.line === 2)*2)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}


function parseBockMatch(stream, state) {
    if(stream.sol()) {
        if(stream.eat(">") && state.block.line===0) {
            startLine(state, 1, true, "text");
            return STATE_DEFAULT;
        }
        if(stream.eat("~") && state.block.allow_trans) {
            startLine(state, undefined, false, "trans");
            return STATE_DEFAULT;
        }
        if(stream.eat("-") && state.block.line===1) {
            startLine(state, 1, false, "pair");
            return STATE_DEFAULT;
        }

        stream.skipToEnd();
        return STATE_ERROR;
    }
    if(state.block.line_type === "text")
        return parserTextWithTranslation(stream, state)
    if(state.block.line_type === "trans")
        return parserTranslation(stream, state)
    if(state.block.line_type === "pair")
        return parserPair(stream, state)

    stream.skipToEnd();
    return STATE_ERROR;
}

const BLOCK_FUNCS = {
    "DATA": parseBockData,
    "HEADER": parseBockHeader,
    "LINE": parseBockLine,
    "MULTIPLE_CHOICE": parseBockMultipleChoice,
    "SELECT_PHRASE": parseBockSelectPhrase,
    "ARRANGE": parseBockArrange,
    "MATCH": parseBockMatch,
    "POINT_TO_PHRASE": parseBockPointToPhrase,
}

function parseBlockDef(stream, state) {
    if(stream.eat("]")) {
        state.func = BLOCK_FUNCS[state.block.name];
        return STATE_DEFAULT;
    }
    state.block = {name: stream.match(/[^\]]+/)[0], line: 0};
    return STATE_BLOCK_TYPE;
}

function parserWithMetadata(stream, state) {
    if(stream.sol()) {
        stream.match(/\s*/);
        if(stream.eat("[")) {
            state.func = parseBlockDef;
            return STATE_DEFAULT;
        }
    }
    if(state.func)
        return state.func(stream, state);

    stream.skipToEnd();
    return STATE_ERROR;
}


export const exampleLanguage = StreamLanguage.define({
    token: parserWithMetadata,
    startState() { return {pos:"default"}
    }
})

import {LanguageSupport} from "@codemirror/language"

export function example() {
    return new LanguageSupport(exampleLanguage)
}
