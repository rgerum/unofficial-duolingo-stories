"use client";
import React, { useState } from "react";

interface TextEditProps {
  tag: string;
  text: string | null;
  set_localization: (tag: string, text: string) => Promise<unknown>;
}

export default function TextEdit({
  tag,
  text,
  set_localization,
}: TextEditProps) {
  let [current_text, setText] = useState(text || "");
  return (
    <>
      <textarea
        value={current_text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-[5px] border border-[var(--input-border)] bg-[var(--input-background)] p-[5px] text-[17px] text-[var(--text-color)]"
      ></textarea>
      <button
        onClick={() => set_localization(tag, current_text)}
        className="mt-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] px-3 py-1"
      >
        Save
      </button>
    </>
  );
}
