const transcriptWordPattern =
  /[\p{L}\p{N}\p{M}]+(?:['’-][\p{L}\p{N}\p{M}]+)*/gu;

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function getTranscriptWordTokens(text: string) {
  return [...text.matchAll(transcriptWordPattern)].map((match) => ({
    text: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

export function getGraphemeLength(text: string) {
  if (!graphemeSegmenter) return Array.from(text).length;
  return [...graphemeSegmenter.segment(text)].length;
}
