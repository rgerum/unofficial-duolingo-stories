"use client";
import React from "react";
import Part from "../_components/exercise";
import convertToComposeObject from "../_parser/convert_parts";

export default function Interactive({ text }) {
  let elements = convertToComposeObject(text);

  return (
    <>
      {elements.map((data, i) => (
        <Part key={i} active={10} data={data} />
      ))}
    </>
  );
}
