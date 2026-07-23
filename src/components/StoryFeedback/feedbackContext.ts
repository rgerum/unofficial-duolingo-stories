import type { StoryElement } from "@/components/editor/story/syntax_parser_types";

export function getFeedbackLineIndex(
  currentPart: StoryElement[] | undefined,
  partProgress: number,
) {
  if (!currentPart?.length) return undefined;

  const lastElement = currentPart.at(-1);
  const visibleElement =
    partProgress > 0 &&
    lastElement &&
    (lastElement.type === "MULTIPLE_CHOICE" ||
      lastElement.type === "POINT_TO_PHRASE")
      ? lastElement
      : currentPart[0];
  const sourceLineIndex = (
    visibleElement.trackingProperties as {
      source_line_index?: number;
    }
  ).source_line_index;

  return sourceLineIndex ?? visibleElement.trackingProperties.line_index;
}
