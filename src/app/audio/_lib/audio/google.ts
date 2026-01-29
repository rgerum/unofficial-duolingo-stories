import { put } from "@vercel/blob";
import type { SynthesisResult, Voice, TTSEngine } from "./types";

const apiKey = process.env.GITHUB_APIKEY;

export async function synthesizeSpeechGoogle(
  filename: string | undefined,
  voice_id: string,
  text: string,
): Promise<SynthesisResult> {
  //async function getAudio(apiKey, voiceLang, voiceName, ssml) {
  let [lang, region, voiceName] = voice_id.split("-", 2);

  const headers = new Headers();
  headers.append("Content-Type", "application/json; charset=utf-8");

  //text = text.replace(/^<speak>/, "");
  //text = text.replace(/<\/speak>$/, "");
  //let [text_with_marks, marks] = add_marks(text);
  //let ssml = "<speak>" + text_with_marks + "</speak>";
  let ssml = text;

  const request = {
    input: {
      ssml,
    },
    voice: {
      languageCode: lang + "-" + region,
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
    },
  );
  if (response.ok) {
    const { audioContent, timepoints } = await response.json();

    return new Promise(async (resolve, reject) => {
      if (filename === undefined) {
        /*
        for (let mark_index in timepoints) {
          mark_index = mark_index * 1;
          marks[0]["time"] = 0;
          for (let mark of marks) {
            if (mark.end === parseInt(timepoints[mark_index].markName)) {
              mark["time"] = timepoints[mark_index]["timeSeconds"] * 1000;
            }
          }
        }*/
        resolve({ timepoints: timepoints, content: audioContent });
      } else {
        await put(filename, Buffer.from(audioContent, "base64"), {
          access: "public",
          addRandomSuffix: false,
        });
        resolve({ output_file: filename, timepoints: timepoints });
      }
      /*
      fs.writeFile(filename, Buffer.from(audioContent, "base64"), () => {
        resolve({ output_file: filename, timepoints: timepoints });
      });
    */
    });
    // do something with audioContent and timepoints
  } else {
    console.error(`Error: ${response.status} - ${response.statusText}`);
    return new Promise((resolve, reject) => {
      reject(`Error: ${response.status} - ${response.statusText}`);
    });
  }
}

interface MarkData {
  type: "word";
  start: number;
  end: number;
  value: string;
}

function add_marks(text: string): [string, MarkData[]] {
  const regexSplitToken = /(<[^>]+>)|([^\s<>]+)|(\s*)/g;
  const regexCombineWhitespace = / +/g;
  text = text.replace(regexCombineWhitespace, " ").trim();
  let text2 = "";
  let i = 0;
  const splitTextTokens = text.matchAll(regexSplitToken);
  const marks: MarkData[] = [];
  for (const [, tag, word, space] of splitTextTokens) {
    if (tag) {
      text2 += tag;
    } else if (word) {
      marks.push({ type: "word", start: i, end: i + word.length, value: word });
      i += word.length;
      text2 += word + `<mark name="${i}"/>`;
    } else if (space) {
      i += space.length;
      text2 += space;
    }
  }
  return [text2, marks];
}

interface GoogleVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: "MALE" | "FEMALE";
}

async function getVoices(): Promise<Voice[]> {
  const headers = new Headers();
  headers.append("Content-Type", "application/json; charset=utf-8");

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
    {
      method: "GET",
      headers,
    },
  );

  if (response.ok) {
    const { voices } = (await response.json()) as { voices: GoogleVoice[] };
    const voices_result: Voice[] = [];
    for (const voice of voices) {
      voices_result.push({
        language: voice.languageCodes[0].split("-")[0],
        locale: voice.languageCodes[0],
        name: voice.name,
        gender: voice.ssmlGender,
        type: voice.name.indexOf("Neural") !== -1 ? "NEURAL" : "NORMAL",
        service: "Google TTS",
      });
    }
    return voices_result;
  } else {
    console.error(`Error: ${response.status} - ${response.statusText}`);
    return [];
  }
}

function isValidVoice(voice: string): boolean {
  return (
    voice.indexOf("Wavenet") !== -1 ||
    voice.indexOf("Standard") !== -1 ||
    voice.indexOf("Neural2") !== -1
  );
}

const googleEngine: TTSEngine = {
  name: "google",
  synthesizeSpeech: synthesizeSpeechGoogle,
  getVoices: getVoices,
  isValidVoice: isValidVoice,
};

export default googleEngine;
