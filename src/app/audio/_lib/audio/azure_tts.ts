import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import * as fs from "fs";
import { put } from "@vercel/blob";
import type { AudioMark, SynthesisResult, Voice, TTSEngine } from "./types";

function get_raw(text: string): string {
  text = text.replace(/ +/g, " ");
  let text2 = "";
  for (let m of text.matchAll(/(<[^>]+>)|(\w+)|([^\w<>]*)/g)) {
    if (m[1]) {
    } else if (m[2]) {
      text2 += m[2];
    } else if (m[3]) {
      text2 += m[3];
    }
  }
  return text2;
}

async function synthesizeSpeechAzure(
  filename: string | undefined,
  voice_id: string,
  text: string,
  file?: string,
): Promise<SynthesisResult> {
  return new Promise((resolve, reject) => {
    if (file) text = fs.readFileSync(file, "utf8");
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_APIKEY!,
      "westeurope",
    );
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(
      "/dev/null", //filename === undefined ? "/dev/null" : filename,
    );
    speechConfig.speechSynthesisOutputFormat = 5;
    // create the speech synthesizer.
    let synthesizer: sdk.SpeechSynthesizer | undefined =
      new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    let last_pos = 0;
    const marks: AudioMark[] = [];

    synthesizer.wordBoundary = (
      _w: unknown,
      v: sdk.SpeechSynthesisWordBoundaryEventArgs,
    ) => {
      last_pos = text2.substring(last_pos).search(v.text) + last_pos;
      const data: AudioMark = {
        time: Math.round(v.audioOffset / 10000),
        type: "word",
        start: v.textOffset,
        end: v.textOffset + v.wordLength,
        value: v.text,
      };
      marks.push(data);
    };

    //text = text.replace(/^<speak>/, "");
    //text = text.replace(/<\/speak>$/, "");
    let lang = voice_id.split("-")[0] + "-" + voice_id.split("-")[1];
    if (!text.startsWith("<speak"))
      text = `<speak version='1.0' xml:lang='${lang}'><voice name="${voice_id}">${text}</voice></speak>`;

    let text2 = get_raw(text);
    synthesizer.speakSsmlAsync(
      text,
      async function (result: sdk.SpeechSynthesisResult) {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const content = Buffer.from(result.audioData).toString("base64");
          const output: SynthesisResult = {
            output_file: filename,
            marks: marks,
            content: content,
          };
          if (filename !== undefined) {
            await put(filename, Buffer.from(result.audioData), {
              access: "public",
              addRandomSuffix: false,
            });
          }
          resolve(output);
        } else {
          console.error(
            "Speech synthesis canceled, " +
              result.errorDetails +
              "\nDid you update the subscription info?",
          );
          reject(result.errorDetails);
        }
        synthesizer?.close();
        synthesizer = undefined;
      },
      function (err: string) {
        console.trace("err - " + err);
        synthesizer?.close();
        synthesizer = undefined;
        reject(err);
      },
    );
  });
}

async function getVoices(): Promise<Voice[]> {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_APIKEY!,
    "westeurope",
  );

  // create the speech synthesizer.
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  const voices = await synthesizer.getVoicesAsync();
  const result_voices: Voice[] = [];
  for (const voice of voices.voices) {
    result_voices.push({
      language: voice.locale.split("-")[0],
      locale: voice.locale,
      name: voice.shortName,
      gender: voice.gender === 1 ? "FEMALE" : "MALE",
      type: voice.voiceType === 1 ? "NEURAL" : "NORMAL",
      service: "Microsoft Azure",
    });
  }
  return result_voices;
}

function isValidVoice(voice: string): boolean {
  return voice.indexOf("-") !== -1;
}

const azureEngine: TTSEngine = {
  name: "azure",
  synthesizeSpeech: synthesizeSpeechAzure,
  getVoices: getVoices,
  isValidVoice: isValidVoice,
};

export default azureEngine;
