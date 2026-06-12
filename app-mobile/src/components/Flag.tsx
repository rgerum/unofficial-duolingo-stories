import React from "react";
import { View } from "react-native";
import { SvgCss } from "react-native-svg/css";
import { useSvgXml } from "./RemoteSvg";

// Port of the web's Flag component (src/components/ui/flag.tsx): most flags
// come from a vertical sprite sheet of nested <svg> cells; languages with a
// custom flag use an SVG from duostories.org/flags/.
//
// react-native-svg can't render the sprite's nested <svg> elements, so the
// sprite is fetched once and the requested cell is extracted as a standalone
// SVG document.
const SPRITE_URL =
  "https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg";
const CUSTOM_FLAG_BASE = "https://duostories.org/flags";

const ORDER = [
  "en", "es", "fr", "de", "ja", "it", "ko", "zh", "ru", "pt", "tr", "nl",
  "sv", "ga", "el", "he", "pl", "no", "vi", "da", "hv", "ro", "sw", "eo",
  "hu", "cy", "uk", "tlh", "cs", "hi", "id", "hw", "nv", "ar", "ca", "th",
  "gn", "world", "duo", "tools", "reader", "la", "gd", "fi", "yi", "ht",
  "tl", "zu",
];

const cellCache = new Map<number, string>();

/** Extracts the index-th nested <svg> cell of the sprite as its own document. */
function extractSpriteCell(spriteXml: string, index: number): string | null {
  const cached = cellCache.get(index);
  if (cached) return cached;

  const cells: string[] = [];
  // Skip the outer <svg>, then collect each nested <svg>…</svg> block.
  let pos = spriteXml.indexOf("<svg", spriteXml.indexOf("<svg") + 1);
  while (pos !== -1) {
    let depth = 0;
    let i = pos;
    let end = -1;
    while (i < spriteXml.length) {
      const open = spriteXml.indexOf("<svg", i);
      const close = spriteXml.indexOf("</svg>", i);
      if (close === -1) break;
      if (open !== -1 && open < close) {
        depth += 1;
        i = open + 4;
      } else {
        depth -= 1;
        i = close + 6;
        if (depth === 0) {
          end = close + 6;
          break;
        }
      }
    }
    if (end === -1) break;
    cells.push(spriteXml.slice(pos, end));
    if (cells.length > index) break;
    pos = spriteXml.indexOf("<svg", end);
  }

  const cell = cells[index];
  if (!cell) return null;
  // Drop the sprite-sheet offset so the cell renders at the origin.
  const standalone = cell
    .replace(/^(<svg[^>]*?)\sx="[^"]*"/, "$1")
    .replace(/^(<svg[^>]*?)\sy="[^"]*"/, "$1");
  cellCache.set(index, standalone);
  return standalone;
}

export function Flag({
  iso,
  flag,
  flag_file,
  width = 44,
}: {
  iso?: string;
  flag?: number | string;
  flag_file?: string;
  width?: number;
}) {
  const spriteXml = useSvgXml(flag_file ? undefined : SPRITE_URL);
  const customXml = useSvgXml(
    flag_file ? `${CUSTOM_FLAG_BASE}/${flag_file}` : undefined,
  );

  if (flag_file) {
    const height = Math.round((width * 62) / 78);
    return (
      <View style={{ width, height }}>
        {customXml && <SvgCss xml={customXml} width={width} height={height} />}
      </View>
    );
  }

  let index = 0;
  if (iso) {
    const found = ORDER.indexOf(iso);
    if (found >= 0) index = found;
  }
  if (index === 0 && iso !== "en") {
    const numericFlag = typeof flag === "number" ? flag : Number(flag);
    index =
      Number.isFinite(numericFlag) && numericFlag > 0 && numericFlag < 48
        ? numericFlag
        : 37; // "world" fallback
  }

  const height = Math.round((width * 66) / 82);
  const cellXml = spriteXml ? extractSpriteCell(spriteXml, index) : null;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: (16 * width) / 82,
        overflow: "hidden",
      }}
    >
      {cellXml && <SvgCss xml={cellXml} width={width} height={height} />}
    </View>
  );
}
