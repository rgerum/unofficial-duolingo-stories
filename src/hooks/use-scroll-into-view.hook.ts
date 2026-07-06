import React, { useEffect } from "react";

export default function useScrollIntoView(condition: boolean) {
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!condition || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const header = document.querySelector("[data-story-header-progress]");
    const footer = document.querySelector("[data-story-footer]");
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
    const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
    const availableHeight = Math.max(0, footerTop - headerBottom);
    const targetTop =
      window.scrollY +
      rect.top -
      headerBottom -
      Math.max(0, (availableHeight - rect.height) / 2);

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }, [condition]);
  return ref;
}
