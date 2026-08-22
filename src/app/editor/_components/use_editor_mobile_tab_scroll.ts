"use client";

import React from "react";
import { createEditorTabScrollMemory } from "./editor_tab_scroll_memory";
import { getEditorMainScrollContainer } from "./editor_scroll_container";

export function useEditorMobileTabScroll<Section extends string>({
  enabled,
  selectedSection,
  onSectionSelect,
}: {
  enabled: boolean;
  selectedSection: Section;
  onSectionSelect: (section: Section) => void;
}) {
  const [scrollMemory] = React.useState(() =>
    createEditorTabScrollMemory(selectedSection),
  );

  React.useLayoutEffect(() => {
    if (!enabled || !window.matchMedia("(max-width: 975px)").matches) {
      return;
    }

    const scrollTarget = getEditorMainScrollContainer();
    if (
      !scrollTarget ||
      !scrollMemory.restorePending(selectedSection, scrollTarget)
    ) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      scrollMemory.restore(selectedSection, scrollTarget);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [enabled, scrollMemory, selectedSection]);

  return (section: Section) => {
    if (section === selectedSection) return;

    const scrollTarget = getEditorMainScrollContainer();
    if (scrollTarget) {
      scrollMemory.remember(selectedSection, scrollTarget);
    }
    scrollMemory.requestRestore(section);
    onSectionSelect(section);
  };
}
