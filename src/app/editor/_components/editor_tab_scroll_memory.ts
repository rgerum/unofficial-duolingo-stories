type ScrollTarget = {
  scrollTop: number;
};

export function createEditorTabScrollMemory<Section extends string>(
  initialSection: Section,
) {
  const positions = new Map<Section, number>();
  let pendingRestore: Section | null = initialSection;

  return {
    remember(section: Section, target: ScrollTarget) {
      positions.set(section, target.scrollTop);
    },
    restore(section: Section, target: ScrollTarget) {
      target.scrollTop = positions.get(section) ?? 0;
    },
    requestRestore(section: Section) {
      pendingRestore = section;
    },
    restorePending(section: Section, target: ScrollTarget) {
      if (pendingRestore !== section) return false;

      pendingRestore = null;
      target.scrollTop = positions.get(section) ?? 0;
      return true;
    },
  };
}
