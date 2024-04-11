import fs from "node:fs/promises";
import React from "react";

const basefolder = "public/docs";

export async function getPageData(path) {
  try {
    const res = await fs.readFile(basefolder + "/" + path + ".mdx", "utf8");
    let data = res.split("---");
    let metadata = {};
    for (let line of data[1].split("\n")) {
      let pos = line.indexOf(":");
      if (pos === -1) continue;
      let key = line.slice(0, pos).trim();
      let value = line.slice(pos + 1).trim();
      metadata[key.trim()] = value.match(/\s*"(.*)"\s*/)[1];
    }
    metadata.body = data[2];
    return metadata;
  } catch (e) {
    return { title: path, body: "" };
  }
}

export async function GetDocsData() {
  return JSON.parse(await fs.readFile(basefolder + "/docs.json", "utf8"));
}

export const getDocsData = React.cache(async () => {
  const data = JSON.parse(await fs.readFile(basefolder + "/docs.json", "utf8"));

  for (let group of data.navigation) {
    const pages_new = [];
    for (let page of group.pages) {
      const d = await getPageData(page);
      pages_new.push({ slug: page, title: d.title });
    }
    group.pages = pages_new;
  }
  return data;
});
