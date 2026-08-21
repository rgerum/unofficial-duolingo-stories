import type { StoryElement } from "@/components/editor/story/syntax_parser_types";

function getInterleavedSourceLine(element: StoryElement) {
  return element.editor?.block_start_no ?? element.editor?.start_no;
}

export function splitInterleavedPreviewPart(
  part: StoryElement[],
): StoryElement[][] {
  const groups: StoryElement[][] = [];
  let currentSourceBlock: number | undefined;

  for (const element of part) {
    const sourceBlock = getInterleavedSourceLine(element);
    if (
      groups.length > 0 &&
      sourceBlock !== undefined &&
      currentSourceBlock !== undefined &&
      sourceBlock !== currentSourceBlock
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
