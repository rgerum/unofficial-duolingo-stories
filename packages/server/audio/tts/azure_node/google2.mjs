import fetch from 'node-fetch';
import {Headers} from "node-fetch";
import fs from "fs";

const apiKey = "AIzaSyCzcXOAb__4XMV8V89Hhbk5FUlMweV8xYM";
const voiceLang = "en-US";
const voiceName = "en-US-Wavenet-D";

const ssml = '<speak>Hello World! This is a sample TTS</speak>';

async function synthesizeSpeech(filename, voice_id, text) {
//async function getAudio(apiKey, voiceLang, voiceName, ssml) {
    let [lang, region, voiceName] = voice_id.split("-", 2);

    const headers = new Headers();
    headers.append("Content-Type", "application/json; charset=utf-8");

    text = text.replace(/^<speak>/, "")
    text = text.replace(/<\/speak>$/, "")
    let [text_with_marks, marks] = add_marks(text);
    let ssml = "<speak>"+text_with_marks+"</speak>";

    const request = {
        input: {
            ssml,
        },
        voice: {
            languageCode: lang+"-"+region,
            name: voice_id,
        },
        audioConfig: {
            audioEncoding: "MP3",
        },
        enableTimePointing: ["SSML_MARK"],
    };

    const response = await fetch(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(request),
        }
    );

    if (response.ok) {
        const { audioContent, timepoints } = await response.json();

        return new Promise((resolve, reject) => {
            fs.writeFile(filename, Buffer.from(audioContent, "base64"), () => {
                //{"time":1025,"type":"word","start":14,"end":17,"value":"moe"}
                for(let mark_index in timepoints) {
                    marks[mark_index]["time"] = timepoints[mark_index]["timeSeconds"]*1000
                }
                resolve({output_file: filename, marks: marks});
            });
        });
        // do something with audioContent and timepoints
    } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return new Promise((resolve, reject) => {
            reject(`Error: ${response.status} - ${response.statusText}`);
        });
    }
}

function add_marks(text) {
    const regexSplitToken = /(<[^>]+>)|(\w+)|([^\w<>]*)/g;
    const regexCombineWhitespace = / +/g;
    text = text.replace(regexCombineWhitespace, " ").trim();
    let text2 = "";
    let i = 0;
    const splitTextTokens = text.matchAll(regexSplitToken);
    // {"time":1025,"type":"word","start":14,"end":17,"value":"moe"}
    let marks = [];
    for (const [match, tag, word, space] of splitTextTokens) {
        if (tag) {
            text2 += tag;
        } else if (word) {
            marks.push({"type": "word", "start": i, "end": i+word.length, "value": word})
            i += word.length;
            text2 += word + `<mark name="${i}"/>`;
        } else if (space) {
            i += space.length;
            text2 += space;
        }
    }
    return [text2, marks];
}

//synthesizeSpeech("test.mp3", voiceName, ssml);