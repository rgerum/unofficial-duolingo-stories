import get_localisation_func from "@/lib/get_localisation_func";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cacheLife, cacheTag } from "next/cache";

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

// Remote cache: there are only a few dozen languages, but every story page
// render needs one, and plain `use cache` entries don't survive across
// serverless invocations. Writes revalidate the "localization" tag
// (convex/localizationWrite.ts), so the lifetime is only a fallback - and it
// must be long, because it caps how long the story pages using it stay cached.
async function get_localisation_entries_by_convex_language_id(
  langId: Id<"languages">,
) {
  "use cache: remote";
  cacheLife("weeks");
  cacheTag("localization");
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
  "use cache: remote";
  cacheLife("weeks");
  cacheTag("localization");
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
