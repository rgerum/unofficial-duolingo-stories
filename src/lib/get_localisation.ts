import get_localisation_func from "@/lib/get_localisation_func";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const get_localisation_dict = async (lang: number) => {
  if (!lang) return {};
  const rows = await get_localisation_entries_by_legacy_language_id(lang);
  const data: Record<string, string> = {};
  for (const row of rows) data[row.tag] = row.text;
  return data;
};

const convexUrl = process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL ?? "";
if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL/CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

async function get_localisation_entries_by_convex_language_id(
  langId: Id<"languages">,
) {
  return await convex.query(
    api.localization.getLocalizationWithEnglishFallback,
    {
      languageId: langId,
    },
  );
}

async function get_localisation_entries_by_legacy_language_id(
  legacyLanguageId: number,
) {
  return await convex.query(
    api.localization.getLocalizationByLegacyLanguageId,
    {
      legacyLanguageId,
    },
  );
}

const get_localisation_dict_by_convex_language_id = async (
  langId: Id<"languages">,
) => {
  const rows = await get_localisation_entries_by_convex_language_id(langId);
  const data: Record<string, string> = {};
  for (const row of rows) data[row.tag] = row.text;
  return data;
};

export async function get_localisation_by_convex_language_id(
  langId: Id<"languages">,
) {
  const data = await get_localisation_dict_by_convex_language_id(langId);
  return get_localisation_func(data);
}
