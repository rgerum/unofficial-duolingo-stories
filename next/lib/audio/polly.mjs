// Load the AWS SDK for Node.js
import {Polly} from "@aws-sdk/client-polly";
import fs from "fs";

// Set the region and credentials for the AWS SDK
let config = {
    region: 'eu-central-1',
};

async function synthesizeSpeech(polly, params) {
    return new Promise((resolve, reject) => {
        polly.synthesizeSpeech(params, function (err, data) {
            if (err) {
                reject(err);
                console.log("err", err, err.stack);
            }
            resolve(data);
        })
    });
}

async function writeFile(filename, data_read) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data_read, function (err) {
            if (err) {
                console.log("err", err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

async function writeStream(filename, readable){
    return new Promise((resolve, reject) => {
        const writable = fs.createWriteStream(filename);

    // Pipe the readable stream to the writable stream
        readable.pipe(writable);

    // Listen for 'finish' event to know when the write is complete
        writable.on('finish', () => {
            console.log('Write complete');
            resolve();
        });
    });
}

function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

async function streamToBase64(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => {
            // Concatenate all the chunks into a single buffer
            const buffer = Buffer.concat(chunks);

            // Encode the buffer to base64
            const base64 = buffer.toString('base64');
            resolve(base64);
        });
    });
}


async function synthesizeSpeechPolly(filename, voice_id, text) {
    // Create an instance of the Polly service object
    var polly = new Polly(config);

    text = text.replace(/^<speak>/, "")
    text = text.replace(/<\/speak>$/, "")
    text = text.replace(/pitch="medium"/, "")

    // Set the parameters for the synthesis request
    var params = {
        OutputFormat: 'mp3',
        Text: `<speak>${text}</speak>`,
        VoiceId: voice_id,
        TextType: "ssml",
        Engine: "neural",
    };

    // Call the synthesizeSpeech method to generate the audio
    let data;
    try {
        data = await synthesizeSpeech(polly, params);
    }
    catch (e) {
        if(e.message.indexOf("feature") !== -1) {
            params.Text = params.Text.replace(/pitch="[^"]*"/, "");
            data = await synthesizeSpeech(polly, params);
        }
        else {
            params.Engine = "standard";
            data = await synthesizeSpeech(polly, params);
        }
    }
    params.SpeechMarkTypes = ["word"];
    params.OutputFormat = "json";
    let data2 = await synthesizeSpeech(polly, params);

    let content;
    if(filename)
        await writeStream(filename, data.AudioStream);
    else
       content = await streamToBase64(data.AudioStream);

    // Handle the audio data
    let data_read2 = await streamToString(data2.AudioStream);

    let marks = [];
    for(let mark of data_read2.trim().split("\n"))
        marks.push(JSON.parse(mark))
    return {
        output_file: filename,
        marks: marks,
        content: content,
    }
}

async function getVoices() {
    return new Promise((resolve, reject) => {
        var polly = new Polly(config);
        polly.describeVoices({}, (err, data) => {
            if (err) {
                reject(err);
            } else {
                let voices_result = [];
                for(let voice of data.Voices) {
                    voices_result.push({
                        language: voice.LanguageCode.split("-")[0],
                        name: voice.Id,
                        gender: voice.Gender.toUpperCase(),
                        type: (voice.SupportedEngines[0] === "neural") ? "NEURAL" : "NORMAL",
                        service: "Amazon Polly",
                    })
                }
                resolve(voices_result);
            }
        });
    });
}
async function isValidVoice(voice) {
    return voice.indexOf("-") === -1
}

export default {name: "polly", "synthesizeSpeech": synthesizeSpeechPolly, "getVoices": getVoices, "isValidVoice": isValidVoice}
