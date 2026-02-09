import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import fs from "fs";
import { put } from "@vercel/blob";
import { getUser, isContributor } from "@/lib/userInterface";

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

  if (!isContributor(token))
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  const data = await req.formData();
  const file = data.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ success: false });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const storyIdValue = data.get("story_id");
  let id = parseInt(typeof storyIdValue === "string" ? storyIdValue : "0");

  let filename = undefined;
  if (id !== 0) {
    filename = `audio/${id}`;
    try {
      await mkdir(filename);
    } catch (e) {}
    while (true) {
      const extMatch = file.name.match(/.*(\.[^.]*)/);
      let filebase = uuid().split("-")[0] + (extMatch ? extMatch[1] : "");
      filename += "/_" + filebase;
      if (!(await exists(filename))) break;
    }
    await put(filename, Buffer.from(buffer), {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, filename: filename });
  }
  return NextResponse.json({ success: false });
}
