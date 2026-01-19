"use client";
import React, { useState } from "react";

interface TextEditProps {
  tag: string;
  text: string | null;
  set_localization: (tag: string, text: string) => Promise<unknown>;
}

export default function TextEdit({ tag, text, set_localization }: TextEditProps) {
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
