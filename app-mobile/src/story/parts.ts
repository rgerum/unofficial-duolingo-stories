// Progressive-reveal grouping logic, ported from the web app's
// src/components/StoryProgress/StoryProgress.tsx.
import type { StoryElement } from "./types";

/** Groups story elements into reveal steps ("parts"), one per line_index. */
export function getParts(elements: StoryElement[]): StoryElement[][] {
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
    )
      parts.push([]);
    parts[parts.length - 1].push(element);
  }
  for (let i = 0; i < parts.length; i++) {
    for (let j = 0; j < parts[i].length; j++) {
      parts[i][j].trackingProperties.line_index = i;
    }
  }
  return parts;
}

/** MATCH challenges have no line content, so they vanish in listening mode. */
export function shouldSkipStoryPart(
  parts: StoryElement[],
  hideQuestions: boolean,
): boolean {
  return (
    hideQuestions &&
    parts[0].type === "MATCH" &&
    parts[0].trackingProperties?.challenge_type === "match"
  );
}

export function getNextVisibleStoryProgress(
  partsList: StoryElement[][],
  currentStoryProgress: number,
  hideQuestions: boolean,
): number {
  let next = currentStoryProgress + 1;
  while (
    next < partsList.length &&
    shouldSkipStoryPart(partsList[next], hideQuestions)
  ) {
    next += 1;
  }
  return next;
}

export function getVisibleStoryLength(
  partsList: StoryElement[][],
  hideQuestions: boolean,
): number {
  let length = 0;
  for (const parts of partsList) {
    if (!shouldSkipStoryPart(parts, hideQuestions)) length += 1;
  }
  return length;
}

export function getVisibleStoryProgress(
  partsList: StoryElement[][],
  storyProgress: number,
  hideQuestions: boolean,
): number {
  if (storyProgress >= partsList.length) {
    return getVisibleStoryLength(partsList, hideQuestions);
  }
  let visible = 0;
  for (let index = 0; index <= storyProgress; index += 1) {
    if (!shouldSkipStoryPart(partsList[index], hideQuestions)) visible += 1;
  }
  return Math.max(visible - 1, 0);
}

export function getPartIndex(parts: StoryElement[]): number {
  return parts[0].trackingProperties.line_index || 0;
}

/**
 * Which component a part renders with — same dispatch order as the web's
 * getComponent().
 */
export type PartKind =
  | "header"
  | "arrange"
  | "point-to-phrase"
  | "multiple-choice"
  | "continuation"
  | "select-phrases"
  | "match"
  | "line";

/**
 * The footer status a part establishes when it becomes active (mirrors the
 * setButtonStatus effects in Part.tsx). Computing it synchronously when
 * advancing avoids a one-frame disabled-gray flash on the Continue button
 * while the new part's effect hasn't run yet.
 */
export function getInitialButtonStatus(
  parts: StoryElement[],
  hideQuestions: boolean,
): string {
  switch (getPartKind(parts)) {
    case "header":
    case "line":
      return "continue";
    case "multiple-choice":
      if (hideQuestions) return "continue";
      return parts.length > 1 ? "idle" : "wait";
    case "point-to-phrase":
      return hideQuestions ? "continue" : "idle";
    case "arrange":
    case "select-phrases":
    case "continuation":
      return hideQuestions ? "continue" : "wait";
    default:
      return "wait";
  }
}

export function getPartKind(parts: StoryElement[]): PartKind {
  const lastPart = parts[parts.length - 1];
  if (parts[0].type === "HEADER") return "header";
  if (parts[0].trackingProperties?.challenge_type === "arrange")
    return "arrange";
  if (lastPart.type === "POINT_TO_PHRASE") return "point-to-phrase";
  if (
    lastPart.type === "MULTIPLE_CHOICE" &&
    lastPart.trackingProperties.challenge_type === "multiple-choice"
  )
    return "multiple-choice";
  if (parts[0].trackingProperties?.challenge_type === "continuation")
    return "continuation";
  if (parts[0].trackingProperties?.challenge_type === "select-phrases")
    return "select-phrases";
  if (parts[0].trackingProperties?.challenge_type === "match") return "match";
  return "line";
}
