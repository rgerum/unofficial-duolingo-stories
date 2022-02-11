import {getAvatar} from "./api_calls.mjs";


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
    return text.replace(/([^-|~ ,;.:_?!…]*)\{([^\}]*)\}/g, "$1");
}

function getInputStringSpeachtext(text) {
    if(lexicon != undefined) {
        if (lexicon.letters !== undefined)
            for (let c in lexicon.letters) {
                text = text.replace(new RegExp(c, "g"), lexicon.letters[c]);
            }
        if (lexicon.fragments !== undefined)
            for (let fragment of lexicon.fragments) {
                text = text.replace(new RegExp(fragment.match, "g"), fragment.replace);
            }
    }
    text = text.replace(/(\.\.\.|…)/g, '<sub alias="">$1</sub><break/>');
    return "<speak>"+text.replace(/([^-|~ ,;.:_?!…]*)\{([^\}:]*):([^\}]*)\}/g, '<phoneme alphabet="$3" ph="$2">$1</phoneme>').replace(/([^-|~ ,;.:_?!…]*)\{([^\}]*)\}/g, '<sub alias="$2">$1</sub>').replace(/~/g, " ").replace(/\|/g, "​")+"</speak>";
}

function getSpeaker(name) {
    if(!name)
        name = "Narrator"
    if(story_properties["speaker_"+name])
        return story_properties["speaker_"+name];
    if(!language_data || !language_data[story_properties.lang])
        return undefined;
    return language_data[story_properties.lang].speaker;
}

//window.ssml_list = [];
//window.lexicon = undefined;

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

function getAudioUrl(id) {
    return `audio/${story_id}/speech_${story_id}_${id}.mp3?${Date.now()}`
}

function generateAudioMap(text, audiomap, id) {
    let text_speak = getInputStringSpeachtext(text);
    let text_display = getInputStringText(text);
    let text_speak_list = splitTextTokens(text_speak, false);
    let text_display_list = splitTextTokens(text_display, false);

    let keypoints = [];
    let text_pos = 0;
    for(let i = 0; i < text_display_list.length; i++) {
        if(i%2 === 0 && audiomap[parseInt(i/2)]) {
            keypoints.push({
                rangeEnd: text_pos + text_display_list[i].length,
                audioStart: audiomap[parseInt(i/2)].time,
            })
        }
        text_pos += text_display_list[i].length;
    }
    return {url: getAudioUrl(id), keypoints: keypoints};
}

function generateMaps(speaker, text, translation, audiomap, id) {
    let data = {type: "LINE"};
    let content = generateHintMap(getInputStringText(text), translation);
    if(audiomap && audiomap[id])
        content.audio = generateAudioMap(text, audiomap[id], id);
    else
        content.audio = {}
    if(getSpeaker(speaker))
        content.audio.ssml = {text: getInputStringSpeachtext(text), speaker: getSpeaker(speaker), id: id};
    if(speaker) {
        data.line = {
            type: "CHARACTER",
            content: content,
            characterId: speaker,
            avatarUrl: story_properties["icon_"+speaker],
        }
    }
    else {
        data.line = {
            type: "PROSE",
            content: content,
        }
    }
    data.hideRangesForChallenge = [];
    data.trackingProperties = {line_index: id};
    return data;
}

function getTextWithTranslation(lines, index, regex1, regex2) {
    let match = lines[index].match(regex1);
    if(match === null)
        return [index, undefined, undefined];
    let match2 = lines[index+1].match(regex2);
    if(match2 === null)
        return [index, match[match.length-1], undefined]
    index += 1;
    return [index, match[match.length-1], match2[match2.length-1]];
}

function getTextWithTranslationsHintMap(lines, index, regex1, regex2) {
    let text, translation;
    [index, text, translation] = getTextWithTranslation(lines, index, regex1, regex2);
    return [index, generateHintMap(text || "", translation || "")];
}

