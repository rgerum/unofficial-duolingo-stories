import {getAvatar} from "./api_calls.mjs";

function generateHintMap(text, translation) {
    if(!text)
        text = "";
    let text_list = splitTextTokens(text);
    text = text.replace(/~/g, " ").replace(/\|/g, "â€‹");
    if(!translation)
        translation = ""
    let trans_list = splitTextTokens(translation);
    let hints = [];
    let hintMap = [];
    let text_pos = 0;
    for(let i = 0; i < text_list.length; i++) {
        if(i === 0 && text_list[i] === '') {
            trans_list.unshift("", "")
        }
        if(i%2 === 0 && trans_list[i] && trans_list[i] !== "~") {
            hintMap.push({hintIndex: hints.length, rangeFrom: text_pos, rangeTo: text_pos+text_list[i].length-1});
            hints.push(trans_list[i].replace(/~/g, " ").replace(/\|/g, "â€‹"));
        }
        text_pos += text_list[i].length;
    }
    return {hintMap:hintMap, hints:hints, text:text};
}

function hintsShift(content, pos) {
    for(let i in content.hintMap) {
        if(content.hintMap[i].rangeFrom > pos)
            content.hintMap[i].rangeFrom -= 1
        if(content.hintMap[i].rangeTo >= pos)
            content.hintMap[i].rangeTo -= 1
    }
    content.text = content.text.substring(0, pos) + content.text.substring(pos+1);
}

function getButtons(content) {
    let buttons = [...content.text.matchAll(/\(([^)]*)\)/g)];
    let selectablePhrases = [];
    for(let button of buttons) {
        selectablePhrases.push(button[1]);
    }
    let characterPositions = [];
    let pos1 = content.text.indexOf("(");
    while(pos1 !== -1) {
        hintsShift(content, pos1)
        if(content.text.substring(pos1, pos1+1) === "+")
            hintsShift(content, pos1)
        pos1 = content.text.indexOf("(")
    }
    pos1 = content.text.indexOf(")");
    while(pos1 !== -1) {
        hintsShift(content, pos1)
        characterPositions.push(pos1);
        pos1 = content.text.indexOf(")")
    }
    return [selectablePhrases, characterPositions]
}

function getHideRanges(content) {
    let pos1 = content.text.indexOf("[");
    let pos2 = content.text.indexOf("]");
    if(pos1 !== -1 && pos2 !== -1) {
        hintsShift(content, pos1)
        hintsShift(content, pos2-1)
        return [{start: pos1, end: pos2-1}]
    }
    return []
}

function shuffleArray(selectablePhrases) {
    let phraseOrder = [];
    for(let i in selectablePhrases) {
        phraseOrder.push(parseInt(i));
    }
    const shuffleArray = array => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
    shuffleArray(phraseOrder);
    let selectablePhrases2 = [];
    for(let i of phraseOrder)
        selectablePhrases2.push(selectablePhrases[i])
    return [phraseOrder, selectablePhrases2]
}

function split_lines(text) {
    /* splits the text into lines and removes comments */
    let lines = [];
    let lineno = 0;
    for (let line of text.split("\n")) {
        lineno += 1;
        // ignore empty lines or lines with comments (and remove rtl isolate)
        line = line.trim().replace(/\u2067/, "");
        if (line.length === 0 || line.substring(0, 1) === "#")
            continue;

        lines.push([lineno, line]);
    }
    return lines
}

function processBlockData(line_iter, story) {
    while(line_iter.get()) {
        let [, line] = line_iter.get();
        if(line.indexOf("=") !== -1) {
            let [key, value] = line.split("=");
            story.meta[key.trim()] = value.trim();
            line_iter.advance();
            continue
        }
        break
    }
    for(let key in story.meta) {
        if(key.startsWith("icon_")) {
            add_avatar(key.substring(5), story.meta[key]);
        }
    }
    story.fromLanguageName = story.meta.fromLanguageName
}

function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    if(keep_tilde)
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
        return text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]+)/)
    else
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
        return text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…~]+)/)
}

function getInputStringText(text) {
    // remove multiple white space characters
    text = text.replace(/(\s)\s+/g, "$1");
    //
    return text.replace(/([^-|~ ,;.:_?!…]*){([^}]*)}/g, "$1");
}

