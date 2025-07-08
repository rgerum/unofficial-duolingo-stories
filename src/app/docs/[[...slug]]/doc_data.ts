import fs from "node:fs/promises";
import React from "react";

const basefolder = "public/docs";

export async function getPageData(path: string) {
  try {
    const res = await fs.readFile(basefolder + "/" + path + ".mdx", "utf8");
    const data = res.split("---");
    const metadata: Record<string, string> = {};
    for (const line of data[1].split("\n")) {
      const pos = line.indexOf(":");
      if (pos === -1) continue;
      const key = line.slice(0, pos).trim();
      const value = line.slice(pos + 1).trim();
      metadata[key.trim()] = (value.match(/\s*"(.*)"\s*/) || ["", ""])[1];
    }
    metadata.body = data[2];
    return metadata;
  } catch {
    return { title: path, body: "" };
  }
}

export interface DocDataRaw {
  navigation: {
    group: string;
    pages: string[];
  }[];
}

export interface DocData {
  navigation: {
    group: string;
    pages: { slug: string; title: string }[];
  }[];
}

export const getDocsData = React.cache(async () => {
  const data = JSON.parse(await fs.readFile(basefolder + "/docs.json", "utf8"));

  for (const group of data["navigation"]) {
    const pages_new = [];
    for (const page of group.pages) {
      const d = await getPageData(page);
      pages_new.push({ slug: page, title: d.title });
    }
    group.pages = pages_new;
  }
  return data as DocData;
});
