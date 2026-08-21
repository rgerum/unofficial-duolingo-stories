import type { StoryElement } from "@/components/editor/story/syntax_parser_types";

function getInterleavedSourceLine(element: StoryElement) {
  return element.editor?.block_start_no ?? element.editor?.start_no;
}

function isContinuationIntroLine(part: StoryElement[], index: number) {
  const prompt = part[0];
  const element = part[index];
  return (
    index === 1 &&
    prompt?.type === "CHALLENGE_PROMPT" &&
    prompt.trackingProperties.challenge_type === "continuation" &&
    element?.type === "LINE"
  );
}

function splitContinuationAnswers(element: StoryElement): StoryElement[] {
  const answerPositions =
    element.type === "MULTIPLE_CHOICE"
      ? element.editor.answer_positions
      : undefined;
  if (
    element.type !== "MULTIPLE_CHOICE" ||
    element.trackingProperties.challenge_type !== "continuation" ||
    element.answers.length < 2 ||
    answerPositions?.length !== element.answers.length ||
    answerPositions.some((position, index) => position.answer_index !== index)
  ) {
    return [element];
  }

  return element.answers.map((answer, index) => {
    const position = answerPositions[index];
    const start_no = position.start_no;
    const end_no =
      answerPositions[index + 1]?.start_no ?? element.editor.end_no;

    return {
      ...element,
      answers: [answer],
      correctAnswerIndex: element.correctAnswerIndex === index ? 0 : -1,
      editor: {
        ...element.editor,
        start_no,
        end_no,
        active_no: start_no,
        answer_positions: [position],
      },
    };
  });
}

export function splitInterleavedPreviewPart(
  part: StoryElement[],
): StoryElement[][] {
  const groups: StoryElement[][] = [];
  const positionedElements = part.flatMap(splitContinuationAnswers);
  let currentSourceBlock: number | undefined;

  for (const [index, element] of positionedElements.entries()) {
    const sourceBlock = getInterleavedSourceLine(element);
    if (
      groups.length > 0 &&
      sourceBlock !== undefined &&
      currentSourceBlock !== undefined &&
      sourceBlock !== currentSourceBlock &&
      !isContinuationIntroLine(positionedElements, index)
    ) {
      groups.push([]);
    }

    if (groups.length === 0) groups.push([]);
    groups[groups.length - 1].push(element);
    if (sourceBlock !== undefined) currentSourceBlock = sourceBlock;
  }

  return groups;
}

export function getInterleavedPreviewLineNumber(
  part: StoryElement[],
  documentLineCount: number,
): number | null {
  let lineNumber: number | null = null;

  for (const element of part) {
    const candidate = getInterleavedSourceLine(element);
    if (!Number.isFinite(candidate) || !candidate || candidate < 1) continue;
    lineNumber =
      lineNumber === null ? candidate : Math.min(lineNumber, candidate);
  }

  if (lineNumber === null) return null;
  return Math.min(lineNumber, Math.max(1, documentLineCount));
}

export function getInterleavedPreviewRenderKey(
  part: StoryElement[],
  settings: { rtl: boolean; showHints: boolean; showAudio: boolean },
): string {
  const visiblePart = JSON.stringify(part, (key, value) => {
    if (key === "editor" || key === "trackingProperties") return undefined;
    return value;
  });
  const challengeTypes = part.map(
    (element) => element.trackingProperties?.challenge_type,
  );

  return JSON.stringify({ visiblePart, challengeTypes, ...settings });
}

export function getInterleavedPreviewInteractionKey(
  part: StoryElement[],
): string {
  return JSON.stringify(
    part.map((element) => ({
      editor: element.editor,
      trackingProperties: element.trackingProperties,
    })),
  );
}
