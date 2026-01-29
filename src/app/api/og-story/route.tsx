import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fontData = await fetch(
      new URL("../../../../assets/Nunito-Regular.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const imageUrl = new URL("./og_background.png", import.meta.url).toString();

    return new ImageResponse(
      <div
        style={{
          height: "70%",
          width: "100%",
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          flexWrap: "nowrap",
          gap: "30px",
        }}
      >
        <img
          style={{
            position: "absolute",
            left: 0,
            top: 0,
          }}
          height="630px"
          width="1200px"
          src={imageUrl}
          alt=""
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            justifyItems: "left",
            flexDirection: "column",
            fontSize: 40,
            width: "60%",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: 80 }}>
            {searchParams.get("title") ?? "Good morning"}
          </div>
          <div style={{ textAlign: "left" }}>
            {`${searchParams.get("name") ?? "Language"} story on duostories.org`}
          </div>
        </div>
        <img
          src={`https://stories-cdn.duolingo.com/image/${searchParams.get("image") ?? "783305780a6dad8e0e4eb34109d948e6a5fc2c35"}.svg`}
          height={290}
          width={300}
          alt=""
        />
      </div>,
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
    //console.log(`${e instanceof Error ? e.message : String(e)}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
