"use client";
import React from "react";
import { convertToComposeObject } from "../[lesson_id]/convert_parts";
import Part from "../_components/exercise";

export default function Interactive({ text }) {
  console.log("text", text);
  let elements = convertToComposeObject(text);

  return (
    <>
      {elements.map((data, i) => (
        <Part key={i} active={10} data={data} />
      ))}
    </>
  );
}