function readAnswerLines(lines, index, data) {
    // iterate over the next lines, they are the answers
    for(; index < lines.length - 1; index+=1) {
        // check if it starts with + or -
        let match = lines[index+1].match(/^([-+])\s*(.*)\s*$/);

        if(match === null)
            break
        // split text
        let [_, yes, text] = match;
        let translation = undefined;

        // check if it is the correct answer
        if(yes === "+")
            data.solution = data.answers.length;

        // optionally the next line can be the translation
        match = lines[index+2].match(/^[~]\s*(.*)\s*$/);
        if(match !== null) {
            [_, translation] = match;
            index += 1;
        }
        // add the answer
        data.answers.push([text, translation]);
    }
    return index;
}

function readAnswerLines2(lines, index, data) {
    let answers = [];
    let answer;
    let correctAnswerIndex = 0;
    // iterate over the next lines, they are the answers
    while(index < lines.length - 1) {
        if(!lines[index+1].startsWith("+") && !lines[index+1].startsWith("-"))
            break

        if(lines[index+1].startsWith("+"))
            correctAnswerIndex = answers.length;

        [index, answer] = getTextWithTranslationsHintMap(lines, index+1, /^([-+])\s*(.*)\s*$/, /^[~]\s*(.*)\s*$/)

        // add the answer
        answers.push(answer);
    }
    return [index, answers, correctAnswerIndex];
}

function readAnswerLinesNoHints(lines, index, data) {
    let answers = [];
    let translations = [];
    let answer, translation;
    let correctAnswerIndex = 0;
    // iterate over the next lines, they are the answers
    while(index < lines.length - 1) {
        if(!lines[index+1].startsWith("+") && !lines[index+1].startsWith("-"))
            break

        if(lines[index+1].startsWith("+"))
            correctAnswerIndex = answers.length;

        [index, answer, translation] = getTextWithTranslation(lines, index+1, /^([-+])\s*(.*)\s*$/, /^[~]\s*(.*)\s*$/)

        // add the answer
        answers.push(answer);
        translations.push(translation);
    }
    return [index, answers, translations, correctAnswerIndex];
}

function hintMapToText(content) {
    let text_pos = 0;
    let text = "";

    // iterate over all hints
    for(let hint of content.hintMap) {
        // add the text since the last hint
        if(hint.rangeFrom > text_pos)
            text += content.text.substring(text_pos, hint.rangeFrom).replace(/([^\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*,\-.\/:;<=>?@^_`{|}~]+)/g, "~");

        // add the text with the hint
        text += content.hints[hint.hintIndex];

        // advance the position
        text_pos = hint.rangeTo+1;
    }
    // add the text after the last hint
    if(text_pos < content.text.length)
        text += content.text.substring(text_pos, content.text.length).replace(/([^\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*,\-.\/:;<=>?@^_`{|}~]+)/g, "~");
    return text;
}

function split_lines(text) {
    /* splits the text into lines and removes comments */
    let lines = [];
    let lineno = 0;
    for (let line of text.split("\n")) {
        lineno += 1;
        // ignore empty lines or lines with comments (and remove rtl isolate)
        line = line.trim().replace(/\u2067/, "");
        if (line.length === 0 || line.substr(0, 1) === "#")
            continue;

        lines.push([lineno, line]);
    }
    return lines
}

function group_lines(lines) {
    /* group list of lines into blocks */
    let groups = [];
    let current_group = undefined;
    for(let [lineno, line] of lines) {
        if(line.startsWith("[")) {
            if(current_group) {
                current_group.end_no = lineno;
                groups.push(current_group);
            }
            current_group = {"name": line.substr(1, line.length-2), "start_no":lineno, "end_no":undefined, "pairs":[]}
        }
        else if(line.startsWith("~")) {
            current_group.pairs[current_group.pairs.length - 1][1] = line;
        }
        else {
            current_group.pairs.push([line, undefined]);
        }
    }
    if(current_group) {
        groups.push(current_group);
    }
    return groups
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
// [..."bla(bla) (his)] is {tgreat:ffa}".matchAll(/\(([^)]*)\)/g)]
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

export function speaker_text_trans(line) {
    let [, speaker, text] = line[0].match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S)\s*/);
    let translation = "";
    if(line[1])
        [, translation] = line[1].match(/\s*~\s*(\S.*\S)\s*/);
    let content = generateHintMap(getInputStringText(text), translation);

    let [selectablePhrases, characterPositions] = getButtons(content);
    let hideRanges = getHideRanges(content);
    // split number of speaker
    if(speaker) {
        let [, id] = speaker.match(/Speaker(.*)/);
        speaker = get_avatar(id);
    }
    return [speaker, content, hideRanges, selectablePhrases, characterPositions];
}

