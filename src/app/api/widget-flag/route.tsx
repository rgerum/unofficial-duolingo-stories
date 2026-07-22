import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Order of flags in the Duolingo CloudFront sprite sheet. Mirrors the
// client Flag components (src/components/ui/flag.tsx, app-mobile Flag.tsx)
// and the og-course route so the widget flag matches the rest of the site.
const FLAG_ORDER = [
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

const SPRITE_URL =
  "https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg";
const CUSTOM_FLAG_BASE = "https://duostories.org/flags";
const SQUARE_CUSTOM_FLAG_FILES = new Set(["flag_gsw.svg"]);

function getFlagId(iso: string | null, flag: number | null): number {
  let index = 0;
  if (iso) {
    const found = FLAG_ORDER.indexOf(iso);
    if (found >= 0) index = found;
  }
  if (index === 0 && iso !== "en") {
    index =
      flag !== null && Number.isInteger(flag) && flag > 0 && flag < 48
        ? flag
        : 37; // "world" fallback
  }
  return index;
}

// Rendered at 3x the sprite's base cell so the widget can downscale crisply.
const SCALE = 3;
const CELL_W = 82 * SCALE;
const CELL_H = 66 * SCALE;
const RADIUS = 16 * SCALE;
const SPRITE_TOTAL_H = 66 * 48 * SCALE;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flagFile = searchParams.get("flag_file");
    const iso = searchParams.get("lang");
    const flagParam = searchParams.get("flag");
    const flagNumber = flagParam !== null ? Number(flagParam) : null;

    if (flagFile) {
      const isSquare = SQUARE_CUSTOM_FLAG_FILES.has(flagFile);
      const width = isSquare ? CELL_H : CELL_W;
      return new ImageResponse(
        <div
          style={{
            display: "flex",
            width,
            height: CELL_H,
            borderRadius: RADIUS,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${CUSTOM_FLAG_BASE}/${flagFile}`}
            width={width}
            height={CELL_H}
            alt=""
          />
        </div>,
        { width, height: CELL_H },
      );
    }

    const flagOffset = getFlagId(
      iso,
      Number.isFinite(flagNumber) ? (flagNumber as number) : null,
    );

    // Satori ignores backgroundPosition offsets, so crop the sprite by
    // rendering it as a full-height <img> shifted up inside a clipped box.
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: CELL_W,
          height: CELL_H,
          borderRadius: RADIUS,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SPRITE_URL}
          width={CELL_W}
          height={SPRITE_TOTAL_H}
          style={{
            position: "absolute",
            left: 0,
            top: -CELL_H * flagOffset,
          }}
          alt=""
        />
      </div>,
      { width: CELL_W, height: CELL_H },
    );
  } catch {
    return new Response("Failed to generate the flag", { status: 500 });
  }
}
