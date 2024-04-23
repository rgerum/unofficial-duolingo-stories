"use client";
import React, { useState } from "react";

export default function TextEdit({ tag, text, set_localization }) {
  let [current_text, setText] = useState(text || "");
  return (
    <>
      <textarea
        value={current_text}
        onChange={(e) => setText(e.target.value)}
        className="text"
      ></textarea>
      <button
        onClick={() => set_localization(tag, current_text)}
        className="button"
      >
        Save
      </button>
    </>
  );
}
