
function generateHintMap(text, translation) {
    if(!text)
        text = "";
    text = text.replace(/\|/g, "​");
    let text_list = splitTextTokens(text);
    text = text.replace(/~/g, " ")//
    if(!translation)
        translation = ""
    translation = translation.replace(/\|/g, "​");
    let trans_list = splitTextTokens2(translation);
    let hints = [];
    let hintMap = [];
    let text_pos = 0;
    for(let i = 0; i < text_list.length; i++) {
        if(i === 0 && text_list[i] === '') {
            trans_list.unshift("", "")
        }
        if(i%2 === 0 && trans_list[i] && trans_list[i] !== "~") {
            hintMap.push({hintIndex: hints.length, rangeFrom: text_pos, rangeTo: text_pos+text_list[i].length-1});
            hints.push(trans_list[i].replace(/~/g, " ").replace(/\|/g, "​"));
        }
        text_pos += text_list[i].length;
    }
    return {hintMap:hintMap, hints:hints, text:text.trim()};
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
    pos1 = content.text.indexOf(")");
    while(pos1 !== -1) {
        hintsShift(content, pos1)
        pos1 = content.text.indexOf(")")
    }
    pos1 = content.text.indexOf("(");
    let first = true;
    while(pos1 !== -1) {
        hintsShift(content, pos1)
        if(content.text.substring(pos1, pos1+1) === "+")
            hintsShift(content, pos1)
        if(!first)
            characterPositions.push(pos1-1);
        first = false;
        pos1 = content.text.indexOf("(")
    }
    characterPositions.push(content.text.length-2);

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
    lines.push([lineno+1, ""]);
    lines.push([lineno+2, ""]);
    return lines
}

function processBlockData(line_iter, story) {
    while(line_iter.get()) {
        let line = line_iter.get();
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
            let id = key.substring(5);
            if(!story.meta.avatar_overwrites[id])
                story.meta.avatar_overwrites[id] = {id: id}
            story.meta.avatar_overwrites[id].link = story.meta[key];
        }
        if(key.startsWith("speaker_")) {
            let id = key.substring(8);
            if(!story.meta.avatar_overwrites[id])
                story.meta.avatar_overwrites[id] = {id: id}
            story.meta.avatar_overwrites[id].speaker = story.meta[key];
        }
    }
    if(story.meta["set"] && story.meta["set"].indexOf("|") !== -1) {
        [story.meta.set_id, story.meta.set_index] = story.meta["set"].split("|");
    }
    story.fromLanguageName = story.meta.fromLanguageName
}

let punctuation_chars = "\\\/¡!\"\'\`#$%&*,.:;<=>¿?@^_`{|}…"+
    "。、，！？；：（）～—·《…》〈…〉﹏……——"
//punctuation_chars = "\\\\¡!\"#$%&*,、，.。\\/:：;<=>¿?@^_`{|}…"

let regex_split_token = new RegExp(`([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​)[\\s${punctuation_chars}]*)`);
let regex_split_token2 = new RegExp(`([\\s${punctuation_chars}~]*(?:^|\\s|$|​)[\\s${punctuation_chars}~]*)`);
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

export function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    //console.log(text, text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*(?:^|\s|$)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/))
    if(keep_tilde)
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
        return text.split(regex_split_token)
    //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…\]]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/)
    else
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
        return text.split(regex_split_token2)
    //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…~]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…~]*)/)
}

function splitTextTokens2(text, keep_tilde=true) {
    if(!text)
        return [];
    if(keep_tilde)
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
        return text.split(/([\s​]+)/)
    else
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
        return text.split(/([\s​~]+)/)
}

function getInputStringText(text) {
    // remove multiple white space characters
    text = text.replace(/(\s)\s+/g, "$1");
    //
    return text.replace(/([^-|~ ,、，;.。:：_?!…]*){([^}]*)}/g, "$1");
}

