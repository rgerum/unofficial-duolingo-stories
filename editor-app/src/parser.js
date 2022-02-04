import {StreamLanguage} from "@codemirror/stream-parser"

function parserWithMetadata(stream, state) {
    // new element
    if(state.pos === "default" && stream.eat("[")) {
        state.pos = "type";
        return "default"
    }
    // inside new element
    if(state.pos === "type") {
        if(stream.eat("]")) {
            state.pos = "default";
            return "default"
        }
        let type = stream.match(/[^\]]+/)[0];
        state.type = type;
        state.odd = false;
        return "keyword"
    }
    if(state.type === "DATA") {
        if(stream.match(/[^=]+/)) {
            if(state.odd) {
                state.odd = false;
                return "name";
            }
            return "heading";
        }
        if(stream.eat("=")) {
            state.odd = true;
            return "default"
        }
    }
    if(state.pos === "speech") {
        if(stream.match(/ +/)) {
            if(state.bracket)
                return "className"
            return "default";
        }
        if(!state.translate) {
            if (state.type === "ARRANGE" || state.type === "CONTINUATION" || "SELECT_PHRASE") {
                if (stream.eat("[")) {
                    state.bracket = true;
                    return "default";
                }
                if (stream.eat("]")) {
                    state.bracket = false;
                    return "default";
                }
            }
            if (state.type === "POINT_TO_PHRASE")
                if (stream.match(/\(\+[^\(\)]*\)/)) {
                    return "modifier"
                }
            if (state.type === "POINT_TO_PHRASE" || state.type === "ARRANGE")
                if (stream.match(/\([^\(\)]*\)/)) {
                    if (state.bracket)
                        return "labelName"
                    return "number"
                }
        }
        if(stream.eol()) {
            stream.skipToEnd()
            state.pos = "default";
            state.odd = false;
            state.translate = false;
            state.bracket = false;
            return "here"
        }
        if(
            ((state.type === "ARRANGE") && stream.match(/ *[^ $\]\[\(\)]+ */)) ||
            ((state.type === "CONTINUATION" || "SELECT_PHRASE") && stream.match(/ *[^ $\]\[]+ */)) ||
            ((state.type === "POINT_TO_PHRASE") && stream.match(/ *[^ $\(\)]+ */)) ||
            (stream.match(/ *[^ $\]\[]+ */))
        ) {
            if(stream.eol())
                state.pos = "default"
            state.odd = !state.odd
            if(state.translate === true) {
                if (state.odd)
                    return "propertyName"
                return "macroName"
            }
            if(state.bracket) {
                if (state.odd)
                    return "className"
                return "typeName"
            }
            if(state.paranthese) {
                if (state.odd)
                    return "number"
                return "modifier"
            }
            if (state.odd)
                return "tagName"
            return "name"
        }
        else {
            stream.skipToEnd()
            state.pos = "default"
            state.odd = false;
            state.translate = false;
            state.bracket = false;
            return "here";
        }
    }
    if(state.pos === "match_part") {
        if(state.odd === false) {
            if(stream.match(/[^<>]*/)) {
                state.odd = undefined
                return "tagName"
            }
        }
        else if(state.odd === undefined) {
            if(stream.match(/ *<> */)) {
                state.odd = true
                return "default"
            }
        }
        else {
            stream.skipToEnd()
            state.pos = "default"
            state.odd = false;
            return "propertyName";
        }
    }
    if(state.type === "LINE" || state.type === "HEADER"
        || state.type === "MULTIPLE_CHOICE"
        || state.type === "MATCH"
        || state.type === "CONTINUATION"
        || state.type === "SELECT_PHRASE"
        || state.type === "ARRANGE"
        || state.type === "POINT_TO_PHRASE"
    ) {
        if(stream.eat(">")) {
            state.pos = "speech";
            state.odd = false;
            state.translate = false;
            state.bracket = false;
            return "strong"
        }
        if(stream.eat("~")) {
            state.pos = "speech";
            state.odd = false;
            state.translate = true;
            return "strong"
        }
        if(stream.match(/.+:/)) {
            state.pos = "speech";
            state.odd = false;
            state.translate = false;
            state.bracket = false;
            return "heading"
        }
        if(state.type === "MATCH") {
            if (stream.eat("-")) {
                state.pos = "match_part";
                state.odd = false;
                state.translate = false;
                return "default"
            }
        }
        if(state.type === "MULTIPLE_CHOICE"
            || state.type === "CONTINUATION"
            || state.type === "SELECT_PHRASE"
        ) {
            if (stream.eat("+")) {
                state.pos = "speech";
                state.odd = false;
                state.translate = false;
                state.bracket = false;
                return "default"
            }
            if (stream.eat("-")) {
                state.pos = "speech";
                state.odd = false;
                state.translate = false;
                state.bracket = false;
                return "default"
            }
        }
    }
    state.odd = false;
    state.bracket = false;
    return "deleted"
}


export const exampleLanguage = StreamLanguage.define({
    token: parserWithMetadata,
    startState(indentUnit) { return {pos:"default"}
    }
})

import {LanguageSupport} from "@codemirror/language"

export function example() {
    return new LanguageSupport(exampleLanguage)
}
