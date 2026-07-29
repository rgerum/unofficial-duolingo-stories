export type AlignmentWordToken = {
  text: string;
  normalized: string;
  start: number;
  end: number;
};

export function getAlignmentWordTokens(text: string) {
  const tokens: AlignmentWordToken[] = [];
  const regex = /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu;
  for (const match of text.matchAll(regex)) {
    const word = match[0];
    const start = match.index ?? 0;
    const normalized = normalizeAlignmentWord(word);
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

export function getAlignmentText(text: string) {
  const tokens = getAlignmentWordTokens(text).map((token) => token.normalized);
  if (tokens.length > 0) return tokens.join(" ");
  return normalizeAlignmentWord(text);
}

export function normalizeAlignmentWord(word: string) {
  return word
    .toLocaleLowerCase("da-DK")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}
