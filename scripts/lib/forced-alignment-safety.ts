export function validateAlignmentAudioFile({
  resultFilename,
  manifestFilename,
  currentFilename,
}: {
  resultFilename: string;
  manifestFilename: string;
  currentFilename: string;
}) {
  if (resultFilename !== manifestFilename) {
    return "result audio file differs from manifest";
  }
  if (currentFilename !== manifestFilename) return "current audio file changed";
  return null;
}

export function validateAlignmentArtifactStoryIds({
  expectedStoryId,
  manifestStoryId,
  resultsStoryId,
}: {
  expectedStoryId: number;
  manifestStoryId: number;
  resultsStoryId: number;
}) {
  if (manifestStoryId !== expectedStoryId) {
    return "manifest story ID differs from batch story";
  }
  if (resultsStoryId !== expectedStoryId) {
    return "results story ID differs from batch story";
  }
  return null;
}

export function validateAlignmentStoryCoverage({
  resultIds,
  manifestIds,
  currentIds,
}: {
  resultIds: string[];
  manifestIds: string[];
  currentIds: string[];
}) {
  if (!haveSameUniqueIds(resultIds, manifestIds)) {
    return "result rows differ from manifest";
  }
  if (!haveSameUniqueIds(currentIds, manifestIds)) {
    return "current story rows differ from manifest";
  }
  return null;
}

function haveSameUniqueIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const leftIds = new Set(left);
  const rightIds = new Set(right);
  if (leftIds.size !== left.length) return false;
  if (rightIds.size !== right.length) return false;
  return right.every((id) => leftIds.has(id));
}

export function selectLatestSuccessfulStoryRuns<
  T extends { storyId: number; status: string },
>(runs: T[]) {
  const latestByStory = new Map<number, T>();
  for (const run of runs) latestByStory.set(run.storyId, run);
  return [...latestByStory.values()].filter((run) => run.status === "done");
}

export function findNextMatchingAlignedWord<
  T extends { normalized: string; startMs: number },
>(alignedWords: T[], normalizedToken: string, fromIndex: number) {
  for (let index = fromIndex; index < alignedWords.length; index += 1) {
    const word = alignedWords[index];
    if (word?.normalized === normalizedToken) return { index, word };
  }
  return null;
}
