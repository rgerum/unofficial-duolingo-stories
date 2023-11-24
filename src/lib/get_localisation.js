import query from "lib/db";
import get_localisation_func from "lib/get_localisation_func";

export async function get_localisation_dict(lang) {
  if (!lang) return {};
  let result = await query(
    `SELECT tag, text FROM localization WHERE language_id = ?`,
    [lang],
  );
  let data = {};
  for (let d of result) {
    data[d.tag] = d.text;
  }
  return data;
}

export default async function get_localisation(lang) {
  let data = await get_localisation_dict(lang);
  return get_localisation_func(data);
}
