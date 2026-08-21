export type FeedbackMobileHeaderRoute = {
  courseId?: string;
};

export function getFeedbackMobileHeaderRoute(
  segments: readonly string[],
): FeedbackMobileHeaderRoute | null {
  if (segments[0] === "feedback") return {};
  if (segments[0] === "course" && segments[2] === "feedback") {
    return { courseId: segments[1] };
  }
  return null;
}
