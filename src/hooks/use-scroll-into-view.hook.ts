import React, { useEffect } from "react";

export default function useScrollIntoView(condition: boolean) {
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (condition && ref.current)
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [condition]);
  return ref;
}
