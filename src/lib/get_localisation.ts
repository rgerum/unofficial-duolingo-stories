import get_localisation_func from "@/lib/get_localisation_func";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { unstable_cache } from "next/cache";

export const get_localisation_dict = async (lang: number) => {
  if (!lang) return {};
  const rows = await get_localisation_entries_by_legacy_language_id(lang);
  const data: Record<string, string> = {};
  for (const row of rows) data[row.tag] = row.text;
  return data;
};

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

const get_localisation_entries_by_convex_language_id = unstable_cache(
  async (langId: Id<"languages">) =>
    await convex.query(api.localization.getLocalizationWithEnglishFallback, {
      languageId: langId,
    }),
  ["localisation_dict_convex"],
  { tags: ["localisation"], revalidate: 3600 },
);

const get_localisation_entries_by_legacy_language_id = unstable_cache(
  async (legacyLanguageId: number) =>
    await convex.query(api.localization.getLocalizationByLegacyLanguageId, {
      legacyLanguageId,
    }),
  ["localisation_dict_legacy"],
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
  return get_localisation_func(data);
}

export async function get_localisation_by_convex_language_id(
  langId: Id<"languages">,
) {
  const data = await get_localisation_dict_by_convex_language_id(langId);
  return get_localisation_func(data);
}
