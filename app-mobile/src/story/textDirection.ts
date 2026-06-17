export function getStoryLineRtl({
  storyRtl,
  lineLang,
}: {
  storyRtl: boolean;
  lineLang?: string;
}) {
  return lineLang === "rtl" || (storyRtl && lineLang !== "en");
}