function getInputStringSpeechText(text, hide) {
    if(hide) {
        text = text.replace("[", "<prosody volume=\"silent\">")
        text = text.replace("]", "</prosody>")
    }
    text = text.replace(/(\.\.\.|…)/g, '<sub alias=" ">$1</sub><break/>');
    text = text.replace(/\(\+/g, '');
    text = text.replace(/\(/g, '');
    text = text.replace(/\)/g, '');
    text = text.replace(/\[/g, '');
    text = text.replace(/\]/g, '');
    return "<speak>"+text.replace(/([^-|~ ,;.:_?!…]*)\{([^\}:]*):([^\}]*)\}/g, '<phoneme alphabet="$3" ph="$2">$1</phoneme>').replace(/([^-|~ ,;.:_?!…]*)\{([^\}]*)\}/g, '<sub alias="$2">$1</sub>').replace(/~/g, " ").replace(/\|/g, "​")+"</speak>";
}

function speaker_text_trans(data, meta, use_buttons, hide=false) {
    //console.log("data.text", data.text)
    let [, speaker_text, text] = data.text.match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S|\S)\s*/);
    let translation = "";
    if(data.trans)
        [, translation] = data.trans.match(/\s*~\s*(\S.*\S|\S)\s*/);
    let content = generateHintMap(getInputStringText(text), translation);

    let selectablePhrases, characterPositions;
    if(use_buttons)
        [selectablePhrases, characterPositions] = getButtons(content);
    let hideRanges = getHideRanges(content);
    // split number of speaker
    let speaker;
    let speaker_id = 0;
    if(speaker_text) {
        [, speaker_id] = speaker_text.match(/Speaker(.*)/);
    }
    if(meta) {
        speaker = get_avatar(speaker_id, meta.avatar_names, meta.avatar_overwrites);
        meta.cast[speaker_id] = {
            speaker: meta.avatar_overwrites[speaker_id]?.speaker || meta.avatar_names[speaker_id]?.speaker || meta.avatar_names[0]?.speaker || "",
            link: meta.avatar_overwrites[speaker_id]?.link || meta.avatar_names[speaker_id]?.link,
            name: meta.avatar_overwrites[speaker_id]?.name || meta.avatar_names[speaker_id]?.name,
            id: speaker_id,
        };
    }
    let audio;
    if(data.allow_audio) {
        let speaker_name = meta["speaker_" + "narrator"] || meta.avatar_names[0]?.speaker;
        if(speaker_id)
            speaker_name = meta.avatar_overwrites[speaker_id]?.speaker || meta.avatar_names[speaker_id]?.speaker || meta.avatar_names[0]?.speaker;
        audio = line_to_audio(data.audio, text, speaker_name, meta.story_id, hide)
        audio.ssml.inser_index = meta.audio_insert_lines.length;
        audio.ssml.plan_text = text;
        audio.ssml.plan_text_speaker_name = speaker_name;
        meta.audio_insert_lines.push([data.audio_line, data.audio_line_inset])
        //audio.ssml.line = data.audio_line;
        //audio.ssml.line_insert = data.audio_line_inset;
        content.audio = audio
    }

    let line;
    if(speaker && speaker_id !== 0) {
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
    return {speaker: speaker, line: line, content: content, hideRanges: hideRanges, selectablePhrases: selectablePhrases, characterPositions: characterPositions, audio: audio};
}

function line_to_audio(line, text, speaker, story_id, hide=false) {
    let text_speak = getInputStringSpeechText(text, hide);
    let audio = {}
    audio.ssml = {
        "text": text_speak,
        "speaker": speaker,
        "id": story_id,
    }
    if(line) {
        line = line.substring(1);
        let parts = line.split(";");
        audio.url = "audio/" + parts.splice(0, 1)[0];
        audio.keypoints = [];
        let last_end = 0;
        let last_time = 0;
        for (let part of parts) {
            let [start, duration] = part.split(",")
            start = parseInt(start);
            duration = parseInt(duration);
            audio.keypoints.push({rangeEnd: last_end + start, audioStart: last_time + duration});
            last_end += start;
            last_time += duration;
        }
    }
    return audio;
}

function get_avatar(id, avatar_names, avatar_overwrites) {
    id = parseInt(id) ? parseInt(id) : id;
    if(avatar_overwrites[id])
        return {"characterId": id, "avatarUrl": avatar_overwrites[id]?.link};
    return {"characterId": id, "avatarUrl": avatar_names[id]?.link};
}