function speaker_text_trans(data) {
    let [, speaker, text] = data.text.match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S)\s*/);
    let translation = "";
    if(data.trans)
        [, translation] = data.trans.match(/\s*~\s*(\S.*\S)\s*/);
    let content = generateHintMap(getInputStringText(text), translation);

    let [selectablePhrases, characterPositions] = getButtons(content);
    let hideRanges = getHideRanges(content);
    // split number of speaker
    if(speaker) {
        let [, id] = speaker.match(/Speaker(.*)/);
        speaker = get_avatar(id);
    }
    let line;
    if(speaker) {
        line = {
            type: "CHARACTER",
            avatarUrl: speaker.avatarUrl,
            characterId: speaker.characterId,
            content: content,
        }
    }
    else {
        line = {
            type: "PROSE",
            content: content,
        }
    }
    let audio;
    if(data.audio)
        audio = line_to_audio(data.audio)
    return {speaker: speaker, line: line, content: content, hideRanges: hideRanges, selectablePhrases: selectablePhrases, characterPositions: characterPositions, audio: audio};
}

function line_to_audio(line) {
    let audio = {}
    line = line.substring(1);
    let parts = line.split(";");
    audio.url = "audio/"+parts.splice(0, 1)[0];
    audio.ssml = {
        "text": "<speak>De tuin</speak>",
        "speaker": "Ruben",
        "id": 0
    }
    audio.keypoints = [];
    let last_end = 0;
    let last_time = 0;
    for(let part of parts) {
        let [start, duration] = part.split(",")
        start = parseInt(start);
        duration = parseInt(duration);
        audio.keypoints.push({rangeEnd: last_end + start, audioStart: last_time + duration});
        last_end += start;
        last_time += duration;
    }
    return audio;
}

function get_avatar(id) {
    id = parseInt(id) ? parseInt(id) : id;
    if(!character_avatars[id]) {
        getAvatar(id).then((avatar)=>(add_avatar(id, avatar ? avatar.link : undefined)));
    }
    let avatar = character_avatars[id];
    return {"characterId": id, "avatarUrl": avatar};
}

function add_avatar(id, link) {
    character_avatars[id] = link;
}

function getText(line_iter, allow_speaker, allow_trans, allow_audio) {
    let speaker = {}
    let [, line] = line_iter.get();
    if (line.startsWith(">") || (allow_speaker && line.match(/\w*:/))) {
        speaker.text = line;
        [, line] = line_iter.advance(1);
        if (line.startsWith("~") && allow_trans) {
            speaker.trans = line;
            [, line] = line_iter.advance();
        }
        if (line.startsWith("$") && allow_audio) {
            speaker.audio = line;
            line_iter.advance();
        }
    }
    return speaker;
}

function getAnswers(line_iter, allow_trans) {
    let answers = []
    let correct_answer = undefined;
    while(line_iter.get()) {
        let [lineno, line] = line_iter.get();
        if (line.startsWith("+") || line.startsWith("-")) {
            if(line.startsWith("+"))
                correct_answer = answers.length;
            let answer = {text: line};
            [lineno, line] = line_iter.advance();
            if (line.startsWith("~") && allow_trans) {
                answer.trans = line;
                [lineno, line] = line_iter.advance();
            }
            if(allow_trans) {
                let data_text = speaker_text_trans(answer)
                answers.push(data_text.content)
            }
            else
                answers.push(answer.text.substring(1).trim())
            continue
        }
        break
    }
    return [answers, correct_answer];
}

function pointToPhraseButtons(line) {
    [, , line] = line.match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S)\s*/);
    let transcriptParts = [];
    let correctAnswerIndex = 0;
    let index = 0;
    let tokens = splitTextTokens(line);
    for(let token of tokens) {
        let selectable = false;
        if(token.substring(0, 2) === "(+") {
            correctAnswerIndex = index
            token = token.substring(2, token.length-1)
            selectable = true;
        }
        if(token.substring(0, 1) === "(") {
            index += 1
            token = token.substring(1, token.length-1)
            selectable = true;
        }
        if(token !== "")
            transcriptParts.push({
                selectable: selectable,
                text: token,
            })
    }

    return [correctAnswerIndex, transcriptParts]
}

function processBlockHeader(line_iter, story) {
    let data = getText(line_iter, false, true, true);
    let data_text = speaker_text_trans(data)
    story.elements.push({
        type: "HEADER",
        illustrationUrl: "https://stories-cdn.duolingo.com/image/"+story.meta["icon"],
        learningLanguageTitleContent: data_text.content,
        trackingProperties: {},
        audio: data_text.audio,
    })
    return false
}

function processBlockLine(line_iter, story) {
    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data)

    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio
    })
    story.meta.line_index += 1;
    return false
}

