import React from "react";
import Flag from "@/components/layout/flag.tsx";

export default function FlagName({
  lang,
  languages,
}: {
  lang: string;
  languages: any;
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