function getText(line_iter, allow_speaker, allow_trans, allow_audio) {
    let speaker = {}
    let line = line_iter.get();
    if (line.startsWith(">") || (allow_speaker && line.match(/\w*:/))) {
        speaker.text = line;
        line = line_iter.advance(1);
        if (line.startsWith("~") && allow_trans) {
            speaker.trans = line;
            line = line_iter.advance();
        }
        if(allow_audio) {
            speaker.allow_audio = allow_audio;
            speaker.audio_line_inset = line_iter.get_lineno();
            if (line.startsWith("$")) {
                speaker.audio = line;
                speaker.audio_line = line_iter.get_lineno();
                line_iter.advance();
            }
        }
    }
    return speaker;
}

function getAnswers(line_iter, allow_trans) {
    let answers = []
    let correct_answer = undefined;
    while(line_iter.get()) {
        let line = line_iter.get();
        if (line.startsWith("+") || line.startsWith("-")) {
            if(line.startsWith("+"))
                correct_answer = answers.length;
            let answer = {text: line};
            line = line_iter.advance();
            if (line && line.startsWith("~") && allow_trans) {
                answer.trans = line;
                line = line_iter.advance();
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
    line = line.replace(/(\s*)\)/g, ")$1")
    line = line.replace(/~/g, " ")
    line = line.replace(/ +/g, " ")
    let transcriptParts = [];
    let correctAnswerIndex = 0;
    let index = 0;

    while(line.length) {
        let pos = line.indexOf("(");
        if(pos === -1) {
            for(let l of splitTextTokens(line))
                if(l !== "")
                    transcriptParts.push({
                        selectable: false,
                        text: l,
                    })
            break
        }
        if(line.substring(0, pos) !== "") {
            for(let l of splitTextTokens(line.substring(0, pos),))
                if(l !== "")
                    transcriptParts.push({
                        selectable: false,
                        text: l
                    })
        }
        line = line.substring(pos+1);
        if(line.startsWith("+")) {
            correctAnswerIndex = index;
            line = line.substring(1);
        }
        let pos2 = line.indexOf(")");
        if(pos2 === -1)
            pos2 = line.length-1;
        transcriptParts.push({
            selectable: true,
            text: line.substring(0, pos2).trim(),
        })
        index += 1
        line = line.substring(pos2+1);

    }

    return [correctAnswerIndex, transcriptParts]
}

function processBlockHeader(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let data = getText(line_iter, false, true, true);
    let data_text = speaker_text_trans(data, story.meta)
    story.elements.push({
        type: "HEADER",
        illustrationUrl: "https://stories-cdn.duolingo.com/image/"+story.meta["icon"]+".svg",
        title: story.meta["fromLanguageName"],
        learningLanguageTitleContent: data_text.content,
        trackingProperties: {},
        audio: data_text.audio,
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": line_iter.get_lineno(), "active_no": start_no1}
    })
    return false
}

function processBlockLine(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data, story.meta)

    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio,
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": line_iter.get_lineno(), "active_no": start_no1}
    })
    story.meta.line_index += 1;
    return false
}

function processBlockMultipleChoice(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let data = getText(line_iter, false, true, false);
    let data_text = speaker_text_trans(data, story.meta)

    let [answers, correct_answer] = getAnswers(line_iter, true);
    story.elements.push({
        type: "MULTIPLE_CHOICE",
        answers: answers,
        correctAnswerIndex: correct_answer,
        question: data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index-1,
            challenge_type: "multiple-choice"
        },
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": line_iter.get_lineno(), "active_no": start_no1}
    })
    //story.meta.line_index += 1;
    return false
}

function processBlockSelectPhrase(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data, story.meta)

    let start_no2 = line_iter.get_lineno(0);
    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data, story.meta)

    let start_no3 = line_iter.get_lineno(0);
    let [answers, correct_answer] = getAnswers(line_iter, false);
    story.elements.push({
        type: "CHALLENGE_PROMPT",
        prompt: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "select-phrases"
        },
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": start_no2, "active_no": start_no1}
    })
    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio,
        editor: {"start_no": start_no2, "end_no": start_no3}
    })
    story.elements.push({
        type: "SELECT_PHRASE",
        answers: answers,
        correctAnswerIndex: correct_answer,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "select-phrases"
        },
        editor: {"start_no": start_no3, "end_no": line_iter.get_lineno()}
    })
    story.meta.line_index += 1;
}

