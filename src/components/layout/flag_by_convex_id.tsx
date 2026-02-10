import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { unstable_cache } from "next/cache";
import Flag from "./flag";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

const getLanguageFlag = unstable_cache(
  async (languageId: Id<"languages">) =>
    await convex.query(api.localization.getLanguageFlagById, {
      languageId,
    }),
  ["get_langs_short_convex"],
  { tags: ["lang"], revalidate: 3600 },
);

export default async function FlagByConvexId({
  id,
  width,
  height,
}: {
  id: Id<"languages">;
  width?: number;
  height?: number;
}) {
  const language = await getLanguageFlag(id);
  if (!language) return null;
  return (
    <Flag
      iso={language.short}
      flag={language.flag}
      flag_file={language.flag_file}
      width={width}
      height={height}
    />
  );
}
