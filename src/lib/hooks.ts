import React from "react";

export function useInput(def: string | undefined) {
  let [value, setValue] = React.useState(def ?? "");
  function set(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e?.target ? e?.target?.value : e;
    if (v === null || v === undefined) v = "";
    if (e?.target?.type === "checkbox") {
      v = e?.target?.checked;
    }
    setValue(v);
    return v;
  }
  return [value, set];
} // Hook
