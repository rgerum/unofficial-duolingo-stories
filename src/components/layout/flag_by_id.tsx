import React from "react";
import { sql, cache } from "@/lib/db";
import Flag from "./flag";

type LanguageProps = {
  id: number;
  short: string;
  flag_file: string | null;
  flag: number | null;
};

export const get_flag_data = cache(
  async () => {
    let langs = await sql`SELECT id, short, flag_file, flag FROM language`;
    let lang_list: Record<number, LanguageProps> = {};
    for (let lang of langs) {
      lang_list[lang.id] = lang as LanguageProps;
    }
    return lang_list;
  },
  ["get_langs_short_xx"],
  { tags: ["lang"], revalidate: 3600 },
);

let get_lang = cache(async (id: number) => {
  return (await get_flag_data())[id];
});

export default async function FlagById({
  id,
  width,
  height,
}: {
  id: number;
  width?: number;
  height?: number;
}) {
  const { short, flag_file, flag } = await get_lang(id);
  return (
    <Flag
      iso={short}
      flag={flag}
      flag_file={flag_file}
      width={width}
      height={height}
    />
  );
}
