import type { StoryElement } from "../components/editor/story/syntax_parser_types";

export function splitStoryElementsIntoParts(
  elements: StoryElement[],
): StoryElement[][] {
  const parts: StoryElement[][] = [];
  let lastId = -1;

  for (const element of elements) {
    if (element.trackingProperties === undefined) continue;
    if (lastId !== element.trackingProperties.line_index) {
      parts.push([]);
      lastId = element.trackingProperties.line_index;
    }
    if (
      element.type === "MULTIPLE_CHOICE" &&
      (parts.at(-1)?.length ?? 0) > 1 &&
      element.trackingProperties.challenge_type === "multiple-choice"
    ) {
      parts.push([]);
    }
    parts[parts.length - 1].push(element);
  }

  return parts;
}
