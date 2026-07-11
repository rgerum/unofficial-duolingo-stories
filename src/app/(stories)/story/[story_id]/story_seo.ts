import type {
  StoryElement,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import type { StoryData } from "./getStory";

export type StoryTranscriptLine = {
  id: string;
  speaker?: string;
  text: string;
};

type StoryTitleData = Pick<
  StoryData,
  "from_language_name" | "learning_language_long"
>;

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function getSpeakerName(element: StoryElementLine) {
  if (element.line.type !== "CHARACTER") return undefined;
  const value = element.line.characterName ?? element.line.characterId;
  if (value === undefined || value === null) return undefined;
  const normalized = normalizeWhitespace(String(value));
  return normalized.length > 0 ? normalized : undefined;
}

function getTranscriptText(element: StoryElement) {
  if (element.type === "LINE") {
    return normalizeWhitespace(element.line.content.text ?? "");
  }
  if (element.type === "CHALLENGE_PROMPT") {
    return normalizeWhitespace(element.prompt.text ?? "");
  }
  if (element.type === "POINT_TO_PHRASE") {
    return normalizeWhitespace(
      `${element.question.text ?? ""} ${element.transcriptParts
        .map((part) => part.text)
        .join(" ")}`,
    );
  }
  if (element.type === "MATCH") {
    return normalizeWhitespace(
      `${element.prompt} ${element.fallbackHints
        .map((hint) => `${hint.phrase} ${hint.translation}`)
        .join(" ")}`,
    );
  }
  return "";
}

export function getStoryTranscript(story: StoryData): StoryTranscriptLine[] {
  return story.elements
    .map((element: StoryElement, index: number) => {
      const text = getTranscriptText(element);
      if (!text) return null;

      return {
        id: `${story.id}-${index}`,
        speaker: element.type === "LINE" ? getSpeakerName(element) : undefined,
        text,
      };
    })
    .filter((line: StoryTranscriptLine | null): line is StoryTranscriptLine => {
      return line !== null;
    });
}

export function getStoryDescription(story: StoryData) {
  const excerpt = getStoryTranscript(story)
    .slice(0, 3)
    .map((line) => line.text)
    .join(" ");
  const normalizedExcerpt = normalizeWhitespace(excerpt);
  const baseDescription = `${story.from_language_name} is a Duostories lesson for ${story.from_language_long} speakers learning ${story.learning_language_long}.`;

  if (!normalizedExcerpt) return baseDescription;

  const trimmedExcerpt =
    normalizedExcerpt.length > 220
      ? `${normalizedExcerpt.slice(0, 217).trimEnd()}...`
      : normalizedExcerpt;
  return `${baseDescription} ${trimmedExcerpt}`;
}

export function getStoryTitle(story: StoryTitleData) {
  return `${story.from_language_name} - ${story.learning_language_long} Story with Audio | Duostories`;
}