function processBlockMultipleChoice(line_iter, story) {
    let data = getText(line_iter, false, true, false);
    let data_text = speaker_text_trans(data)

    let [answers, correct_answer] = getAnswers(line_iter, true);
    story.elements.push({
        type: "MULTIPLE_CHOICE",
        answers: answers,
        correctAnswerIndex: correct_answer,
        question: data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "multiple-choice"
        },
    })
    story.meta.line_index += 1;
    return false
}

function processBlockSelectPhrase(line_iter, story) {
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data)

    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data)

    let [answers, correct_answer] = getAnswers(line_iter, false);
    story.elements.push({
        type: "CHALLENGE_PROMPT",
        prompt: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "select-phrases"
        },
    })
    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio
    })
    story.elements.push({
        type: "SELECT_PHRASE",
        answers: answers,
        correctAnswerIndex: correct_answer,
        question: data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "select-phrases"
        },
    })
    story.meta.line_index += 1;
}

function processBlockContinuation(line_iter, story) {
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data)

    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data)

    let [answers, correct_answer] = getAnswers(line_iter, true);
    story.elements.push({
        type: "CHALLENGE_PROMPT",
        prompt: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "continuation"
        },
    })
    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio
    })
    story.elements.push({
        type: "MULTIPLE_CHOICE",
        answers: answers,
        correctAnswerIndex: correct_answer,
        question: data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "continuation"
        },
    })
    story.meta.line_index += 1;
}

function processBlockArrange(line_iter, story) {
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data)

    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data)

    let [phraseOrder, selectablePhrases2] = shuffleArray(data_text.selectablePhrases);
    story.elements.push({
        type: "CHALLENGE_PROMPT",
        prompt: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "arrange"
        },
    })
    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio
    })
    story.elements.push({
        type: "ARRANGE",
        characterPositions: data_text.characterPositions,
        phraseOrder: phraseOrder,
        selectablePhrases: selectablePhrases2,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "arrange"
        },
    })
    story.meta.line_index += 1;
}


function processBlockPointToPhrase(line_iter, story) {
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data)

    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data)

    let [correctAnswerIndex, transcriptParts] = pointToPhraseButtons(data.text)

    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio
    })
    story.elements.push({
        type: "POINT_TO_PHRASE",
        correctAnswerIndex: correctAnswerIndex,
        transcriptParts: transcriptParts,
        question: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "point-to-phrase"
        },
    })
    story.meta.line_index += 1;
}

function processBlockMatch(line_iter, story) {
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data)

    let answers = [];
    while(line_iter.get()) {
        let [, line] = line_iter.get()
        let match = line.match(/-\s*(.*\S)\s*<>\s*(.*\S)\s*/);
        if(match) {
            let [, word1, word2] = match;
            answers.push({"phrase": word1, "translation": word2});
            line_iter.advance()
            continue
        }
        break
    }

    story.elements.push({
        type: "MATCH",
        fallbackHints: answers,
        prompt: question_data_text.content.text,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "match"
        },
    })
    story.meta.line_index += 1;
}

const block_functions = {
    "DATA": processBlockData,
    "HEADER": processBlockHeader,
    "LINE": processBlockLine,
    "MULTIPLE_CHOICE": processBlockMultipleChoice,
    "SELECT_PHRASE": processBlockSelectPhrase,
    "CONTINUATION": processBlockContinuation,
    "ARRANGE": processBlockArrange,
    "POINT_TO_PHRASE": processBlockPointToPhrase,
    "MATCH": processBlockMatch,
}

function line_iterator(lines) {
    let index = 0;
    function get(offset=0) {
        return lines[index + offset];
    }
    function advance(offset=1) {
        index += offset;
        return lines[index];
    }
    return {get:get, advance:advance}
}

export function processStoryFile(text) {
    let lines = split_lines(text);

    let story = {elements: [], meta: {line_index: 1}}
    let line_iter = line_iterator(lines)
    while(line_iter.get()) {
        let [, line] = line_iter.get()
        if(line.startsWith("[") && line.endsWith("]")) {
            line_iter.advance();
            let current_block = line.substring(1, line.length - 1)
            if(block_functions[current_block]) {
                block_functions[current_block](line_iter, story)
                continue
            }
        }
        //console.log("error", lineno, line)
        line_iter.advance();
    }

    return [story, story.meta];
}

let character_avatars = {}

try {
    window.character_avatars = character_avatars
}
catch (e) {
    
}

