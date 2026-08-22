export function isCourseStoryListRoute(segments: readonly string[]): boolean {
  return segments.length === 2 && segments[0] === "course";
}
