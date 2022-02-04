function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    if(keep_tilde)
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
        return text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    else
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
        return text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
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
        if(i%2 === 0 && trans_list[i] && trans_list[i] !== "~") {
            hintMap.push({hintIndex: hints.length, rangeFrom: text_pos, rangeTo: text_pos+text_list[i].length-1});
            hints.push(trans_list[i].replace(/~/g, " ").replace(/\|/g, "â€‹"));
        }
        text_pos += text_list[i].length;
    }
    return {text:text, hints:hints, hintMap:hintMap};
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
    for (let line of text.split("\n")) {
        // ignore empty lines or lines with comments (and remove rtl isolate)
        line = line.trim().replace(/\u2067/, "");
        if (line.length === 0 || line.substr(0, 1) === "#")
            continue;

        lines.push(line);
    }
    return lines
}

function group_lines(lines) {
    /* group list of lines into blocks */
    let groups = [];
    for(let line of lines) {
        if(line.startsWith("[")) {
            groups.push([line.substr(1, line.length-2), []]);
        }
        else if(line.startsWith("~")) {
            groups[groups.length - 1][1][groups[groups.length - 1][1].length-1][1] = line;
        }
        else {
            groups[groups.length - 1][1].push([line, undefined]);
        }
    }
    return groups
}

function speaker_text_trans(line) {
    console.log("speakertext", line[0])
    let [, speaker, text] = line[0].match(/\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S)\s*/);
    let translation = "";
    if(line[1])
        [, translation] = line[1].match(/\s*~\s*(\S.*\S)\s*/);
    let content = generateHintMap(getInputStringText(text), translation);
    return [speaker, content];
}

function parseGroup(group) {
    let [name, lines] = group;
    console.log(name);
    if(name === "HEADER") {
        let [speaker, content] = speaker_text_trans(lines[0]);
        return {"type": "HEADER", "learningLanguageTitleContent": content}
    }
    else if(name === "LINE") {
        let [speaker, content] = speaker_text_trans(lines[0]);
        if(speaker === undefined)
            return {"type": "LINE", "line": {"type": "PROSE", "content": content}}
        else
            return {"type": "LINE", "line": {"type": "CHARACTER",
                    "avatarUrl": "",  // TODO
                    "characterId": 0, // TODO
                    "content": content}}
    }
    else if(name === "MULTIPLE_CHOICE") {
        let [speaker, content] = speaker_text_trans(lines[0]);
        let answer_lines = lines.splice(1);
        let answers = [];
        let correct_answer = 0;
        for(let i in answer_lines) {
            let [speaker, content] = speaker_text_trans(answer_lines[i]);
            if(answer_lines[i][0].startsWith("+"))
                correct_answer = parseInt(i);
            answers.push(content);
        }
        return {"type": "MULTIPLE_CHOICE", "question": content, "answers": answers, correctAnswerIndex: correct_answer}
    }
    else if(name === "MATCH") {
        let [speaker, content] = speaker_text_trans(lines[0]);
        let answer_lines = lines.splice(1);
        let answers = [];
        let correct_answer = 0;
        for(let i in answer_lines) {
            let [, word1, word2] = answer_lines[i][0].match(/-\s*(\S.*\S)\s*<>\s*(\S.*\S)\s*/)
            answers.push({"phrase": word1, "translation": word2});
        }
        return {"type": "MATCH", "prompt": lines[0], "fallbackHints": answers}
    }
}

