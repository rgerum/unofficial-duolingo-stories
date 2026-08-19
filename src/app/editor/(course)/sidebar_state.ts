export function getCourseSegment(segments: string[]) {
  return segments[0] === "course" ? segments[1] : undefined;
}

export function shouldShowCourseList(segments: string[]) {
  return segments.length === 0;
}
