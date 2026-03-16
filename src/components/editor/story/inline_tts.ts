export type InlineTtsReplacement = {
  index: number;
  word: string;
  alias: string;
  alphabet?: string;
};

export type InlineTtsError = {
  message: string;
  segment: string;
  start: number;
  end: number;
};

const punctuationChars =
  "\\/¡!\"'`#$%&*,.:;<=>¿?@^_`{|}…" + "。、，！？；：（）～—·《…》〈…〉﹏……——";
const inlineTtsBoundaryPunctuation = punctuationChars.replace(/[{}]/g, "");

function isInlineTtsSegmentBoundary(char: string | undefined) {
  return (
    char === undefined ||
    char === "|" ||
    char === "[" ||
    char === "]" ||
    char.match(new RegExp(`[\\s${inlineTtsBoundaryPunctuation}]`)) !== null
  );
}

function createInlineTtsError(
  message: string,
  segment: string,
  start: number,
  end: number,
): InlineTtsError {
  return { message, segment, start, end };
}

export function formatInlineTtsError(
  error: InlineTtsError,
  lineNumber?: number,
) {
  const prefix = lineNumber ? `Line ${lineNumber}: ` : "";
  return `${prefix}${error.message}: "${error.segment}".`;
}

export function scanInlineTts(text: string) {
  let normalizedText = "";
  const replacements: InlineTtsReplacement[] = [];
  const errors: InlineTtsError[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (isInlineTtsSegmentBoundary(char)) {
      normalizedText += char;
      i += 1;
      continue;
    }

    const segmentStart = i;
    let braceDepth = 0;
    while (i < text.length) {
      const currentChar = text[i];
      if (currentChar === "{") {
        braceDepth += 1;
        i += 1;
        continue;
      }
      if (currentChar === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        i += 1;
        continue;
      }
      if (braceDepth === 0 && isInlineTtsSegmentBoundary(currentChar)) {
        break;
      }
      i += 1;
    }

    const segment = text.substring(segmentStart, i);
    const openCount = [...segment.matchAll(/{/g)].length;
    const closeCount = [...segment.matchAll(/}/g)].length;

    if (openCount === 0 && closeCount === 0) {
      normalizedText += segment;
      continue;
    }
    if (openCount === 0) {
      errors.push(
        createInlineTtsError(
          'Inline TTS replacement is missing "{"',
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }
    if (closeCount === 0) {
      errors.push(
        createInlineTtsError(
          'Inline TTS replacement is missing "}"',
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }
    if (openCount > 1 || closeCount > 1) {
      errors.push(
        createInlineTtsError(
          "Multiple inline TTS replacements in one segment are not allowed",
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }

    const openIndex = segment.indexOf("{");
    const closeIndex = segment.indexOf("}");
    if (closeIndex < openIndex) {
      errors.push(
        createInlineTtsError(
          'Inline TTS replacement is missing "{"',
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }
    const word = segment.substring(0, openIndex);
    if (!word) {
      errors.push(
        createInlineTtsError(
          'Inline TTS replacement needs text before "{"',
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }

    const replacementRaw = segment.substring(openIndex + 1, closeIndex);
    if (!replacementRaw) {
      errors.push(
        createInlineTtsError(
          "Inline TTS replacement needs spoken text inside braces",
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }

    let alias = replacementRaw;
    let alphabet: string | undefined;
    const alphabetSeparator = replacementRaw.lastIndexOf(":");
    if (alphabetSeparator !== -1) {
      alias = replacementRaw.substring(0, alphabetSeparator);
      alphabet = replacementRaw.substring(alphabetSeparator + 1);
      if (!alphabet) {
        errors.push(
          createInlineTtsError(
            "Inline TTS replacement needs a pronunciation alphabet after ':'",
            segment,
            segmentStart,
            i,
          ),
        );
        normalizedText += segment;
        continue;
      }
    }

    if (!alias) {
      errors.push(
        createInlineTtsError(
          "Inline TTS replacement needs spoken text inside braces",
          segment,
          segmentStart,
          i,
        ),
      );
      normalizedText += segment;
      continue;
    }

    replacements.push({
      index: normalizedText.length,
      word,
      alias,
      alphabet,
    });
    normalizedText += word + segment.substring(closeIndex + 1);
  }

  return { normalizedText, replacements, errors };
}
