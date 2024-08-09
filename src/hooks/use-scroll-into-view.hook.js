import React, { useEffect } from "react";

export default function useScrollIntoView(condition) {
  const ref = React.useRef();

  useEffect(() => {
    if (condition)
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [condition]);
  return ref;
}
