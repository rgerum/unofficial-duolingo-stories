import get_localisation_func from "lib/get_localisation_func";
import { sql } from "./db";
import { cache } from "react";

export const get_localisation_dict = cache(async (lang) => {
  if (!lang) return {};
  let result = await sql`SELECT l.tag, COALESCE(l2.text, l.text) AS text
FROM localization l
LEFT JOIN localization l2 ON l.tag = l2.tag AND l2.language_id = ${lang}
WHERE l.language_id = 1;`;
  let data = {};
  for (let d of result) {
    data[d.tag] = d.text;
  }
  return data;
});

export default async function get_localisation(lang) {
  let data = await get_localisation_dict(lang);
  return get_localisation_func(data);
}
