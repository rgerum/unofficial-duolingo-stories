export type MobileVoiceSection = "cast" | "voices";

export function getCourseVoiceLayoutClassNames({
  mobileCourseLayout,
  selectedSection,
}: {
  mobileCourseLayout: boolean;
  selectedSection: MobileVoiceSection;
}) {
  if (mobileCourseLayout) {
    return {
      voices: `w-full min-[976px]:h-[calc(100vh-64px)] min-[976px]:w-[400px] min-[976px]:overflow-y-scroll ${
        selectedSection === "voices" ? "" : "max-[975px]:hidden"
      }`,
      voiceList:
        "min-[976px]:h-[calc(100%-110px)] min-[976px]:overflow-y-scroll",
      cast: `w-full min-[976px]:ml-2 min-[976px]:h-[calc(100vh-64px)] min-[976px]:w-[calc(100vw-400px)] min-[976px]:overflow-y-scroll ${
        selectedSection === "cast" ? "" : "max-[975px]:hidden"
      }`,
    };
  }

  return {
    voices:
      "h-[calc(100vh-64px)] w-full overflow-y-scroll max-[600px]:h-auto min-[560px]:w-[400px]",
    voiceList:
      "h-[calc(100%-110px)] overflow-y-scroll max-[600px]:h-[calc(50vh-140px)]",
    cast: "ml-2 h-[calc(100vh-64px)] w-full overflow-y-scroll max-[600px]:m-0 max-[600px]:h-[calc(50vh-30px)] min-[560px]:w-[calc(100vw-400px)]",
  };
}
