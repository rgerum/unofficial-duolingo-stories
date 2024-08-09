import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { v4 as uuid } from "uuid";
let fs = require("fs");
import { put } from "@vercel/blob";

async function mkdir(folderName) {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderName, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
        console.log(`Folder '${folderName}' created successfully`);
      }
    });
  });
}

async function exists(filename) {
  return new Promise((resolve) => {
    fs.access(filename, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function POST(req) {
  const token = await getToken({ req });

  if (!token?.role)
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  const data = await req.formData();
  const file = data.get("file");

  if (!file) {
    return NextResponse.json({ success: false });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  let id = parseInt(data.get("story_id"));

  let filename = undefined;
  if (id !== 0) {
    filename = `audio/${id}`;
    try {
      await mkdir(filename);
    } catch (e) {}
    while (true) {
      let filebase = uuid().split("-")[0] + file.name.match(/.*(\.[^.]*)/)[1];
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