function processStoryFile(text) {
    let phrases = [];

    let lines = split_lines(text);
    console.log(lines);
    let groups = group_lines(lines);
    console.log(groups);

    let story = {"elements": []}
    for(let group of groups) {
        story.elements.push(parseGroup(group));
    }
    console.log(JSON.stringify(story, null, 2));
    //console.log(story);
    return


    let line_index = 1;

    for(let index = 0; index < lines.length; index++) {
        try {
            // metadata
            if (lines[index].search("=") !== -1) {
                let [key, value] = lines[index].split("=");
                story_properties[key.trim()] = value.trim();
                continue
            }

            // speaker
            if (lines[index].startsWith(">")) {
                // split speaker and text
                let [_, speaker, text] = lines[index].match(/^>\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                let translation = undefined;
                // if the next line starts with ~ it is the translation for the text
                if (lines[index + 1].startsWith("~")) {
                    [_, _, translation] = lines[index + 1].match(/^~\s*(?:([^ :]+)\s*:)?:?\s*(.*)\s*$/);
                    index += 1;
                }
                let data = generateMaps(speaker, text, translation, audio_map, line_index);
                line_index += 1;

                // add it and continue
                phrases.push(data);
                continue;
            }

            // question choice
            if (lines[index].startsWith("[choice]")) {
                let question, answers, correctAnswerIndex;

                [index, question] = getTextWithTranslationsHintMap(lines, index, /^\[(.*)\]\s*(.*)\s*$/, /^~\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                [index, answers, correctAnswerIndex] = readAnswerLines2(lines, index);

                // set the data
                let data = {
                    type: "MULTIPLE_CHOICE",
                    question: question,
                    answers: answers,
                    correctAnswerIndex: correctAnswerIndex,
                    trackingProperties: {line_index: line_index, challenge_type: "multiple-choice"},
                };
                line_index += 1;
                // add the data
                phrases.push(data);
                continue;
            }

            // question fill
            if (lines[index].startsWith("[fill]")) {
                // split the question text
                let [_, tag, speaker, text] = lines[index].match(/^\[(.*)\]\s*>?\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                let translation = undefined;
                // if the next line starts with ~ it is the translation for the text
                if (lines[index + 1].startsWith("~")) {
                    [_, _, translation] = lines[index + 1].match(/^~\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                    index += 1;
                }

                let question = undefined;
                if (!lines[index + 1].startsWith("+") && !lines[index + 1].startsWith("-")) {
                    question = lines[index + 1].trim();
                    index += 1;
                }

                let question_translation = undefined;
                if (lines[index + 1].startsWith("~")) {
                    [_, question_translation] = lines[index + 1].match(/^~\s*(.*)\s*$/);
                    index += 1;
                }

                let answers;
                let [__, answers_raw, translation_raw, correctAnswerIndex] = readAnswerLinesNoHints(lines, index);
                [index, answers, correctAnswerIndex] = readAnswerLines2(lines, index);

                let hideRangesForChallenge = [];
                let ssml = getInputStringSpeachtext(text);
                if (text.indexOf("*") !== -1) {
                    let start = getInputStringText(text).indexOf("*");
                    hideRangesForChallenge = {start: start, end: start + answers[correctAnswerIndex].text.length};
                    text = text.replace("*", answers_raw[correctAnswerIndex]);
                    if (!translation)
                        translation = translation_raw[correctAnswerIndex];
                    ssml = ssml.replace("*", answers[correctAnswerIndex].text);
                    if (translation)
                        translation = translation.replace("*", translation_raw[correctAnswerIndex]);
                }

                phrases.push({
                    type: "CHALLENGE_PROMPT",
                    prompt: generateHintMap(question, question_translation),
                    trackingProperties: {line_index: line_index, challenge_type: "select-phrases"},
                })

                phrases.push(generateMaps(speaker, text, translation, audio_map, line_index));
                phrases[phrases.length - 1].hideRangesForChallenge = hideRangesForChallenge;
                if (phrases[phrases.length - 1].line.content.audio && phrases[phrases.length - 1].line.content.audio.ssml) {
                    phrases[phrases.length - 1].line.content.audio.ssml.text = ssml;
                }

                // set the data
                phrases.push({
                    type: "SELECT_PHRASE",
                    answers: answers,
                    correctAnswerIndex: correctAnswerIndex,
                    trackingProperties: {line_index: line_index, challenge_type: "select-phrases"},
                });
                line_index += 1;

                continue;
            }

            // question next
            if (lines[index].startsWith("[next]")) {
                // split the question text
                let [_, tag, speaker, text] = lines[index].match(/^\[(.*)\]\s*>?\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                let translation = undefined;
                // if the next line starts with ~ it is the translation for the text
                if (lines[index + 1].startsWith("~")) {
                    [_, _, translation] = lines[index + 1].match(/^~\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                    index += 1;
                }

                let question = undefined;
                let question_translation = undefined;
                if (!lines[index + 1].startsWith("+") && !lines[index + 1].startsWith("-")) {

                    [index, question, question_translation] = getTextWithTranslation(lines, index + 1, /^\s*(.+)\s*$/, /^~\s*(.*)\s*$/);
                    //index += 1;
                }

                let answers, correctAnswerIndex;
                [index, answers, correctAnswerIndex] = readAnswerLines2(lines, index);

                let ssml = getInputStringSpeachtext(text);
                let hideRangesForChallenge;
                if (text.indexOf("*") !== -1 && answers[correctAnswerIndex] !== undefined) {
                    let start = getInputStringText(text).indexOf("*");
                    hideRangesForChallenge = {start: start, end: start + answers[correctAnswerIndex].text.length};
                    text = text.replace("*", answers[correctAnswerIndex].text);
                    ssml = ssml.replace("*", "<prosody volume=\"silent\">" + answers[correctAnswerIndex].text + "</prosody>");
                }

                phrases.push({
                    type: "CHALLENGE_PROMPT",
                    prompt: generateHintMap(question, question_translation),
                    trackingProperties: {line_index: line_index, challenge_type: "continuation"},
                })

                phrases.push(generateMaps(speaker, text, translation, audio_map, line_index));
                phrases[phrases.length - 1].hideRangesForChallenge = hideRangesForChallenge;
                if (phrases[phrases.length - 1].line.content.audio && phrases[phrases.length - 1].line.content.audio.ssml) {
                    phrases[phrases.length - 1].line.content.audio.ssml.text = ssml;
                }

                // set the data
                phrases.push({
                    type: "MULTIPLE_CHOICE",
                    answers: answers,
                    correctAnswerIndex: correctAnswerIndex,
                    trackingProperties: {line_index: line_index, challenge_type: "continuation"},
                });
                line_index += 1;

                continue;
            }

            // question order
            if (lines[index].startsWith("[order]")) {
                // split the question text
                let [_, tag, speaker, text] = lines[index].match(/^\[(.*)\]\s*>?\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                let translation = undefined;
                // if the next line starts with ~ it is the translation for the text
                if (lines[index + 1].startsWith("~")) {
                    [_, _, translation] = lines[index + 1].match(/^~\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                    index += 1;
                }
                let question = lines[index + 1].trim();
                index += 1;
                let question_translation = undefined;
                if (lines[index + 1].startsWith("~")) {
                    [_, question_translation] = lines[index + 1].match(/^~\s*(.*)\s*$/);
                    index += 1;
                }

                let words = [], translations = [], full_text = [];
                let hideRangesForChallenge = [];
                let characterPositions = [];

                for (; index < lines.length - 1; index += 1) {
                    if (lines[index + 1].startsWith("[") || lines[index + 1].startsWith(">"))
                        break

                    if (words.length === 0 || translations.length !== 0) {
                        words.push(lines[index + 1].split("/"));

                        // construct the target text (for audio)
                        if (words.length === 1) {
                            let start = getInputStringText(text).indexOf("*");
                            let pos = start;
                            for (let x of lines[index + 1].split("/")) {
                                pos += x.length;
                                characterPositions.push(pos);
                                pos += 1;
                            }
                            let filler = lines[index + 1].split("/").join(" ");
                            hideRangesForChallenge = {start: start, end: start + filler.length};
                            text = text.replace("*", filler);
                            for (let j = 0; j < words[0].length; j++)
                                words[0][j] = words[0][j].replace(/~/g, " ").replace(/\|/g, "â€‹");
                        }
                    } else {
                        translations.push(lines[index + 1].split("/"));
                        if (translation === undefined)
                            translation = "*";
                        translation = translation.replace("*", lines[index + 1].split("/").join(" "));
                    }
                }

                let sort = [];
                for (let i = 0; i < words[0].length; i++)
                    sort.push(i);
                shuffle(sort);

                let selectablePhrases = [];
                for (let i of sort)
                    selectablePhrases.push(words[0][i]);

                phrases.push({
                    type: "CHALLENGE_PROMPT",
                    prompt: generateHintMap(question, question_translation),
                    trackingProperties: {line_index: line_index, challenge_type: "arrange"},
                })

                phrases.push(generateMaps(speaker, text, translation, audio_map, line_index));
                phrases[phrases.length - 1].hideRangesForChallenge = hideRangesForChallenge;

                // set the data
                phrases.push({
                    type: "ARRANGE",
                    selectablePhrases: selectablePhrases,
                    phraseOrder: sort,
                    characterPositions: characterPositions,
                    trackingProperties: {line_index: line_index, challenge_type: "arrange"},
                });
                line_index += 1;
                continue;
            }

            // question point-to-phrase
            if (lines[index].startsWith("[click]")) {
                // read in the question (with translation)
                let question, question_translation, translation, speaker, text, _;
                [index, question, question_translation] = getTextWithTranslation(lines, index, /^\[.*\]\s*(.*)\s*$/, /^~\s*(.*)\s*$/);

                // read the line (with translation)
                [_, speaker, text] = lines[index + 1].match(/^>?\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/);
                //console.log("[click]", speaker, text, lines[index], question, question_translation);
                [index, text, translation] = getTextWithTranslation(lines, index + 1, /^>?\s*(?:([^ :]+)\s*:)?:?\s*(.+)\s*$/, /^~\s*(.*)\s*$/);

                // Split the text into text with buttons
                let parts = splitTextTokens(text, true);
                let new_text = "";
                let transcriptParts = [];
                let answerIndex = 0;
                let correctAnswerIndex = 0;
                for (let part of parts) {
                    // Button with + is the correct answer
                    if (part.startsWith("[+") && part.endsWith("]")) {
                        correctAnswerIndex = answerIndex;
                        part = part.substr(2, part.length - 3);
                        transcriptParts.push({text: part.replace(/~/g, " ").replace(/\|/g, "â€‹"), selectable: true});
                        answerIndex += 1;
                    }
                    // a button with a wrong answer
                    else if (part.startsWith("[") && part.endsWith("]")) {
                        part = part.substr(1, part.length - 2)
                        transcriptParts.push({text: part.replace(/~/g, " ").replace(/\|/g, "â€‹"), selectable: true});
                        answerIndex += 1;
                    }
                    // text which is not a button
                    else
                        transcriptParts.push({text: part.replace(/~/g, " ").replace(/\|/g, "â€‹"), selectable: false});
                    // join the text parts
                    new_text += part;
                }

                // the text line
                phrases.push(generateMaps(speaker, new_text, translation, audio_map, line_index));

                // the question
                phrases.push({
                    type: "POINT_TO_PHRASE",
                    question: generateHintMap(question, question_translation),
                    transcriptParts: transcriptParts,
                    correctAnswerIndex: correctAnswerIndex,
                    trackingProperties: {line_index: line_index, challenge_type: "point-to-phrase"},
                });
                line_index += 1;
                continue;
            }

            // question pairs
            if (lines[index].startsWith("[pairs]")) {
                // split the question text
                let [_, tag, question] = lines[index].match(/^\[(.*)\]\s*(.*)\s*$/);

                let question_translation = undefined;
                if (lines[index + 1].startsWith("~")) {
                    [_, question_translation] = lines[index + 1].match(/^~\s*(.*)\s*$/);
                    index += 1;
                }

                let fallbackHints = [];

                // iterate over the next lines, they are the answers
                for (; index < lines.length - 1; index += 1) {
                    // check if it starts with + or -
                    let match = lines[index + 1].match(/^\s*(.*)\s* - \s*(.*)\s*$/);
                    if (match === null)
                        break
                    // split text
                    let [_, lang1, lang2] = match;
                    fallbackHints.push({
                        phrase: lang1.replace(/~/g, " ").replace(/\|/g, "â€‹"),
                        translation: lang2.replace(/~/g, " ").replace(/\|/g, "â€‹")
                    });
                }

                // set the data
                phrases.push({
                    type: "MATCH",
                    prompt: question,
                    fallbackHints: fallbackHints,
                    trackingProperties: {line_index: line_index, challenge_type: "match"},
                });
                line_index += 1;

                continue;
            }
        }
        catch (e) {
            console.log("error", e);
            phrases.push({
                type: "ERROR",
                line: lines[index],
                message: "ERROR: "+e,
            });
        }

        if(lines[index] !== "") {
            phrases.push({
                type: "ERROR",
                line: lines[index],
                message: "could not understand line: " + lines[index],
            });
        }
    }
    if(story_properties.title != "") {
        //phrases.splice(0, 0, {tag: "title", id: 0, text: story_properties.title, translation: story_properties.title_translation});
        phrases.splice(0, 0, generateMaps(null, story_properties.title, story_properties.title_translation, audio_map, 0));
        phrases[0].line.type = "TITLE";
        //console.log(phrases);
    }

    if(true) {
        ssml_list = {};
        for (let phrase of phrases) {
            if (phrase.type === "LINE") {
                let audio = phrase.line.content.audio;
                if (audio && audio.ssml)
                    ssml_list[audio.ssml.id] = audio.ssml;
            }
        }
        //if(Object.keys(ssml_list).length)
        //    document.getElementById("button_audio").style.display = "inline";
        //else
        //    document.getElementById("button_audio").style.display = "none";
    }

    story_json = {
        elements: phrases,
        learningLanguage: story_properties["lang"],
        fromLanguage: story_properties["lang_base"],
        revision: 1,
        illustrations: {
            active: story_properties["image"],
            gilded: story_properties["image_done"],
            locked: story_properties["image_locked"],
        },
        fromLanguageName: story_properties["title_base"],
        discussion: story_properties["discussion"],
        story_properties: story_properties,
    }
    return story_json;
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
    console.log(response);
    let text = await response.text();
    console.log(text);
    return text;
}

async function generate_audio_line(story_json, line_id) {
    let json = JSON.stringify(ssml_list);
    let audio_reloader = d3.select("#audio_reload"+line_id);
    audio_reloader.attr("data-reload", true);
    let response = await fetch_post(`${backend_audio}set_audio.php`, {"id": story_id, "json": json, "line_id": line_id});
    console.log(response);
    let text = await response.text();
    console.log(text);
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

try {
    module.exports = processStoryFile;
} catch (e) {}


let text = processStoryFile(`
[HEADER]
> El  examen~de~inglés
~ the English~test    

[LINE]
> Junior está en su~casa   con  Zari.
~ Junior is   at his~house with Zari 

[LINE]
Speaker415: ¡Zari, necesito tu~ayuda! 
~            Zari  I~need   your~help 

[LINE]
Speaker418: ¿Tú  necesitas mi ayuda?
~            you need      my help  

[LINE]
Speaker415: Sí,  tengo  un examen~de~inglés~muy~importante…
~           yes  I~have a  very~important~English~test     

[MULTIPLE_CHOICE]
> Junior has a Spanish exam soon.
+ No, that's wrong.
- Yes, that's right.

[LINE]
Speaker415: Y   yo quiero jugar…  
~           and I  want   to~play 

[LINE]
Speaker415: … pero tengo~que~estudiar.
~             but  I~have~to~study    

[MULTIPLE_CHOICE]
> Junior needs to study English, but he really wants to…
- …study history.
- …take over the world.
+ …play a video game.

[LINE]
Speaker418: ¡Vamos~a~estudiar juntos!   ¡Yo hablo muy~bien~inglés!  
~            let's~study      together   I  speak English~very~well 

[ARRANGE]
> Tap what you hear
Speaker418: ¿[Dónde está tu   libro?]
~             where is   your book   
TODO

[LINE]
Speaker415: En mi mochila. 
~           in my backpack 

[LINE]
Speaker418: Y…   ¿dónde está tu~mochila?   
~           and   where is   your~backpack 

[LINE]
Speaker415: En la~escuela.
~           at school     

[MULTIPLE_CHOICE]
> Where's Junior's backpack?
- in his room
- in Zari's living room
+ at his school

[LINE]
Speaker418: Junior, ¿cómo vamos~a~estudiar      sin     tu~libro? 
~           Junior   how  we~are~going~to~study without your~book 

[LINE]
Speaker415: Tú  vas a  la~escuela, buscas       mi libro…
~           you go  to school      you~look~for my book  

[LINE]
Speaker415: … y   yo juego aquí en mi casa. 
~             and I  play  here at my house 

[MULTIPLE_CHOICE]
> What does Junior want Zari to do?
- buy him a new backpack
- play video games with him
+ go get his English book while he plays video games

[MATCH]
> Tap the pairs
- vas <> go
- Junior <> Junior
- necesito <> I need
- Dónde <> where
- tengo que estudiar <> I have to study


`)

import {Diff} from "diff";
Diff.diffJson(text, text);