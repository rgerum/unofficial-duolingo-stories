export type VocabularyStoryInput = {
  id: number;
  name: string;
  setId: number;
  setIndex: number;
  lines: string[];
};

export type VocabularyStoryAnalysis = VocabularyStoryInput & {
  wordCount: number;
  uniqueWordCount: number;
  newWords: string[];
  cumulativeUniqueWords: number;
};

const WORD_PATTERN = /\p{L}[\p{L}\p{M}'’ʼ-]*/gu;
const EDGE_PUNCTUATION = /^['’ʼ-]+|['’ʼ-]+$/gu;

export function tokenizeWords(text: string) {
  return Array.from(text.normalize("NFC").matchAll(WORD_PATTERN), ([match]) =>
    match.replace(EDGE_PUNCTUATION, "").toLocaleLowerCase(),
  ).filter(Boolean);
}

export function analyzeCourseVocabulary(stories: VocabularyStoryInput[]) {
  const seen = new Set<string>();
  let totalWordCount = 0;

  const analyzedStories: VocabularyStoryAnalysis[] = stories.map((story) => {
    const words = story.lines.flatMap(tokenizeWords);
    const storyWords = new Set(words);
    const newWords: string[] = [];

    for (const word of words) {
      if (seen.has(word)) continue;
      seen.add(word);
      newWords.push(word);
    }
    totalWordCount += words.length;

    return {
      ...story,
      wordCount: words.length,
      uniqueWordCount: storyWords.size,
      newWords,
      cumulativeUniqueWords: seen.size,
    };
  });

  return {
    totalWordCount,
    uniqueWordCount: seen.size,
    words: Array.from(seen),
    stories: analyzedStories,
  };
}
