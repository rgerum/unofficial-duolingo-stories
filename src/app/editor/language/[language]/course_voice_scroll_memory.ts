import type { MobileVoiceSection } from "./course_voice_layout_classes";

type ScrollTarget = {
  scrollTop: number;
};

export function createCourseVoiceSectionScrollMemory(
  initialSection: MobileVoiceSection,
) {
  const positions: Record<MobileVoiceSection, number> = {
    cast: 0,
    voices: 0,
  };
  let pendingRestore: MobileVoiceSection | null = initialSection;

  return {
    remember(section: MobileVoiceSection, target: ScrollTarget) {
      positions[section] = target.scrollTop;
    },
    restore(section: MobileVoiceSection, target: ScrollTarget) {
      target.scrollTop = positions[section];
    },
    requestRestore(section: MobileVoiceSection) {
      pendingRestore = section;
    },
    restorePending(section: MobileVoiceSection, target: ScrollTarget) {
      if (pendingRestore !== section) return false;

      pendingRestore = null;
      target.scrollTop = positions[section];
      return true;
    },
  };
}
