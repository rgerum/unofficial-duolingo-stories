import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import fs from "fs";
import { audio_engines } from "../_lib/audio";
import { getUser } from "@/lib/userInterface";
import type { SynthesisResult } from "../_lib/audio/types";

async function mkdir(folderName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderName, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
        //console.log(`Folder '${folderName}' created successfully`);
      }
    });
  });
}

async function exists(filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(filename, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const token = await getUser();

  if (!token?.role)
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  let data = await req.json();
  let id = parseInt(data.id);
  let speaker = data.speaker;
  let text = data.text;
  let filename = undefined;
  let file;
  if (id !== 0) {
    filename = `audio/${id}`;
    try {
      await mkdir(filename);
    } catch (e) {}
    while (true) {
      file = uuid().split("-")[0] + ".mp3";
      filename += "/" + file;
      if (!(await exists(filename))) break;
    }
  }

  let answer: SynthesisResult | undefined;
  for (const engine of audio_engines) {
    if (await engine.isValidVoice(speaker)) {
      answer = await engine.synthesizeSpeech(filename, speaker, text);
      answer.engine = engine.name;
      break;
    }
  }

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  if (id !== 0) {
    answer.output_file = `${id}/` + file;
  }

  return NextResponse.json(answer);
}
