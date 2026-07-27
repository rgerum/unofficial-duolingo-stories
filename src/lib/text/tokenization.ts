const BASE_PUNCTUATION =
  "\\/¡!\"'`#$%&*,.:;<=>¿?@^_`{|}…" + "。、，！？；：（）～—·《…》〈…〉﹏……——।";
const ZERO_WIDTH_SPACE = "\u200B";
const WORD_JOINER = "\u2060";
const INVISIBLE_SEPARATORS = `${ZERO_WIDTH_SPACE}${WORD_JOINER}`;

type SplitOptions = {
  tilde?: "join" | "separator";
};

function createAlignedSeparator(tildeMode: SplitOptions["tilde"]): RegExp {
  const tilde = tildeMode === "separator" ? "~" : "";
  return new RegExp(
    `([\\s${BASE_PUNCTUATION}${tilde}\\]]*(?:^|\\s|$|[${INVISIBLE_SEPARATORS}])[\\s${BASE_PUNCTUATION}${tilde}]*)`,
  );
}

const ALIGNED_SEPARATOR = createAlignedSeparator("join");
const ALIGNED_SEPARATOR_WITH_TILDE = createAlignedSeparator("separator");
const HINT_SEPARATOR = new RegExp(`([\\s${INVISIBLE_SEPARATORS}]+)`);
const HINT_SEPARATOR_WITH_TILDE = new RegExp(
  `([\\s${INVISIBLE_SEPARATORS}~]+)`,
);
const DISPLAY_SEPARATOR = new RegExp(
  `([\\s${BASE_PUNCTUATION}${INVISIBLE_SEPARATORS}]+)`,
);
const AUDIO_WORD_BOUNDARY = new RegExp(
  `[\\s${BASE_PUNCTUATION}~${INVISIBLE_SEPARATORS}]`,
);
const INLINE_TTS_BOUNDARY = new RegExp(
  `[\\s${BASE_PUNCTUATION.replace(/[{}]/g, "")}${INVISIBLE_SEPARATORS}]`,
);

/**
 * Splits aligned source text while retaining every separator and source offset.
 * Only punctuation at alignment boundaries becomes a separate token.
 */
export function splitAlignedText(
  text: string,
  options: SplitOptions = {},
): string[] {
  if (!text) return [];
  return text.split(
    options.tilde === "separator"
      ? ALIGNED_SEPARATOR_WITH_TILDE
      : ALIGNED_SEPARATOR,
  );
}

/**
 * Splits display text at every punctuation or spacing boundary.
 * This keeps attached punctuation in its own renderable span.
 */
export function splitDisplayText(text: string): string[] {
  if (!text) return [];
  return text.split(DISPLAY_SEPARATOR);
}

/**
 * Splits a translation/pronunciation line while retaining its separators.
 * Punctuation remains part of the hint text; only spacing syntax separates hints.
 */
export function splitAlignedHintText(
  text: string,
  options: SplitOptions = {},
): string[] {
  if (!text) return [];
  return text.split(
    options.tilde === "separator" ? HINT_SEPARATOR_WITH_TILDE : HINT_SEPARATOR,
  );
}

export function isAudioWordCharacter(char: string): boolean {
  return (
    !["<", ">", "[", "]"].includes(char) && !AUDIO_WORD_BOUNDARY.test(char)
  );
}

export function isInlineTtsBoundary(char: string | undefined): boolean {
  return (
    char === undefined ||
    char === "|" ||
    char === "[" ||
    char === "]" ||
    INLINE_TTS_BOUNDARY.test(char)
  );
}