function get_avatar(id) {
    id = parseInt(id) ? parseInt(id) : id;
    if(!character_avatars[id]) {
        getAvatar(id).then((avatar)=>(add_avatar(id, avatar ? avatar.link : undefined)));
    }
    let avatar = character_avatars[id];
    let speaker = {"characterId": id, "avatarUrl": avatar}
    return speaker;
}

function add_avatar(id, link) {
    character_avatars[id] = link;
}

function generateLineElement(line_pair, line_index, group) {
    let element = undefined;
    let [speaker, content, hideRanges, selectablePhrases, characterPositions] = speaker_text_trans(line_pair);
    if (speaker === undefined)
        element = {
            "type": "LINE",
            "hideRangesForChallenge": hideRanges,
            "line": {"type": "PROSE", "content": content},
            "trackingProperties": {
                "line_index": line_index
            },
            "editor": {"start_no": group.start_no, "end_no": group.end_no}
        };
    else
        element = {
            "type": "LINE",
            "hideRangesForChallenge": hideRanges,
            "line": {
                "type": "CHARACTER",
                "avatarUrl": speaker.avatarUrl,
                "characterId": speaker.characterId,
                "content": content
            },
            "trackingProperties": {
                "line_index": line_index
            },
            "editor": {"start_no": group.start_no, "end_no": group.end_no}
        };
    return [element, selectablePhrases, characterPositions];
}

