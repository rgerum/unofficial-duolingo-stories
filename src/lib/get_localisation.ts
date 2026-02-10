import get_localisation_func from "@/lib/get_localisation_func";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { unstable_cache } from "next/cache";
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

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

const get_localisation_entries_by_convex_language_id = unstable_cache(
  async (langId: Id<"languages">) =>
    (await convex.query(
      (api as any).localization.getLocalizationWithEnglishFallback,
      { languageId: langId },
    )) as Array<{ tag: string; text: string }>,
  ["localisation_dict_convex"],
  { tags: ["localisation"], revalidate: 3600 },
);

export const get_localisation_dict_by_convex_language_id = async (
  langId: Id<"languages">,
) => {
  const rows = await get_localisation_entries_by_convex_language_id(langId);
  const data: Record<string, string> = {};
  for (const row of rows) data[row.tag] = row.text;
  return data;
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

export async function get_localisation_by_convex_language_id(
  langId: Id<"languages">,
) {
  const data = await get_localisation_dict_by_convex_language_id(langId);
  return get_localisation_func(data) as LocalisationFunc;
}
