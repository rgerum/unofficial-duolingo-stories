function splitTextSpeech(text) {
    //"asd. asd - asd; Here...".split(/([-—.:,;?!¿¡"'…\s]+)/)
    "asd. asd - asd; Here...".split(/([\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+)/)
}

function getInputStringText(text) {
    return text.replace(/([^~ ,;.:-_?!…]*)\{([^\}]*)\}/g, "$1");
}

function getInputStringSpeachtext(text) {
    return text.replace(/([^~ ,;.:-_?!…]*)\{([^\}]*)\}/g, "$2");
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

let phrases = undefined;
let story_properties = undefined;
function processStoryFile() {
    phrases = [];
    story_properties = {title: "", language: "", title_translation: ""}

    let lines = [];
    for (let line of story.split("\n")) {
        // ignore empty lines or lines with comments
        line = line.trim();
        if (line.length === 0 || line.substr(0, 1) === "#")
            continue;

        lines.push(line);
    }

    for(let index = 0; index < lines.length; index++) {

        // metadata
        if(lines[index].search("=") !== -1) {
            let [key, value] = lines[index].split("=");
            story_properties[key.trim()] = value.trim();
            continue
        }

        // speaker
        if (lines[index].startsWith(">")) {
            // split speaker and text
            let [_, speaker, text] = lines[index].match(/^>\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
            let translation = undefined;
            // if the next line starts with ~ it is the translation for the text
            if (lines[index+1].startsWith("~")) {
                [_, _, translation] = lines[index+1].match(/^~\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
                index += 1;
            }
            // gather the data
            let data = {
                tag: "phrase",
                id: phrases.length+1,
                speaker: speaker,
                text: getInputStringText(text),
                speech: getInputStringSpeachtext(text),
                translation: translation,
            };
            // add it and continue
            phrases.push(data);
            continue;
        }

        // question choice
        if (lines[index].startsWith("[choice]")) {
            // split the question text
            let [_, tag, question] = lines[index].match(/^\[(.*)\]\s*(.*)\s*$/);
            // set the data
            let data = {
                tag: tag,
                id: phrases.length+1,
                question: question,
                answers: [],
                solution: 0,
            };
            index = readAnswerLines(lines, index, data);
            // add the data
            phrases.push(data);
            continue;
        }

        // question fill / next
        if (lines[index].startsWith("[fill]") || lines[index].startsWith("[next]")) {
            // split the question text
            let [_, tag, speaker, text] = lines[index].match(/^\[(.*)\]\s*>?\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
            let translation = undefined;
            // if the next line starts with ~ it is the translation for the text
            if (lines[index + 1].startsWith("~")) {
                [_, _, translation] = lines[index + 1].match(/^~\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
                index += 1;
            }

            let question = undefined;
            if (!lines[index + 1].startsWith("+") && !lines[index + 1].startsWith("-")) {
                let question = lines[index + 1].trim();
                index += 1;
            }

            // set the data
            let data = {
                tag: tag,
                id: phrases.length+1,
                question: question,
                answers: [],
                solution: 0,

                speaker: speaker,
                text: text,
                translation: translation,
            };
            index = readAnswerLines(lines, index, data);
            // add the data
            phrases.push(data);
            continue;
        }

        // question order
        if (lines[index].startsWith("[order]")) {
            // split the question text
            let [_, tag, speaker, text] = lines[index].match(/^\[(.*)\]\s*>?\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
            let translation = undefined;
            // if the next line starts with ~ it is the translation for the text
            if (lines[index+1].startsWith("~")) {
                [_, _, translation] = lines[index+1].match(/^~\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
                index += 1;
            }
            let question = lines[index+1].trim();
            index += 1;

            // set the data
            let data = {
                tag: tag,
                id: phrases.length+1,
                question: question,
                answers: [],
                solution: 0,

                speaker: speaker,
                text: text,
                translation: translation,

                words: [],
                translations: [],
            };

            for(; index < lines.length - 1; index+=1) {
                if(lines[index+1].startsWith("[") || lines[index+1].startsWith(">"))
                    break
                if(data.words.length === 0 || data.translations.length !== 0) {
                    data.words.push(lines[index + 1].split("/"));

                    // construct the target text (for audio)
                    if(data.words.length === 1) {
                        data.full_text = data.text.replace("*", lines[index+1].split("/").join(" "));
                    }
                }
                else
                    data.translations.push(lines[index+1].split("/"));
            }

            // add the data
            phrases.push(data);
            continue;
        }

        // question pairs
        if (lines[index].startsWith("[pairs]")) {
            // split the question text
            let [_, tag, question] = lines[index].match(/^\[(.*)\]\s*(.*)\s*$/);
            // set the data
            let data = {
                tag: tag,
                id: phrases.length+1,
                question: question,
                words: [],
            };
            // iterate over the next lines, they are the answers
            for(; index < lines.length - 1; index+=1) {
                // check if it starts with + or -
                let match = lines[index+1].match(/^\s*(.*)\s* - \s*(.*)\s*$/);
                if(match === null)
                    break
                // split text
                let [_, lang1, lang2] = match;
                data.words.push(lang1);
                data.words.push(lang2);
            }
            // add the data
            phrases.push(data);
            continue;
        }

        // question click
        if (lines[index].startsWith("[click]")) {
            // split the question text
            let [_, tag, question] = lines[index].match(/^\[(.*)\]\s*(.*)\s*$/);

            let [__, speaker, text] = lines[index+1].match(/^>?\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
            index += 1;

            let translation = undefined;
            // if the next line starts with ~ it is the translation for the text
            if (lines[index+1].startsWith("~")) {
                [_, _, translation] = lines[index+1].match(/^~\s*(?:([^:]+)\s*:)?:?\s*(.+)\s*$/);
                index += 1;
            }

            // set the data
            let data = {
                tag: tag,
                id: phrases.length+1,
                question: question,
                answers: [],
                speaker: speaker,
                text: text,
                translation: translation,
            };

            // add the data
            phrases.push(data);
            continue;
        }
    }
    phrases.splice(0, 0, {tag: "title", id: 0, text: story_properties.title, translation: story_properties.title_translation});
    console.log(phrases);
}