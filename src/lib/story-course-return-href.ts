export function getStoryCourseReturnHref(story: {
  course_short: string;
  set_id: number;
}) {
  const setHash = story.set_id > 0 ? `#${story.set_id}` : "";
  return `/${story.course_short}${setHash}`;
}
