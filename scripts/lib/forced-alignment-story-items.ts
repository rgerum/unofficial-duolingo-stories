import type {
  Audio,
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";

export type AudioBackedStoryItem = {
  id: string;
  type: "HEADER" | "LINE";
  lineIndex: number;
  text: string;
  audioUrl: string;
  filename: string;
  ssml: NonNullable<Audio["ssml"]>;
  existingKeypoints: { rangeEnd: number; audioStart: number }[];
  element: StoryElementHeader | StoryElementLine;
};

export function getAudioBackedStoryItems(elements: StoryElement[]) {
  const items: AudioBackedStoryItem[] = [];
  for (const element of elements) {
    if (element.type !== "HEADER" && element.type !== "LINE") continue;
    const audio = getElementAudio(element);
    if (!audio?.url || !audio.ssml) continue;

    const text = getElementText(element);
    if (!text.trim()) continue;

    items.push({
      id: `${element.type}-${element.trackingProperties.line_index}-${audio.ssml.inser_index}`,
      type: element.type,
      lineIndex: element.trackingProperties.line_index || 0,
      text,
      audioUrl: audio.url,
      filename: audio.url.replace(/^audio\//, ""),
      ssml: audio.ssml,
      existingKeypoints: audio.keypoints ?? [],
      element,
    });
  }
  return items;
}

function getElementAudio(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER") return element.audio;
  return element.line.content.audio ?? element.audio;
}

function getElementText(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER") {
    return element.learningLanguageTitleContent?.text ?? "";
  }
  return element.line.content?.text ?? "";
}