function processBlockContinuation(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data, story.meta)

    let start_no2 = line_iter.get_lineno();
    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data, story.meta, false, true)

    let start_no3 = line_iter.get_lineno();
    let [answers, correct_answer] = getAnswers(line_iter, true);
    story.elements.push({
        type: "CHALLENGE_PROMPT",
        prompt: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "continuation"
        },
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": start_no2, "active_no": start_no1}
    })
    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio,
        editor: {"start_no": start_no2, "end_no": start_no3}
    })
    story.elements.push({
        type: "MULTIPLE_CHOICE",
        answers: answers,
        correctAnswerIndex: correct_answer,
        //question: data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "continuation"
        },
        editor: {"start_no": start_no3, "end_no": line_iter.get_lineno()}
    })
    story.meta.line_index += 1;
}

function processBlockArrange(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data, story.meta)

    let start_no2 = line_iter.get_lineno();
    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data, story.meta, true)

    let [phraseOrder, selectablePhrases2] = shuffleArray(data_text.selectablePhrases);
    story.elements.push({
        type: "CHALLENGE_PROMPT",
        prompt: question_data_text.content,
        trackingProperties: {
            line_index: story.meta.line_index,
            challenge_type: "arrange"
        },
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": start_no2, "active_no": start_no1}
    })
    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio,
        editor: {"start_no": start_no2, "end_no": line_iter.get_lineno()}
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
        editor: {"start_no": start_no2, "end_no": line_iter.get_lineno()}
    })
    story.meta.line_index += 1;
}


function processBlockPointToPhrase(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data, story.meta)

    let start_no2 = line_iter.get_lineno();
    let data = getText(line_iter, true, true, true);
    let data_text = speaker_text_trans(data, story.meta, true)

    let [correctAnswerIndex, transcriptParts] = pointToPhraseButtons(data.text)

    story.elements.push({
        type: "LINE",
        hideRangesForChallenge: data_text.hideRanges,
        line: data_text.line,
        trackingProperties: {
            line_index: story.meta.line_index,
        },
        audio: data_text.audio,
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": start_no2, "active_no": start_no1}
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
        editor: {"start_no": start_no2, "end_no": line_iter.get_lineno()}
    })
    story.meta.line_index += 1;
}

function processBlockMatch(line_iter, story) {
    let start_no = line_iter.get_lineno(-1);
    let start_no1 = line_iter.get_lineno();
    let question_data = getText(line_iter, false, true, false);
    let question_data_text = speaker_text_trans(question_data, story.meta)

    let answers = [];
    while(line_iter.get()) {
        let line = line_iter.get()
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
        editor: {"block_start_no": start_no, "start_no": start_no, "end_no": line_iter.get_lineno(), "active_no": start_no1}
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
        if(lines[index + offset])
            return lines[index + offset][1];
    }
    function get_lineno(offset=0) {
        if(lines[index + offset])
            return lines[index + offset][0];
    }
    function advance(offset=1) {
        index += offset;
        return get();
    }
    return {get:get, get_lineno:get_lineno, advance:advance}
}

//window.audio_insert_lines = []
export function processStoryFile(text, story_id, avatar_names) {
    // reset those line as they may have changed
    //window.audio_insert_lines = []

    let lines = split_lines(text);

    let story = {elements: [], meta: {audio_insert_lines: [], line_index: 1, story_id: story_id, avatar_names: avatar_names, avatar_overwrites: {}, cast: {}}}
    let line_iter = line_iterator(lines)
    while(line_iter.get()) {
        let line = line_iter.get()
        if(line.startsWith("[") && line.endsWith("]")) {
            line_iter.advance();
            let current_block = line.substring(1, line.length - 1)
            try {
                if (block_functions[current_block]) {
                    block_functions[current_block](line_iter, story)
                    continue
                }
            }
            catch (e) {
                console.error(e);

            }
        }
        story.elements.push({
            type: "ERROR",
            text: line,
            trackingProperties: {
                line_index: story.meta.line_index,
                challenge_type: "error"
            },
            // "editor": {"start_no": group.start_no, "end_no": group.end_no}
        });
        story.meta.line_index += 1;
        //console.log("error", lineno, line)
        line_iter.advance();
    }
    let meta = story.meta;
    delete story.meta;
    let audio_insert_lines = meta.audio_insert_lines;
    delete meta.audio_insert_lines;

    return [story, meta, audio_insert_lines];
}