function shuftleArray(selectablePhrases) {
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

function parseGroup(groups) {
    let elements = [];
    let line_index = 1;
    let meta = {fromLanguageName: ""}
    for(let group of groups) {
        let name = group.name;
        let lines = group.pairs;
        try {
            if (name === "DATA") {
                for(let i in lines) {
                    let [key, value] = lines[i][0].split("=");
                    key = key.trim()
                    value = value.trim()
                    if(key === "set") {
                        [meta["set_id"], meta["set_index"]] = value.split("|");
                    }
                    else if(key.startsWith("icon_")) {
                        add_avatar(key.substring(5), value);
                    }
                    else {
                        meta[key] = value;
                    }
                }
            }
            else if (name === "HEADER") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                elements.push({
                    "type": "HEADER",
                    "illustrationUrl": "https://stories-cdn.duolingo.com/image/"+meta["icon"]+".svg",
                    "learningLanguageTitleContent": content,
                    "trackingProperties": {},
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                });
                if(lines[1] && lines[1][0].startsWith("$")) {
                    elements[elements.length - 1].learningLanguageTitleContent.audio = line_to_audio(lines[1][0]);
                }
            } else if (name === "LINE") {
                elements.push(generateLineElement(lines[0], line_index, group)[0]);
                if(lines[1] && lines[1][0].startsWith("$")) {
                    elements[elements.length - 1].line.content.audio = line_to_audio(lines[1][0]);
                }
                line_index += 1;
            } else if (name === "ARRANGE") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                elements.push({
                    "type": "CHALLENGE_PROMPT",
                    "prompt": content,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "arrange"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                let [elem, selectablePhrases, characterPositions] = generateLineElement(lines[1], line_index, group);
                elements.push(elem);
                if(lines[2] && lines[2][0].startsWith("$")) {
                    elements[elements.length - 1].line.content.audio = line_to_audio(lines[2][0]);
                }
                let [phraseOrder, selectablePhrases2] = shuftleArray(selectablePhrases);

                elements.push({
                    "type": "ARRANGE",
                    "characterPositions" : characterPositions,
                    "phraseOrder": phraseOrder,
                    "selectablePhrases": selectablePhrases2,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "arrange",
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                line_index += 1;
            } else if (name === "SELECT_PHRASE") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                elements.push({
                    "type": "CHALLENGE_PROMPT",
                    "prompt": content,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "select-phrases"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                let [elem, selectablePhrases, characterPositions] = generateLineElement(lines[1], line_index, group);
                elements.push(elem);
                if(lines[2] && lines[2][0].startsWith("$")) {
                    elements[elements.length - 1].line.content.audio = line_to_audio(lines[2][0]);
                    lines.splice(2, 1)
                }

                let answer_lines = lines.splice(2);
                let answers = [];
                let correct_answer = 0;
                for (let i in answer_lines) {
                    let [speaker, content] = speaker_text_trans(answer_lines[i]);
                    if (answer_lines[i][0].startsWith("+"))
                        correct_answer = parseInt(i);
                    answers.push(content.text);
                }
                elements.push({
                    "type": "SELECT_PHRASE",
                    "answers": answers,
                    "correctAnswerIndex": correct_answer,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "select-phrases"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                line_index += 1;
            } else if (name === "CONTINUATION") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                elements.push({
                    "type": "CHALLENGE_PROMPT",
                    "prompt": content,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "continuation"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                let [elem, selectablePhrases, characterPositions] = generateLineElement(lines[1], line_index, group);
                elements.push(elem);
                if(lines[2] && lines[2][0].startsWith("$")) {
                    elements[elements.length - 1].audio = line_to_audio(lines[2][0]);
                }

                let answer_lines = lines.splice(2);
                let answers = [];
                let correct_answer = 0;
                for (let i in answer_lines) {
                    let [speaker, content] = speaker_text_trans(answer_lines[i]);
                    if (answer_lines[i][0].startsWith("+"))
                        correct_answer = parseInt(i);
                    answers.push(content);
                }
                elements.push({
                    "type": "MULTIPLE_CHOICE",
                    "answers": answers,
                    "correctAnswerIndex": correct_answer,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "continuation"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                line_index += 1;
            } else if (name === "MULTIPLE_CHOICE") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                let answer_lines = lines.splice(1);
                let answers = [];
                let correct_answer = 0;
                for (let i in answer_lines) {
                    let [speaker, content] = speaker_text_trans(answer_lines[i]);
                    if (answer_lines[i][0].startsWith("+"))
                        correct_answer = parseInt(i);
                    answers.push(content);
                }
                elements.push({
                    "type": "MULTIPLE_CHOICE",
                    "answers": answers,
                    "correctAnswerIndex": correct_answer,
                    "question": content,
                    "trackingProperties": {
                        "line_index": line_index - 1,
                        "challenge_type": "multiple-choice"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
            } else if (name === "POINT_TO_PHRASE") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                function pointToPhraseButtons(lines) {
                    let [, speaker, line] = lines[0].match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S)\s*/);
                    lines[0] = lines[0].replace("(+", "(")
                    let transcriptParts = [];
                    let correctAnswerIndex = 0;
                    let index = 0;
                    let tokens = splitTextTokens(line);
                    for(let token of tokens) {
                        let selectable = false;
                        if(token.substr(0, 2) === "(+") {
                            correctAnswerIndex = index
                            token = token.substring(2, token.length-1)
                            selectable = true;
                        }
                        if(token.substr(0, 1) === "(") {
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

                    while(line.length) {
                        let pos = line.indexOf("(");
                        if(pos === -1) {
                            transcriptParts.push({
                                selectable: false,
                                text: line
                            })
                            break
                        }
                        if(pos > 0) {
                            transcriptParts.push({
                                selectable: false,
                                text: line.substring(0, pos)
                            })
                        }
                        if(line.substr(pos, 1) === "+") {
                            pos += 1;
                            correctAnswerIndex = index;
                        }
                        let pos2 = line.indexOf(")")
                        transcriptParts.push({
                            selectable: true,
                            text: line.substring(pos+1, pos2)
                        })
                        line = line.substr(pos2+1)
                        index += 1;
                    }
                    return [correctAnswerIndex, transcriptParts]
                }
                let [correctAnswerIndex, transcriptParts] = pointToPhraseButtons(lines[1])
                let [elem, selectablePhrases, characterPositions] = generateLineElement(lines[1], line_index, group);
                elements.push(elem);
                if(lines[2] && lines[2][0].startsWith("$")) {
                    elements[elements.length - 1].audio = line_to_audio(lines[2][0]);
                }
                let [phraseOrder, selectablePhrases2] = shuftleArray(selectablePhrases);

                elements.push({
                    "type": "POINT_TO_PHRASE",
                    "correctAnswerIndex" : correctAnswerIndex,
                    "transcriptParts": transcriptParts,
                    "question": content,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "point-to-phrase",
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                })
                line_index += 1;
            } else if (name === "MATCH") {
                let [speaker, content] = speaker_text_trans(lines[0]);
                let answer_lines = lines.splice(1);
                let answers = [];
                let correct_answer = 0;
                for (let i in answer_lines) {
                    let [, word1, word2] = answer_lines[i][0].match(/-\s*(\S.*\S)\s*<>\s*(\S.*\S)\s*/)
                    answers.push({"phrase": word1, "translation": word2});
                }
                elements.push({
                    "type": "MATCH",
                    "fallbackHints": answers,
                    "prompt": content.text,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "match"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                });
            }
            else {
                elements.push({
                    "type": "ERROR",
                    "name": name,
                    "text": group,
                    "trackingProperties": {
                        "line_index": line_index,
                        "challenge_type": "error"
                    },
                    "editor": {"start_no": group.start_no, "end_no": group.end_no}
                });
            }
        }
        catch (e) {
            elements.push({
                "type": "ERROR",
                "text": group,
                "trackingProperties": {
                    "line_index": line_index,
                    "challenge_type": "error"
                },
                "editor": {"start_no": group.start_no, "end_no": group.end_no}
            });
            line_index += 1;
        }
    }
    return [elements, meta];
}

export function processStoryFile(text) {
    let phrases = [];

    let lines = split_lines(text);
    //console.log(lines);
    let groups = group_lines(lines);
    //console.log(groups);
    // fromLanguageName
    let [elements, data] = parseGroup(groups)

    let story = {"elements": elements, "fromLanguageName": data["fromLanguageName"]};
    //console.log(JSON.stringify(story, null, 2));
    //console.log(story);
    return [story, data];
}

function updateAudioLinks(story_json, line_id) {
    function processElement(element) {
        if(element.line && element.line.content && element.line.content.audio) {
            let audio = element.line.content.audio;
            if(audio.url)
                audio.url = audio.url.replace(/\?.*$/, "")+`?${Date.now()}`;
        }
    }
    if(line_id !== undefined)
        return processElement(story_json.elements[line_id]);
    for(let element of story_json.elements) {
        processElement(element);
    }
    return story_json;
}

async function reloadAudioMap() {
    let audio_map = await fetch(`audio/${story_id}/audio_${story_id}.json?${Date.now()}`);
    if(audio_map.status !== 200)
        window.audio_map = undefined;
    else {
        window.audio_map = await audio_map.json();
    }
}
//window.reloadAudioMap = reloadAudioMap;

let json;

function download_json() {
    let j = document.createElement("a")
    j.id = "download"
    j.download = "story"+story_id+".json"
    j.href = URL.createObjectURL(new Blob([JSON.stringify({"meta": story_properties, "phrases": story_json.elements}, null, 2)]))
    j.click()
}

async function upload_json() {
    let json = JSON.stringify({"meta": story_properties, "phrases": story_json.elements});
    let response = await fetch_post(`${backend_audio}set_audio.php`, {"id": story_id, "json": json});
    let text = await response.text();
    return text;
}

async function generate_audio_line(story_json, line_id) {
    let json = JSON.stringify(ssml_list);
    let audio_reloader = d3.select("#audio_reload"+line_id);
    audio_reloader.attr("data-reload", true);
    let response = await fetch_post(`${backend_audio}set_audio.php`, {"id": story_id, "json": json, "line_id": line_id});
    let text = await response.text();
    updateAudioLinks(story_json, line_id);
    loadAudios(story_json);
    await reloadAudioMap();
    audio_reloader.attr("data-reload", undefined);
    return text;
}
//window.generate_audio_line = generate_audio_line;

async function generate_all_audio(story_json) {
    for(let id in ssml_list) {
        await generate_audio_line(story_json, id);
    }
    loadAudios(story_json);
}

let character_avatars = {
}
try {
    window.character_avatars = character_avatars
}
catch (e) {
    
}

