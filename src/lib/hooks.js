import React from "react";

export function useInput(def) {
  let [value, setValue] = React.useState(def);
  function set(e) {
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
