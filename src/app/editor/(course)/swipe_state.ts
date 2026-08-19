export function getCourseSegment(segments: string[]) {
  return segments[0] === "course" ? segments[1] : undefined;
}

export function shouldShowCourseList(segments: string[], showList: boolean) {
  return segments.length === 0 || showList;
}
