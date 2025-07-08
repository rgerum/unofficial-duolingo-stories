import get_localisation_func from "@/lib/get_localisation_func";
import { sql, cache } from "./db";

export const get_localisation_dict_all = cache(
  async () => {
    let result = await sql`SELECT tag, text, language_id FROM localization`;
    let data: Record<number, Record<string, string>> = {};
    for (let d of result) {
      if (data[d.language_id] === undefined) {
        data[d.language_id] = {};
      }
      data[d.language_id][d.tag] = d.text;
    }
    return data;
  },
  ["localisation_dict_all"],
  { tags: ["localisation"] },
);

export const get_localisation_dict = async (lang: number) => {
  if (!lang) return {};
  let data = await get_localisation_dict_all();
  return data[lang];
};

export type LocalisationFunc = (
  tag: string,
  replacements?: Record<string, string>,
  links?: string[],
) => string | React.JSX.Element | undefined;

export default async function get_localisation(lang: number) {
  let data = await get_localisation_dict(lang);
  if (lang !== 1) {
    data = {
      ...(await get_localisation_dict(1)),
      ...data,
    };
  }
  return get_localisation_func(data) as LocalisationFunc;
}
