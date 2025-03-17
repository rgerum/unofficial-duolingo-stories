// Load the AWS SDK for Node.js
import { Polly } from "@aws-sdk/client-polly";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db.ts";

// Set the region and credentials for the AWS SDK
let config = {
  region: "eu-central-1",
};

async function synthesizeSpeech(polly, params) {
  return new Promise((resolve, reject) => {
    polly.synthesizeSpeech(params, function (err, data) {
      if (err) {
        reject(err);
        console.log("err", err, err.stack);
      }
      resolve(data);
    });
  });
}

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function streamToBuffer(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function streamToBase64(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => {
      // Concatenate all the chunks into a single buffer
      const buffer = Buffer.concat(chunks);

      // Encode the buffer to base64
      const base64 = buffer.toString("base64");
      resolve(base64);
    });
  });
}

async function synthesizeSpeechPolly(filename, voice_id, text) {
  // Create an instance of the Polly service object
  let polly = new Polly(config);

  text = text.replace(/^<speak>/, "");
  text = text.replace(/<\/speak>$/, "");
  text = text.replace(/pitch="medium"/, "");

  let voice_data = await getVoiceData(voice_id);

  // Set the parameters for the synthesis request
  let params = {
    OutputFormat: "mp3",
    Text: `<speak>${text}</speak>`,
    VoiceId: voice_id,
    TextType: "ssml",
    Engine: voice_data.type === "NEURAL" ? "neural" : "standard",
  };

  // Call the synthesizeSpeech method to generate the audio
  let data;
  try {
    data = await synthesizeSpeech(polly, params);
  } catch (e) {
    if (e.message.indexOf("feature") !== -1) {
      params.Text = params.Text.replace(/pitch="[^"]*"/, "");
      data = await synthesizeSpeech(polly, params);
    } else {
      params.Engine = "standard";
      data = await synthesizeSpeech(polly, params);
    }
  }
  params.SpeechMarkTypes = ["word"];
  params.OutputFormat = "json";
  let data2 = await synthesizeSpeech(polly, params);

  let content;
  if (filename) {
    //await writeStream(filename, data.AudioStream);
    let data_file = await streamToBuffer(data.AudioStream);
    await put(filename, data_file, {
      access: "public",
      addRandomSuffix: false,
    });
  } else content = await streamToBase64(data.AudioStream);

  // Handle the audio data
  let data_read2 = await streamToString(data2.AudioStream);

  let marks = [];
  for (let mark of data_read2.trim().split("\n")) marks.push(JSON.parse(mark));
  return {
    output_file: filename,
    marks: marks,
    content: content,
  };
}

async function getVoices() {
  return new Promise((resolve, reject) => {
    let polly = new Polly(config);
    polly.describeVoices({}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        let voices_result = [];
        for (let voice of data.Voices) {
          voices_result.push({
            language: voice.LanguageCode.split("-")[0],
            locale: voice.LanguageCode,
            name: voice.Id,
            gender: voice.Gender.toUpperCase(),
            type: voice.SupportedEngines[0] === "neural" ? "NEURAL" : "NORMAL",
            service: "Amazon Polly",
          });
        }
        resolve(voices_result);
      }
    });
  });
}
async function isValidVoice(voice) {
  return voice.indexOf("-") === -1;
}

async function getVoiceData(voice) {
  return (await sql`SELECT * FROM speaker WHERE speaker = ${voice}`)[0];
}

export default {
  name: "polly",
  synthesizeSpeech: synthesizeSpeechPolly,
  getVoices: getVoices,
  isValidVoice: isValidVoice,
};
