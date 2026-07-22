export type WidgetStory = {
  id: number;
  name: string;
  image: string;
};

export type NextStory = WidgetStory & {
  completedCount: number;
  totalCount: number;
};

export function findNextStory(
  stories: WidgetStory[],
  doneStoryIds: ReadonlySet<number>,
): NextStory | null {
  const story = stories.find((candidate) => !doneStoryIds.has(candidate.id));
  if (!story) return null;

  return {
    ...story,
    completedCount: stories.filter((candidate) =>
      doneStoryIds.has(candidate.id),
    ).length,
    totalCount: stories.length,
  };
}
