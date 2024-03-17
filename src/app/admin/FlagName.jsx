import React from "react";
import Flag from "../../components/layout/flag";

export default function FlagName({ lang, languages }) {
  return (
    <>
      <Flag
        iso={languages[lang].short}
        width={40}
        flag={languages[lang].flag}
        flag_file={languages[lang].flag_file}
      />
      {languages[lang].name}
    </>
  );
}
