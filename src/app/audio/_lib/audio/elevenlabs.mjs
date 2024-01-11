import {put} from "@vercel/blob";

const WebSocket = require("ws");
const { decode } = require("base64-arraybuffer");
const fs = require("fs");

const model = "eleven_multilingual_v2";


async function generate(voiceId, text) {
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}&enable_ssml_parsing=false`;
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(wsUrl);

        let audioBuffers = [];
        const alignment = [];

        // 2. Initialize the connection by sending the BOS message
        socket.onopen = function (event) {
            const bosMessage = {
                text: " ",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                },
                xi_api_key: process.env.ELEVENLABS_APIKEY, // replace with your API key
            };

            socket.send(JSON.stringify(bosMessage));

            // 3. Send the input text message ("Hello World")
            const textMessage = {
                text: text,
                try_trigger_generation: true,
            };

            socket.send(JSON.stringify(textMessage));

            // 4. Send the EOS message with an empty string
            const eosMessage = {
                text: "",
            };

            socket.send(JSON.stringify(eosMessage));
        };

        // 5. Handle server responses
        socket.onmessage = function (event) {
            const response = JSON.parse(event.data);

            //console.log("Server response:", response);

            if (response.alignment) {
                for (let i in response.alignment.chars) {
                    alignment.push([
                        response.alignment.chars[i],
                        response.alignment.charStartTimesMs[i],
                    ]);
                }
            }

            if (response.audio) {
                // decode and handle the audio data (e.g., play it)
                const audioChunk = decode(response.audio);
                audioBuffers.push(Buffer.from(audioChunk));

                //console.log("Received audio chunk");
            } else {
                //console.log("No audio data in the response");
            }

            if (response.isFinal) {
                // the generation is complete
                resolve({ audioBuffers: audioBuffers, alignment: alignment });
            }

            if (response.normalizedAlignment) {
                // use the alignment info if needed
            }
        };

        // Handle errors
        socket.onerror = function (error) {
            console.error(`WebSocket Error: ${error}`);
        };

        // Handle socket closing
        socket.onclose = function (event) {
            if (event.wasClean) {
                console.info(
                    `Connection closed cleanly, code=${event.code}, reason=${event.reason}`,
                );
            } else {
                console.warn("Connection died");
            }
        };
    });
}
async function synthesizeSpeechElevenLabs(filename, voice_id, text) {
    console.log("synthesizeSpeechElevenLabs", filename, voice_id, text);
    const response = await generate(voice_id, text);
    const completeAudio = Buffer.concat(response.audioBuffers);

    let content;
    if(filename) {
        await put(filename, data_file, { access: "public", addRandomSuffix: false });
        fs.writeFileSync(filename, completeAudio);
    }
    else
        content = completeAudio.toString('base64');
    console.log(response.alignment);
    let marks = [];
    let word = "";
    let word_start = 0;
    let last_time = 0;
    let word_start_time = 0;
    for (let i = 0; i < response.alignment.length; i++) {
        let [c, t] = response.alignment[i];
        let match = c.match(/[ .,!?:;]/);
        if (match) {
            if (word.length > 0) {
                marks.push({
                    time: word_start_time,
                    type: "word",
                    start: word_start,
                    end: word_start + word.length,
                    value: word,
                });
            }
            word = "";
            word_start = i;
            word_start_time = t;
        } else {
            word += c;
            last_time = t;
        }
    }
    if (word.length > 0) {
        marks.push({
            time: word_start_time,
            type: "word",
            start: word_start,
            end: word_start + word.length,
            value: word,
        });
    }
    console.log(marks);
    return {
        output_file: filename,
        content: content,
        marks: marks
    }
}

async function main() {
    synthesizeSpeechElevenLabs(
        "test2.mp3",
        "21m00Tcm4TlvDq8ikWAM",
        "I really want to test how this works.",
    );
}
//main();
async function getUserInfo() {
    const options = {
        method: "GET",
        headers: { "xi-api-key": process.env.ELEVENLABS_APIKEY },
    };

    let response = await fetch(
        "https://api.elevenlabs.io/v1/user/subscription",
        options,
    );
    response = await response.json();
    return response;
    /*
    {
    tier: 'free',
    character_count: 1175,
    character_limit: 10000,
    can_extend_character_limit: false,
    allowed_to_extend_character_limit: false,
    next_character_count_reset_unix: 1707497886,
    voice_limit: 3,
    max_voice_add_edits: 54,
    voice_add_edit_counter: 0,
    professional_voice_limit: 0,
    can_extend_voice_limit: false,
    can_use_instant_voice_cloning: false,
    can_use_professional_voice_cloning: false,
    currency: null,
    status: 'free',
    next_invoice: null,
    has_open_invoices: false
  }
     */
}
async function isValidVoice(voiceId) {
    const options = { method: "GET", headers: { "xi-api-key": process.env.ELEVENLABS_APIKEY } };
    try {
        let response = await fetch(
            `https://api.elevenlabs.io/v1/voices/${voiceId}`,
            options,
        );
        let voice = await response.json();
        console.log(voice);
        return voice.voice_id === voiceId;
    } catch (e) {
        return false;
    }
}

async function getVoices() {
    const options = { method: "GET", headers: { "xi-api-key": process.env.ELEVENLABS_APIKEY } };

    try {
        let response = await fetch("https://api.elevenlabs.io/v1/voices", options);
        response = await response.json();
        //console.log(response);
        for (let voice of response.voices) {
            console.log(voice.voice_id, voice.name, voice.description, voice.labels);
        }
    } catch (e) {
        console.log(e);
    }
}

export default {
    name: "elevenlabs",
    synthesizeSpeech: synthesizeSpeechElevenLabs,
    getVoices: getVoices,
    isValidVoice: isValidVoice,
    getUserInfo: getUserInfo,
};
