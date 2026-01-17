import { put } from "@vercel/blob";
import type {
  AudioMark,
  SynthesisResult,
  Voice,
  ElevenLabsEngine,
  ElevenLabsSubscription,
} from "./types";

const WebSocket = require("ws");
const { decode } = require("base64-arraybuffer");

const model = "eleven_multilingual_v2";

interface GenerateResult {
  audioBuffers: Buffer[];
  alignment: [string, number][];
}

async function generate(voiceId: string, text: string): Promise<GenerateResult> {
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}&enable_ssml_parsing=false`;
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(wsUrl);

        const audioBuffers: Buffer[] = [];
        const alignment: [string, number][] = [];

        // 2. Initialize the connection by sending the BOS message
        socket.onopen = function (_event: Event) {
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
        socket.onmessage = function (event: { data: string }) {
            const response = JSON.parse(event.data) as {
                alignment?: { chars: string[]; charStartTimesMs: number[] };
                audio?: string;
                isFinal?: boolean;
                normalizedAlignment?: unknown;
            };

            if (response.alignment) {
                for (let i = 0; i < response.alignment.chars.length; i++) {
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
            }

            if (response.isFinal) {
                // the generation is complete
                resolve({ audioBuffers: audioBuffers, alignment: alignment });
            }
        };

        // Handle errors
        socket.onerror = function (error: Error) {
            console.error(`WebSocket Error: ${error}`);
            reject(error);
        };

        // Handle socket closing
        socket.onclose = function (event: { wasClean: boolean; code: number; reason: string }) {
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
async function synthesizeSpeechElevenLabs(
    filename: string | undefined,
    voice_id: string,
    text: string,
): Promise<SynthesisResult> {
    console.log("synthesizeSpeechElevenLabs", filename, voice_id, text);
    const response = await generate(voice_id, text);
    const completeAudio = Buffer.concat(response.audioBuffers);

    let content: string | undefined;
    if (filename) {
        await put(filename, completeAudio, { access: "public", addRandomSuffix: false });
    } else {
        content = completeAudio.toString('base64');
    }
    console.log(response.alignment);
    const marks: AudioMark[] = [];
    let word = "";
    let word_start = 0;
    let word_start_time = 0;
    for (let i = 0; i < response.alignment.length; i++) {
        const [c, t] = response.alignment[i];
        const match = c.match(/[ .,!?:;]/);
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
    };
}

async function getUserInfo(): Promise<ElevenLabsSubscription> {
    const options = {
        method: "GET",
        headers: { "xi-api-key": process.env.ELEVENLABS_APIKEY! },
    };

    const response = await fetch(
        "https://api.elevenlabs.io/v1/user/subscription",
        options,
    );
    return await response.json() as ElevenLabsSubscription;
}

async function isValidVoice(voiceId: string): Promise<boolean> {
    const options = { method: "GET", headers: { "xi-api-key": process.env.ELEVENLABS_APIKEY! } };
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/voices/${voiceId}`,
            options,
        );
        const voice = await response.json() as { voice_id?: string };
        console.log(voice);
        return voice.voice_id === voiceId;
    } catch (e) {
        return false;
    }
}

async function getVoices(): Promise<Voice[]> {
    const options = { method: "GET", headers: { "xi-api-key": process.env.ELEVENLABS_APIKEY! } };

    try {
        const response = await fetch("https://api.elevenlabs.io/v1/voices", options);
        const data = await response.json() as { voices: Array<{ voice_id: string; name: string; labels?: { language?: string } }> };
        // ElevenLabs doesn't return voices in standard format, return empty for now
        return data.voices.map(voice => ({
            language: voice.labels?.language ?? "en",
            locale: voice.labels?.language ?? "en-US",
            name: voice.voice_id,
            gender: "MALE" as const,
            type: "NEURAL" as const,
            service: "ElevenLabs",
        }));
    } catch (e) {
        console.log(e);
        return [];
    }
}

const elevenlabsEngine: ElevenLabsEngine = {
    name: "elevenlabs",
    synthesizeSpeech: synthesizeSpeechElevenLabs,
    getVoices: getVoices,
    isValidVoice: isValidVoice,
    getUserInfo: getUserInfo,
};

export default elevenlabsEngine;
