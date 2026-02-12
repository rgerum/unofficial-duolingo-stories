// Load the AWS SDK for Node.js
import {
  Polly,
  SynthesizeSpeechInput,
  SynthesizeSpeechOutput,
  DescribeVoicesOutput,
} from "@aws-sdk/client-polly";
import { put } from "@vercel/blob";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { SynthesisResult, Voice, TTSEngine, SpeakerData } from "./types";
import type { Readable } from "stream";

// Set the region and credentials for the AWS SDK
const config = {
  region: "eu-central-1",
};

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";

const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

async function synthesizeSpeechCall(
  polly: Polly,
  params: SynthesizeSpeechInput,
): Promise<SynthesizeSpeechOutput> {
  return new Promise((resolve, reject) => {
    polly.synthesizeSpeech(
      params,
      function (err: Error | null, data?: SynthesizeSpeechOutput) {
        if (err) {
          console.error("[Polly] synthesizeSpeech error:", err.message);
          return reject(err);
        }
        resolve(data!);
      },
    );
  });
}

function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function streamToBase64(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
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

async function synthesizeSpeechPolly(
  filename: string | undefined,
  voice_id: string,
  text: string,
): Promise<SynthesisResult> {
  console.log("[Polly] Starting synthesis for voice:", voice_id);

  // Create an instance of the Polly service object
  const polly = new Polly(config);

  text = text.replace(/^<speak>/, "");
  text = text.replace(/<\/speak>$/, "");
  text = text.replace(/pitch="medium"/, "");

  const voice_data = await getVoiceData(voice_id);
  console.log("[Polly] Voice data from DB:", voice_data);

  // Set the parameters for the synthesis request
  const params: SynthesizeSpeechInput = {
    OutputFormat: "mp3",
    Text: `<speak>${text}</speak>`,
    VoiceId: voice_id as SynthesizeSpeechInput["VoiceId"],
    TextType: "ssml",
    Engine: voice_data?.type === "NEURAL" ? "neural" : "standard",
  };
  console.log("[Polly] Synthesis params:", { ...params, Text: params.Text?.substring(0, 100) + "..." });

  // Call the synthesizeSpeech method to generate the audio
  let data: SynthesizeSpeechOutput;
  try {
    data = await synthesizeSpeechCall(polly, params);
    console.log("[Polly] Synthesis successful");
  } catch (e) {
    console.error("[Polly] Initial synthesis failed:", e instanceof Error ? e.message : e);
    if (e instanceof Error && e.message.indexOf("feature") !== -1) {
      console.log("[Polly] Retrying without pitch attribute");
      params.Text = params.Text!.replace(/pitch="[^"]*"/, "");
      data = await synthesizeSpeechCall(polly, params);
    } else {
      console.log("[Polly] Retrying with standard engine");
      params.Engine = "standard";
      data = await synthesizeSpeechCall(polly, params);
    }
  }

  const params2: SynthesizeSpeechInput = {
    ...params,
    SpeechMarkTypes: ["word"],
    OutputFormat: "json",
  };
  const data2 = await synthesizeSpeechCall(polly, params2);

  let content: string | undefined;
  if (filename) {
    const data_file = await streamToBuffer(data.AudioStream as Readable);
    await put(filename, data_file, {
      access: "public",
      addRandomSuffix: false,
    });
  } else {
    content = await streamToBase64(data.AudioStream as Readable);
  }

  // Handle the audio data
  const data_read2 = await streamToString(data2.AudioStream as Readable);

  const marks = [];
  for (const mark of data_read2.trim().split("\n")) {
    marks.push(JSON.parse(mark));
  }
  return {
    output_file: filename,
    marks: marks,
    content: content,
  };
}

async function getVoices(): Promise<Voice[]> {
  return new Promise((resolve, reject) => {
    const polly = new Polly(config);
    polly.describeVoices(
      {},
      (err: Error | null, data?: DescribeVoicesOutput) => {
        if (err) {
          reject(err);
        } else {
          const voices_result: Voice[] = [];
          for (const voice of data?.Voices ?? []) {
            voices_result.push({
              language: voice.LanguageCode?.split("-")[0] ?? "",
              locale: voice.LanguageCode ?? "",
              name: voice.Id ?? "",
              gender: (voice.Gender?.toUpperCase() ?? "MALE") as
                | "MALE"
                | "FEMALE",
              type:
                voice.SupportedEngines?.[0] === "neural" ? "NEURAL" : "NORMAL",
              service: "Amazon Polly",
            });
          }
          resolve(voices_result);
        }
      },
    );
  });
}

function isValidVoice(voice: string): boolean {
  return voice.indexOf("-") === -1;
}

async function getVoiceData(voice: string): Promise<SpeakerData | undefined> {
  if (!convex) return undefined;
  const speaker = await convex.query(api.audioRead.getSpeakerByName, {
    speaker: voice,
  });
  if (!speaker) return undefined;

  return {
    id: speaker.id,
    speaker: speaker.speaker,
    type:
      speaker.type === "NEURAL" || speaker.type === "NORMAL"
        ? speaker.type
        : "NORMAL",
    gender: speaker.gender,
    service: speaker.service,
  };
}

const pollyEngine: TTSEngine = {
  name: "polly",
  synthesizeSpeech: synthesizeSpeechPolly,
  getVoices: getVoices,
  isValidVoice: isValidVoice,
};

export default pollyEngine;
