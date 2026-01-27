import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
export const runtime = "edge";

function get_flag_id(iso: string | null): number {
  const order = [
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
  for (let i = 0; i < order.length; i++) {
    if (order[i] === (iso || "world")) flag = i;
  }
  return flag;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fontData = await fetch(
      new URL("../../../../assets/Nunito-Regular.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const flag_offset = get_flag_id(searchParams.get("lang"));
    const flag_scale = 3;

    const imageUrl = new URL("./og_background.png", import.meta.url).toString();

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "white",
            backgroundSize: "150px 150px",
            height: "100%",
            width: "100%",
            display: "flex",
            textAlign: "left",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            flexDirection: "column",
            flexWrap: "nowrap",
          }}
        >
          <img
            style={{
              position: "absolute",
              left: 0,
              top: 0,
            }}
            height="100%"
            width="100%"
            src={imageUrl}
            alt=""
          />
          <div
            style={{
              position: "absolute",
              left: 32,
              top: 32,
              width: 82 * flag_scale,
              height: 66 * flag_scale,
              backgroundPosition: `0px -${66 * flag_offset * flag_scale}px`,
              backgroundColor: "#f5f5f5",
              backgroundSize: `${82 * flag_scale}px ${3168 * flag_scale}px`,
              backgroundImage:
                "url(https://d35aaqx5ub95lt.cloudfront.net/vendor/87938207afff1598611ba626a8c4827c.svg)",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: 32 + 32 + 82 * flag_scale,
              top: 64 - 16,
              fontSize: 82,
            }}
          >
            {searchParams.get("name") ?? "Language"}
          </div>
          <div
            style={{
              position: "absolute",
              left: 32 + 32 + 82 * flag_scale,
              top: 64 + 82,
              fontSize: "40px",
              fontWeight: 300,
            }}
          >
            on Duostories.org
          </div>
          <div
            style={{
              position: "absolute",
              left: 64,
              top: 40 + 30 + 66 * flag_scale,
              fontSize: "40px",
            }}
          >
            {`${searchParams.get("count") ?? "4"} community translated stories`}
          </div>

          <div
            style={{
              fontSize: 60,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              color: "black",
              marginTop: 30,
              padding: "0 120px",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          ></div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Nunito",
            data: fontData,
            style: "normal",
          },
        ],
      },
    );
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : String(e)}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
