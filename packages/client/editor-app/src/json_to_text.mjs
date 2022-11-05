//import {diffJson} from "diff";
//import {processStoryFile, splitTextTokens} from "./story-editor/syntax_parser_new.mjs";

let punctuation_chars = "\\\/¡!\"\'\`#$%&*,.:;<=>¿?@^_`{|}…"+
    "。、，！？；：（）～—·《…》〈…〉﹏……——"
let regex_split_token = new RegExp(`([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​)[\\s${punctuation_chars}]*)`);
let regex_split_token2 = new RegExp(`([\\s${punctuation_chars}~]*(?:^|\\s|$|​)[\\s${punctuation_chars}~]*)`);
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

let backend_get = "https://carex.uber.space/stories/backend/editor/get.php"
export async function getAvatars(id, course_id) {
    try {
        let response = await fetch(`${backend_get}?action=avatar_names&id=${id}&course_id=${course_id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

function make_same_length([t, r], fill="_") {
    return [
        t + fill.repeat(Math.max(0, r.length - t.length)),
        r + fill.repeat(Math.max(0, t.length - r.length)),
    ]
}


function stringIndex (search, find, position = "all") {

    var currIndex = 0, indexes = [], found = true;

    while (found) {
        var searchIndex = search.indexOf(find);
        if (searchIndex > -1) {
            currIndex += searchIndex + find.length;
            search = search.substr (searchIndex + find.length);
            indexes.push (currIndex - find.length);
        } else found = false; //no other string to search for - exit from while loop
    }

    if (position == 'all') return indexes;
    if (position > indexes.length -1) return [];

    position = (position == "last") ? indexes.length -1 : position;

    return indexes[position];
}

function text_add_hints(t, {hints, hintMap}) {
    if(hintMap.length === 0) {
        t = text_swap_regex(t)
        return t
    }
    hints = [...hints];
    hintMap = [...hintMap];
    /*
    let zwsp_pos = stringIndex(t.original_text, "​")
    t.text = t.text.replace(/​/g, "-")
    console.log(t.text)
    console.log(zwsp_pos)
    for(let pos of zwsp_pos) {
        t = text_splice(t, pos-1, 1, ["", ""]);
        console.log(pos, t.text)
    }*/
    //t.text = t.text.replace(/​/g, "-")
    console.log(t.text)
    let parts = splitTextTokens(t.original_text.replace(/​/g, "."));
    let pos = 0;

    let ii = 0;
    console.log(parts);
    console.log(hintMap);
    // iterate over all the naturally split parts
    for(let i=0; i < parts.length; i++) {
        let pos2 = pos+parts[i].length-1;
        // omit empty parts
        if(parts[i].length === 0) {
            pos = pos2+1
            continue;
        }
        if(i % 2 === 0) {
            let hint =hintMap[ii]
            console.log(pos, pos2, hint, hints[ii])
            // maybe we need to split up the current hint
            while(hint !== undefined && pos2 > hint.rangeTo) {
                t = text_splice(t, hint.rangeTo+1, 0, ["|", " "]);
                ii += 1;
                pos = hint.rangeTo+1;
                hint = hintMap[ii];
                console.log(pos, pos2, hint, hints[ii])
                console.log(t.text)
            }
            if(hint === undefined || hint.rangeFrom > pos2) {
                hintMap.splice(ii, 0, {rangeFrom: pos, rangeTo: pos2})
                hints.splice(ii, 0, "~")
            }
            else if(hint.rangeTo > pos2) {
                ii -= 1;
            }
            ii += 1;
        }
        pos = pos2+1
    }
    //console.log("parts", parts, hintMap)
    /*"hints": [
        "my",
        "English",
        "textbook",
        "where"
    ],*/

    for(let i in hintMap) {
        let hint = hintMap[i];
        let word = t.original_text.substring(hint.rangeFrom, hint.rangeTo+1)
        console.log(hint, word)
        t = text_splice(t, hint.rangeFrom, word.length, make_same_length([word.replace(/ /g, "~"), hints[i].replace(/ /g, "~")]));
        console.log(t.text)
        console.log(t.tran)
    }
    //if(hints[0] === "my")
    //    throw "as"
    t = text_swap_regex(t)

    return t;
}

function text_new(text) {
    return {
        original_text: text,
        text: text,
        tran: " ".repeat(text.length),
        map_old_to_new: [...Array(text.length).keys()],
    }
}

function text_copy(text) {
    return {
        original_text: text.original_text,
        text: text.text,
        tran: text.tran,
        map_old_to_new: [...text.map_old_to_new],
    }
}

function text_splice(t, old_pos, del, [insert1, insert2], near_next_space=false) {
    console.assert(insert1.length === insert2.length, "Strings don't have equal length.")
    console.assert(old_pos >= 0, "Pos needs to be positive")
    console.assert(old_pos <= t.original_text.length, "Pos needs to be in string")

    // work on copy
    t = text_copy(t);

    let pos = old_pos === t.original_text.length ? t.text.length : t.map_old_to_new[old_pos];

    t.text = t.text.slice(0, pos) + insert1.slice(0, del) + t.text.slice(pos+del);
    t.tran = t.tran.slice(0, pos) + insert2.slice(0, del) + t.tran.slice(pos+del);

    pos += del
    insert1 = insert1.slice(del)
    insert2 = insert2.slice(del)

    t.text = t.text.slice(0, pos) + insert1 + t.text.slice(pos);
    if(near_next_space) {
        while(t.tran.substring(pos, pos+1) && t.tran.substring(pos, pos+1) !== " ")
            pos += 1;
    }
    t.tran = t.tran.slice(0, pos) + insert2 + t.tran.slice(pos);

    for (let i = old_pos+del; i < t.map_old_to_new.length; i++) {
        t.map_old_to_new[i] += insert1.length;
    }
    return t
}

function text_swap_regex(t) {
    let m;
    t = text_copy(t);
    // as long as there are matches to swap
    while(m = t.text.match(/(_+)([^ \w]+)/)) {
        // swap the position of the first and second match
        t.text = t.text.slice(0, m.index) + m[2] + m[1] + t.text.slice(m.index+m[0].length);
        // change the position in the mapping
        for (let i in t.map_old_to_new) {
            let val = t.map_old_to_new[i];
            if(val >= m.index+m[1].length && val < m.index+m[1].length+m[2].length) {
                t.map_old_to_new[i] -= m[1].length;
            }
        }
    }
    t.text = t.text.replace(/_/g, " ")
    t.tran = t.tran.replace(/_/g, " ")
    return t
}

function text_map_back(t) {
    let reconstructed = "";
    for(let i in t.map_old_to_new) {
        reconstructed += t.text.substr(t.map_old_to_new[i], 1);
    }
    console.log("+", ">"+t.original_text+"<");
    console.log("-", ">"+reconstructed+"<");
}

function text_hide_challenge(t, hideRangesForChallenge) {
    if(hideRangesForChallenge.start !== undefined) // legacy
        hideRangesForChallenge = [hideRangesForChallenge]

    t = text_copy(t);
    for(let challenge of hideRangesForChallenge) {
        t = text_splice(t, challenge.start, 0, ["[", " "])
        t = text_splice(t, challenge.end, 0, ["]", " "])
    }
    return t
}

function text_add_arrange(t, part) {
    t = text_copy(t);
    for (let i in part.characterPositions) {
        let index = 0;

        if(0) {
            for (let j in part.phraseOrder) {
                if (part.phraseOrder[j] === parseInt(i))
                    index = j;
            }
        }
        else {
            index = part.phraseOrder[i];
        }
        console.log("characterPos", i, index, part.phraseOrder)
        let length = part.selectablePhrases[index].length;
        let pos = part.characterPositions[i] - length;

        while(pos && t.original_text.substring(pos, pos+length) !== part.selectablePhrases[index]) {
            console.log(i, index, pos, t.original_text.substring(pos, pos+length), part.selectablePhrases[index])
            pos -= 1;
            if(pos < 0)
                throw "no pos found"
        }
        //let pos = t.original_text.indexOf(part.selectablePhrases[index])

        t = text_splice(t, pos, 0, ["(", " "])
        t = text_splice(t, pos + length, 0, [")", " "], true)
    }
    // swap space and )
    t.text = t.text.replace(/( *)\)/g, ")$1")
    // swap ,)
    t.text = t.text.replace(/,\)/g, "),")
    t.text = t.text.replace(/]\)/g, ")]")
    t.text = t.text.replace(/(\W)\)]/g, ")]$1")
    // swap spaces before ) to be after the )
    //text.text = text.text.replace(/( *)\)/g, ")$1")
    // swap ]) for )]
    //text.text = text.text.replace(/]\)/g, ")]")
    return t;
}

function text_add_selectable(t, transcriptParts, correctAnswerIndex) {
    t = text_copy(t);
    let pos = 0;
    let index = 0;
    for(let part of transcriptParts) {
        let length = part.text.length;
        if(part.selectable) {
            t = text_splice(t, pos, 0, ["(", " "])
            if(index === correctAnswerIndex)
                t = text_splice(t, pos, 0, ["+", " "])
            t = text_splice(t, pos + length, 0, [")", " "], true)
            index += 1;
        }
        pos += length;
    }
    // swap space and )
    t.text = t.text.replace(/( *)\)/g, ")$1")
    return t;
}

function line_speaker(line) {
    if(line.type === "PROSE") {
        return "> ";
    }
    else if(line.type === "CHARACTER") {
        console.log("line.avatarUrl", line.avatarUrl)
        if(avatar_id_from_image_global[line.avatarUrl])
            return `Speaker${avatar_id_from_image_global[line.avatarUrl]}: `;
        //let bla = fo;
        return `Speaker${line.characterId}: `;
    }
}

function text_print(t) {
    if(t.tran.match(/[^~ ]+/))
        return `${t.text}\n${t.tran}\n`
    return `${t.text}\n`
}

function audio_to_text(audio) {
    if(audio === undefined)
        return "";
    let text = "";
    if(!audio?.url?.match(/audio\/(.*)\?\d*/))
        return "";
    text += "$"+audio.url.match(/audio\/(.*)\?\d*/)[1];
    let point = 0, key_time = 0;
    for(let keypoint of audio.keypoints) {
        text +=`;${keypoint.rangeEnd - point},${keypoint.audioStart - key_time}`;
        point = keypoint.rangeEnd;
        key_time = keypoint.audioStart;
    }
    text += "\n";
    return text;
}

export function processStory(json, set_id, story_id, old_text, avatar_list, avatar_id_from_image) {
    let T = "~";
    let text = ""

    let old_meta = {}; // legacy
    let speaker_list = {};
    let speaker_icons = "";

    if(old_text !== undefined) {
        for (let line of old_text.split("\n")) {
            let match = line.match(/\s*(\w+)\s*=\s*(\S+)\s*/);
            if(match) {
                old_meta[match[1]] = match[2];
                if(match[1].startsWith("icon_")) {
                    let speaker_name = match[1].substring(5);
                    console.log("search!", match)
                    if(avatar_id_from_image && avatar_id_from_image[match[2]]) {
                        speaker_list[speaker_name] = avatar_id_from_image[match[2]]
                        console.log("Found!", speaker_list[speaker_name])
                    }
                    else {
                        for (let avatar of avatar_list) {

                            if (avatar[1] === match[2]) {
                                speaker_list[speaker_name] = avatar[0]
                            }
                        }
                    }
                    if(speaker_list[speaker_name] === undefined) {
                        speaker_icons += `icon_${speaker_name}=${match[2]}\n`;
                        console.log(speaker_icons)
                    }
                }
                if(match[1].startsWith("speaker_")) {
                    speaker_icons += `${match[1]}=${match[2]}\n`;
                }
            }
        }
        if(old_meta["set_id"])
            set_id = old_meta["set_id"];
        if(old_meta["set_index"])
            story_id = old_meta["set_index"];
    }
    console.log(old_meta)

    text += "[DATA]\n";
    text += `fromLanguageName=${json.fromLanguageName}\n`;
    try {
        text += `icon=${json.illustrations.active.match(/image\/(.*).svg/)[1]}\n`;
    }
    catch (e) {
        text += `icon=${json.illustrations.active}\n`;
    }
    text += `set=${set_id}|${story_id}\n`;
    text += "\n";

    if(speaker_icons !== "") // legacy
        text += speaker_icons + "\n";

    let challenge_prompt = undefined;
    let element_index = -1;
    for (let element of json.elements) {
        element_index += 1;
        console.log("#### element", element_index, element)

        if (element.type === "LINE") {
            if(element.line.avatarUrl) {
                avatars[element.line.characterId] = element.line.avatarUrl
            }
            if(challenge_prompt !== undefined)
                challenge_prompt.push(element);
            else if(json.elements[element_index+1]?.type === "POINT_TO_PHRASE")
                challenge_prompt = [element];
            else if (element.line.type === "TITLE") { // legacy
                let t = text_new(element.line.content.text)
                t = text_splice(t, 0, 0, make_same_length(["> ", T+" "]));
                t = text_add_hints(t, element.line.content)
                text += `[HEADER]\n${text_print(t)}${audio_to_text(element.line.content.audio)}\n`
            }
            else {
                let t = text_new(element.line.content.text)
                t = text_splice(t, 0, 0, make_same_length([line_speaker(element.line), T]));
                t = text_hide_challenge(t, element.hideRangesForChallenge);
                t = text_add_hints(t, element.line.content)
                text += `[LINE]\n${text_print(t)}${audio_to_text(element.line.content.audio)}\n`
            }
        } else if (element.type === "HEADER") {
            let t = text_new(element.learningLanguageTitleContent.text)
            t = text_add_hints(t, element.learningLanguageTitleContent)
            t = text_splice(t, 0, 0, ["> ", T+" "]);
            text += `[HEADER]\n${text_print(t)}\n`
        }
        else if(element.type === "SELECT_PHRASE") {
            let t0 = text_new(challenge_prompt[0].prompt.text)
            t0 = text_add_hints(t0, challenge_prompt[0].prompt)
            t0 = text_splice(t0, 0, 0, ["> ", T+" "]);

            let t = text_new(challenge_prompt[1].line.content.text)
            t = text_splice(t, 0, 0, make_same_length([line_speaker(challenge_prompt[1].line), T]));
            t = text_hide_challenge(t, challenge_prompt[1].hideRangesForChallenge);
            t = text_add_hints(t, challenge_prompt[1].line.content)
            text += `[SELECT_PHRASE]\n${text_print(t0)}${text_print(t)}${audio_to_text(challenge_prompt[1].line.content.audio)}`

            challenge_prompt = undefined;

            for(let i in element.answers) {
                if(element.answers[i].slice === undefined) // legacy
                    element.answers[i] = element.answers[i].text
                let t = text_new(element.answers[i])
                t = text_splice(t, 0, 0, [(parseInt(i) === parseInt(element.correctAnswerIndex)) ? "+ " : "- ", T+" "]);
                text += text_print(t)
            }
            text += "\n";
        }
        else if(element.type === "MULTIPLE_CHOICE") {

            if(challenge_prompt === undefined) {
                let t = text_new(element.question.text)
                t = text_add_hints(t, element.question)
                t = text_splice(t, 0, 0, ["> ", T+" "]);
                text += `[MULTIPLE_CHOICE]\n${text_print(t)}`
            }
            else {
                if(challenge_prompt[0].trackingProperties.challenge_type === "continuation") {

                    let t0 = text_new(challenge_prompt[0].prompt.text)
                    t0 = text_add_hints(t0, challenge_prompt[0].prompt)
                    t0 = text_splice(t0, 0, 0, ["> ", T+" "]);

                    let t = text_new(challenge_prompt[1].line.content.text)
                    t = text_splice(t, 0, 0, make_same_length([line_speaker(challenge_prompt[1].line), T]));
                    t = text_hide_challenge(t, challenge_prompt[1].hideRangesForChallenge);
                    t = text_add_hints(t, challenge_prompt[1].line.content)
                    text += `[CONTINUATION]\n${text_print(t0)}${text_print(t)}${audio_to_text(challenge_prompt[1].line.content.audio)}`
                }
                else {
                    throw "Undefined multiple choice challenge type"
                }
                challenge_prompt = undefined;
            }
            for(let i in element.answers) {
                let t = text_new(element.answers[i].text)
                t = text_add_hints(t, element.answers[i])
                t = text_splice(t, 0, 0, [(parseInt(i) === parseInt(element.correctAnswerIndex)) ? "+ " : "- ", T+" "]);
                text += text_print(t)
            }
            text += "\n";
        }
        else if(element.type === "CHALLENGE_PROMPT") {
            challenge_prompt = [element];
        }
        else if(element.type === "ARRANGE") {

            let t0 = text_new(challenge_prompt[0].prompt.text)
            t0 = text_add_hints(t0, challenge_prompt[0].prompt)
            t0 = text_splice(t0, 0, 0, ["> ", T+" "]);

            let t = text_new(challenge_prompt[1].line.content.text)
            t = text_splice(t, 0, 0, make_same_length([line_speaker(challenge_prompt[1].line), "~"]));
            t = text_hide_challenge(t, challenge_prompt[1].hideRangesForChallenge);
            t = text_add_hints(t, challenge_prompt[1].line.content)
            t = text_add_arrange(t, element)

            text += `[ARRANGE]\n${text_print(t0)}${text_print(t)}${audio_to_text(challenge_prompt[1].line.content.audio)}\n`
            challenge_prompt = undefined;
        }
        else if(element.type === "POINT_TO_PHRASE") {
            let t = text_new(challenge_prompt[0].line.content.text)
            t = text_splice(t, 0, 0, make_same_length([line_speaker(challenge_prompt[0].line), "~"]));
            t = text_hide_challenge(t, challenge_prompt[0].hideRangesForChallenge);
            t = text_add_hints(t, challenge_prompt[0].line.content)
            t = text_add_selectable(t, element.transcriptParts, element.correctAnswerIndex)

            //exit
            let t0 = text_new(element.question.text)
            t0 = text_add_hints(t0, element.question)
            t0 = text_splice(t0, 0, 0, ["> ", "~ "]);
            text += `[POINT_TO_PHRASE]\n${text_print(t0)}${text_print(t)}${audio_to_text(challenge_prompt[0].line.content.audio)}\n`

            challenge_prompt = undefined;
        }
        else if(element.type === "MATCH") {
            text += "[MATCH]\n";
            text += `> ${element.prompt}\n`;
            for(let hint of element.fallbackHints) {
                text += `- ${hint.phrase} <> ${hint.translation}\n`;
            }
            text += "\n";
            challenge_prompt = undefined;
        }
        else if(element.type === "DUO_POPUP"
            || element.type === "FREEFORM_WRITING_PROMPT"
            || element.type === "FREEFORM_WRITING_EXAMPLE_RESPONSE"
            || element.type === "FREEFORM_WRITING") {

        }
        else {
            console.log(element)
            throw "Undefined element type"
        }
    }
    text = text.replace(/​/g, "")
    return text;
}

import * as fs from "fs";
import fetch from "node-fetch";
let avatars = {}
let icons = {}

function add_icon(story) {
    icons[story.illustrationUrls.active.match(/image\/(.*).svg/)[1]] = {
        active: story.illustrationUrls.active,
        gilded: story.illustrationUrls.gilded,
        locked: story.illustrationUrls.locked,
        activeLip: story.colors.activeLip,
        gildedLip: story.colors.gildedLip,
    }
}
function sortedObject(o1) {
    if(typeof(o1) === "object" && !Array.isArray(o1)) {
        let sorted = Object.entries(o1).sort(([k1], [k2]) => k1. localeCompare(k2));
        let sorted2 = []
        for(let o of sorted) {
            o[1] = sortedObject(o[1]);
            // console.log("...", o)
            sorted2.push(o);
        }
        return Object.fromEntries(sorted2);
    }
    else if(Array.isArray(o1)) {
        let sorted2 = [];
        for(let o of o1) {
            // console.log("...", o)
            sorted2.push(sortedObject(o));
        }
        return sorted2;
    }
    else
        return o1;
}

function compare_stories(json, text, story_id, avatar_names, avatar_id_from_image) {
    console.log("compare_stories")

    let [story_new_json, story_meta] = processStoryFile(text, story_id, avatar_names);

    let elements2 = []
    for(let i in json.elements) {
        // e.g. es-en-me-encanta-tu-corte-de-pelo // 'I Love Your Haircut!'
        if(json.elements[i].type === "DUO_POPUP" || json.elements[i].type === "FREEFORM_WRITING_PROMPT" || json.elements[i].type === "FREEFORM_WRITING"|| json.elements[i].type === "FREEFORM_WRITING_EXAMPLE_RESPONSE") {
            ;
        }
        else {
            elements2.push(json.elements[i])
        }
    }
    json.elements = elements2;


    let old = true;

    if(old) {
        json.elements[0] = {
            "illustrationUrl": story_new_json.elements[0].illustrationUrl,
            "learningLanguageTitleContent":
            json.elements[0].line.content,
            "title": story_new_json.elements[0].title,
            "trackingProperties": {},
            "type": "HEADER"
        }
    }

    let old_index_offset = 0;
    for(let element of json.elements) {
        if(!element)
            continue
        if(element.type === "HEADER") {
            delete element.learningLanguageTitleContent.audio;
            element.learningLanguageTitleContent.text = element.learningLanguageTitleContent.text.trim();
        }
        if(element.type === "LINE") {
            delete element.line.content.audio;
            let id = avatar_id_from_image[element.line.avatarUrl]
            if(id !== undefined)  // for old stories
                element.line.characterId = id
            element.line.content.text = element.line.content.text.trim()
            delete element.line.content.audioPrefix
            delete element.line.content.audioSuffix
            delete element.line.content.imageUrl
        }
        if(element.type === "MATCH")
            delete element.matches;
        if(element.type === "ARRANGE") {
            delete element.phraseOrder;
            delete element.selectablePhrases;
        }
        if(element.type === "SELECT_PHRASE") {
            for(let i in element.answers)
                element.answers[i] = element.answers[i].trim()
        }
        if(element.type === "MULTIPLE_CHOICE") {
            if(element.question)
                element.question.text = element.question.text.trim()
            for(let answer of element.answers)
                answer.text = answer.text.trim()
        }
        delete json.speakModeCharacterIds;
        delete json.learningLanguage;
        delete json.fromLanguage
        delete json.revision
        delete json.startTime
        delete json.illustrations
        delete json.active
        delete json.listenModeCharacterIds;
        delete json.peakModeCharacterIds
        delete json.cefrLevel
        delete json.mode
        delete json.isListenModeAvailable
        delete json.isListenModeRequired
        //delete json.fromLanguageName
        delete json.unspeakableWords
        delete json.showPromptsInTargetLanguage
        delete json.trackingProperties
        delete json.trackingConstants
        // old stories
        delete json.story_properties;
        delete json.discussion;
        if(element.hideRangesForChallenge && !Array.isArray(element.hideRangesForChallenge)) {
            element.hideRangesForChallenge = [element.hideRangesForChallenge]
        }
        if(old) {
            if(element.trackingProperties.challenge_type === "multiple-choice") {
                old_index_offset -= 1;
            }
            if(element.trackingProperties && element.trackingProperties.line_index)
                element.trackingProperties.line_index += old_index_offset;
            if(element.type === "LINE" && element.line.type === "CHARACTER" && !element.line.characterId) {
                let char = line_speaker(element.line).substring("Speaker".length)
                element.line.characterId = char
            }
            if(element.transcriptParts) {
                let parts = []
                for(let p of element.transcriptParts) {
                    if(p.text)
                        parts.push(p)
                }
                element.transcriptParts = parts
            }
            if(element.characterPositions) {
                let numbers = []
                for (let i in element.characterPositions) {
                    numbers.push(parseInt(element.characterPositions[i]) + 1);
                }
                element.characterPositions = numbers;
            }
            if(element.type === "ARRANGE" && story_id === 56) {
                element.characterPositions[element.characterPositions.length-1] -= 1;
            }
        }
    }
    fs.writeFileSync("/home/richard/Dropbox/unofficial-duolingo-stories/editor-app/story_compare0.txt", text);
    json = sortedObject(json);
    fs.writeFileSync("/home/richard/Dropbox/unofficial-duolingo-stories/editor-app/story_compare1.txt", JSON.stringify(json, null, 2));

    for(let element of story_new_json.elements) {
        delete element.audio;
        delete element.editor;
        if(element.type === "HEADER")
            delete element.learningLanguageTitleContent.audio;
        if(element.type === "LINE")
            delete element.line.content.audio;
        if(element.type === "ARRANGE") {
            delete element.phraseOrder;
            delete element.selectablePhrases;
        }
    }
    story_new_json = sortedObject(story_new_json);
    fs.writeFileSync("/home/richard/Dropbox/unofficial-duolingo-stories/editor-app/story_compare2.txt", JSON.stringify(story_new_json, null, 2));
    //console.log("same", JSON.stringify(story_new_json) === JSON.stringify(json))
    if(JSON.stringify(story_new_json) !== JSON.stringify(json))
        throw "JSON not the same"
    return
}

let avatar_id_from_image_global;
//import {fetch_post} from "./includes.mjs";
async function test() {
    /*
    "id" => "int",
        "duo_id" => "string",
        "name" => "string",
#        "name_base" => "string",
#        "lang" => "string",
#        "lang_base" => "string",
        "author" => "int",
        "change_date" => "string",
        "image" => "string",
#        "image_done" => "string",
#        "image_locked" => "string",
#        "discussion" => "string",
#        "xp" => "int",
#        "cefr" => "string",
        "set_id" => "int",
        "set_index" => "int",
        "course_id" => "int",
        "text" => "string",
        "json" => "string",
        "api" => "int"];
     */
    let course_id = 129;
    let folder = "/home/richard/Dropbox/unofficial-duolingo-stories/import_tools/duolingo_data_en_tr"
    let avatars = await getAvatars(2);
    let avatar_names = {}
    for(let avatar of avatars) {
        avatar_names[avatar.avatar_id] = avatar;
    }
    let avatars_new = [];
    let images = [];
    let avatar_id_from_image = {};
    avatar_id_from_image_global = avatar_id_from_image
    for(let avatar of avatars) {
        if(images.indexOf(avatar.link) === -1) {
            avatars_new.push(avatar);
            images.push(avatar.link);
            avatar_id_from_image[avatar.link] = avatar.avatar_id;
        }
    }

    let data2 = JSON.parse(fs.readFileSync(folder+"/_stories.txt"));
    //console.log(data2)
    for(let set_id in data2.sets) {
        for(let story_id in data2.sets[set_id]) {
            let story = data2.sets[set_id][story_id]
            let story_index = set_id * 100 + story_id;
            //if(story_index < 60002) // 53000
            //    continue
            //if(story.id !== 'es-en-en-el-supermercado')
            //    continue
            console.log(story)
            add_icon(story)
            let json = fs.readFileSync(folder+"/"+story.id+".txt")
            json = JSON.parse(json);

            console.log("### processStory")
            let text = processStory(json, parseInt(set_id)+1, parseInt(story_id)+1, "", [], avatar_id_from_image)

            console.log("story_index", story_index)
            //compare_stories(json, text, story_id, avatar_names, avatar_id_from_image)
            //console.log(diffJson(story_new_json, json));
            //return
            let data = {
                duo_id: story.id,
                name: story.title,
                author: 1,
                image: story.illustrationUrls.active.match(/image\/(.*).svg/)[1],
                set_id: parseInt(set_id)+1,
                set_index: parseInt(story_id)+1,
                course_id: course_id,// 12 es-en, 66 en-es
                text: text,
                json: JSON.stringify(json),
            }
            console.log("---------upload")
            try {
                //let res = await fetch_post(`https://carex.uber.space/stories/backend/editor/set.php?action=story`, data);
                //res = await res.text()
                //console.log(res);
            }
            catch (e) {
                console.log(e)
                die()
            }
            //die
            //if(story_id == 2)
            //    return
            //break
        }
        //break
    }
    //console.log(data2)
    //console.log(avatars)
    //if(0)
    for(let avatar_id in avatars) {
        let avatar_link = avatars[avatar_id];
        let data = await fetch(`https://carex.uber.space/stories/backend/admin/upload.php?action=avatar&id=${avatar_id}&link=${avatar_link}`)
        console.log(await data.text())
    }
    //console.log(icons)
    //if(0)
    for(let icon_id in icons) {
        let icon = icons[icon_id];
        let data = await fetch(`https://carex.uber.space/stories/backend/admin/upload.php?action=image&id=${icon_id}&active=${icon.active}&gilded=${icon.gilded}&locked=${icon.locked}&activeLip=${icon.activeLip}&gildedLip=${icon.gildedLip}`);
        console.log(await data.text())
    }
    return
    let jsonXXX = `{"elements": [ {"type":"HEADER","illustrationUrl":"https://stories-cdn.duolingo.com/image/fb16be061ee25cbd89be9a23e762f04047652d7f.svg","title":"The English Test","learningLanguageTitleContent":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":3},{"audioStart":220,"rangeEnd":10},{"audioStart":980,"rangeEnd":13},{"audioStart":1110,"rangeEnd":19}],"url":"https://stories-cdn.duolingo.com/audio/82803cf656252334e071e5c716ccbab9d1d45700.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":18}],"hints":["the","English test"],"text":"El examen de inglés"},"trackingProperties":{}}, {"type":"LINE","hideRangesForChallenge":[],"line":{"type":"PROSE","content": {"audio": {"keypoints":[{"audioStart":0,"rangeEnd":7},{"audioStart":650,"rangeEnd":12},{"audioStart":1520,"rangeEnd":15},{"audioStart":1800,"rangeEnd":18},{"audioStart":2040,"rangeEnd":23},{"audioStart":2690,"rangeEnd":27},{"audioStart":2910,"rangeEnd":32}], "url":"https://stories-cdn.duolingo.com/audio/67296d54315d8c674461c2f908590b94d1b2385a.mp3" }, "hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":5},{"hintIndex":1,"rangeFrom":7,"rangeTo":10},{"hintIndex":2,"rangeFrom":12,"rangeTo":13},{"hintIndex":3,"rangeFrom":15,"rangeTo":21},{"hintIndex":4,"rangeFrom":23,"rangeTo":25},{"hintIndex":5,"rangeFrom":27,"rangeTo":30}], "hints":["Junior","is","at","his house","with","Zari"], "text":"Junior está en su casa con Zari."}}, "trackingProperties":{"line_index":1}}, {"type":"LINE","hideRangesForChallenge":[], "line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415, "content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":7},{"audioStart":840,"rangeEnd":16},{"audioStart":1690,"rangeEnd":19},{"audioStart":1850,"rangeEnd":25}],"url":"https://stories-cdn.duolingo.com/audio/f3320b0f433edfeaaaea290e74915c3f166e2122.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":4},{"hintIndex":1,"rangeFrom":7,"rangeTo":14},{"hintIndex":2,"rangeFrom":16,"rangeTo":23}],"hints":["Zari","I need","your help"],"text":"¡Zari, necesito tu ayuda!"}},"trackingProperties":{"line_index":2}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/b603d66652590a597f5952576abeb2a09f355986.svg","characterId":418,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":4},{"audioStart":230,"rangeEnd":14},{"audioStart":920,"rangeEnd":17},{"audioStart":1050,"rangeEnd":23}],"url":"https://stories-cdn.duolingo.com/audio/9f125ce5b9ae07838663640b80f81f4b862ba40a.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":2},{"hintIndex":1,"rangeFrom":4,"rangeTo":12},{"hintIndex":2,"rangeFrom":14,"rangeTo":15},{"hintIndex":3,"rangeFrom":17,"rangeTo":21}],"hints":["you","need","my","help"],"text":"¿Tú necesitas mi ayuda?"}},"trackingProperties":{"line_index":3}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":4},{"audioStart":640,"rangeEnd":10},{"audioStart":970,"rangeEnd":13},{"audioStart":1110,"rangeEnd":20},{"audioStart":1770,"rangeEnd":23},{"audioStart":1850,"rangeEnd":30},{"audioStart":2350,"rangeEnd":34},{"audioStart":2640,"rangeEnd":45}],"url":"https://stories-cdn.duolingo.com/audio/0eb0e87b2aceef9f7bcf3586ae79c576cc79fd48.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":4,"rangeTo":8},{"hintIndex":2,"rangeFrom":10,"rangeTo":11},{"hintIndex":3,"rangeFrom":13,"rangeTo":43}],"hints":["yes","I have","a","very important English test"],"text":"Sí, tengo un examen de inglés muy importante…"}},"trackingProperties":{"line_index":4}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"No, that's wrong."},{"hintMap":[],"hints":[],"text":"Yes, that's right."}],"correctAnswerIndex":0,"question":{"hintMap":[],"hints":[],"text":"Junior has a Spanish exam soon."},"trackingProperties":{"line_index":4,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":180,"rangeEnd":5},{"audioStart":440,"rangeEnd":12},{"audioStart":800,"rangeEnd":18}],"url":"https://stories-cdn.duolingo.com/audio/fcf4f5774301cf3f967605545a1a775225056eb7.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":0},{"hintIndex":1,"rangeFrom":2,"rangeTo":3},{"hintIndex":2,"rangeFrom":5,"rangeTo":10},{"hintIndex":3,"rangeFrom":12,"rangeTo":16}],"hints":["and","I","want","to play"],"text":"Y yo quiero jugar…"}},"trackingProperties":{"line_index":5}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":0,"rangeEnd":7},{"audioStart":430,"rangeEnd":13},{"audioStart":960,"rangeEnd":17},{"audioStart":1110,"rangeEnd":26}],"url":"https://stories-cdn.duolingo.com/audio/a18e5eadb8a7226df26db7b44d4df07f0a8ed93a.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":2,"rangeTo":5},{"hintIndex":1,"rangeFrom":7,"rangeTo":24}],"hints":["but","I have to study"],"text":"… pero tengo que estudiar."}},"trackingProperties":{"line_index":6}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"…study history."},{"hintMap":[],"hints":[],"text":"…take over the world."},{"hintMap":[],"hints":[],"text":"…play a video game."}],"correctAnswerIndex":2,"question":{"hintMap":[],"hints":[],"text":"Junior needs to study English, but he really wants to…"},"trackingProperties":{"line_index":6,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/b603d66652590a597f5952576abeb2a09f355986.svg","characterId":418,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":7},{"audioStart":410,"rangeEnd":9},{"audioStart":440,"rangeEnd":18},{"audioStart":900,"rangeEnd":27},{"audioStart":1970,"rangeEnd":30},{"audioStart":2150,"rangeEnd":36},{"audioStart":2430,"rangeEnd":40},{"audioStart":2740,"rangeEnd":45},{"audioStart":2900,"rangeEnd":52}],"url":"https://stories-cdn.duolingo.com/audio/1066ed4eaa15f172b30c4dc88d5ab4bb3aab1bfc.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":16},{"hintIndex":1,"rangeFrom":18,"rangeTo":23},{"hintIndex":2,"rangeFrom":27,"rangeTo":28},{"hintIndex":3,"rangeFrom":30,"rangeTo":34},{"hintIndex":4,"rangeFrom":36,"rangeTo":50}],"hints":["let's study","together","I","speak","English very well"],"text":"¡Vamos a estudiar juntos! ¡Yo hablo muy bien inglés!"}},"trackingProperties":{"line_index":7}},{"type":"CHALLENGE_PROMPT","prompt":{"hintMap":[],"hints":[],"text":"Tap what you hear"},"trackingProperties":{"line_index":8,"challenge_type":"arrange"}},{"type":"LINE","hideRangesForChallenge":[{"start":1,"end":21}],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/b603d66652590a597f5952576abeb2a09f355986.svg","characterId":418,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":7},{"audioStart":280,"rangeEnd":12},{"audioStart":550,"rangeEnd":15},{"audioStart":710,"rangeEnd":21}],"url":"https://stories-cdn.duolingo.com/audio/5d73a1b7670cf8a869e5c1f3e28edfb0439ed263.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":5},{"hintIndex":1,"rangeFrom":7,"rangeTo":10},{"hintIndex":2,"rangeFrom":12,"rangeTo":13},{"hintIndex":3,"rangeFrom":15,"rangeTo":19}],"hints":["where","is","your","book"],"text":"¿Dónde está tu libro?"}},"trackingProperties":{"line_index":8}},{"type":"ARRANGE","characterPositions":[7,12,15,21],"phraseOrder":[3,2,1,0],"selectablePhrases":["libro","tu","está","Dónde"],"trackingProperties":{"line_index":8,"challenge_type":"arrange"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":3},{"audioStart":360,"rangeEnd":6},{"audioStart":530,"rangeEnd":14}],"url":"https://stories-cdn.duolingo.com/audio/ec334d6fee1e80dc70f3c214e20e714306d07d29.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":4},{"hintIndex":2,"rangeFrom":6,"rangeTo":12}],"hints":["in","my","backpack"],"text":"En mi mochila."}},"trackingProperties":{"line_index":9}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/b603d66652590a597f5952576abeb2a09f355986.svg","characterId":418,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":4},{"audioStart":980,"rangeEnd":10},{"audioStart":1290,"rangeEnd":15},{"audioStart":1540,"rangeEnd":18},{"audioStart":1670,"rangeEnd":26}],"url":"https://stories-cdn.duolingo.com/audio/87f184b0f84ae8f06d179fc26cf407663387c82f.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":0},{"hintIndex":1,"rangeFrom":4,"rangeTo":8},{"hintIndex":2,"rangeFrom":10,"rangeTo":13},{"hintIndex":3,"rangeFrom":15,"rangeTo":24}],"hints":["and","where","is","your backpack"],"text":"Y… ¿dónde está tu mochila?"}},"trackingProperties":{"line_index":10}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":3},{"audioStart":310,"rangeEnd":6},{"audioStart":510,"rangeEnd":14}],"url":"https://stories-cdn.duolingo.com/audio/447bfd53b9dada737b1031d51e837dec9dbaf19e.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":12}],"hints":["at","school"],"text":"En la escuela."}},"trackingProperties":{"line_index":11}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"in his room"},{"hintMap":[],"hints":[],"text":"in Zari's living room"},{"hintMap":[],"hints":[],"text":"at his school"}],"correctAnswerIndex":2,"question":{"hintMap":[],"hints":[],"text":"Where's Junior's backpack?"},"trackingProperties":{"line_index":11,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/b603d66652590a597f5952576abeb2a09f355986.svg","characterId":418,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":9},{"audioStart":1060,"rangeEnd":14},{"audioStart":1380,"rangeEnd":20},{"audioStart":1730,"rangeEnd":22},{"audioStart":1780,"rangeEnd":31},{"audioStart":2280,"rangeEnd":35},{"audioStart":2510,"rangeEnd":38},{"audioStart":2680,"rangeEnd":44}],"url":"https://stories-cdn.duolingo.com/audio/58dc97cbf375ddf25b28dc3e92f25a74c4431abc.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":5},{"hintIndex":1,"rangeFrom":9,"rangeTo":12},{"hintIndex":2,"rangeFrom":14,"rangeTo":29},{"hintIndex":3,"rangeFrom":31,"rangeTo":33},{"hintIndex":4,"rangeFrom":35,"rangeTo":42}],"hints":["Junior","how","we are going to study","without","your book"],"text":"Junior, ¿cómo vamos a estudiar sin tu libro?"}},"trackingProperties":{"line_index":12}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":3},{"audioStart":220,"rangeEnd":7},{"audioStart":530,"rangeEnd":9},{"audioStart":600,"rangeEnd":12},{"audioStart":730,"rangeEnd":21},{"audioStart":1790,"rangeEnd":28},{"audioStart":2500,"rangeEnd":31},{"audioStart":2700,"rangeEnd":37}],"url":"https://stories-cdn.duolingo.com/audio/d42742cd6d8edbcf46bccaf7638e4cb487900e8d.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":5},{"hintIndex":2,"rangeFrom":7,"rangeTo":7},{"hintIndex":3,"rangeFrom":9,"rangeTo":18},{"hintIndex":4,"rangeFrom":21,"rangeTo":26},{"hintIndex":5,"rangeFrom":28,"rangeTo":29},{"hintIndex":6,"rangeFrom":31,"rangeTo":35}],"hints":["you","go","to","school","you look for","my","book"],"text":"Tú vas a la escuela, buscas mi libro…"}},"trackingProperties":{"line_index":13}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/3444bf73abfe20eb6f9de1b5b5103feaa7caaf19.svg","characterId":415,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":0,"rangeEnd":4},{"audioStart":190,"rangeEnd":7},{"audioStart":480,"rangeEnd":13},{"audioStart":900,"rangeEnd":18},{"audioStart":1190,"rangeEnd":21},{"audioStart":1310,"rangeEnd":24},{"audioStart":1550,"rangeEnd":29}],"url":"https://stories-cdn.duolingo.com/audio/5af3ab530fd3d29aa26e4c47c61c6103931d7d94.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":2,"rangeTo":2},{"hintIndex":1,"rangeFrom":4,"rangeTo":5},{"hintIndex":2,"rangeFrom":7,"rangeTo":11},{"hintIndex":3,"rangeFrom":13,"rangeTo":16},{"hintIndex":4,"rangeFrom":18,"rangeTo":19},{"hintIndex":5,"rangeFrom":21,"rangeTo":22},{"hintIndex":6,"rangeFrom":24,"rangeTo":27}],"hints":["and","I","play","here","at","my","house"],"text":"… y yo juego aquí en mi casa."}},"trackingProperties":{"line_index":14}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"buy him a new backpack"},{"hintMap":[],"hints":[],"text":"play video games with him"},{"hintMap":[],"hints":[],"text":"go get his English book while he plays video games"}],"correctAnswerIndex":2,"question":{"hintMap":[],"hints":[],"text":"What does Junior want Zari to do?"},"trackingProperties":{"line_index":14,"challenge_type":"multiple-choice"}},{"type":"MATCH","fallbackHints":[{"phrase":"vas","translation":"go"},{"phrase":"Junior","translation":"Junior"},{"phrase":"necesito","translation":"I need"},{"phrase":"Dónde","translation":"where"},{"phrase":"tengo que estudiar","translation":"I have to study"}],"matches":[{"phrase":"ayuda","translation":"help"},{"phrase":"necesitas","translation":"you need"},{"phrase":"jugar","translation":"to play"},{"phrase":"mochila","translation":"backpack"},{"phrase":"sin","translation":"without"},{"phrase":"buscas","translation":"you look for"},{"phrase":"libro","translation":"book"},{"phrase":"examen","translation":"exam"},{"phrase":"estudiar","translation":"to study"},{"phrase":"importante","translation":"important"},{"phrase":"inglés","translation":"English"},{"phrase":"juntos","translation":"together"},{"phrase":"escuela","translation":"school"},{"phrase":"aquí","translation":"here"},{"phrase":"vas","translation":"you go"}],"prompt":"Tap the pairs","trackingProperties":{"line_index":15,"challenge_type":"match"}}],"learningLanguage":"es","fromLanguage":"en","revision":43,"startTime":1637107754,"illustrations":{"active":"https://stories-cdn.duolingo.com/image/fb16be061ee25cbd89be9a23e762f04047652d7f.svg","gilded":"https://stories-cdn.duolingo.com/image/67c0cf3b25f91fbb2c4a68ac1e11d7517fa1533e.svg","locked":"https://stories-cdn.duolingo.com/image/47ce7a457b235d881018793532050da2927edc76.svg"},"listenModeCharacterIds":[415],"speakModeCharacterIds":[418],"mode":"READ","isListenModeAvailable":false,"isListenModeRequired":false,"fromLanguageName":"The English Test","unspeakableWords":[],"trackingProperties":{"adaptive_difficulty_level":9,"stories_creation_date_epoch":1503518388,"stories_seconds_since_creation":133589366,"first_story":false,"already_completed":false,"story_play_mode":"read","total_stories_completed":323,"completed_story_count":297,"story_max_level":0,"story_set_index":5,"story_id":"es-en-el-examen-de-ingles","story_revision":43,"story_language":"es","cefr_level":"Intro","multipart":false,"session_cefr_level_section":"Intro","session_cefr_level":"Intro"},"trackingConstants":{"maxTimePerLine":30,"maxTimePerChallenge":60}}`;
    jsonXXX = `{"elements":[{"type":"HEADER","illustrationUrl":"https://stories-cdn.duolingo.com/image/a13fae69b40921c2d4f62a0295a19ff0c25d26eb.svg","title":"You Can Talk?","learningLanguageTitleContent":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":8},{"audioStart":650,"rangeEnd":16}],"url":"https://stories-cdn.duolingo.com/audio/f760fe4d79ae16bfc074228ae10d713da86fdcb1.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":13}],"hints":["you can talk"],"text":"¿Puedes hablar? "},"trackingProperties":{}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"PROSE","content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":5},{"audioStart":890,"rangeEnd":13},{"audioStart":1530,"rangeEnd":15},{"audioStart":1620,"rangeEnd":20},{"audioStart":1990,"rangeEnd":23},{"audioStart":2100,"rangeEnd":26},{"audioStart":2270,"rangeEnd":34},{"audioStart":2950,"rangeEnd":37},{"audioStart":3200,"rangeEnd":40},{"audioStart":3460,"rangeEnd":47},{"audioStart":3920,"rangeEnd":50},{"audioStart":4070,"rangeEnd":55}],"url":"https://stories-cdn.duolingo.com/audio/7b41847798ef976aed618045505ed19ddcd29f2c.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":13},{"hintIndex":2,"rangeFrom":15,"rangeTo":18},{"hintIndex":3,"rangeFrom":20,"rangeTo":21},{"hintIndex":4,"rangeFrom":23,"rangeTo":32},{"hintIndex":5,"rangeFrom":34,"rangeTo":35},{"hintIndex":6,"rangeFrom":37,"rangeTo":38},{"hintIndex":7,"rangeFrom":40,"rangeTo":53}],"hints":["Lily","comes back","home","from","her work","in","the","clothing store"],"text":"Lily regresa a casa de su trabajo en la tienda de ropa."}},"trackingProperties":{"line_index":1}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":6},{"audioStart":660,"rangeEnd":14},{"audioStart":1340,"rangeEnd":17},{"audioStart":1410,"rangeEnd":26},{"audioStart":2020,"rangeEnd":36},{"audioStart":2600,"rangeEnd":39},{"audioStart":2710,"rangeEnd":48},{"audioStart":3560,"rangeEnd":53},{"audioStart":4010,"rangeEnd":56},{"audioStart":4140,"rangeEnd":60}],"url":"https://stories-cdn.duolingo.com/audio/a4c427850a39104dc54e717874395eaffd7dc8f2.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":4},{"hintIndex":1,"rangeFrom":6,"rangeTo":12},{"hintIndex":2,"rangeFrom":14,"rangeTo":15},{"hintIndex":3,"rangeFrom":17,"rangeTo":24},{"hintIndex":4,"rangeFrom":26,"rangeTo":46},{"hintIndex":5,"rangeFrom":48,"rangeTo":58}],"hints":["I am","tired","of","hearing","customers' problems","all day"],"text":"Estoy cansada de escuchar problemas de clientes todo el día."}},"trackingProperties":{"line_index":2}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"Yes, that's right."},{"hintMap":[],"hints":[],"text":"No, that's wrong."}],"correctAnswerIndex":1,"question":{"hintMap":[],"hints":[],"text":"Lily thinks her job is perfect."},"trackingProperties":{"line_index":2,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"PROSE","content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":5},{"audioStart":480,"rangeEnd":8},{"audioStart":700,"rangeEnd":15},{"audioStart":1240,"rangeEnd":18},{"audioStart":1440,"rangeEnd":21},{"audioStart":1570,"rangeEnd":27},{"audioStart":2610,"rangeEnd":30},{"audioStart":3000,"rangeEnd":36},{"audioStart":3500,"rangeEnd":42},{"audioStart":3860,"rangeEnd":52}],"url":"https://stories-cdn.duolingo.com/audio/fb9ee510fb06ce29bb601391fa095099a82eba1d.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":13},{"hintIndex":2,"rangeFrom":15,"rangeTo":16},{"hintIndex":3,"rangeFrom":18,"rangeTo":24},{"hintIndex":4,"rangeFrom":27,"rangeTo":34},{"hintIndex":5,"rangeFrom":36,"rangeTo":40},{"hintIndex":6,"rangeFrom":42,"rangeTo":50}],"hints":["she","sits down","on","the sofa","her dog","arrives","walking"],"text":"Ella se sienta en el sofá. Su perro llega caminando."}},"trackingProperties":{"line_index":3}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":6},{"audioStart":1210,"rangeEnd":14},{"audioStart":1900,"rangeEnd":18},{"audioStart":2100,"rangeEnd":25}],"url":"https://stories-cdn.duolingo.com/audio/17f00f9f12c144dd6cd2fef08cab9d94573de8e2.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":6,"rangeTo":16},{"hintIndex":2,"rangeFrom":18,"rangeTo":23}],"hints":["Lily","we have to","(to) talk"],"text":"Lily… Tenemos que hablar."}},"trackingProperties":{"line_index":4}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":0,"rangeEnd":7}],"url":"https://stories-cdn.duolingo.com/audio/bfd1be3d2a37d426600d32de96550ebc0a57bd20.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":2,"rangeTo":4}],"hints":["what"],"text":"¡¿Qué?!"}},"trackingProperties":{"line_index":5}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":12},{"audioStart":880,"rangeEnd":20},{"audioStart":1400,"rangeEnd":28},{"audioStart":2160,"rangeEnd":34},{"audioStart":2790,"rangeEnd":38},{"audioStart":3030,"rangeEnd":43}],"url":"https://stories-cdn.duolingo.com/audio/cc908527de5231b894526ea93e26b60cbe44c743.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":10},{"hintIndex":1,"rangeFrom":12,"rangeTo":18},{"hintIndex":2,"rangeFrom":20,"rangeTo":26},{"hintIndex":3,"rangeFrom":28,"rangeTo":32},{"hintIndex":4,"rangeFrom":34,"rangeTo":41}],"hints":["we need","to change","some","things","around here"],"text":"Necesitamos cambiar algunas cosas por aquí."}},"trackingProperties":{"line_index":6}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"He bought an expensive new watch."},{"hintMap":[],"hints":[],"text":"He needs to go for a walk."},{"hintMap":[],"hints":[],"text":"He wants things to be different."}],"correctAnswerIndex":2,"question":{"hintMap":[],"hints":[],"text":"Wait… what does the dog mean by that?"},"trackingProperties":{"line_index":6,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":8},{"audioStart":650,"rangeEnd":15}],"url":"https://stories-cdn.duolingo.com/audio/eb03dc9ae4ac2109b9af0374b7a73d4893f96101.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":13}],"hints":["you can talk"],"text":"¿Puedes hablar?"}},"trackingProperties":{"line_index":7}},{"type":"CHALLENGE_PROMPT","prompt":{"hintMap":[],"hints":[],"text":"Tap what you hear"},"trackingProperties":{"line_index":8,"challenge_type":"arrange"}},{"type":"LINE","hideRangesForChallenge":[{"start":0,"end":39}],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":6},{"audioStart":680,"rangeEnd":14},{"audioStart":1400,"rangeEnd":17},{"audioStart":1540,"rangeEnd":20},{"audioStart":1670,"rangeEnd":27},{"audioStart":2160,"rangeEnd":32},{"audioStart":2520,"rangeEnd":39}],"url":"https://stories-cdn.duolingo.com/audio/00c17fb09fcd8ed859f8461aef86ec3a92512f77.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":4},{"hintIndex":1,"rangeFrom":6,"rangeTo":12},{"hintIndex":2,"rangeFrom":14,"rangeTo":15},{"hintIndex":3,"rangeFrom":17,"rangeTo":37}],"hints":["I am","tired","of","(the) dog food"],"text":"Estoy cansado de la comida para perros."}},"trackingProperties":{"line_index":8}},{"type":"ARRANGE","characterPositions":[6,14,17,39],"phraseOrder":[2,1,0,3],"selectablePhrases":["de","cansado","Estoy","la comida para perros"],"trackingProperties":{"line_index":8,"challenge_type":"arrange"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":7},{"audioStart":470,"rangeEnd":14},{"audioStart":1360,"rangeEnd":20},{"audioStart":1850,"rangeEnd":24},{"audioStart":2140,"rangeEnd":29}],"url":"https://stories-cdn.duolingo.com/audio/3adacade5102cb653d441726a757930cb0217cff.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":5},{"hintIndex":1,"rangeFrom":7,"rangeTo":12},{"hintIndex":2,"rangeFrom":14,"rangeTo":27}],"hints":["I want","steak","every day"],"text":"Quiero bistec todos los días.","imageUrl":"https://stories-cdn.duolingo.com/image/a2e9e41d36b3e34f9d23911a11123d1235db82c3.svg"}},"trackingProperties":{"line_index":9}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":3},{"audioStart":400,"rangeEnd":12}],"url":"https://stories-cdn.duolingo.com/audio/b1302210f5a4cf5126af18b9b29fb9ca78b7bffb.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":10}],"hints":["I don't understand"],"text":"No entiendo."}},"trackingProperties":{"line_index":10}},{"type":"CHALLENGE_PROMPT","prompt":{"hintMap":[],"hints":[],"text":"What comes next?"},"trackingProperties":{"line_index":11,"challenge_type":"continuation"}},{"type":"LINE","hideRangesForChallenge":[{"start":16,"end":26}],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":710,"rangeEnd":9},{"audioStart":1130,"rangeEnd":16},{"audioStart":2320,"rangeEnd":19},{"audioStart":2570,"rangeEnd":22},{"audioStart":2810,"rangeEnd":27}],"url":"https://stories-cdn.duolingo.com/audio/139ca669197d7f3d8f412af45a7e8f41721aac65.mp3"},"audioPrefix":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":710,"rangeEnd":9},{"audioStart":1130,"rangeEnd":16},{"audioStart":2320,"rangeEnd":19},{"audioStart":2570,"rangeEnd":22},{"audioStart":2810,"rangeEnd":27}],"url":"https://stories-cdn.duolingo.com/audio/2a8da148dba96d65691ae473633e87f14c07ca2f.mp3"},"audioSuffix":{"keypoints":[{"audioStart":0,"rangeEnd":19},{"audioStart":250,"rangeEnd":22},{"audioStart":490,"rangeEnd":27}],"url":"https://stories-cdn.duolingo.com/audio/02989b606c2ff82482e0c9c05dc0a8d40f2c7b91.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":0},{"hintIndex":1,"rangeFrom":2,"rangeTo":7},{"hintIndex":2,"rangeFrom":9,"rangeTo":14},{"hintIndex":3,"rangeFrom":16,"rangeTo":17},{"hintIndex":4,"rangeFrom":19,"rangeTo":20},{"hintIndex":5,"rangeFrom":22,"rangeTo":25}],"hints":["and","I want","to sleep","on","your","bed"],"text":"Y quiero dormir en tu cama."}},"trackingProperties":{"line_index":11}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":9}],"hints":["on","the moon"],"text":"en la luna"},{"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":12}],"hints":["at","work"],"text":"en el trabajo"},{"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":4},{"hintIndex":2,"rangeFrom":6,"rangeTo":9}],"hints":["on","your","bed"],"text":"en tu cama"}],"correctAnswerIndex":2,"trackingProperties":{"line_index":11,"challenge_type":"continuation"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":3},{"audioStart":440,"rangeEnd":10},{"audioStart":910,"rangeEnd":17},{"audioStart":1570,"rangeEnd":20},{"audioStart":1840,"rangeEnd":23},{"audioStart":2080,"rangeEnd":32}],"url":"https://stories-cdn.duolingo.com/audio/5d3be0b746bb5b413793a0af9e0104d8c1ef40ed.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":3,"rangeTo":8},{"hintIndex":2,"rangeFrom":10,"rangeTo":15},{"hintIndex":3,"rangeFrom":17,"rangeTo":18},{"hintIndex":4,"rangeFrom":20,"rangeTo":21},{"hintIndex":5,"rangeFrom":23,"rangeTo":30}],"hints":["you","can","(to) sleep","on","my","pillow"],"text":"Tú puedes dormir en mi almohada."}},"trackingProperties":{"line_index":12}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":2},{"audioStart":0,"rangeEnd":9},{"audioStart":860,"rangeEnd":12}],"url":"https://stories-cdn.duolingo.com/audio/8790c8ae3cf96ad400f72e6e59c2a5202606992b.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":2,"rangeTo":4},{"hintIndex":1,"rangeFrom":9,"rangeTo":10}],"hints":["what","no"],"text":"¡¿Qué?! ¡No!"}},"trackingProperties":{"line_index":13}},{"type":"CHALLENGE_PROMPT","prompt":{"hintMap":[],"hints":[],"text":"Select the missing phrase"},"trackingProperties":{"line_index":14,"challenge_type":"select-phrases"}},{"type":"LINE","hideRangesForChallenge":[{"start":10,"end":26}],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/cf69dae61625845b78327b1108e5bb5ad626be39.svg","characterId":58,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":10},{"audioStart":1050,"rangeEnd":20},{"audioStart":1680,"rangeEnd":27},{"audioStart":1980,"rangeEnd":34}],"url":"https://stories-cdn.duolingo.com/audio/8d5f4d41183f676e79692aeb699cc13a1bdaa584.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":8},{"hintIndex":1,"rangeFrom":10,"rangeTo":25},{"hintIndex":2,"rangeFrom":27,"rangeTo":32}],"hints":["then","do you prefer to sleep","outside"],"text":"¿Entonces prefieres dormir afuera?"}},"trackingProperties":{"line_index":14}},{"type":"SELECT_PHRASE","answers":["te vienes a dormir","prefieres dormir","prefieres morir"],"correctAnswerIndex":1,"trackingProperties":{"line_index":14,"challenge_type":"select-phrases"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":6},{"audioStart":350,"rangeEnd":9},{"audioStart":530,"rangeEnd":15},{"audioStart":860,"rangeEnd":23},{"audioStart":1290,"rangeEnd":30}],"url":"https://stories-cdn.duolingo.com/audio/a71836f77ae0f5b50b16893a21f6589d1947acb4.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":4},{"hintIndex":1,"rangeFrom":6,"rangeTo":7},{"hintIndex":2,"rangeFrom":9,"rangeTo":13},{"hintIndex":3,"rangeFrom":15,"rangeTo":21},{"hintIndex":4,"rangeFrom":23,"rangeTo":28}],"hints":["but","you","never","sleep","outside"],"text":"¡Pero tú nunca duermes afuera!"}},"trackingProperties":{"line_index":15}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"PROSE","content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":5},{"audioStart":700,"rangeEnd":8},{"audioStart":890,"rangeEnd":18},{"audioStart":1540,"rangeEnd":30},{"audioStart":3100,"rangeEnd":35},{"audioStart":3420,"rangeEnd":38},{"audioStart":3630,"rangeEnd":44},{"audioStart":4100,"rangeEnd":49},{"audioStart":4520,"rangeEnd":59},{"audioStart":5200,"rangeEnd":62},{"audioStart":5310,"rangeEnd":65},{"audioStart":5470,"rangeEnd":70}],"url":"https://stories-cdn.duolingo.com/audio/38086743510e2348dc3cb0ce00c1f6d83a174826.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":16},{"hintIndex":2,"rangeFrom":18,"rangeTo":27},{"hintIndex":3,"rangeFrom":30,"rangeTo":33},{"hintIndex":4,"rangeFrom":35,"rangeTo":42},{"hintIndex":5,"rangeFrom":44,"rangeTo":57},{"hintIndex":6,"rangeFrom":59,"rangeTo":60},{"hintIndex":7,"rangeFrom":62,"rangeTo":68}],"hints":["Lily","wakes up","worried","but","her dog","is sleeping","on","the floor"],"text":"Lily se despierta preocupada, pero su perro está durmiendo en el piso."}},"trackingProperties":{"line_index":16}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"PROSE","content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":5},{"audioStart":870,"rangeEnd":8},{"audioStart":1230,"rangeEnd":12}],"url":"https://stories-cdn.duolingo.com/audio/8608e66f587a1e4b54cf40d911eb8d677a4dd6e9.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":10}],"hints":["Lily","laughs"],"text":"Lily se ríe."}},"trackingProperties":{"line_index":17}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/baff6e45d4f21e6947932fddf27ba76b5a6c58e9.svg","characterId":416,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":8},{"audioStart":550,"rangeEnd":12},{"audioStart":700,"rangeEnd":15},{"audioStart":890,"rangeEnd":23},{"audioStart":1600,"rangeEnd":26},{"audioStart":1680,"rangeEnd":31},{"audioStart":1970,"rangeEnd":37},{"audioStart":2310,"rangeEnd":44},{"audioStart":2740,"rangeEnd":53}],"url":"https://stories-cdn.duolingo.com/audio/02b0adf52a733fe40789385294fe097a00036d59.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":6},{"hintIndex":1,"rangeFrom":8,"rangeTo":10},{"hintIndex":2,"rangeFrom":12,"rangeTo":13},{"hintIndex":3,"rangeFrom":15,"rangeTo":21},{"hintIndex":4,"rangeFrom":23,"rangeTo":35},{"hintIndex":5,"rangeFrom":37,"rangeTo":51}],"hints":["it seems","that","my","job","is giving me","strange dreams"],"text":"¡Parece que mi trabajo me está dando sueños extraños!"}},"trackingProperties":{"line_index":18}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"…she realized it was just a dream."},{"hintMap":[],"hints":[],"text":"…he was only giving her a kiss."},{"hintMap":[],"hints":[],"text":"…he wanted to keep it a secret."}],"correctAnswerIndex":0,"question":{"hintMap":[],"hints":[],"text":"Lily thought her dog could talk, but…"},"trackingProperties":{"line_index":18,"challenge_type":"multiple-choice"}},{"type":"MATCH","fallbackHints":[{"phrase":"hablar","translation":"talk"},{"phrase":"No entiendo","translation":"I don't understand"},{"phrase":"en","translation":"in"},{"phrase":"está durmiendo","translation":"is sleeping"},{"phrase":"cama","translation":"bed"}],"matches":[{"phrase":"almohada","translation":"pillow"},{"phrase":"se ríe","translation":"she laughs"},{"phrase":"sueños","translation":"dreams"},{"phrase":"extraños","translation":"strange"},{"phrase":"regresa","translation":"she comes back"},{"phrase":"perro","translation":"dog"},{"phrase":"cansada","translation":"tired"},{"phrase":"clientes","translation":"customers"},{"phrase":"todo el día","translation":"all day"},{"phrase":"tenemos que hablar","translation":"we have to talk"},{"phrase":"cambiar","translation":"to change"},{"phrase":"bistec","translation":"steak"},{"phrase":"no entiendo","translation":"I don't understand"},{"phrase":"cama","translation":"bed"},{"phrase":"dormir","translation":"to sleep"}],"prompt":"Tap the pairs","trackingProperties":{"line_index":19,"challenge_type":"match"}}],"learningLanguage":"es","fromLanguage":"en","revision":52,"startTime":1638841695,"illustrations":{"active":"https://stories-cdn.duolingo.com/image/a13fae69b40921c2d4f62a0295a19ff0c25d26eb.svg","gilded":"https://stories-cdn.duolingo.com/image/365321c14985a374bbbef64ce89cea3b659d55e7.svg","locked":"https://stories-cdn.duolingo.com/image/469d9652f4082befc1b9b0ccaae169bc98738ba0.svg"},"listenModeCharacterIds":[58],"speakModeCharacterIds":[58],"mode":"READ","isListenModeAvailable":false,"isListenModeRequired":false,"fromLanguageName":"You Can Talk?","unspeakableWords":[],"showPromptsInTargetLanguage":false,"trackingProperties":{"adaptive_difficulty_level":9,"stories_creation_date_epoch":1503518388,"stories_seconds_since_creation":135323307,"first_story":false,"already_completed":true,"story_play_mode":"read","total_stories_completed":323,"completed_story_count":297,"story_max_level":3,"story_set_index":21,"story_id":"es-en-puedes-hablar","story_revision":52,"story_language":"es","cefr_level":"A2.1","multipart":false,"session_cefr_level_section":"A2.1","session_cefr_level":"A2"},"trackingConstants":{"maxTimePerLine":30,"maxTimePerChallenge":60}}`
