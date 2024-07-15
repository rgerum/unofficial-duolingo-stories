import React from "react";
import styles from "./flag.module.css";
import Image from "next/image";

export default function Flag(props) {
  /**
   * A big flag button
   * @type {{flag_file: string, flag: number}}
   */
  let order = [
    "en", //0
    "es", //1
    "fr", //2
    "de", //3
    "ja", //4
    "it", //5
    "ko", //6
    "zh", //7
    "ru", //8
    "pt", //9
    "tr", //10
    "nl", //11
    "sv", //12
    "ga", //13
    "el", //14
    "he", //15
    "pl", //16
    "no", //17
    "vi", //18
    "da", //19
    "hv", //20
    "ro", //21
    "sw", //22
    "eo", //23
    "hu", //24
    "cy", //25
    "uk", //26
    "tlh", //27
    "cs", //28
    "hi", //29
    "id", //30
    "hw", //31
    "nv", //32
    "ar", //33
    "ca", //34
    "th", //35
    "gn", //36
    "world", //37
    "duo", //38
    "tools", //39
    "reader", //40
    "la", //41
    "gd", //42
    "fi", //43
    "yi", //44
    "ht", //45
    "tl", //46
    "zu", //47
  ];
  let flag = 0;
  for (let i in order) {
    if (order[i] === (props.iso || "world")) flag = i;
  }
  if (flag === 0 && !props.flag_file && props.iso !== "en") {
    // Check if there's a valid flag index, fall back to "world" flag if not
    flag = (props.flag > 0 && props.flag < 48) ? props.flag : 37; // "world"
  }

  let style = {
    width: props.width || 88,
    height: (66 / 82) * (props.width || 88),
    minWidth: props.width || 88,
  };
  return (
    <>
      <Image
        style={{
          "--flag-scale": (props.width || 88) / 82,
          "--flag_offset": flag,
        }}
        width={style.width}
        height={style.height}
        priority={true}
        className={styles.flag_image2 + " " + (props.className || "")}
        src={
          props.flag_file
            ? `https://carex.uber.space/stories/flags/${props.flag_file}`
            : "https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg"
        }
        alt={`${props.iso} flag`}
      />
    </>
  );
}

export function DoubleFlag({ lang1, lang2, width, onClick, className }) {
  if (!lang2) {
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
      </>
    );
  }
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
