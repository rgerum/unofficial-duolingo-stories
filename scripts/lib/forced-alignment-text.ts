export type AlignmentWordToken = {
  text: string;
  normalized: string;
  start: number;
  end: number;
};

const DANISH_DIGIT_WORDS: Record<string, string> = {
  "0": "nul",
  "1": "en",
  "2": "to",
  "3": "tre",
  "4": "fire",
  "5": "fem",
  "6": "seks",
  "7": "syv",
  "8": "otte",
  "9": "ni",
};

export function getAlignmentWordTokens(text: string, languageCode = "") {
  const tokens: AlignmentWordToken[] = [];
  const regex = /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu;
  for (const match of text.matchAll(regex)) {
    const word = match[0];
    const start = match.index ?? 0;
    const normalized = normalizeAlignmentWord(word, languageCode);
    if (!normalized) continue;
    tokens.push({
      text: word,
      normalized,
      start,
      end: start + word.length,
    });
  }
  return tokens;
}

export function getAlignmentText(text: string, languageCode = "") {
  const tokens = getAlignmentWordTokens(text, languageCode).map(
    (token) => token.normalized,
  );
  if (tokens.length > 0) return tokens.join(" ");
  return normalizeAlignmentWord(text, languageCode);
}

export function normalizeAlignmentWord(word: string, languageCode = "") {
  const normalizedLanguage = languageCode.toLocaleLowerCase().split(/[-_]/)[0];
  if (normalizedLanguage === "da" && DANISH_DIGIT_WORDS[word]) {
    return DANISH_DIGIT_WORDS[word];
  }

  return word
    .toLocaleLowerCase("da-DK")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}