//jsonXXX = `{"elements":[{"type":"HEADER","illustrationUrl":"https://stories-cdn.duolingo.com/image/783305780a6dad8e0e4eb34109d948e6a5fc2c35.svg","title":"Good Morning","learningLanguageTitleContent":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":7},{"audioStart":660,"rangeEnd":11}],"url":"https://stories-cdn.duolingo.com/audio/2a908f3ba86ab305fda8e6fbbf5b0fe25243af6f.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":10}],"hints":["good morning"],"text":"Buenos días"},"trackingProperties":{}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":8},{"audioStart":620,"rangeEnd":14},{"audioStart":1360,"rangeEnd":20}],"url":"https://stories-cdn.duolingo.com/audio/f705ed36518b48b3243c2a48334311d77c4e62e0.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":11},{"hintIndex":1,"rangeFrom":14,"rangeTo":18}],"hints":["good morning","Priti"],"text":"¡Buenos días, Priti!"}},"trackingProperties":{"line_index":1}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":7},{"audioStart":580,"rangeEnd":13},{"audioStart":1090,"rangeEnd":16},{"audioStart":1250,"rangeEnd":21}],"url":"https://stories-cdn.duolingo.com/audio/5eedf508be7abaa31ae05328f301f6d064a72d23.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":10},{"hintIndex":1,"rangeFrom":13,"rangeTo":14},{"hintIndex":2,"rangeFrom":16,"rangeTo":19}],"hints":["good morning","my","love"],"text":"Buenos días, mi amor."}},"trackingProperties":{"line_index":2}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":7},{"audioStart":540,"rangeEnd":13},{"audioStart":1180,"rangeEnd":17},{"audioStart":1480,"rangeEnd":24}],"url":"https://stories-cdn.duolingo.com/audio/a579989a48c1c55200897275dba2b43c06f05422.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":5},{"hintIndex":1,"rangeFrom":7,"rangeTo":11},{"hintIndex":2,"rangeFrom":13,"rangeTo":15},{"hintIndex":3,"rangeFrom":17,"rangeTo":22}],"hints":["where","are","my","keys"],"text":"¿Dónde están mis llaves?"}},"trackingProperties":{"line_index":3}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":5},{"audioStart":560,"rangeEnd":12}],"url":"https://stories-cdn.duolingo.com/audio/d14149aba294108c6eaa11018e82ee11fd0ab6c4.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":10}],"hints":["your","keys"],"text":"¿Tus llaves?"}},"trackingProperties":{"line_index":4}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"No, that's wrong."},{"hintMap":[],"hints":[],"text":"Yes, that's right."}],"correctAnswerIndex":1,"question":{"hintMap":[],"hints":[],"text":"Priti can't find her keys."},"trackingProperties":{"line_index":4,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":4},{"audioStart":880,"rangeEnd":13},{"audioStart":1890,"rangeEnd":16},{"audioStart":2050,"rangeEnd":19},{"audioStart":2190,"rangeEnd":27}],"url":"https://stories-cdn.duolingo.com/audio/b95deb808341416ed3dba0aeab4539f691b2a35e.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":4,"rangeTo":11},{"hintIndex":2,"rangeFrom":13,"rangeTo":14},{"hintIndex":3,"rangeFrom":16,"rangeTo":17},{"hintIndex":4,"rangeFrom":19,"rangeTo":25}],"hints":["yes","I need","to go","to","work"],"text":"Sí, necesito ir al trabajo."}},"trackingProperties":{"line_index":5}},{"type":"CHALLENGE_PROMPT","prompt":{"hintMap":[],"hints":[],"text":"Tap what you hear"},"trackingProperties":{"line_index":6,"challenge_type":"arrange"}},{"type":"LINE","hideRangesForChallenge":[{"start":1,"end":33}],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":10},{"audioStart":1050,"rangeEnd":14},{"audioStart":1260,"rangeEnd":21},{"audioStart":1690,"rangeEnd":24},{"audioStart":1790,"rangeEnd":27},{"audioStart":1980,"rangeEnd":33}],"url":"https://stories-cdn.duolingo.com/audio/9e5494fca99148cdea6bde7a38bdb01a9c8740c4.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":8},{"hintIndex":1,"rangeFrom":10,"rangeTo":19},{"hintIndex":2,"rangeFrom":21,"rangeTo":22},{"hintIndex":3,"rangeFrom":24,"rangeTo":25},{"hintIndex":4,"rangeFrom":27,"rangeTo":31}],"hints":["I need","the keys","of","my","car"],"text":"¡Necesito las llaves de mi carro!"}},"trackingProperties":{"line_index":6}},{"type":"ARRANGE","characterPositions":[10,21,24,27,33],"phraseOrder":[4,0,2,1,3],"selectablePhrases":["las llaves","mi","de","carro","Necesito"],"trackingProperties":{"line_index":6,"challenge_type":"arrange"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":5},{"audioStart":450,"rangeEnd":10},{"audioStart":1270,"rangeEnd":17},{"audioStart":2340,"rangeEnd":21},{"audioStart":2580,"rangeEnd":28},{"audioStart":3050,"rangeEnd":34},{"audioStart":3470,"rangeEnd":39},{"audioStart":4360,"rangeEnd":42},{"audioStart":4580,"rangeEnd":45},{"audioStart":4810,"rangeEnd":52},{"audioStart":5820,"rangeEnd":56},{"audioStart":6210,"rangeEnd":60},{"audioStart":6520,"rangeEnd":63}],"url":"https://stories-cdn.duolingo.com/audio/3621f7d27af3d8a13eb6975910ff614829ddf0d7.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":2},{"hintIndex":1,"rangeFrom":5,"rangeTo":6},{"hintIndex":2,"rangeFrom":10,"rangeTo":14},{"hintIndex":3,"rangeFrom":17,"rangeTo":19},{"hintIndex":4,"rangeFrom":21,"rangeTo":26},{"hintIndex":5,"rangeFrom":28,"rangeTo":32},{"hintIndex":6,"rangeFrom":34,"rangeTo":37},{"hintIndex":7,"rangeFrom":39,"rangeTo":40},{"hintIndex":8,"rangeFrom":42,"rangeTo":43},{"hintIndex":9,"rangeFrom":45,"rangeTo":48},{"hintIndex":10,"rangeFrom":52,"rangeTo":53},{"hintIndex":11,"rangeFrom":56,"rangeTo":57},{"hintIndex":12,"rangeFrom":60,"rangeTo":61}],"hints":["ha","ha","Priti","your","keys","are","here","on","the","table","ha","ha","ha"],"text":"¡Ja, ja! ¡Priti, tus llaves están aquí en la mesa! ¡Ja, ja, ja!"}},"trackingProperties":{"line_index":7}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":8},{"audioStart":740,"rangeEnd":11},{"audioStart":920,"rangeEnd":17},{"audioStart":1370,"rangeEnd":23},{"audioStart":1760,"rangeEnd":33},{"audioStart":3140,"rangeEnd":41},{"audioStart":3770,"rangeEnd":47}],"url":"https://stories-cdn.duolingo.com/audio/786712946dc29b6d92763191447c55aaf64cbe65.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":5},{"hintIndex":1,"rangeFrom":8,"rangeTo":9},{"hintIndex":2,"rangeFrom":11,"rangeTo":14},{"hintIndex":3,"rangeFrom":17,"rangeTo":21},{"hintIndex":4,"rangeFrom":23,"rangeTo":29},{"hintIndex":5,"rangeFrom":33,"rangeTo":39},{"hintIndex":6,"rangeFrom":41,"rangeTo":45}],"hints":["sorry","my","love","I am","tired","I work","a lot"],"text":"Perdón, mi amor, estoy cansada. ¡Trabajo mucho!"}},"trackingProperties":{"line_index":8}},{"type":"POINT_TO_PHRASE","correctAnswerIndex":2,"transcriptParts":[{"selectable":true,"text":"Perdón"},{"selectable":false,"text":", "},{"selectable":false,"text":"mi"},{"selectable":false,"text":" "},{"selectable":false,"text":"amor"},{"selectable":false,"text":", "},{"selectable":true,"text":"estoy"},{"selectable":false,"text":" "},{"selectable":true,"text":"cansada"},{"selectable":false,"text":". ¡"},{"selectable":true,"text":"Trabajo"},{"selectable":false,"text":" "},{"selectable":false,"text":"mucho"},{"selectable":false,"text":"!"}],"question":{"hintMap":[],"hints":[],"text":"Choose the option that means \\"tired.\\""},"trackingProperties":{"line_index":8,"challenge_type":"point-to-phrase"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":9},{"audioStart":580,"rangeEnd":14}],"url":"https://stories-cdn.duolingo.com/audio/79dcfa75f413029f200d0dc56d468d2963c1321d.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":7},{"hintIndex":1,"rangeFrom":9,"rangeTo":12}],"hints":["do you want","coffee"],"text":"¿Quieres café?"}},"trackingProperties":{"line_index":9}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":5},{"audioStart":540,"rangeEnd":9},{"audioStart":760,"rangeEnd":15}],"url":"https://stories-cdn.duolingo.com/audio/3b79beab34fb14e6886f132a1a03df246920bbff.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":2},{"hintIndex":1,"rangeFrom":5,"rangeTo":13}],"hints":["yes","please"],"text":"¡Sí, por favor!"}},"trackingProperties":{"line_index":10}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":5},{"audioStart":340,"rangeEnd":11},{"audioStart":810,"rangeEnd":14},{"audioStart":990,"rangeEnd":19}],"url":"https://stories-cdn.duolingo.com/audio/5180f851e3ffd315b707b743625d1a0ef54bac6e.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":8},{"hintIndex":2,"rangeFrom":11,"rangeTo":12},{"hintIndex":3,"rangeFrom":14,"rangeTo":17}],"hints":["here","it is","my","love"],"text":"Aquí está, mi amor."}},"trackingProperties":{"line_index":11}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":7},{"audioStart":480,"rangeEnd":12},{"audioStart":1000,"rangeEnd":15},{"audioStart":1180,"rangeEnd":23},{"audioStart":2550,"rangeEnd":27},{"audioStart":3160,"rangeEnd":32},{"audioStart":3540,"rangeEnd":37}],"url":"https://stories-cdn.duolingo.com/audio/13f9d309e9fd51b1eb603635e810d76e1f838186.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":5},{"hintIndex":1,"rangeFrom":7,"rangeTo":10},{"hintIndex":2,"rangeFrom":12,"rangeTo":13},{"hintIndex":3,"rangeFrom":15,"rangeTo":20},{"hintIndex":4,"rangeFrom":23,"rangeTo":24},{"hintIndex":5,"rangeFrom":27,"rangeTo":30},{"hintIndex":6,"rangeFrom":32,"rangeTo":35}],"hints":["where","is","the","sugar","oh","here","it is"],"text":"¿Dónde está el azúcar? Ah, aquí está."}},"trackingProperties":{"line_index":12}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"looking for some sugar for her coffee"},{"hintMap":[],"hints":[],"text":"pouring her coffee on the table"},{"hintMap":[],"hints":[],"text":"putting sugar on her keys"}],"correctAnswerIndex":0,"question":{"hintMap":[],"hints":[],"text":"Hmm… what is Priti doing?"},"trackingProperties":{"line_index":12,"challenge_type":"multiple-choice"}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"PROSE","content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":5},{"audioStart":730,"rangeEnd":10},{"audioStart":1180,"rangeEnd":13},{"audioStart":1350,"rangeEnd":18}],"url":"https://stories-cdn.duolingo.com/audio/c5571afc9964bfcee0c3b7cd5505da92b163bb66.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":8},{"hintIndex":2,"rangeFrom":10,"rangeTo":11},{"hintIndex":3,"rangeFrom":13,"rangeTo":16}],"hints":["she","drinks","her","coffee"],"text":"Ella bebe su café."}},"trackingProperties":{"line_index":13}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":5},{"audioStart":580,"rangeEnd":8}],"url":"https://stories-cdn.duolingo.com/audio/a082acb4a67cded220e816c062751663661b190e.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":2},{"hintIndex":1,"rangeFrom":5,"rangeTo":6}],"hints":["oh","no"],"text":"¡Ay, no!"}},"trackingProperties":{"line_index":14}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":5}],"url":"https://stories-cdn.duolingo.com/audio/d97a4860c0fba5ae35f0cd9a84faf41892d7a029.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":3}],"hints":["what"],"text":"¿Qué?"}},"trackingProperties":{"line_index":15}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":5},{"audioStart":630,"rangeEnd":8},{"audioStart":870,"rangeEnd":12}],"url":"https://stories-cdn.duolingo.com/audio/e58ba2ebc49b2b261a2afc3547db3a176c18c7d9.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":3},{"hintIndex":1,"rangeFrom":5,"rangeTo":6},{"hintIndex":2,"rangeFrom":8,"rangeTo":10}],"hints":["that","is","salt"],"text":"¡Eso es sal!"}},"trackingProperties":{"line_index":16}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/7074d00522c0be6307e3e405f503699a99d2121e.svg","characterId":593,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":1},{"audioStart":0,"rangeEnd":8},{"audioStart":1220,"rangeEnd":14},{"audioStart":1730,"rangeEnd":18},{"audioStart":2330,"rangeEnd":26}],"url":"https://stories-cdn.duolingo.com/audio/cc56b7e489f1b9695abb93de3e4a6e29fa5f4ed5.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":1,"rangeTo":5},{"hintIndex":1,"rangeFrom":8,"rangeTo":12},{"hintIndex":2,"rangeFrom":14,"rangeTo":16},{"hintIndex":3,"rangeFrom":18,"rangeTo":24}],"hints":["Priti","you are","very","tired"],"text":"¡Priti, estás muy cansada!"}},"trackingProperties":{"line_index":17}},{"type":"LINE","hideRangesForChallenge":[],"line":{"type":"CHARACTER","avatarUrl":"https://stories-cdn.duolingo.com/image/2b2b64afe0c2af19eed8ac69c36cb8803d0a090e.svg","characterId":560,"content":{"audio":{"keypoints":[{"audioStart":0,"rangeEnd":4},{"audioStart":940,"rangeEnd":13},{"audioStart":1770,"rangeEnd":17},{"audioStart":2020,"rangeEnd":24},{"audioStart":3090,"rangeEnd":28},{"audioStart":3320,"rangeEnd":36},{"audioStart":4530,"rangeEnd":39},{"audioStart":4880,"rangeEnd":43},{"audioStart":5070,"rangeEnd":47}],"url":"https://stories-cdn.duolingo.com/audio/03dc8d4dd4cc42d80d235baf258be5a1a113f090.mp3"},"hintMap":[{"hintIndex":0,"rangeFrom":0,"rangeTo":1},{"hintIndex":1,"rangeFrom":4,"rangeTo":11},{"hintIndex":2,"rangeFrom":13,"rangeTo":15},{"hintIndex":3,"rangeFrom":17,"rangeTo":20},{"hintIndex":4,"rangeFrom":24,"rangeTo":26},{"hintIndex":5,"rangeFrom":28,"rangeTo":33},{"hintIndex":6,"rangeFrom":36,"rangeTo":37},{"hintIndex":7,"rangeFrom":39,"rangeTo":41},{"hintIndex":8,"rangeFrom":43,"rangeTo":45}],"hints":["yes","I need","more","coffee","with","sugar","not","with","salt"],"text":"Sí, necesito más café… ¡con azúcar, no con sal!"}},"trackingProperties":{"line_index":18}},{"type":"MULTIPLE_CHOICE","answers":[{"hintMap":[],"hints":[],"text":"…she put salt in her coffee."},{"hintMap":[],"hints":[],"text":"…she fell asleep in the kitchen."},{"hintMap":[],"hints":[],"text":"…she put her keys in her coffee."}],"correctAnswerIndex":0,"question":{"hintMap":[],"hints":[],"text":"Priti was so tired that…"},"trackingProperties":{"line_index":18,"challenge_type":"multiple-choice"}},{"type":"MATCH","fallbackHints":[{"phrase":"las llaves","translation":"the keys"},{"phrase":"al","translation":"to"},{"phrase":"café","translation":"coffee"},{"phrase":"Dónde","translation":"where"},{"phrase":"cansada","translation":"tired"}],"matches":[{"phrase":"cansada","translation":"tired"},{"phrase":"quieres","translation":"you want"},{"phrase":"llaves","translation":"keys"},{"phrase":"amor","translation":"love"},{"phrase":"buenos días","translation":"good morning"},{"phrase":"carro","translation":"car"},{"phrase":"perdón","translation":"sorry"},{"phrase":"trabajo","translation":"work"},{"phrase":"necesito","translation":"I need"},{"phrase":"mesa","translation":"table"},{"phrase":"café","translation":"coffee"},{"phrase":"por favor","translation":"please"},{"phrase":"sal","translation":"salt"},{"phrase":"aquí","translation":"here"},{"phrase":"azúcar","translation":"sugar"}],"prompt":"Tap the pairs","trackingProperties":{"line_index":19,"challenge_type":"match"}}],"learningLanguage":"es","fromLanguage":"en","revision":60,"startTime":1638936282,"illustrations":{"active":"https://stories-cdn.duolingo.com/image/783305780a6dad8e0e4eb34109d948e6a5fc2c35.svg","gilded":"https://stories-cdn.duolingo.com/image/344e43fc1b8fe4c6370f1095bd773e4478334436.svg","locked":"https://stories-cdn.duolingo.com/image/1b8b6e50c91ec2cec781fae14746e9f6014342f0.svg"},"listenModeCharacterIds":[560],"speakModeCharacterIds":[560],"mode":"READ","isListenModeAvailable":false,"isListenModeRequired":false,"fromLanguageName":"Good Morning","unspeakableWords":[],"showPromptsInTargetLanguage":false,"trackingProperties":{"adaptive_difficulty_level":9,"stories_creation_date_epoch":1503518388,"stories_seconds_since_creation":135417894,"first_story":false,"already_completed":true,"story_play_mode":"read","total_stories_completed":323,"completed_story_count":297,"story_max_level":3,"story_set_index":0,"story_id":"es-en-buenos-dias","story_revision":60,"story_language":"es","cefr_level":"Intro","multipart":false,"session_cefr_level_section":"Intro","session_cefr_level":"Intro"},"trackingConstants":{"maxTimePerLine":30,"maxTimePerChallenge":60}}`
    let text_ = JSON.parse(jsonXXX)
    processStory(text_)

    let text2 = JSON.stringify(text_, null, 2);
    console.log(text2)
    fs.writeFile("story_raw.json", text2, (e) => {
        console.log(e, "saved")
    });
}
async function import_old() {
    let processed = [43, 56, 79, 50, 103
//        43,   56,  79,   50,  103, 570,  623,
//        634, 1004, 934,  913,  923, 924,   66,
//        569,  974,  99, 1278, 1139,  46, 1242,
//        1249, 1301,  16,   18,   28,  45,   57,
//        63,   69,  41,    1, 1003, 911,   35
    ]

    let courses = await (await fetch("https://carex.uber.space/stories/backend/stories/get_courses.php")).json();

    for(let course of courses) {
        if(course.learningLanguage === "zh" || course.learningLanguage === "nl" ||
            (course.learningLanguage === "es" && course.fromLanguage === "en") ||
            (course.learningLanguage === "fr" && course.fromLanguage === "en") ||
            (course.learningLanguage === "fr" && course.fromLanguage === "es") ||
            (course.learningLanguage === "en" && course.learningLanguage === "es"))
            continue
        if(course.learningLanguage === "ru")
            continue
        let avatars = await getAvatars(course.id);
        let avatar_names = {}
        for (let avatar of avatars) {
            avatar_names[avatar.avatar_id] = avatar;
        }
        let avatars_new = [];
        let images = [];
        let avatar_id_from_image = {};
        avatar_id_from_image_global = avatar_id_from_image
        for (let avatar of avatars) {
            if (images.indexOf(avatar.link) === -1) {
                avatars_new.push(avatar);
                images.push(avatar.link);
                avatar_id_from_image[avatar.link] = avatar.avatar_id;
            }
        }
        let course_id = course.id;
        let res = await fetch(`https://carex.uber.space/stories/backend/stories/get_list.php?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`);
        let stories = await res.json();
        for (let story of stories) {
            //if(story.id === 573)
            //    continue
            if (processed.indexOf(story.id) !== -1)
                continue

            console.log("----", story.id, course.learningLanguage)
            console.log(story)
            if(story.api === 2)
                continue
            let res = await fetch(`https://carex.uber.space/stories/backend/stories/get_story_json.php?id=${story.id}`);
            let json = await res.json();
            let res2 = await fetch(`https://carex.uber.space/stories/backend/stories/get_story.php?id=${story.id}`);
            let json2 = await res2.json();

            console.log("write")
            fs.writeFileSync("/home/richard/Dropbox/unofficial-duolingo-stories/editor-app/story_compare0.txt", json2[0].text);
            fs.writeFileSync("/home/richard/Dropbox/unofficial-duolingo-stories/editor-app/story_compare1.txt", JSON.stringify(json, null, 2));

            if (json.elements[json.elements.length - 1].prompt === "")
                json.elements[json.elements.length - 1].prompt = "Tap the pairs."

            let text = processStory(json, story.set_id, story.set_index, json2[0].text, [], avatar_id_from_image)
            //console.log(text);
            //text = text.replace(/​/g, "|");

            console.log("processed =", processed)
            console.log("----", story.id) // TODO look at 974, 1249, 63, 69, 35, 1281

            console.log(json2[0])
            console.log(json)

            let data = {
                id: story.id,
                name: story.name_base,
                author: json2[0].author,
                image: story.image.match(/image\/(.*).svg/) ? story.image.match(/image\/(.*).svg/)[1] : story.image,
                set_id: story.set_id,
                set_index: story.set_index,
                course_id: course_id,
                text: text,
                json: JSON.stringify(json),
            }
            if (story.duo_id)
                data.duo_id = story.duo_id;
            //if([43, 56, 79, 570, 634, 924, 569, 974, 99, 46, 1249, 1301, 16, 18, 63, 69, 1,
            //   1003, 35, 1281].indexOf(story.id) === -1)
                //compare_stories(json, text, story.id, avatar_names, avatar_id_from_image)
            //exit()
            processed.push(story.id)
            console.log(data)
            console.log("-----------------upload")
            try {
                let res = await fetch_post(`https://carex.uber.space/stories/backend/editor/set.php?action=story`, data);
                res = await res.text()
                console.log(res);
            } catch (e) {
                console.log(e)
            }
            //exit()
            //return
        }
    }

}
try {
    test();
    //import_old();
}
catch (e) {
    console.log(e)
}

//import fetch from "node-fetch";
import {FormData} from "formdata-node"

async function fetch_post(url, data) {
    /** like fetch but with post instead of get */
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for (var i in data) {
        fd.append(i, data[i]);
    }
    var res = fetch(url, {
        method: "POST",
        body: fd,
        mode: "cors"
    })
    return res
}