import React from "react";
import { sql, cache } from "@/lib/db";
import Flag from "./flag";
import { LanguageProps } from "@/app/editor/(course)/db_get_course_editor";

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
  console.log("get_lang", await get_flag_data());
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
  console.log("FlagById", id, short, flag_file, flag);
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
