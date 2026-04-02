import React from "react";
import Image from "next/image";

export default function Flag(props: {
  width?: number | undefined;
  height?: number | undefined;
  iso?: string;
  flag_file?: string | null;
  flag?: number | null;
  priority?: boolean;
  loading?: "lazy" | "eager";
  className?: string;
}) {
  let flag = 0;
  const order = [
    "en",
    "es",
    "fr",
    "de",
    "ja",
    "it",
    "ko",
    "zh",
    "ru",
    "pt",
    "tr",
    "nl",
    "sv",
    "ga",
    "el",
    "he",
    "pl",
    "no",
    "vi",
    "da",
    "hv",
    "ro",
    "sw",
    "eo",
    "hu",
    "cy",
    "uk",
    "tlh",
    "cs",
    "hi",
    "id",
    "hw",
    "nv",
    "ar",
    "ca",
    "th",
    "gn",
    "world",
    "duo",
    "tools",
    "reader",
    "la",
    "gd",
    "fi",
    "yi",
    "ht",
    "tl",
    "zu",
  ];
  if (props.iso) {
    for (const [index, value] of order.entries()) {
      if (value === (props.iso || "world")) {
        flag = index;
      }
    }
  }
  if (flag === 0 && !props.flag_file && props.iso !== "en") {
    flag = props.flag && props.flag > 0 && props.flag < 48 ? props.flag : 37;
  }

  const width = props.width || 88;
  const scale = width / 82;
  const height = (66 / 82) * width;
  const isCustomFlag = Boolean(props.flag_file);
  const customScale = width / 88;
  const outlineWidth = isCustomFlag ? 7 * customScale : 5 * scale;
  const outlineOffset = isCustomFlag ? -6 * customScale : -6 * scale;
  const flagImageStyle: React.CSSProperties = {
    width,
    height,
    minWidth: width,
    objectFit: "cover",
    objectPosition: `0 ${-66 * scale * flag}px`,
    outline: `${outlineWidth}px solid var(--body-background)`,
    outlineOffset: `${outlineOffset}px`,
    borderRadius: `${16 * scale}px`,
    display: "block",
    flexShrink: 0,
  };

  return (
    <Image
      style={flagImageStyle}
      width={width}
      height={height}
      priority={props.priority === true}
      loading={props.loading}
      className={props.className || ""}
      src={
        props.flag_file
          ? `/flags/${props.flag_file}`
          : "https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg"
      }
      alt={props.iso ? `${props.iso} flag` : "Language flag"}
    />
  );
}
