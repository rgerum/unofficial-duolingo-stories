import query from "lib/db";
import get_localisation_func from "lib/get_localisation_func";
import { unstable_cache } from "next/cache";
import { sql } from "./db";

//export async function get_localisation_dict(lang) {
export const get_localisation_dict = unstable_cache(
  async (lang) => {
    if (!lang) return {};
    let result =
      await sql`SELECT tag, text FROM localization WHERE language_id = ${lang}`;
    let data = {};
    for (let d of result) {
      data[d.tag] = d.text;
    }
    return data;
  },
  ["get_localisation_dictx"],
);

export default async function get_localisation(lang) {
  let data = await get_localisation_dict(lang);
  return get_localisation_func(data);
}
