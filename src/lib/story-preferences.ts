export const HIDE_STORY_QUESTIONS_COOKIE = "hide_story_questions";

export function isStoryQuestionsDisabled(
  value: string | null | undefined,
): boolean {
  return value === "1";
}
