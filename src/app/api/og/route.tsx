import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const fontData = await fetch(
      new URL("../../../../assets/Nunito-Regular.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    //let counts = get_counts();
    let counts = { count_stories: 0, count_courses: 0 };

    let text = `A community project to bring the original Duolingo Stories to new languages.`;
    let text2 = `${counts.count_stories} stories in ${counts.count_courses} courses and counting!`;

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "white",
            backgroundSize: "150px 150px",
            height: "100%",
            width: "100%",
            display: "flex",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            flexWrap: "nowrap",
            gap: "50px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              justifyItems: "left",
              flexDirection: "column",
              backgroundColor: "white",
              fontSize: 40,
              width: "60%",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: 80 }}>Duostories</div>
            <div style={{ textAlign: "left" }}>{text}</div>
            <div style={{ textAlign: "left" }}>{text2}</div>
          </div>
          <img
            src={"https://duostories.org/icon192.png"}
            height={"300px"}
            width="300px"
          ></img>
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
