import React from "react";
import Flag from "@/components/layout/flag";

export default function FlagName({
  lang,
  languages,
}: {
  lang: number;
  languages: Record<
    number,
    {
      short: string;
      flag: number | null;
      flag_file: string | null;
      name: string | null;
    }
  >;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Flag
        iso={languages[lang].short}
        width={40}
        flag={languages[lang].flag}
        flag_file={languages[lang].flag_file}
      />
      {languages[lang].name}
    </div>
  );
}
