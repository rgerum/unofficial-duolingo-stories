import React from "react";
import styles from "./flag.module.css";
import { sql, cache } from "lib/db";
import Flag from "./flag";

export const get_flag_data = cache(
  async () => {
    let langs =
      await sql`SELECT id, short AS iso, flag_file, flag FROM language`;
    let lang_list = {};
    for (let lang of langs) {
      lang_list[lang.id] = lang;
    }
    return lang_list;
  },
  ["get_langs"],
  { tags: ["lang"] },
);

let get_lang = cache(async (id) => {
  return (await get_flag_data())[id];
});

export default async function FlagById({ id, ...props }) {
  /**
   * A big flag button
   * @type {{flag_file: string, flag: number}}
   */
  let { iso, flag_file } = await get_lang(id);
  return <Flag iso={iso} flag_file={flag_file} {...props} />;
}

export function DoubleFlag({ lang1, lang2, width, onClick, className }) {
  return (
    <>
      <Flag
        iso={lang1?.short}
        flag={lang1?.flag}
        flag_file={lang1?.flag_file}
        width={width}
        onClick={onClick}
        className={className}
      />
      <Flag
        iso={lang2?.short}
        flag={lang2?.flag}
        flag_file={lang2?.flag_file}
        width={width * 0.9}
        onClick={onClick}
        className={className + " " + styles.flag_sub}
      />
    </>
  );
}
