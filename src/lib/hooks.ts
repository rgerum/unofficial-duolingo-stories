import React from "react";

export function useInput(
  def: string | undefined,
): [string, (e: React.ChangeEvent<HTMLInputElement>) => string] {
  const [value, setValue] = React.useState(def ?? "");
  function set(e: React.ChangeEvent<HTMLInputElement>): string {
    let v: string;
    if (e?.target?.type === "checkbox") {
      v = String(e?.target?.checked);
    } else {
      v = e?.target?.value ?? "";
    }
    setValue(v);
    return v;
  }
  return [value, set];
}
